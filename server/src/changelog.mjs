// Zet de changelog van één Flux Web Components release om naar wat de MCP-server aanbiedt.
//
// De bron is catalog/flux/<versie>/changelog/changelog.md: de sectie van die release uit de changelog van
// conventional-changelog, zoals changelog-cleanup ze overhoudt. Het resultaat is changelog.json ernaast: elke
// entry met type, issues, componenten en labels, aangevuld met de handmatige annotaties uit
// catalog/flux/<versie>/annotations/changelog.json en met de API-diff tegen de web-types van de vorige versie.
// De keuzes staan in docs/beslissingen/ADR-001-changelog-voor-de-mcp-server.md.

import fs from 'node:fs';
import path from 'node:path';
import { diffWebTypes, loadWebTypes } from './web-types.mjs';

// Verhoog dit wanneer het formaat van changelog.json wijzigt, zodat de server geen oude bestanden verkeerd leest.
export const SCHEMA = 1;

// In deze volgorde verschijnen de types in tellingen en overzichten: wat een afnemer eerst moet weten, eerst.
export const TYPES = ['breaking', 'feature', 'fix', 'docs', 'perf', 'revert', 'other'];
// 'no-impact': een afnemer mag het weten, maar het raakt zijn project niet (testen, CI, tooling en de
// documentatie van Flux zelf). 'a11y': een wijziging aan toegankelijkheid.
export const LABELS = ['a11y', 'no-impact'];

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

// Types die het project van een afnemer nooit raken: documentatie wijzigt geen project, ook niet als ze nuttig
// is om te lezen.
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

const ANNOTATION_KEYS = ['summary', 'migration', 'entries'];
const ENTRY_ANNOTATION_KEYS = ['note', 'migration', 'labels'];

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

// De labels die uit het type en de tekst af te leiden zijn. Een annotatie kan ze overschrijven.
export function deriveLabels(entry) {
    const text = entry.text;
    const labels = [];
    if (A11Y_TEXT.some((pattern) => pattern.test(text))) labels.push('a11y');
    if (
        NO_IMPACT_TYPES.includes(entry.type) ||
        entry.topics.some((topic) => NO_IMPACT_TOPICS.some((pattern) => pattern.test(topic))) ||
        NO_IMPACT_TEXT.some((pattern) => pattern.test(text))
    ) {
        labels.push('no-impact');
    }
    const wcag = /\bwcag\b/i.test(text) ? unique(text.match(WCAG_CRITERION) ?? []).sort() : [];
    return { labels, wcag };
}

const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// Voegt de handmatige annotaties samen met de geparste release. Een onbekende entry of sleutel is een fout: zo
// verrotten annotaties niet stil wanneer een changelog opnieuw opgehaald wordt.
export function applyAnnotations(release, annotations, source = 'de annotaties') {
    if (annotations == null) return release;
    const errors = [];
    if (!isObject(annotations)) throw new Error(`Fout in ${source}: verwacht een object.`);

    for (const key of Object.keys(annotations)) {
        if (!ANNOTATION_KEYS.includes(key)) errors.push(`onbekende sleutel '${key}'`);
    }
    for (const key of ['summary', 'migration']) {
        if (key in annotations && !isText(annotations[key])) errors.push(`'${key}' moet een niet-lege tekst zijn`);
    }
    const byId = annotations.entries ?? {};
    if (!isObject(byId)) errors.push(`'entries' moet een object zijn, per entry-id`);

    const ids = new Set(release.entries.map((entry) => entry.id));
    for (const [id, annotation] of Object.entries(isObject(byId) ? byId : {})) {
        if (!ids.has(id)) {
            errors.push(`onbekende entry '${id}'`);
            continue;
        }
        if (!isObject(annotation)) {
            errors.push(`entry '${id}' moet een object zijn`);
            continue;
        }
        for (const key of Object.keys(annotation)) {
            if (!ENTRY_ANNOTATION_KEYS.includes(key)) errors.push(`entry '${id}': onbekende sleutel '${key}'`);
        }
        for (const key of ['note', 'migration']) {
            if (key in annotation && !isText(annotation[key])) errors.push(`entry '${id}': '${key}' moet een niet-lege tekst zijn`);
        }
        if ('labels' in annotation) {
            if (!isObject(annotation.labels)) {
                errors.push(`entry '${id}': 'labels' moet een object zijn, bv. { "no-impact": false }`);
            } else {
                for (const [label, on] of Object.entries(annotation.labels)) {
                    if (!LABELS.includes(label)) errors.push(`entry '${id}': onbekend label '${label}' (${LABELS.join(', ')})`);
                    else if (typeof on !== 'boolean') errors.push(`entry '${id}': label '${label}' moet true of false zijn`);
                }
            }
        }
    }
    if (errors.length > 0) throw new Error(`Fout in ${source}:\n  - ${errors.join('\n  - ')}`);

    return {
        ...release,
        summary: annotations.summary ?? release.summary ?? null,
        migration: annotations.migration ?? release.migration ?? null,
        entries: release.entries.map((entry) => {
            const annotation = byId[entry.id];
            if (!annotation) return entry;
            const labels = new Set(entry.labels);
            for (const [label, on] of Object.entries(annotation.labels ?? {})) {
                if (on) labels.add(label);
                else labels.delete(label);
            }
            return {
                ...entry,
                labels: LABELS.filter((label) => labels.has(label)),
                note: annotation.note ?? entry.note,
                migration: annotation.migration ?? entry.migration,
            };
        }),
    };
}

function countsOf(entries) {
    const counts = Object.fromEntries([...TYPES, ...LABELS].map((key) => [key, 0]));
    for (const entry of entries) {
        counts[entry.type]++;
        for (const label of entry.labels) counts[label]++;
    }
    return counts;
}

// De componenten die de changelog van deze versie als scope noemt, zonder de entries met 'no-impact'. Een naam
// die niet in de web-types staat, zoals vl-header-next, blijft erin, maar zonder soort en Storybook-link.
function componentsOf(entries, webTypes) {
    const names = unique(entries.filter((entry) => !entry.labels.includes('no-impact')).flatMap((entry) => entry.components));
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
export function buildRelease({ markdown, annotations = null, annotationsSource, webTypes = null, previousWebTypes = null }) {
    const parsed = parseChangelog(markdown);
    const entries = parsed.entries.map((entry) => ({ ...entry, ...deriveLabels(entry), note: null, migration: null }));
    const annotated = applyAnnotations({ summary: null, migration: null, entries }, annotations, annotationsSource);
    const { api, apiUnavailable } = apiOf(parsed, annotated.entries, webTypes, previousWebTypes);

    return {
        schema: SCHEMA,
        version: parsed.version,
        date: parsed.date,
        previous: parsed.previous,
        compareUrl: parsed.compareUrl,
        summary: annotated.summary,
        migration: annotated.migration,
        counts: countsOf(annotated.entries),
        components: componentsOf(annotated.entries, webTypes),
        entries: annotated.entries,
        api,
        apiUnavailable,
    };
}

// De handmatige annotaties van een versie, of null als ze er niet zijn.
export function readAnnotations(catalogDir, version) {
    const source = `catalog/flux/${version}/annotations/changelog.json`;
    const file = path.join(catalogDir, version, 'annotations', 'changelog.json');
    if (!fs.existsSync(file)) return { annotations: null, source };
    try {
        return { annotations: JSON.parse(fs.readFileSync(file, 'utf-8')), source };
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
    const { annotations, source: annotationsSource } = readAnnotations(catalogDir, version);

    const { version: found, previous } = parseChangelog(markdown);
    if (found !== version) {
        throw new Error(`catalog/flux/${version}/changelog/changelog.md bevat de changelog van ${found}, niet van ${version}.`);
    }

    return buildRelease({
        markdown,
        annotations,
        annotationsSource,
        webTypes: loadWebTypes(catalogDir, version),
        previousWebTypes: previous ? loadWebTypes(catalogDir, previous) : null,
    });
}
