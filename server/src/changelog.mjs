// Zet de changelog van één Flux Web Components release om naar wat de MCP-server aanbiedt.
//
// De bron is catalog/flux/<versie>/changelog/changelog.md: de sectie van die release uit de changelog van
// conventional-changelog, zoals changelog-cleanup ze overhoudt. Het resultaat is changelog.json ernaast: elke
// entry met type, issues, componenten, impact en labels, aangevuld met:
//   - de feiten uit de commits (commits.json, van changelog-commits): de uitleg in de commit message, of de
//     wijziging de packages van een afnemer raakt, en de Storybook-pagina's met de documentatie die erbij kwam;
//   - de analyse per entry (catalog/flux/<versie>/analysis/changelog.json, zie prompts/changelog-analyse.md): de
//     impact voor een afnemer, een uitleg voor hem, wat hij moet doen en een voorbeeld;
//   - de API-diff tegen de web-types van de vorige versie.
// De keuzes staan in docs/beslissingen/ADR-001-changelog-voor-de-mcp-server.md.

import fs from 'node:fs';
import path from 'node:path';
import { diffWebTypes, loadWebTypes } from './web-types.mjs';

// Verhoog dit wanneer het formaat van changelog.json wijzigt, zodat de server geen oude bestanden verkeerd leest.
export const SCHEMA = 1;

// In deze volgorde verschijnen de types in tellingen en overzichten: wat een afnemer eerst moet weten, eerst.
export const TYPES = ['breaking', 'feature', 'fix', 'docs', 'perf', 'revert', 'other'];
// Wat een wijziging voor het project van een afnemer betekent, van meest naar minst dringend:
//   action:    hij moet iets aanpassen of nakijken;
//   opt-in:    een nieuwe mogelijkheid die hij zelf moet gebruiken;
//   automatic: hij krijgt ze mee door te upgraden, zonder iets te doen;
//   none:      hij mag het weten, maar het raakt zijn project niet (testen, tooling, documentatie).
export const IMPACTS = ['action', 'opt-in', 'automatic', 'none'];
// 'a11y': een wijziging aan toegankelijkheid.
export const LABELS = ['a11y'];

// Sectietitel → type. Een onbekende sectie wordt 'other'; de titel zelf blijft bewaard in 'section'.
const SECTION_TYPES = [
    [/breaking changes/i, 'breaking'],
    [/^features$/i, 'feature'],
    [/^bug fixes$/i, 'fix'],
    [/^documentation$/i, 'docs'],
    [/^performance improvements$/i, 'perf'],
    [/^reverts$/i, 'revert'],
];

// '# [2.20.0](…/compare/v2.19.0...v2.20.0) (2026-09-18)', '## [2.12.1](…) (…)' voor een patch, of
// '# 1.0.0 (2024-01-01)' voor de allereerste release.
const VERSION_HEADING =
    /^#{1,2} (?:\[([^\]]+)\]\(([^)]*)\)|(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?))(?: \((\d{4}-\d{2}-\d{2})\))?\s*$/;
const SECTION_HEADING = /^### (.+?)\s*$/;
const BULLET = /^[*-] (.*)$/;
const COMPARE = /\/compare\/v?(.+?)\.\.\.v?[^/]+$/;
// ' ([ca607d5](…/commit/ca607d5…))' aan het einde van een entry, soms met meerdere commits en
// ', closes [ref](url) …' erachter.
const TAIL = /\s\(((?:\[[0-9a-f]{7,40}\]\([^)\s]+\)(?:,\s*)?)+)\)(?:,\s*closes\s+(.+))?$/;
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
// 'FLUX-791', 'UIG-3304', of meerdere: 'FLUX-1, FLUX-2'.
const ISSUES = /^[A-Z][A-Z0-9]*-\d+(?:\s*[,/]\s*[A-Z][A-Z0-9]*-\d+)*$/;
// De angular-stijl van conventional-changelog: '**vl-alert:** tekst'.
const BOLD_SCOPE = /^\*\*([^*]+):\*\*\s*(.*)$/;
const COMPONENT = /^vl-[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const COMPONENT_IN_TEXT = /\bvl-[a-z0-9]+(?:-[a-z0-9]+)*/g;

// Zonder de feiten uit de commits leiden deze regels 'none' af. Documentatie wijzigt geen project, ook niet als ze
// nuttig is om te lezen.
const NO_IMPACT_TYPES = ['docs'];
// Scope-onderdelen die over het project Flux zelf gaan, niet over wat een afnemer gebruikt.
const NO_IMPACT_TOPICS = [/storybook/i, /cypress/i, /\bbuild\b/i, /\bagents?\b/i, /onderhoud/i, /-release\b/i, /monorepo/i, /\bbranches?\b/i];
// Woorden in de tekst die op testen, CI of tooling wijzen.
const NO_IMPACT_TEXT = [/\btest(en|s)?\b/i, /\bflaky\b/i, /\bcypress\b/i, /\bpipeline\b/i, /\blint(er|ing)?\b/i];
// Woorden die op toegankelijkheid wijzen. Niet 'axe': dat is cypress-axe, testtooling.
const A11Y_TEXT = [
    /\baria\b/i,
    /\bwcag\b/i,
    /\bscreen ?readers?\b/i,
    /\bschermlezers?\b/i,
    /\btoegankelijk/i,
    /\bfocus/i,
    /\btoetsenbord/i,
    /\bkeyboard\b/i,
    /\bskip-(link|to-content)\b/i,
    /\bcontrast\b/i,
    /\ba11y\b/i,
];
// Een WCAG-succescriterium, bv. 2.4.1; enkel gezocht in een tekst die WCAG noemt.
const WCAG_CRITERION = /\b[1-4]\.\d{1,2}\.\d{1,2}\b/g;

const ANALYSIS_KEYS = ['summary', 'entries'];
const ENTRY_ANALYSIS_KEYS = ['impact', 'explanation', 'action', 'example', 'a11y'];

const unique = (values) => [...new Set(values)];

function typeOf(section) {
    return SECTION_TYPES.find(([pattern]) => pattern.test(section))?.[1] ?? 'other';
}

function parseRefs(text) {
    const links = [...text.matchAll(LINK)].map(([, ref, url]) => ({ ref, url }));
    return links.length > 0 ? links : text.split(/[\s,]+/).filter(Boolean).map((ref) => ({ ref, url: null }));
}

// Eén entry: de regel na de bullet en eventuele vervolgregels.
function parseEntry(lines, section) {
    const tail = TAIL.exec(lines[0]);
    const head = (tail ? lines[0].slice(0, tail.index) : lines[0]).trim();
    const links = tail ? [...tail[1].matchAll(LINK)] : [];
    const continuation = lines.slice(1);

    let issues = [];
    let scope = null;
    let summary;
    const bold = BOLD_SCOPE.exec(head);
    if (bold) {
        scope = bold[1].trim();
        summary = bold[2];
    } else {
        const parts = head.split(' - ');
        if (parts.length > 1 && ISSUES.test(parts[0])) issues = parts.shift().split(/\s*[,/]\s*/);
        if (parts.length > 1) scope = parts.shift().trim();
        summary = parts.join(' - ');
    }
    summary = [summary, ...continuation].join('\n').trim();

    const scopeParts = scope ? scope.split(/\s*[,/]\s*/).filter(Boolean) : [];
    const components = unique(scopeParts.filter((part) => COMPONENT.test(part)).map((part) => part.toLowerCase()));
    const topics = unique(scopeParts.filter((part) => !COMPONENT.test(part)));
    const mentions = unique(
        [...[...topics, summary].join(' ').matchAll(COMPONENT_IN_TEXT)].map(([name]) => name.toLowerCase()),
    ).filter((name) => !components.includes(name));

    return {
        id: links[0]?.[1] ?? null,
        type: typeOf(section),
        section,
        issues,
        scope,
        components,
        topics,
        mentions,
        summary,
        text: [head, ...continuation].join('\n').trim(),
        commits: links.map(([, sha, url]) => ({ sha: /\/commit\/([0-9a-f]{40})/.exec(url)?.[1] ?? sha, url })),
        closes: tail?.[2] ? parseRefs(tail[2]) : [],
    };
}

// Leest de changelog van één release. Staat er meer dan één versie in, dan is ze niet opgekuist.
export function parseChangelog(markdown) {
    let release = null;
    let section = null;
    let current = null;
    let blank = false;
    const raw = [];

    for (const line of markdown.split(/\r?\n/)) {
        const heading = VERSION_HEADING.exec(line);
        if (heading) {
            const version = heading[1] ?? heading[3];
            if (release) {
                throw new Error(
                    `Meer dan één versie in de changelog (${release.version} en ${version}). ` +
                        'Kuis ze eerst op met flux:web-components:changelog-cleanup.',
                );
            }
            const url = heading[2] || null;
            release = { version, date: heading[4] ?? null, previous: COMPARE.exec(url ?? '')?.[1] ?? null, compareUrl: url };
            continue;
        }
        if (!release) continue;

        const sectionHeading = SECTION_HEADING.exec(line);
        if (sectionHeading) {
            section = sectionHeading[1];
            current = null;
            continue;
        }
        if (!section) continue;

        const bullet = BULLET.exec(line);
        if (bullet) {
            current = [bullet[1]];
            raw.push({ section, lines: current });
        } else if (line.trim() === '') {
            blank = current !== null;
            continue;
        } else if (current) {
            // Een vervolgregel, zoals bij een breaking change met uitleg; een lege regel ertussen blijft bewaard.
            if (blank) current.push('');
            current.push(line.trim());
        } else {
            // Tekst zonder bullet onder een sectie: ook een entry.
            current = [line.trim()];
            raw.push({ section, lines: current });
        }
        blank = false;
    }

    if (!release) throw new Error('Geen versiekop gevonden in de changelog.');

    // Zonder commit krijgt een entry '<type>-<n>': stabiel, want de changelog van een release wijzigt niet meer.
    const counters = {};
    const seen = new Set();
    const entries = raw.map(({ section: title, lines }) => {
        const entry = parseEntry(lines, title);
        let id = entry.id ?? `${entry.type}-${(counters[entry.type] = (counters[entry.type] ?? 0) + 1)}`;
        for (let n = 2; seen.has(id); n++) id = `${entry.id ?? entry.type}-${n}`;
        seen.add(id);
        return { ...entry, id };
    });

    return { ...release, entries };
}


const sum = (objects) => {
    const total = {};
    for (const object of objects) for (const [key, count] of Object.entries(object)) total[key] = (total[key] ?? 0) + count;
    return total;
};

// De feiten van de commits achter een entry, samengevoegd; null als er geen zijn (bv. een breaking change zonder
// commit) of als commits.json ontbreekt.
export function sourceOf(entry, commits) {
    if (!commits) return null;
    const facts = entry.commits.map(({ sha }) => {
        const found = commits.commits?.[sha];
        if (!found) {
            throw new Error(
                `commits.json mist commit ${sha.slice(0, 7)} van '${entry.text}'. ` +
                    `Haal ze opnieuw op: pnpm run flux:web-components:changelog-commits ${commits.version}`,
            );
        }
        return found;
    });
    if (facts.length === 0) return null;
    const pages = new Map();
    for (const page of facts.flatMap((fact) => fact.storybook)) {
        const known = pages.get(page.id);
        const added = [known?.added, page.added].filter(Boolean).join('\n\n[…]\n\n') || null;
        pages.set(page.id, { ...page, added });
    }
    return {
        body: facts.map((fact) => fact.body).filter(Boolean).join('\n\n') || null,
        published: facts.some((fact) => fact.published),
        areas: sum(facts.map((fact) => fact.areas)),
        publishedFiles: unique(facts.flatMap((fact) => fact.publishedFiles)).sort(),
        storybook: [...pages.values()].sort((a, b) => a.id.localeCompare(b.id)),
    };
}

// De impact zonder analyse. Met de feiten uit de commits beslist of de packages van een afnemer geraakt worden;
// zonder die feiten vallen we terug op het type en op signaalwoorden in de tekst.
export function deriveImpact(entry, source) {
    if (entry.type === 'breaking') return 'action';
    if (source) {
        if (!source.published) return 'none';
    } else if (
        NO_IMPACT_TYPES.includes(entry.type) ||
        entry.topics.some((topic) => NO_IMPACT_TOPICS.some((pattern) => pattern.test(topic))) ||
        NO_IMPACT_TEXT.some((pattern) => pattern.test(entry.text))
    ) {
        return 'none';
    }
    return entry.type === 'feature' ? 'opt-in' : 'automatic';
}

// De labels en WCAG-criteria uit de changelog-tekst en de uitleg in de commit. De analyse kan 'a11y' overschrijven.
export function deriveLabels(entry, source = null) {
    const text = [entry.text, source?.body].filter(Boolean).join('\n');
    const labels = A11Y_TEXT.some((pattern) => pattern.test(text)) ? ['a11y'] : [];
    const wcag = /\bwcag\b/i.test(text) ? unique(text.match(WCAG_CRITERION) ?? []).sort() : [];
    return { labels, wcag };
}

const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// Controleert de analyse van een versie. Een onbekende entry of sleutel is een fout: zo past de analyse altijd bij
// de changelog waarvoor ze geschreven is.
export function validateAnalysis(analysis, ids, source = 'de analyse') {
    const errors = [];
    if (!isObject(analysis)) throw new Error(`Fout in ${source}: verwacht een object.`);
    for (const key of Object.keys(analysis)) {
        if (!ANALYSIS_KEYS.includes(key)) errors.push(`onbekende sleutel '${key}'`);
    }
    if ('summary' in analysis && !isText(analysis.summary)) errors.push(`'summary' moet een niet-lege tekst zijn`);
    const entries = analysis.entries ?? {};
    if (!isObject(entries)) errors.push(`'entries' moet een object zijn, per entry-id`);

    for (const [id, item] of Object.entries(isObject(entries) ? entries : {})) {
        if (!ids.includes(id)) {
            errors.push(`onbekende entry '${id}'`);
            continue;
        }
        if (!isObject(item)) {
            errors.push(`entry '${id}' moet een object zijn`);
            continue;
        }
        for (const key of Object.keys(item)) {
            if (!ENTRY_ANALYSIS_KEYS.includes(key)) errors.push(`entry '${id}': onbekende sleutel '${key}'`);
        }
        if (!IMPACTS.includes(item.impact)) errors.push(`entry '${id}': 'impact' moet een van ${IMPACTS.join(', ')} zijn`);
        if (!isText(item.explanation)) errors.push(`entry '${id}': 'explanation' moet een niet-lege tekst zijn`);
        if (item.impact === 'action' && !isText(item.action)) errors.push(`entry '${id}': impact 'action' vraagt een 'action'`);
        if (item.impact !== 'action' && 'action' in item) errors.push(`entry '${id}': 'action' hoort enkel bij impact 'action'`);
        if ('example' in item && !isText(item.example)) errors.push(`entry '${id}': 'example' moet een niet-lege tekst zijn`);
        if ('a11y' in item && typeof item.a11y !== 'boolean') errors.push(`entry '${id}': 'a11y' moet true of false zijn`);
    }
    if (errors.length > 0) throw new Error(`Fout in ${source}:\n  - ${errors.join('\n  - ')}`);
}

// Een entry met de feiten uit haar commits, de afgeleide impact en labels, en de analyse als die er is.
function enrich(entry, commits, analysis) {
    const source = sourceOf(entry, commits);
    const { labels, wcag } = deriveLabels(entry, source);
    const item = analysis?.entries?.[entry.id];
    const a11y = item && 'a11y' in item ? item.a11y : labels.includes('a11y');
    return {
        ...entry,
        impact: item?.impact ?? deriveImpact(entry, source),
        impactSource: item ? 'analysis' : 'derived',
        explanation: item?.explanation ?? null,
        action: item?.action ?? null,
        example: item?.example ?? null,
        labels: a11y ? ['a11y'] : [],
        wcag,
        source,
    };
}

function countsOf(entries) {
    const counts = {
        type: Object.fromEntries(TYPES.map((type) => [type, 0])),
        impact: Object.fromEntries(IMPACTS.map((impact) => [impact, 0])),
        a11y: 0,
    };
    for (const entry of entries) {
        counts.type[entry.type]++;
        counts.impact[entry.impact]++;
        if (entry.labels.includes('a11y')) counts.a11y++;
    }
    return counts;
}

// De componenten die de changelog van deze versie als scope noemt, zonder de entries zonder impact. Een naam die
// niet in de web-types staat, zoals vl-header-next, blijft erin, maar zonder soort en Storybook-link.
function componentsOf(entries, webTypes) {
    const names = unique(entries.filter((entry) => entry.impact !== 'none').flatMap((entry) => entry.components));
    return names.sort().map((name) => {
        const known = webTypes?.get(name);
        return { name, category: known?.category ?? null, docUrl: known?.element['doc-url'] ?? null };
    });
}

function apiOf(release, entries, webTypes, previousWebTypes) {
    if (!release.previous) return { api: null, apiUnavailable: 'De changelog noemt geen vorige versie.' };
    if (!webTypes) return { api: null, apiUnavailable: `Geen web-types voor ${release.version} in de catalogus.` };
    if (!previousWebTypes) return { api: null, apiUnavailable: `Geen web-types voor ${release.previous} in de catalogus.` };
    const mentioned = new Set(entries.flatMap((entry) => [...entry.components, ...entry.mentions]));
    return { api: { base: release.previous, ...diffWebTypes(previousWebTypes, webTypes, { mentioned }) }, apiUnavailable: null };
}

// Het volledige document voor changelog.json. Puur: alles wat het nodig heeft, krijgt het mee.
export function buildRelease({ markdown, commits = null, analysis = null, analysisSource, webTypes = null, previousWebTypes = null }) {
    const parsed = parseChangelog(markdown);
    if (commits && commits.version !== parsed.version) {
        throw new Error(`commits.json hoort bij ${commits.version}, de changelog bij ${parsed.version}.`);
    }
    if (analysis) validateAnalysis(analysis, parsed.entries.map((entry) => entry.id), analysisSource);
    const entries = parsed.entries.map((entry) => enrich(entry, commits, analysis));
    const { api, apiUnavailable } = apiOf(parsed, entries, webTypes, previousWebTypes);

    return {
        schema: SCHEMA,
        version: parsed.version,
        date: parsed.date,
        previous: parsed.previous,
        compareUrl: parsed.compareUrl,
        summary: analysis?.summary ?? null,
        counts: countsOf(entries),
        components: componentsOf(entries, webTypes),
        entries,
        api,
        apiUnavailable,
    };
}

function readJson(file, source) {
    if (!fs.existsSync(file)) return null;
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (error) {
        throw new Error(`Geen geldige JSON in ${source}: ${error.message}`);
    }
}

// Leest alles voor één versie uit de catalogus en bouwt het document voor changelog.json.
export function buildReleaseFromCatalog(catalogDir, version) {
    const changelogDir = path.join(catalogDir, version, 'changelog');
    // readdirSync geeft de echte namen, ook op een hoofdletterongevoelig bestandssysteem (macOS).
    const files = fs.existsSync(changelogDir) ? fs.readdirSync(changelogDir) : [];
    if (!files.includes('changelog.md')) {
        throw new Error(
            files.includes('CHANGELOG.md')
                ? `De changelog van ${version} is nog niet opgekuist. Doe eerst: pnpm run flux:web-components:changelog-cleanup ${version}`
                : `Geen changelog in catalog/flux/${version}/changelog. Haal ze eerst op: ` +
                      `pnpm run flux:web-components:changelog-copy ${version} en flux:web-components:changelog-cleanup ${version}`,
        );
    }
    const markdown = fs.readFileSync(path.join(changelogDir, 'changelog.md'), 'utf-8');
    const { version: found, previous } = parseChangelog(markdown);
    if (found !== version) {
        throw new Error(`catalog/flux/${version}/changelog/changelog.md bevat de changelog van ${found}, niet van ${version}.`);
    }

    const analysisSource = `catalog/flux/${version}/analysis/changelog.json`;
    return buildRelease({
        markdown,
        commits: readJson(path.join(changelogDir, 'commits.json'), `catalog/flux/${version}/changelog/commits.json`),
        analysis: readJson(path.join(catalogDir, version, 'analysis', 'changelog.json'), analysisSource),
        analysisSource,
        webTypes: loadWebTypes(catalogDir, version),
        previousWebTypes: previous ? loadWebTypes(catalogDir, previous) : null,
    });
}
