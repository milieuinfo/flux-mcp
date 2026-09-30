// De vragen die de MCP-server over de changelog van Flux beantwoordt, als gewone functies. De kernvraag is die van
// een afnemer: wat verandert er als ik van versie X naar versie Y upgrade (getChangesBetween)?
//
// Leest per versie wat changelog:build in catalog/flux/<versie>/changelog/ zette, samengevoegd met de analyse uit
// changelog-analysis/ (zie readRelease). Voor een bereik vergelijkt het de web-types en de packages van beide
// kanten zelf. De MCP-koppeling hangt deze functies later aan tools en resources; zie
// docs/beslissingen/ADR-001-changelog-voor-de-mcp-server.md.
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

export class CatalogError extends Error {}

// '2.20.0' en 'v2.20.0' mogen allebei.
export function normalizeVersion(version) {
    const normalized = String(version ?? '').trim().replace(/^v/, '');
    if (!VERSION.test(normalized)) throw new CatalogError(`Ongeldige versie: '${version}'. Verwacht bv. 2.20.0.`);
    return normalized;
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

function filterWebTypesDiff(diff, name) {
    if (!diff) return diff;
    return {
        ...diff,
        added: diff.added.filter((item) => item.element === name),
        removed: diff.removed.filter((item) => item.element === name),
        changed: diff.changed.filter((item) => item.element === name),
        descriptions: diff.descriptions.filter((item) => item.element === name),
    };
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

    // Filtert entries; zonder includeNoImpact telt een entry met impact 'none' enkel mee in hiddenNoImpact.
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
        const wanted = component == null ? null : normalizeComponent(component);
        let hiddenNoImpact = 0;
        const selected = [];
        for (const entry of entries) {
            if (types && !types.includes(entry.type)) continue;
            if (impacts && !impacts.includes(entry.impact)) continue;
            if (label != null && !entry.labels.includes(label)) continue;
            const match = wanted ? matchOf(entry, wanted) : null;
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
    function getChangesBetween(from, to, { component, includeNoImpact = false, includeDescriptions = false } = {}) {
        const target = requireRelease(to);
        const start = normalizeVersion(from);
        if (compareVersions(start, target.version) >= 0) {
            throw new CatalogError(`'from' (${start}) moet lager zijn dan 'to' (${target.version}).`);
        }

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
        const components = new Map();
        const targetTypes = webTypes(target.version);
        let hiddenNoImpact = 0;
        for (const release of chain) {
            const selected = select(release.entries, { component, includeNoImpact });
            hiddenNoImpact += selected.hiddenNoImpact;
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
        const startTypes = webTypes(start);
        let webTypesDiff = null;
        let webTypesDiffUnavailable = null;
        if (startTypes && targetTypes) {
            const mentioned = new Set(
                chain.flatMap((release) => release.entries.flatMap((e) => [...e.components, ...e.mentions])),
            );
            webTypesDiff = { base: start, ...diffWebTypes(startTypes, targetTypes, { mentioned }) };
            if (component != null) webTypesDiff = filterWebTypesDiff(webTypesDiff, normalizeComponent(component).name);
        } else {
            webTypesDiffUnavailable = `Geen web-types voor ${startTypes ? target.version : start} in de catalogus.`;
        }
        let hiddenDescriptions = 0;
        if (!includeDescriptions) {
            ({ diff: webTypesDiff, hidden: hiddenDescriptions } = withoutDescriptions(webTypesDiff));
        }

        // Ook de dependencies netto, over het hele bereik.
        const [startPackages, targetPackages] = [packages(start), packages(target.version)];
        const dependenciesDiff =
            startPackages && targetPackages ? { base: start, ...diffPackages(startPackages, targetPackages) } : null;
        const dependenciesDiffUnavailable = dependenciesDiff
            ? null
            : `Geen packages voor ${startPackages ? target.version : start} in de catalogus.`;

        // Commits die de packages raken zonder in de changelog te staan, per versie. null als een versie in de
        // keten het niet weet (geen commits.json).
        const unlistedCommits = chain.some((release) => release.unlistedCommits == null)
            ? null
            : chain.flatMap(({ version, unlistedCommits: list }) => list.map((commit) => ({ version, ...commit })));

        return {
            from: start,
            to: target.version,
            complete: missing === null,
            missing,
            warning: missing
                ? `De catalogus mist ${missing.version}, de vorige versie van ${missing.previousOf}. ` +
                  `Wijzigingen van vóór ${missing.previousOf} ontbreken in dit overzicht.`
                : null,
            versions: chain.map(({ version, date, previous, summary }) => ({ version, date, previous, summary })),
            changes,
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
    function findChanges(query, { includeNoImpact = true } = {}) {
        const text = String(query ?? '').trim();
        if (!text) throw new CatalogError('Geef een zoekterm of een issue-key op, bv. FLUX-800.');
        const issue = ISSUE.test(text) ? text.toUpperCase() : null;
        const terms = text.toLowerCase().split(/\s+/);
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
                if (!includeNoImpact && entry.impact === 'none') {
                    hiddenNoImpact++;
                    continue;
                }
                results.push({ version, ...entry });
            }
        }
        return { query: text, results, hiddenNoImpact, coverage: coverage() };
    }

    return { listVersions, getChangelog, getChangesBetween, getComponentHistory, findChanges, coverage };
}

// De catalogus van deze repo, pas geladen bij de eerste vraag.
let defaultCatalog;
const catalog = () => (defaultCatalog ??= createCatalog());

export const listVersions = (...args) => catalog().listVersions(...args);
export const getChangelog = (...args) => catalog().getChangelog(...args);
export const getChangesBetween = (...args) => catalog().getChangesBetween(...args);
export const getComponentHistory = (...args) => catalog().getComponentHistory(...args);
export const findChanges = (...args) => catalog().findChanges(...args);
