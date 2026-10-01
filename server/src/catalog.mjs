// De vragen die de MCP-server over de changelog van Flux beantwoordt, als gewone functies. De kernvraag is die van
// een afnemer: wat verandert er als ik van versie X naar versie Y upgrade (getChangesBetween)?
//
// Leest per versie wat changelog:build in catalog/flux/<versie>/changelog/ zette, samengevoegd met de analyse uit
// changelog-analysis/ (zie readRelease). Voor een bereik vergelijkt het de web-types en de packages van beide
// kanten zelf. server/src/mcp/tools.mjs hangt deze functies aan tools en resources; zie
// docs/beslissingen/ADR-001-changelog-voor-de-mcp-server.md en ADR-004-functionaliteit-mcp-server.md.
//
// Elke entry zegt met 'impact' wat ze voor het project van een afnemer betekent: action, opt-in, automatic of
// none. Entries met impact 'none' (testen, tooling, de documentatie van Flux zelf) mag een afnemer weten, maar ze
// raken zijn project niet. Wat er in een versie nieuw is (getChangelog) en zoeken (findChanges) tonen ze. De
// upgrade (getChangesBetween) en de historiek van een component (getComponentHistory) laten ze standaard weg;
// 'hiddenNoImpact' zegt hoeveel, en includeNoImpact toont ze toch. Hetzelfde geldt voor elementen in de web-types
// waarvan enkel de beschrijving wijzigde: 'hiddenDescriptions' en includeDescriptions.
//
// Een component mag zonder 'vl-' gevraagd worden. Een fout in de vraag, zoals een onbekende versie, geeft een
// CatalogError met een tekst die een agent kan tonen.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMPACTS, LABELS, readRelease, TYPES } from './changelog.mjs';
import { diffPackages, loadPackages } from './packages.mjs';
import { diffWebTypes, loadWebTypes } from './web-types.mjs';

export const CATALOG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../catalog/flux');

const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
const ISSUE = /^[A-Z][A-Z0-9]*-\d+$/i;

// Een fout in de vraag. 'details' laat wie de fout opvangt ze aanvullen: de MCP-laag noemt bv. bij een onbekend
// element de namen die erop lijken (details.code 'unknown-element'), of de tool waarmee je verder zoekt
// (details.suggest 'search').
export class CatalogError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.details = details;
    }
}

// '2.20.0' en 'v2.20.0' mogen allebei.
export function normalizeVersion(version) {
    const normalized = String(version ?? '').trim().replace(/^v/, '');
    if (!VERSION.test(normalized)) throw new CatalogError(`Ongeldige versie: '${version}'. Verwacht bv. 2.20.0.`);
    return normalized;
}

// De patches op een zijtak van develop-v2 staan niet in de catalogus (ADR-002). Een vraag naar zo'n versie krijgt
// het antwoord van de hoogste versie van dezelfde minor, met een waarschuwing (ADR-004, sectie 3). Een vaste lijst
// en geen regel: zo valt een tikfout, of een patch die nieuwer is dan de catalogus, niet stil terug.
export const SIDE_BRANCH_PATCHES = ['2.4.1', '2.15.1', '2.17.1', '2.17.2', '2.17.3'];

const minorOf = (version) => version.split('.').slice(0, 2).join('.');

// De versie in de catalogus voor een patch op een zijtak, of null. 'versions' is oplopend.
export function sideBranchBase(versions, version) {
    if (!SIDE_BRANCH_PATCHES.includes(version)) return null;
    const same = versions.filter((v) => minorOf(v) === minorOf(version) && compareVersions(v, version) < 0);
    return same.at(-1) ?? null;
}

// Welke versie van de catalogus een gevraagde versie beantwoordt: 'latest' is de nieuwste, een versie uit de
// catalogus zichzelf, en een patch op een zijtak de hoogste versie van haar minor, met een waarschuwing. Elke andere
// versie geeft een CatalogError; is ze nieuwer dan de nieuwste, dan zegt die dat flux-mcp een update nodig heeft.
// 'versions' is oplopend. Geeft { version, requested, warning }.
export function resolveVersion(versions, requested) {
    if (versions.length === 0) throw new CatalogError('De catalogus is leeg.');
    const latest = versions.at(-1);
    if (String(requested ?? '').trim().toLowerCase() === 'latest') {
        return { version: latest, requested: 'latest', warning: null };
    }
    const version = normalizeVersion(requested);
    if (versions.includes(version)) return { version, requested: version, warning: null };
    const base = sideBranchBase(versions, version);
    if (base) {
        const warning =
            `Flux ${version} is een patch op een zijtak en staat niet in de catalogus. Dit antwoord geldt voor ` +
            `${base}: de API is die van ${base}, de fixes van ${version} ontbreken.`;
        return { version: base, requested: version, warning };
    }
    if (compareVersions(version, latest) > 0) {
        throw new CatalogError(
            `Flux ${version} staat niet in de catalogus; de nieuwste is ${latest}. ` +
                'Werk flux-mcp bij voor een nieuwere versie van Flux.',
        );
    }
    const available = [...versions].reverse().join(', ');
    throw new CatalogError(`Versie ${version} staat niet in de catalogus. Beschikbaar: ${available}.`);
}

// Semver-volgorde: een prerelease komt voor de release zelf.
export function compareVersions(a, b) {
    const [, ...pa] = VERSION.exec(a);
    const [, ...pb] = VERSION.exec(b);
    for (let i = 0; i < 3; i++) {
        if (Number(pa[i]) !== Number(pb[i])) return Number(pa[i]) - Number(pb[i]);
    }
    if (pa[3] === pb[3]) return 0;
    if (pa[3] === undefined) return 1;
    if (pb[3] === undefined) return -1;
    return pa[3] < pb[3] ? -1 : 1;
}

function normalizeComponent(component) {
    const raw = String(component ?? '').trim().toLowerCase();
    if (!raw) throw new CatalogError('Geef een component op, bv. vl-alert.');
    return { name: raw.startsWith('vl-') ? raw : `vl-${raw}`, raw };
}

// Een entry hoort bij een component als die in de scope staat, in de tekst genoemd wordt, of als thema in de
// scope staat (bv. 'form-control').
function matchOf(entry, { name, raw }) {
    if (entry.components.includes(name)) return 'scope';
    if (entry.topics.some((topic) => [name, raw].includes(topic.toLowerCase()))) return 'scope';
    if (entry.mentions.includes(name)) return 'mention';
    return null;
}

// De beste match met een van de gevraagde componenten: 'scope' gaat voor 'mention'.
function bestMatch(entry, wanted) {
    const matches = wanted.map((component) => matchOf(entry, component));
    return matches.includes('scope') ? 'scope' : matches.includes('mention') ? 'mention' : null;
}

// Een entry die geen component, geen thema en geen element in de tekst noemt, bv. een wijziging aan de globale
// styling of aan de build. Ze raakt elk project, maar valt anders weg uit een filter op componenten.
export const isGeneral = (entry) =>
    entry.components.length === 0 && entry.topics.length === 0 && entry.mentions.length === 0;

function filterWebTypesDiff(diff, names) {
    if (!diff) return diff;
    const keep = (item) => [].concat(names).includes(item.element);
    return {
        ...diff,
        added: diff.added.filter(keep),
        removed: diff.removed.filter(keep),
        changed: diff.changed.filter(keep),
        descriptions: diff.descriptions.filter(keep),
    };
}

// Of de analyse van de changelog van een versie er is: 'complete' met een samenvatting en een analyse voor elke
// entry, 'missing' zonder beide, anders 'partial'.
function analysisState(release) {
    const analysed = release.entries.filter((entry) => entry.impactSource === 'analysis').length;
    if (release.summary && analysed === release.entries.length) return 'complete';
    return release.summary || analysed > 0 ? 'partial' : 'missing';
}

// De diff zonder de elementen waarvan enkel de beschrijving wijzigde, met hun aantal.
function withoutDescriptions(diff) {
    if (!diff) return { diff, hidden: 0 };
    const { descriptions, ...contract } = diff;
    return { diff: contract, hidden: descriptions.length };
}

export function createCatalog(dir = CATALOG_DIR) {
    const releases = new Map();
    for (const version of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
        if (!VERSION.test(version)) continue;
        const release = readRelease(dir, version);
        if (release) releases.set(version, release);
    }
    // Oplopend; overzichten tonen de nieuwste eerst.
    const versions = [...releases.keys()].sort(compareVersions);

    const cached = (load) => {
        const cache = new Map();
        return (version) => {
            if (!cache.has(version)) cache.set(version, load(dir, version));
            return cache.get(version);
        };
    };
    const webTypes = cached(loadWebTypes);
    const packages = cached(loadPackages);

    function requireRelease(version) {
        const normalized = normalizeVersion(version);
        const release = releases.get(normalized);
        if (!release) {
            const available = versions.length > 0 ? [...versions].reverse().join(', ') : 'geen';
            throw new CatalogError(`Versie ${normalized} staat niet in de catalogus. Beschikbaar: ${available}.`);
        }
        return release;
    }

    // Welke versie van de catalogus een gevraagde versie beantwoordt; zie resolveVersion.
    const resolve = (version) => resolveVersion(versions, version);

    // In welke versies een element in de web-types staat, oplopend. De index komt er pas bij de eerste vraag: hij
    // leest de web-types van elke versie.
    let elementIndex = null;
    function elementVersions(component) {
        if (!elementIndex) {
            elementIndex = new Map();
            for (const version of versions) {
                for (const name of webTypes(version)?.keys() ?? []) {
                    if (!elementIndex.has(name)) elementIndex.set(name, []);
                    elementIndex.get(name).push(version);
                }
            }
        }
        return elementIndex.get(normalizeComponent(component).name) ?? [];
    }

    // Filtert entries; zonder includeNoImpact telt een entry met impact 'none' enkel mee in hiddenNoImpact.
    // 'component' is één component of een lijst; een entry telt mee als ze bij een ervan hoort.
    function select(entries, { type, impact, component, label, includeNoImpact = true } = {}) {
        const types = type == null ? null : [].concat(type);
        for (const t of types ?? []) {
            if (!TYPES.includes(t)) throw new CatalogError(`Onbekend type '${t}'. Kies uit: ${TYPES.join(', ')}.`);
        }
        const impacts = impact == null ? null : [].concat(impact);
        for (const i of impacts ?? []) {
            if (!IMPACTS.includes(i)) {
                throw new CatalogError(`Onbekende impact '${i}'. Kies uit: ${IMPACTS.join(', ')}.`);
            }
        }
        if (label != null && !LABELS.includes(label)) {
            throw new CatalogError(`Onbekend label '${label}'. Kies uit: ${LABELS.join(', ')}.`);
        }
        const wanted = component == null ? null : [].concat(component).map(normalizeComponent);
        let hiddenNoImpact = 0;
        const selected = [];
        for (const entry of entries) {
            if (types && !types.includes(entry.type)) continue;
            if (impacts && !impacts.includes(entry.impact)) continue;
            if (label != null && !entry.labels.includes(label)) continue;
            const match = wanted ? bestMatch(entry, wanted) : null;
            if (wanted && !match) continue;
            if (!includeNoImpact && entry.impact === 'none' && !impacts?.includes('none')) {
                hiddenNoImpact++;
                continue;
            }
            selected.push(wanted ? { match, ...entry } : entry);
        }
        return { entries: selected, hiddenNoImpact };
    }

    // Welke versies de catalogus kent, en waar de keten van vorige versies onderbroken is. Voor de oudste versie
    // is dat normaal: daar begint de historiek in de catalogus.
    function coverage() {
        return {
            oldest: versions[0] ?? null,
            newest: versions.at(-1) ?? null,
            gaps: versions
                .slice(1)
                .map((version) => releases.get(version))
                .filter((release) => release.previous && !releases.has(release.previous))
                .map((release) => ({ version: release.previous, previousOf: release.version })),
        };
    }

    function listVersions() {
        return [...versions].reverse().map((version) => {
            const release = releases.get(version);
            return {
                version,
                date: release.date,
                previous: release.previous,
                previousInCatalog: release.previous != null && releases.has(release.previous),
                webTypes: fs.existsSync(path.join(dir, version, 'web-types')),
                packages: fs.existsSync(path.join(dir, version, 'packages')),
                changelogAnalysis: analysisState(release),
                summary: release.summary,
                counts: release.counts,
            };
        });
    }

    function getChangelog(version, { type, impact, component, label, includeNoImpact = true } = {}) {
        const release = requireRelease(version);
        const filters = { type, impact, component, label, includeNoImpact };
        const { entries, hiddenNoImpact } = select(release.entries, filters);
        const name = component == null ? null : normalizeComponent(component).name;
        const webTypesDiff = name == null ? release.webTypesDiff : filterWebTypesDiff(release.webTypesDiff, name);
        return { ...release, entries, hiddenNoImpact, webTypesDiff };
    }

    // Wat verandert er bij een upgrade van 'from' (exclusief, hoeft niet in de catalogus te staan) naar 'to'.
    // 'component' is één component of een lijst. Met componenten geeft 'general' per impact ook de entries die geen
    // component, thema of element noemen (isGeneral): die raken elk project.
    //
    // De diffs van de web-types en de dependencies vertrekken van 'base': 'from' zelf, of voor een patch op een
    // zijtak de hoogste versie van haar minor (ADR-004, sectie 3). Zo heeft een upgrade vanaf 2.17.3 een diff tegen
    // 2.17.0, met de fixes van 2.17.1–2.17.3 erin.
    function getChangesBetween(from, to, { component, includeNoImpact = false, includeDescriptions = false } = {}) {
        const target = requireRelease(to);
        const start = normalizeVersion(from);
        if (compareVersions(start, target.version) >= 0) {
            throw new CatalogError(`'from' (${start}) moet lager zijn dan 'to' (${target.version}).`);
        }
        const base = sideBranchBase(versions, start) ?? start;
        const wanted = component == null ? [] : [].concat(component);
        const names = wanted.map((name) => normalizeComponent(name).name);

        // Volg de keten van vorige versies terug tot 'from'.
        const chain = [];
        let missing = null;
        for (let version = target.version; version && compareVersions(version, start) > 0; ) {
            const release = releases.get(version);
            if (!release) {
                missing = { version, previousOf: chain.at(-1).version };
                break;
            }
            chain.push(release);
            version = release.previous;
        }
        chain.reverse();

        // Per impact, van meest naar minst dringend: wat een afnemer moet doen, eerst.
        const changes = Object.fromEntries(IMPACTS.map((impact) => [impact, []]));
        const general = names.length > 0 ? Object.fromEntries(IMPACTS.map((impact) => [impact, []])) : null;
        const components = new Map();
        const targetTypes = webTypes(target.version);
        let hiddenNoImpact = 0;
        for (const release of chain) {
            const selected = select(release.entries, { component: names.length > 0 ? names : null, includeNoImpact });
            hiddenNoImpact += selected.hiddenNoImpact;
            if (general) {
                for (const entry of release.entries.filter(isGeneral)) {
                    if (!includeNoImpact && entry.impact === 'none') hiddenNoImpact++;
                    else general[entry.impact].push({ version: release.version, ...entry });
                }
            }
            for (const entry of selected.entries) {
                changes[entry.impact].push({ version: release.version, ...entry });
                for (const name of entry.components) {
                    if (!components.has(name)) {
                        const known = targetTypes?.get(name);
                        components.set(name, {
                            name,
                            category: known?.category ?? null,
                            docUrl: known?.element['doc-url'] ?? null,
                            changes: [],
                        });
                    }
                    components.get(name).changes.push({
                        version: release.version,
                        type: entry.type,
                        impact: entry.impact,
                        id: entry.id,
                        issues: entry.issues,
                        summary: entry.summary,
                    });
                }
            }
        }

        // De netto diff van de web-types tussen beide versies; die klopt ook als er tussenliggende changelogs
        // ontbreken.
        const startTypes = webTypes(base);
        let webTypesDiff = null;
        let webTypesDiffUnavailable = null;
        if (startTypes && targetTypes) {
            const mentioned = new Set(
                chain.flatMap((release) => release.entries.flatMap((e) => [...e.components, ...e.mentions])),
            );
            webTypesDiff = { base, ...diffWebTypes(startTypes, targetTypes, { mentioned }) };
            if (names.length > 0) webTypesDiff = filterWebTypesDiff(webTypesDiff, names);
        } else {
            webTypesDiffUnavailable = `Geen web-types voor ${startTypes ? target.version : base} in de catalogus.`;
        }
        let hiddenDescriptions = 0;
        if (!includeDescriptions) {
            ({ diff: webTypesDiff, hidden: hiddenDescriptions } = withoutDescriptions(webTypesDiff));
        }

        // Ook de dependencies netto, over het hele bereik.
        const [startPackages, targetPackages] = [packages(base), packages(target.version)];
        const dependenciesDiff =
            startPackages && targetPackages ? { base, ...diffPackages(startPackages, targetPackages) } : null;
        const dependenciesDiffUnavailable = dependenciesDiff
            ? null
            : `Geen packages voor ${startPackages ? target.version : base} in de catalogus.`;

        // Commits die de packages raken zonder in de changelog te staan, per versie. null als een versie in de
        // keten het niet weet (geen commits.json).
        const unlistedCommits = chain.some((release) => release.unlistedCommits == null)
            ? null
            : chain.flatMap(({ version, unlistedCommits: list }) => list.map((commit) => ({ version, ...commit })));

        return {
            from: start,
            base,
            to: target.version,
            complete: missing === null,
            missing,
            warning: missing
                ? `De catalogus mist ${missing.version}, de vorige versie van ${missing.previousOf}. ` +
                  `Wijzigingen van vóór ${missing.previousOf} ontbreken in dit overzicht.`
                : null,
            versions: chain.map(({ version, date, previous, summary }) => ({ version, date, previous, summary })),
            changes,
            general,
            components: [...components.values()].sort((a, b) => a.name.localeCompare(b.name)),
            hiddenNoImpact,
            webTypesDiff,
            webTypesDiffUnavailable,
            hiddenDescriptions,
            dependenciesDiff,
            dependenciesDiffUnavailable,
            unlistedCommits,
        };
    }

    // Wat er per versie aan één component veranderde; 'from' en 'to' zijn inclusief.
    function getComponentHistory(component, { from, to, includeNoImpact = false, includeDescriptions = false } = {}) {
        const wanted = normalizeComponent(component);
        const low = from == null ? null : normalizeVersion(from);
        const high = to == null ? null : normalizeVersion(to);
        const history = [];
        let hiddenNoImpact = 0;
        let hiddenDescriptions = 0;
        for (const version of versions) {
            if ((low && compareVersions(version, low) < 0) || (high && compareVersions(version, high) > 0)) continue;
            const release = releases.get(version);
            const selected = select(release.entries, { component, includeNoImpact });
            hiddenNoImpact += selected.hiddenNoImpact;
            const byMatch = (a, b) => (a.match === b.match ? 0 : a.match === 'scope' ? -1 : 1);
            const entries = [...selected.entries].sort(byMatch);
            const diff = filterWebTypesDiff(release.webTypesDiff, wanted.name);
            const contractChanged = diff && diff.added.length + diff.removed.length + diff.changed.length > 0;
            const described = diff?.descriptions.length > 0;
            if (described && !includeDescriptions) hiddenDescriptions++;
            const diffShown = contractChanged || (described && includeDescriptions);
            if (entries.length === 0 && !diffShown) continue;
            history.push({
                version,
                date: release.date,
                docUrl: webTypes(version)?.get(wanted.name)?.element['doc-url'] ?? null,
                entries,
                webTypesDiff: diffShown
                    ? {
                          added: diff.added[0] ?? null,
                          removed: diff.removed[0] ?? null,
                          changed: diff.changed[0] ?? null,
                          ...(includeDescriptions ? { descriptions: diff.descriptions[0] ?? null } : {}),
                      }
                    : null,
                webTypesDiffUnavailable: release.webTypesDiff ? null : release.webTypesDiffUnavailable,
            });
        }
        const latest = versions.length > 0 ? webTypes(versions.at(-1))?.get(wanted.name) : null;
        return {
            component: wanted.name,
            known: Boolean(latest),
            category: latest?.category ?? null,
            description: latest?.element.description ?? null,
            deprecated: latest?.element.deprecated ?? null,
            docUrl: latest?.element['doc-url'] ?? null,
            history: history.reverse(),
            hiddenNoImpact,
            hiddenDescriptions,
            coverage: coverage(),
        };
    }

    // Een issue-key (FLUX-800) zoekt exact; anders moeten alle woorden in de tekst, de uitleg of de scope staan.
    // 'component' beperkt tot de entries van die component; 'limit' tot de eerste resultaten, de nieuwste eerst.
    // 'total' telt alle resultaten.
    function findChanges(query, { includeNoImpact = true, component, limit } = {}) {
        const text = String(query ?? '').trim();
        if (!text) throw new CatalogError('Geef een zoekterm of een issue-key op, bv. FLUX-800.');
        const issue = ISSUE.test(text) ? text.toUpperCase() : null;
        const terms = text.toLowerCase().split(/\s+/);
        const wanted = component == null ? null : normalizeComponent(component);
        const results = [];
        let hiddenNoImpact = 0;
        for (const version of [...versions].reverse()) {
            for (const entry of releases.get(version).entries) {
                const texts = [entry.text, entry.explanation, entry.action, entry.source?.body];
                const haystack = [...texts, ...entry.components, ...entry.topics]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                const found = issue ? entry.issues.includes(issue) : terms.every((term) => haystack.includes(term));
                if (!found) continue;
                if (wanted && !matchOf(entry, wanted)) continue;
                if (!includeNoImpact && entry.impact === 'none') {
                    hiddenNoImpact++;
                    continue;
                }
                results.push({ version, ...entry });
            }
        }
        return {
            query: text,
            results: limit == null ? results : results.slice(0, limit),
            total: results.length,
            hiddenNoImpact,
            coverage: coverage(),
        };
    }

    return {
        versions: () => [...versions],
        resolve,
        elementVersions,
        listVersions,
        getChangelog,
        getChangesBetween,
        getComponentHistory,
        findChanges,
        coverage,
    };
}

// De catalogus van deze repo, pas geladen bij de eerste vraag.
let defaultCatalog;
const catalog = () => (defaultCatalog ??= createCatalog());

export const listVersions = (...args) => catalog().listVersions(...args);
export const getChangelog = (...args) => catalog().getChangelog(...args);
export const getChangesBetween = (...args) => catalog().getChangesBetween(...args);
export const getComponentHistory = (...args) => catalog().getComponentHistory(...args);
export const findChanges = (...args) => catalog().findChanges(...args);
