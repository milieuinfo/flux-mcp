// De vragen die de MCP-server over de documentatie uit Storybook beantwoordt, als gewone functies: per versie de
// pagina's, één pagina of component met zijn voorbeelden en API, zoeken, en wat er tussen twee versies wijzigde. De
// MCP-koppeling hangt ze later aan tools en resources; zie docs/beslissingen/ADR-003-storybook-per-versie.md.
//
// Leest per versie wat storybook:copy in catalog/flux/<versie>/storybook/ zette, met de analyse voor de inhoud van
// elke pagina uit catalog/flux/storybook-analysis/ en de API uit de web-types van die versie. Zonder versie geldt de
// nieuwste in de catalogus; elk antwoord zegt welke versie het is. Een agent neemt best de versie van
// @domg-wc/components uit de package.json van het project.
//
// Pagina's van het Flux-team zelf (Bijdragen, Beheren) raken een afnemer niet. listPages en searchDocs laten ze
// standaard weg; 'hiddenFluxTeam' zegt hoeveel, en met includeFluxTeam toon je ze toch.

import { CATALOG_DIR, CatalogError, compareVersions, createCatalog, normalizeVersion } from './catalog.mjs';
import { loadAnalysis, loadStorybook, PAGE_KINDS, renderPage, storybookVersions } from './storybook.mjs';
import { storybookBase } from './storybook-url.mjs';
import { loadWebTypes } from './web-types.mjs';

const FLUX_TEAM = 'flux-team';
const docsUrl = (version, id) => `${storybookBase(version)}?path=/docs/${id}--documentatie`;
const storyUrl = (version, id) => `${storybookBase(version)}?path=/story/${id}`;

// De woorden van een zoekvraag: kleine letters, 'vl-button' blijft één woord.
const words = (text) => String(text ?? '').toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]*/gu) ?? [];
const count = (text, word) => text.split(word).length - 1;

export function createDocs(dir = CATALOG_DIR, { catalog } = {}) {
    const versions = storybookVersions(dir).sort(compareVersions);
    const cached = (load) => {
        const cache = new Map();
        return (key) => {
            if (!cache.has(key)) cache.set(key, load(key));
            return cache.get(key);
        };
    };
    const storybook = cached((version) => loadStorybook(dir, version));
    const webTypes = cached((version) => loadWebTypes(dir, version));
    const analysisOf = cached((key) => {
        const [id, inputHash] = key.split('/');
        return loadAnalysis(dir, { id, inputHash });
    });
    const analysis = (page) => analysisOf(`${page.id}/${page.inputHash}`);
    const markdown = cached((key) => {
        const [version, id] = key.split('/');
        const book = storybook(version);
        return book.markdown(book.pages.find((page) => page.id === id));
    });
    let history = catalog ?? null;

    // De gevraagde versie, of de nieuwste zonder versie.
    function requireVersion(version) {
        if (versions.length === 0) {
            throw new CatalogError('Er staat geen documentatie uit Storybook in de catalogus.');
        }
        if (version == null || version === '') return versions.at(-1);
        const normalized = normalizeVersion(version);
        if (!versions.includes(normalized)) {
            const available = [...versions].reverse().join(', ');
            throw new CatalogError(
                `Van Flux ${normalized} staat geen documentatie in de catalogus. Beschikbaar: ${available}.`,
            );
        }
        return normalized;
    }

    // Een pagina voor een id ('components-atom-button'), een Storybook-id of -link, of een element ('vl-button',
    // 'button'). Een naam die bij meerdere pagina's past, geeft een fout met de kandidaten.
    function resolvePage(version, reference) {
        const pages = storybook(version).pages;
        const raw = String(reference ?? '').trim().toLowerCase();
        if (!raw) throw new CatalogError('Geef een pagina of een component op, bv. vl-button of afnemen-aan-de-slag.');
        const id = (/path=\/(?:docs|story)\/([a-z0-9-]+)/.exec(raw)?.[1] ?? raw).split('--')[0];
        const exact = pages.find((page) => page.id === id);
        if (exact) return exact;
        const element = id.startsWith('vl-') ? id : `vl-${id}`;
        const byElement = pages.filter((page) => page.elements.includes(element));
        if (byElement.length === 1) return byElement[0];
        const bySuffix = pages.filter((page) => page.id.endsWith(`-${id}`));
        const candidates = byElement.length > 1 ? byElement : bySuffix;
        if (candidates.length === 1) return candidates[0];
        if (candidates.length > 1) {
            const ids = candidates.map((page) => page.id).join(', ');
            throw new CatalogError(`'${reference}' past bij meerdere pagina's: ${ids}.`);
        }
        throw new CatalogError(
            `Geen pagina '${reference}' in de documentatie van Flux ${version}. Zoek met searchDocs.`,
        );
    }

    const summaryOf = (version, page) => ({
        id: page.id,
        title: page.title,
        kind: page.kind,
        elements: page.elements,
        summary: analysis(page)?.summary ?? null,
        url: docsUrl(version, page.id),
    });

    // Welke versies documentatie hebben, met hoeveel pagina's en hoeveel daarvan een analyse hebben.
    function listDocVersions() {
        return [...versions].reverse().map((version) => {
            const pages = storybook(version).pages;
            return {
                version,
                storybook: storybook(version).storybook,
                url: storybookBase(version),
                pages: pages.length,
                analysed: pages.filter((page) => analysis(page)).length,
            };
        });
    }

    // De pagina's van een versie, te filteren op soort en element.
    function listPages(version, { kind, element, includeFluxTeam = false } = {}) {
        const resolved = requireVersion(version);
        const kinds = kind == null ? null : [].concat(kind);
        for (const k of kinds ?? []) {
            if (!PAGE_KINDS.includes(k)) {
                throw new CatalogError(`Onbekende soort '${k}'. Kies uit: ${PAGE_KINDS.join(', ')}.`);
            }
        }
        const wanted = element == null ? null : String(element).toLowerCase().replace(/^(?!vl-)/, 'vl-');
        let hiddenFluxTeam = 0;
        const pages = [];
        for (const page of storybook(resolved).pages) {
            if (kinds && !kinds.includes(page.kind)) continue;
            if (wanted && !page.elements.includes(wanted)) continue;
            if (!includeFluxTeam && page.kind === FLUX_TEAM && !kinds?.includes(FLUX_TEAM)) {
                hiddenFluxTeam++;
                continue;
            }
            pages.push(summaryOf(resolved, page));
        }
        return { version: resolved, url: storybookBase(resolved), pages, hiddenFluxTeam };
    }

    // Eén pagina, zoals de server ze toont: de tekst met de voorbeelden, de API uit de web-types en absolute links.
    function getPage(version, reference) {
        const resolved = requireVersion(version);
        const page = resolvePage(resolved, reference);
        const found = analysis(page);
        return {
            version: resolved,
            id: page.id,
            title: page.title,
            kind: page.kind,
            url: docsUrl(resolved, page.id),
            elements: page.elements,
            status: page.status,
            summary: found?.summary ?? null,
            analysis: found ? 'available' : 'missing',
            notes: found?.notes ?? [],
            links: page.links,
            markdown: renderPage({
                version: resolved,
                page,
                markdown: markdown(`${resolved}/${page.id}`),
                analysis: found,
                webTypes: webTypes(resolved),
            }),
        };
    }

    // Alles over één component in één antwoord: de API uit de web-types, de pagina, de voorbeelden per story, de
    // status en wat er de vorige versies aan veranderde.
    function getComponent(version, component) {
        const resolved = requireVersion(version);
        const raw = String(component ?? '').trim().toLowerCase();
        if (!raw) throw new CatalogError('Geef een component op, bv. vl-button.');
        const name = raw.startsWith('vl-') ? raw : `vl-${raw}`;
        const known = webTypes(resolved)?.get(name);
        if (!known) {
            throw new CatalogError(
                `${name} staat niet in de web-types van Flux ${resolved}. Zoek met searchDocs of listPages.`,
            );
        }
        const page = storybook(resolved).pages.find((candidate) => candidate.elements.includes(name)) ?? null;
        const found = page ? analysis(page) : null;
        let changes = null;
        try {
            history ??= createCatalog(dir);
            changes = history.getComponentHistory(name, { to: resolved });
        } catch (error) {
            if (!(error instanceof CatalogError)) throw error;
        }
        return {
            version: resolved,
            element: name,
            category: known.category,
            description: known.element.description ?? null,
            deprecated: known.element.deprecated ?? null,
            api: {
                attributes: known.element.attributes ?? [],
                properties: known.element.js?.properties ?? [],
                slots: known.element.slots ?? [],
                events: known.element.js?.events ?? [],
            },
            page: page ? page.id : null,
            url: page ? docsUrl(resolved, page.id) : null,
            status: page?.status ?? null,
            summary: found?.summary ?? null,
            analysis: page ? (found ? 'available' : 'missing') : null,
            examples: (page?.stories ?? []).map((story) => ({
                id: story.id,
                name: story.name,
                url: storyUrl(resolved, story.id),
                html: found?.examples?.[story.id]?.html ?? null,
                js: found?.examples?.[story.id]?.js ?? null,
            })),
            notes: (found?.notes ?? []).filter((note) => !note.element || note.element === name),
            changes,
        };
    }

    // Welke pagina's over een onderwerp gaan. Zoekt in de titel, de id, de elementen, de zoektermen en de
    // samenvatting uit de analyse, en in de tekst. Een pagina telt mee als ze minstens de helft van de woorden bevat.
    function searchDocs(query, { version, kind, includeFluxTeam = false, limit = 10 } = {}) {
        const resolved = requireVersion(version);
        const terms = [...new Set(words(query))];
        if (terms.length === 0) {
            throw new CatalogError('Geef een zoekterm op, bv. "formulier validatie" of "vl-modal".');
        }
        const kinds = kind == null ? null : [].concat(kind);
        let hiddenFluxTeam = 0;
        const results = [];
        for (const page of storybook(resolved).pages) {
            if (kinds && !kinds.includes(page.kind)) continue;
            const found = analysis(page);
            const text = markdown(`${resolved}/${page.id}`).toLowerCase();
            const fields = [
                [page.title.toLowerCase(), 5],
                [page.id, 4],
                [page.elements.join(' '), 6],
                [(found?.keywords ?? []).join(' ').toLowerCase(), 4],
                [(found?.summary ?? '').toLowerCase(), 3],
            ];
            let score = 0;
            let matched = 0;
            for (const term of terms) {
                const inFields = fields.reduce((sum, [field, weight]) => sum + (field.includes(term) ? weight : 0), 0);
                const inText = Math.min(count(text, term), 5);
                if (inFields + inText > 0) matched++;
                score += inFields + inText;
            }
            if (matched === 0 || matched < terms.length / 2) continue;
            if (!includeFluxTeam && page.kind === FLUX_TEAM && !kinds?.includes(FLUX_TEAM)) {
                hiddenFluxTeam++;
                continue;
            }
            const matches = (candidate) => terms.some((term) => candidate.toLowerCase().includes(term));
            const line = markdown(`${resolved}/${page.id}`)
                .split('\n')
                .find((candidate) => !candidate.startsWith('#') && matches(candidate));
            results.push({ ...summaryOf(resolved, page), score, passage: line ? line.trim().slice(0, 240) : null });
        }
        results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
        return {
            version: resolved,
            query: String(query),
            results: results.slice(0, limit),
            total: results.length,
            hiddenFluxTeam,
        };
    }

    // Welke pagina's tussen twee versies bijkwamen, wijzigden of verdwenen, op basis van de inhoud (inputHash). Ook
    // documentatie die wijzigde zonder changelog-entry.
    function getDocsChanges(from, to, { includeFluxTeam = false } = {}) {
        const [a, b] = [requireVersion(from), requireVersion(to)];
        if (compareVersions(a, b) >= 0) throw new CatalogError(`Van ${a} naar ${b} is geen upgrade.`);
        const before = new Map(storybook(a).pages.map((page) => [page.id, page]));
        const after = new Map(storybook(b).pages.map((page) => [page.id, page]));
        let hiddenFluxTeam = 0;
        const changed = (page) => before.has(page.id) && before.get(page.id).inputHash !== page.inputHash;
        const select = (pages, keep, version) =>
            [...pages.values()]
                .filter((page) => keep(page))
                .filter((page) => {
                    if (includeFluxTeam || page.kind !== FLUX_TEAM) return true;
                    hiddenFluxTeam++;
                    return false;
                })
                .map((page) => summaryOf(version, page));
        return {
            from: a,
            to: b,
            added: select(after, (page) => !before.has(page.id), b),
            changed: select(after, changed, b),
            removed: select(before, (page) => !after.has(page.id), a),
            hiddenFluxTeam,
        };
    }

    return { listDocVersions, listPages, getPage, getComponent, searchDocs, getDocsChanges };
}
