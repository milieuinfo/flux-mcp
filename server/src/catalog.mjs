// De vragen die de MCP-server over de changelog van Flux beantwoordt, als gewone functies.
//
// Leest per versie catalog/flux/<versie>/changelog/changelog.json (zie changelog-build) en, voor een API-diff
// over een bereik, de web-types. De MCP-koppeling hangt deze functies later aan tools en resources; zie
// docs/beslissingen/ADR-001-changelog-voor-de-mcp-server.md.
//
// Elke entry zegt met 'impact' wat ze voor het project van een afnemer betekent: action, opt-in, automatic of
// none. Entries met impact 'none' (testen, tooling, de documentatie van Flux zelf) mag een afnemer weten, maar ze
// raken zijn project niet. Wat er in een versie nieuw is (getChangelog) en zoeken (findChanges) tonen ze. De
// upgrade (getChangesBetween) en de historiek van een component (getComponentHistory) laten ze standaard weg;
// 'hiddenNoImpact' zegt hoeveel, en includeNoImpact toont ze toch.
//
// Een component mag zonder 'vl-' gevraagd worden. Een fout in de vraag, zoals een onbekende versie, geeft een
// CatalogError met een tekst die een agent kan tonen.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMPACTS, LABELS, SCHEMA, TYPES } from './changelog.mjs';
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

function filterApi(api, name) {
    if (!api) return api;
    return {
        ...api,
        added: api.added.filter((item) => item.element === name),
        removed: api.removed.filter((item) => item.element === name),
        changed: api.changed.filter((item) => item.element === name),
    };
}

export function createCatalog(dir = CATALOG_DIR) {
    const releases = new Map();
    for (const version of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
        const file = path.join(dir, version, 'changelog', 'changelog.json');
        if (!VERSION.test(version) || !fs.existsSync(file)) continue;
        const release = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (release.schema !== SCHEMA) {
            throw new Error(
                `catalog/flux/${version}/changelog/changelog.json heeft schema ${release.schema}, verwacht ${SCHEMA}. ` +
                    'Bouw opnieuw: pnpm run flux:web-components:changelog-build --all',
            );
        }
        releases.set(version, release);
    }
    // Oplopend; overzichten tonen de nieuwste eerst.
    const versions = [...releases.keys()].sort(compareVersions);

    const webTypesCache = new Map();
    const webTypes = (version) => {
        if (!webTypesCache.has(version)) webTypesCache.set(version, loadWebTypes(dir, version));
        return webTypesCache.get(version);
    };

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
            if (!IMPACTS.includes(i)) throw new CatalogError(`Onbekende impact '${i}'. Kies uit: ${IMPACTS.join(', ')}.`);
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
                summary: release.summary,
                counts: release.counts,
            };
        });
    }

    function getChangelog(version, { type, impact, component, label, includeNoImpact = true } = {}) {
        const release = requireRelease(version);
        const { entries, hiddenNoImpact } = select(release.entries, { type, impact, component, label, includeNoImpact });
        const api = component == null ? release.api : filterApi(release.api, normalizeComponent(component).name);
        return { ...release, entries, hiddenNoImpact, api };
    }

    // Wat verandert er bij een upgrade van 'from' (exclusief, hoeft niet in de catalogus te staan) naar 'to'.
    function getChangesBetween(from, to, { component, includeNoImpact = false } = {}) {
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

        // De netto API-diff tussen beide versies; die klopt ook als er tussenliggende changelogs ontbreken.
        const startTypes = webTypes(start);
        let api = null;
        let apiUnavailable = null;
        if (startTypes && targetTypes) {
            const mentioned = new Set(chain.flatMap((release) => release.entries.flatMap((e) => [...e.components, ...e.mentions])));
            api = { base: start, ...diffWebTypes(startTypes, targetTypes, { mentioned }) };
            if (component != null) api = filterApi(api, normalizeComponent(component).name);
        } else {
            apiUnavailable = `Geen web-types voor ${startTypes ? target.version : start} in de catalogus.`;
        }

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
            api,
            apiUnavailable,
        };
    }

    // Wat er per versie aan één component veranderde; 'from' en 'to' zijn inclusief.
    function getComponentHistory(component, { from, to, includeNoImpact = false } = {}) {
        const wanted = normalizeComponent(component);
        const low = from == null ? null : normalizeVersion(from);
        const high = to == null ? null : normalizeVersion(to);
        const history = [];
        let hiddenNoImpact = 0;
        for (const version of versions) {
            if ((low && compareVersions(version, low) < 0) || (high && compareVersions(version, high) > 0)) continue;
            const release = releases.get(version);
            const selected = select(release.entries, { component, includeNoImpact });
            hiddenNoImpact += selected.hiddenNoImpact;
            const entries = [...selected.entries].sort((a, b) => (a.match === b.match ? 0 : a.match === 'scope' ? -1 : 1));
            const api = release.api ? filterApi(release.api, wanted.name) : null;
            const apiChanged = api && api.added.length + api.removed.length + api.changed.length > 0;
            if (entries.length === 0 && !apiChanged) continue;
            history.push({
                version,
                date: release.date,
                docUrl: webTypes(version)?.get(wanted.name)?.element['doc-url'] ?? null,
                entries,
                api: apiChanged ? { added: api.added[0] ?? null, removed: api.removed[0] ?? null, changed: api.changed[0] ?? null } : null,
                apiUnavailable: release.api ? null : release.apiUnavailable,
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
                const haystack = [entry.text, entry.explanation, entry.action, entry.source?.body, ...entry.components, ...entry.topics]
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
