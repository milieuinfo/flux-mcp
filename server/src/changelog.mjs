// Zet de changelog van één Flux Web Components release om naar wat de MCP-server aanbiedt.
//
// De vraag is: wat verandert er voor een afnemer die van de vorige versie naar deze upgradet?
//
// De bronnen staan in catalog/flux/<versie>/changelog/: changelog.md, de sectie van die release zoals
// changelog:cleanup ze overhoudt, en commits.json, de feiten uit de commits van changelog:commits. Daarnaast de
// web-types en de packages van deze en de vorige versie. Daaruit bouwt dit bestand wat de scripts over een versie
// weten, deterministisch en naast de bronnen:
//   - release.json: het overzicht, met de entries, de tickets met hun bestand en de commits die de packages raken
//     zonder in de changelog te staan;
//   - tickets/<ticket>-<componenten>.json: per ticket de volledige entries, met de afgeleide impact en labels en
//     de feiten uit de commits;
//   - web-types-diff.json: de diff tegen de web-types van de vorige versie;
//   - dependencies-diff.json: de diff tegen de dependencies van de packages van de vorige versie.
// Wat een LLM schreef, staat apart in catalog/flux/<versie>/changelog-analysis/, met dezelfde bestandsnamen (zie
// prompts/changelog-analyse.md). De server voegt beide samen bij het laden (readRelease).
// De keuzes staan in docs/beslissingen/ADR-001-changelog-voor-de-mcp-server.md.

import fs from 'node:fs';
import path from 'node:path';
import { COMMITS_SCHEMA } from './commits.mjs';
import { diffPackages, loadPackages } from './packages.mjs';
import { diffWebTypes, loadWebTypes } from './web-types.mjs';

// Verhoog dit wanneer het formaat van de gebouwde bestanden wijzigt, zodat de server geen oude verkeerd leest.
export const SCHEMA = 4;

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
// De sleutels van de Jira-projecten van Flux. Staat er enkel de sleutel, zonder nummer, zoals in 2.9.0
// 'FLUX - vl-footer, vl-footer-next - life cycle verbeterd', dan is er geen ticket en volgt de scope nog.
const PROJECT_KEYS = ['FLUX', 'UIG'];
// De angular-stijl van conventional-changelog: '**vl-alert:** tekst'.
const BOLD_SCOPE = /^\*\*([^*]+):\*\*\s*(.*)$/;
const COMPONENT = /^vl-[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const COMPONENT_IN_TEXT = /\bvl-[a-z0-9]+(?:-[a-z0-9]+)*/g;

// Zonder de feiten uit de commits leiden deze regels 'none' af. Documentatie wijzigt geen project, ook niet als ze
// nuttig is om te lezen.
const NO_IMPACT_TYPES = ['docs'];
// Scope-onderdelen die over het project Flux zelf gaan, niet over wat een afnemer gebruikt.
const NO_IMPACT_TOPICS = [
    /storybook/i,
    /cypress/i,
    /\bbuild\b/i,
    /\bagents?\b/i,
    /onderhoud/i,
    /-release\b/i,
    /monorepo/i,
    /\bbranches?\b/i,
];
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

const ANALYSIS_KEYS = ['summary'];
const ENTRY_ANALYSIS_KEYS = ['impact', 'explanation', 'action', 'example', 'a11y'];

const unique = (values) => [...new Set(values)];
// De JSON-bestanden in een map, alfabetisch.
const jsonFiles = (dir) => fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort();

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
    // Een andere link in de tekst wordt haar label: conventional-changelog maakt van '@ts-ignore' een link naar een
    // GitHub-gebruiker.
    const unlink = (text) => text.replace(LINK, '$1');
    const head = unlink((tail ? lines[0].slice(0, tail.index) : lines[0]).trim());
    const links = tail ? [...tail[1].matchAll(LINK)] : [];
    const continuation = lines.slice(1).map(unlink);

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
        else if (parts.length > 2 && PROJECT_KEYS.includes(parts[0].trim())) parts.shift();
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
                        'Kuis ze eerst op met flux:changelog:cleanup.',
                );
            }
            const url = heading[2] || null;
            const previous = COMPARE.exec(url ?? '')?.[1] ?? null;
            release = { version, date: heading[4] ?? null, previous, compareUrl: url };
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
    for (const object of objects) {
        for (const [key, count] of Object.entries(object)) total[key] = (total[key] ?? 0) + count;
    }
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
                    `Haal ze opnieuw op: pnpm run flux:changelog:commits ${commits.version}`,
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
const toJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

// De naam van het bestand van een ticket: de issue-key (of de id van een entry zonder ticket), gevolgd door de
// componenten en thema's uit de scope van zijn entries, bv. FLUX-810-vl-side-sheet-vl-cascader.json. Stabiel,
// want de changelog van een gereleasede versie wijzigt niet meer.
const MAX_NAMES = 4;
export function ticketFileName(key, entries) {
    const slug = (text) => text.replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    // Een componentnaam in kleine letters; een thema zoals het er staat.
    const name = (part) => slug(part.toLowerCase().startsWith('vl-') ? part.toLowerCase() : part);
    const names = unique(
        entries.flatMap((entry) => (entry.scope ? entry.scope.split(/\s*[,/]\s*/) : []).map(name)),
    ).filter(Boolean);
    const shown = names.slice(0, MAX_NAMES);
    return `tickets/${[key, ...shown, ...(names.length > MAX_NAMES ? ['enz'] : [])].join('-')}.json`;
}

// De entries per ticket, in de volgorde waarin het ticket voor het eerst in de changelog staat.
function ticketsOf(entries) {
    const tickets = new Map();
    for (const entry of entries) {
        const key = entry.issues[0] ?? entry.id;
        if (!tickets.has(key)) tickets.set(key, { ticket: entry.issues[0] ?? null, key, entries: [] });
        tickets.get(key).entries.push(entry);
    }
    return [...tickets.values()].map((ticket) => ({ ...ticket, file: ticketFileName(ticket.key, ticket.entries) }));
}

function countsOf(entries, impactOf) {
    const counts = {
        type: Object.fromEntries(TYPES.map((type) => [type, 0])),
        impact: Object.fromEntries(IMPACTS.map((impact) => [impact, 0])),
        a11y: 0,
    };
    for (const entry of entries) {
        counts.type[entry.type]++;
        counts.impact[impactOf(entry)]++;
        if (entry.labels.includes('a11y')) counts.a11y++;
    }
    return counts;
}

// De componenten die de changelog van deze versie als scope noemt, met hun soort en Storybook-link uit de
// web-types. Een naam die er niet in staat, zoals vl-header-next, blijft erin, maar zonder soort en link.
function componentsOf(entries, webTypes) {
    return unique(entries.flatMap((entry) => entry.components))
        .sort()
        .map((name) => {
            const known = webTypes?.get(name);
            return { name, category: known?.category ?? null, docUrl: known?.element['doc-url'] ?? null };
        });
}

function webTypesDiffOf(release, entries, webTypes, previousWebTypes) {
    const unavailable = (reason) => ({ webTypesDiff: null, webTypesDiffUnavailable: reason });
    if (!release.previous) return unavailable('De changelog noemt geen vorige versie.');
    if (!webTypes) return unavailable(`Geen web-types voor ${release.version} in de catalogus.`);
    if (!previousWebTypes) return unavailable(`Geen web-types voor ${release.previous} in de catalogus.`);
    const mentioned = new Set(entries.flatMap((entry) => [...entry.components, ...entry.mentions]));
    const webTypesDiff = { base: release.previous, ...diffWebTypes(previousWebTypes, webTypes, { mentioned }) };
    return { webTypesDiff, webTypesDiffUnavailable: null };
}

function dependenciesDiffOf(release, packages, previousPackages) {
    const unavailable = (reason) => ({ dependenciesDiff: null, dependenciesDiffUnavailable: reason });
    if (!release.previous) return unavailable('De changelog noemt geen vorige versie.');
    if (!packages) return unavailable(`Geen packages voor ${release.version} in de catalogus.`);
    if (!previousPackages) return unavailable(`Geen packages voor ${release.previous} in de catalogus.`);
    const dependenciesDiff = { base: release.previous, ...diffPackages(previousPackages, packages) };
    return { dependenciesDiff, dependenciesDiffUnavailable: null };
}

// Wat de scripts over een versie weten, zonder analyse. Puur: alles wat het nodig heeft, krijgt het mee.
//   overview:     release.json, het overzicht met de entries en de tickets met hun bestand;
//   tickets:      per ticket het bestand in tickets/, met de volledige entries;
//   webTypesDiff: web-types-diff.json, de diff tegen de web-types van de vorige versie, of null;
//   dependenciesDiff: dependencies-diff.json, de diff tegen de dependencies van de vorige versie, of null.
export function buildRelease({
    markdown,
    commits = null,
    webTypes = null,
    previousWebTypes = null,
    packages = null,
    previousPackages = null,
}) {
    const parsed = parseChangelog(markdown);
    if (commits && commits.schema !== COMMITS_SCHEMA) {
        throw new Error(
            `commits.json van ${commits.version} heeft schema ${commits.schema}, verwacht ${COMMITS_SCHEMA}. ` +
                `Haal ze opnieuw op: pnpm run flux:changelog:commits ${commits.version}`,
        );
    }
    if (commits && commits.version !== parsed.version) {
        throw new Error(`commits.json hoort bij ${commits.version}, de changelog bij ${parsed.version}.`);
    }
    const entries = parsed.entries.map((entry) => {
        const source = sourceOf(entry, commits);
        return { ...entry, derivedImpact: deriveImpact(entry, source), ...deriveLabels(entry, source), source };
    });
    const tickets = ticketsOf(entries);
    const fileOf = new Map(tickets.flatMap((ticket) => ticket.entries.map((entry) => [entry.id, ticket.file])));
    const { webTypesDiff, webTypesDiffUnavailable } = webTypesDiffOf(parsed, entries, webTypes, previousWebTypes);
    const { dependenciesDiff, dependenciesDiffUnavailable } = dependenciesDiffOf(parsed, packages, previousPackages);

    const overview = {
        schema: SCHEMA,
        version: parsed.version,
        date: parsed.date,
        previous: parsed.previous,
        compareUrl: parsed.compareUrl,
        counts: countsOf(entries, (entry) => entry.derivedImpact),
        components: componentsOf(entries, webTypes),
        entries: entries.map(({ id, issues, type, derivedImpact, text }) => ({
            id,
            ticket: issues[0] ?? null,
            type,
            derivedImpact,
            text,
            file: fileOf.get(id),
        })),
        tickets: tickets.map(({ ticket, file, entries: list }) => ({
            ticket,
            file,
            components: unique(list.flatMap((entry) => entry.components)),
            entries: list.map((entry) => entry.id),
        })),
        webTypesDiff: webTypesDiff ? 'web-types-diff.json' : null,
        webTypesDiffUnavailable,
        dependenciesDiff: dependenciesDiff ? 'dependencies-diff.json' : null,
        dependenciesDiffUnavailable,
        // Zonder commits.json weten we het niet: null, niet [].
        unlistedCommits: commits ? commits.unlisted : null,
    };
    return {
        overview,
        tickets: tickets.map(({ ticket, file, entries: list }) => ({
            file,
            content: { schema: SCHEMA, version: parsed.version, ticket, entries: list },
        })),
        webTypesDiff,
        dependenciesDiff,
    };
}

// Controleert de analyse van een versie tegen de tickets die de scripts maakten. Een onbekend bestand, een
// onbekende entry of sleutel, of een ongeldige impact is een fout: zo past de analyse altijd bij de changelog.
export function validateAnalysis(analysis, overview) {
    const errors = [];
    for (const key of Object.keys(analysis.release ?? {})) {
        if (!ANALYSIS_KEYS.includes(key)) errors.push(`changelog-analysis/release.json: onbekende sleutel '${key}'`);
    }
    if (analysis.release && 'summary' in analysis.release && !isText(analysis.release.summary)) {
        errors.push(`changelog-analysis/release.json: 'summary' moet een niet-lege tekst zijn`);
    }
    const tickets = new Map(overview.tickets.map((ticket) => [ticket.file, ticket]));
    for (const [file, content] of Object.entries(analysis.tickets ?? {})) {
        const where = `changelog-analysis/${file}`;
        const ticket = tickets.get(file);
        if (!ticket) {
            errors.push(`${where}: hoort bij geen ticket; de tickets staan in changelog/tickets/`);
            continue;
        }
        if (!isObject(content) || Object.keys(content).some((key) => key !== 'entries') || !isObject(content.entries)) {
            errors.push(`${where}: verwacht { "entries": { "<id>": { … } } }`);
            continue;
        }
        for (const [id, item] of Object.entries(content.entries)) {
            if (!ticket.entries.includes(id)) {
                errors.push(`${where}: entry '${id}' hoort niet bij dit ticket (${ticket.entries.join(', ')})`);
                continue;
            }
            if (!isObject(item)) {
                errors.push(`${where}: entry '${id}' moet een object zijn`);
                continue;
            }
            const error = (problem) => errors.push(`${where}: entry '${id}': ${problem}`);
            for (const key of Object.keys(item)) {
                if (!ENTRY_ANALYSIS_KEYS.includes(key)) error(`onbekende sleutel '${key}'`);
            }
            if (!IMPACTS.includes(item.impact)) error(`'impact' moet een van ${IMPACTS.join(', ')} zijn`);
            if (!isText(item.explanation)) error(`'explanation' moet een niet-lege tekst zijn`);
            if (item.impact === 'action' && !isText(item.action)) error(`impact 'action' vraagt een 'action'`);
            if (item.impact !== 'action' && 'action' in item) error(`'action' hoort enkel bij impact 'action'`);
            if ('example' in item && !isText(item.example)) error(`'example' moet een niet-lege tekst zijn`);
            if ('a11y' in item && typeof item.a11y !== 'boolean') error(`'a11y' moet true of false zijn`);
        }
    }
    if (errors.length > 0) throw new Error(`Fout in de analyse van ${overview.version}:\n  - ${errors.join('\n  - ')}`);
}

// Wat de server over een versie toont: de gegevens van de scripts, aangevuld met de analyse. De analyse
// bepaalt de impact, de uitleg, de actie, het voorbeeld en eventueel het label a11y.
export function mergeRelease({ overview, tickets, webTypesDiff, dependenciesDiff, analysis = null }) {
    const byFile = new Map(tickets.map((ticket) => [ticket.file, ticket.content]));
    const entries = overview.entries.map(({ id, file }) => {
        const entry = byFile.get(file)?.entries.find((candidate) => candidate.id === id);
        if (!entry) {
            const rebuild = `pnpm run flux:changelog:build ${overview.version}`;
            throw new Error(`changelog/${file} mist entry ${id}. Bouw opnieuw: ${rebuild}`);
        }
        const item = analysis?.tickets?.[file]?.entries?.[id];
        const a11y = item && 'a11y' in item ? item.a11y : entry.labels.includes('a11y');
        const { derivedImpact, labels, wcag, source, ...rest } = entry;
        return {
            ...rest,
            ticket: entry.issues[0] ?? null,
            file,
            impact: item?.impact ?? derivedImpact,
            impactSource: item ? 'analysis' : 'derived',
            derivedImpact,
            explanation: item?.explanation ?? null,
            action: item?.action ?? null,
            example: item?.example ?? null,
            labels: a11y ? ['a11y'] : [],
            wcag,
            source,
        };
    });
    return {
        schema: overview.schema,
        version: overview.version,
        date: overview.date,
        previous: overview.previous,
        compareUrl: overview.compareUrl,
        summary: analysis?.release?.summary ?? null,
        counts: countsOf(entries, (entry) => entry.impact),
        // Enkel de componenten van entries die het project van een afnemer raken.
        components: overview.components.filter(({ name }) =>
            entries.some((entry) => entry.impact !== 'none' && entry.components.includes(name)),
        ),
        entries,
        webTypesDiff,
        webTypesDiffUnavailable: overview.webTypesDiffUnavailable,
        dependenciesDiff,
        dependenciesDiffUnavailable: overview.dependenciesDiffUnavailable,
        unlistedCommits: overview.unlistedCommits,
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

// De analyse van een versie: changelog-analysis/release.json en changelog-analysis/tickets/*.json, of null als ze
// er niet is.
export function readAnalysis(catalogDir, version) {
    const dir = path.join(catalogDir, version, 'changelog-analysis');
    const where = `catalog/flux/${version}/changelog-analysis`;
    if (!fs.existsSync(dir)) return null;
    const ticketsDir = path.join(dir, 'tickets');
    const files = fs.existsSync(ticketsDir) ? jsonFiles(ticketsDir) : [];
    return {
        release: readJson(path.join(dir, 'release.json'), `${where}/release.json`),
        tickets: Object.fromEntries(
            files.map((name) => [`tickets/${name}`, readJson(path.join(ticketsDir, name), `${where}/tickets/${name}`)]),
        ),
    };
}

// Bouwt uit de bronnen in de catalogus de bestanden van changelog/: release.json, web-types-diff.json,
// dependencies-diff.json en tickets/*.json, telkens als { path, content } met path relatief tegenover changelog/.
// Controleert ook de analyse, en geeft de samengevoegde versie mee zoals de server ze zal tonen.
export function buildReleaseFiles(catalogDir, version) {
    const changelogDir = path.join(catalogDir, version, 'changelog');
    // readdirSync geeft de echte namen, ook op een hoofdletterongevoelig bestandssysteem (macOS).
    const files = fs.existsSync(changelogDir) ? fs.readdirSync(changelogDir) : [];
    if (!files.includes('changelog.md')) {
        throw new Error(
            files.includes('CHANGELOG.md')
                ? `De changelog van ${version} is nog niet opgekuist. Doe eerst: ` +
                      `pnpm run flux:changelog:cleanup ${version}`
                : `Geen changelog in catalog/flux/${version}/changelog. Haal ze eerst op: ` +
                      `pnpm run flux:changelog:copy ${version} en flux:changelog:cleanup ${version}`,
        );
    }
    const markdown = fs.readFileSync(path.join(changelogDir, 'changelog.md'), 'utf-8');
    const { version: found, previous } = parseChangelog(markdown);
    if (found !== version) {
        throw new Error(
            `catalog/flux/${version}/changelog/changelog.md bevat de changelog van ${found}, niet van ${version}.`,
        );
    }

    const built = buildRelease({
        markdown,
        commits: readJson(path.join(changelogDir, 'commits.json'), `catalog/flux/${version}/changelog/commits.json`),
        webTypes: loadWebTypes(catalogDir, version),
        previousWebTypes: previous ? loadWebTypes(catalogDir, previous) : null,
        packages: loadPackages(catalogDir, version),
        previousPackages: previous ? loadPackages(catalogDir, previous) : null,
    });
    const analysis = readAnalysis(catalogDir, version);
    if (analysis) validateAnalysis(analysis, built.overview);
    return {
        release: mergeRelease({ ...built, analysis }),
        files: [
            { path: 'release.json', content: toJson(built.overview) },
            ...(built.webTypesDiff ? [{ path: 'web-types-diff.json', content: toJson(built.webTypesDiff) }] : []),
            ...(built.dependenciesDiff
                ? [{ path: 'dependencies-diff.json', content: toJson(built.dependenciesDiff) }]
                : []),
            ...built.tickets.map((ticket) => ({ path: ticket.file, content: toJson(ticket.content) })),
        ],
    };
}

// De gegenereerde bestanden die er nu in changelog/ staan.
const GENERATED = ['release.json', 'web-types-diff.json', 'dependencies-diff.json'];
function generatedFiles(changelogDir) {
    const ticketsDir = path.join(changelogDir, 'tickets');
    return [
        ...GENERATED.filter((name) => fs.existsSync(path.join(changelogDir, name))),
        ...(fs.existsSync(ticketsDir) ? jsonFiles(ticketsDir).map((name) => `tickets/${name}`) : []),
    ];
}

// Wat er verschilt tussen de gebouwde bestanden en wat er in de catalogus staat.
export function compareReleaseFiles(catalogDir, version, files) {
    const changelogDir = path.join(catalogDir, version, 'changelog');
    const expected = new Map(files.map((file) => [file.path, file.content]));
    const differences = [];
    for (const [file, content] of expected) {
        const target = path.join(changelogDir, file);
        if (!fs.existsSync(target)) differences.push({ path: file, status: 'ontbreekt' });
        else if (fs.readFileSync(target, 'utf-8') !== content) differences.push({ path: file, status: 'is verouderd' });
    }
    for (const file of generatedFiles(changelogDir)) {
        if (!expected.has(file)) differences.push({ path: file, status: 'is overbodig' });
    }
    return differences;
}

// Schrijft de gebouwde bestanden en ruimt gegenereerde bestanden op die niet meer gebouwd worden.
export function writeReleaseFiles(catalogDir, version, files) {
    const changelogDir = path.join(catalogDir, version, 'changelog');
    const expected = new Set(files.map((file) => file.path));
    for (const file of generatedFiles(changelogDir)) {
        if (!expected.has(file)) fs.rmSync(path.join(changelogDir, file));
    }
    fs.mkdirSync(path.join(changelogDir, 'tickets'), { recursive: true });
    for (const file of files) fs.writeFileSync(path.join(changelogDir, file.path), file.content);
}

// Leest een versie zoals de server ze toont: de gegenereerde bestanden, samengevoegd met de analyse.
export function readRelease(catalogDir, version) {
    const changelogDir = path.join(catalogDir, version, 'changelog');
    const where = `catalog/flux/${version}/changelog/release.json`;
    const overview = readJson(path.join(changelogDir, 'release.json'), where);
    if (!overview) return null;
    if (overview.schema !== SCHEMA) {
        throw new Error(
            `catalog/flux/${version}/changelog/release.json heeft schema ${overview.schema}, verwacht ${SCHEMA}. ` +
                'Bouw opnieuw: pnpm run flux:changelog:build --all',
        );
    }
    const tickets = overview.tickets.map(({ file }) => ({
        file,
        content: readJson(path.join(changelogDir, file), `catalog/flux/${version}/changelog/${file}`),
    }));
    const read = (file) =>
        file ? readJson(path.join(changelogDir, file), `catalog/flux/${version}/changelog/${file}`) : null;
    return mergeRelease({
        overview,
        tickets,
        webTypesDiff: read(overview.webTypesDiff),
        dependenciesDiff: read(overview.dependenciesDiff),
        analysis: readAnalysis(catalogDir, version),
    });
}
