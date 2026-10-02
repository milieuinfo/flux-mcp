// De tools van de MCP-server (ADR-004, sectie 4): per tool de naam, de titel, de beschrijving voor het model, de
// schema's en 'build', die met de queries uit catalog.mjs en docs.mjs het antwoord bouwt. De server (server.mjs)
// toetst de argumenten, verdeelt het antwoord over delen (paging.mjs) en zet het om naar Markdown (render.mjs).
//
//   createTools({ catalog, docs, catalogVersion })  →  [{ name, title, description, inputSchema, outputSchema,
//                                                        annotations, build(args) → { result, sections, links } }]
//
// Elk antwoord heeft dezelfde vaste velden: 'version' (de effectieve versie), 'catalog' (de versie van flux-mcp),
// 'warnings' en 'sources'. Een bron is { kind, path, url? }, met path relatief aan catalog/flux/; een * staat voor
// elke versie. Wat uit een bron *-analysis komt, schreef een LLM.
//
// Een fout in de vraag is een CatalogError; explain() vult haar aan met wat het model verder helpt, zoals de namen
// die op een onbekend element lijken.

import {
    CatalogError,
    compareVersions,
    normalizeVersion,
    resolveVersion,
    SIDE_BRANCH_PATCHES,
    sideBranchBase,
} from '../catalog.mjs';
import { IMPACTS } from '../changelog.mjs';
import { statusOf } from '../docs.mjs';
import { checkMarkup, closest, parseMarkup, SEVERITIES, SYNTAXES } from '../markup.mjs';
import { paginate } from './paging.mjs';

export const SOURCE_KINDS = [
    'web-types',
    'packages',
    'changelog',
    'changelog-analysis',
    'storybook',
    'storybook-analysis',
];
// De soorten pagina's van flux_get_guidance; een componentpagina geeft flux_get_component.
export const GUIDANCE_KINDS = ['guide', 'guideline', 'pattern', 'recipe', 'styles', 'planning', 'flux-team'];
// Standaard alle behalve het werk van het Flux-team zelf (Bijdragen, Beheren).
const DEFAULT_GUIDANCE_KINDS = GUIDANCE_KINDS.filter((kind) => kind !== 'flux-team');
const SEARCH_KINDS = ['component', ...GUIDANCE_KINDS];
const SECTIONS = ['api', 'examples', 'docs', 'history'];
const UPGRADE_IMPACTS = ['action', 'opt-in', 'automatic'];
// Bij een upgrade met componenten: de pagina's die er altijd bij horen, naast die van de componenten.
const UPGRADE_DOC_KINDS = ['guide', 'guideline', 'pattern', 'recipe'];

const ANNOTATIONS = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

// ---------------------------------------------------------------------------------------------------------------
// Schema's.

const string = (description, maxLength = 200) => ({ type: 'string', maxLength, description });
const VERSION = string(
    "De versie van Flux: bv. '2.20.0', 'v2.20.0' of 'latest'. Neem de versie van @domg-wc/components uit de " +
        "package.json van het project. 'latest' is de nieuwste versie in deze catalogus.",
    40,
);
const DETAIL = {
    type: 'string',
    enum: ['summary', 'full'],
    default: 'summary',
    description: "'summary' (standaard) of 'full', met de beschrijvingen en uitleg erbij.",
};
const CURSOR = string('De nextCursor van een vorig deel van hetzelfde antwoord, met dezelfde andere argumenten.', 400);
const input = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });

const nullable = (type) => ({ type: [].concat(type, 'null') });
const strings = { type: 'array', items: { type: 'string' } };
const SOURCE = {
    type: 'object',
    required: ['kind', 'path'],
    properties: { kind: { type: 'string', enum: SOURCE_KINDS }, path: { type: 'string' }, url: { type: 'string' } },
};
const FIXED = {
    version: nullable('string'),
    catalog: { type: 'string' },
    warnings: strings,
    sources: { type: 'array', items: SOURCE },
    part: { type: 'integer' },
    parts: { type: 'integer' },
    nextCursor: { type: 'string' },
};
const output = (properties, required = []) => ({
    type: 'object',
    properties: { ...FIXED, ...properties },
    required: ['version', 'catalog', 'warnings', 'sources', ...required],
});
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required });
const list = (items) => ({ type: 'array', items });
const STATUS = { type: 'string', enum: ['deprecated', 'next', 'internal', 'stable'] };
const IMPACT = { type: 'string', enum: IMPACTS };
const ENTRY = object(
    {
        version: { type: 'string' },
        id: { type: 'string' },
        ticket: nullable('string'),
        type: { type: 'string' },
        impact: IMPACT,
        impactSource: { type: 'string', enum: ['analysis', 'derived'] },
        components: strings,
        summary: { type: 'string' },
        action: nullable('string'),
        explanation: nullable('string'),
        example: nullable('string'),
    },
    ['version', 'id', 'ticket', 'type', 'impact', 'impactSource', 'components', 'summary'],
);
const byImpact = { type: 'object', additionalProperties: list(ENTRY) };

// ---------------------------------------------------------------------------------------------------------------
// Bronnen.

const source = (kind, path, url) => ({ kind, path, ...(url ? { url } : {}) });
const dedupe = (sources) => [...new Map(sources.map((item) => [`${item.kind} ${item.path}`, item])).values()];

// ---------------------------------------------------------------------------------------------------------------
// Hulp bij fouten.

const TOOL_HINTS = {
    search: 'Zoek met flux_search_docs.',
    guidance: 'Gidsen, richtlijnen, patronen en recepten haal je op met flux_get_guidance.',
};

// ---------------------------------------------------------------------------------------------------------------
// De tools.

export function createTools({ catalog, docs, catalogVersion }) {
    const fixed = (version, warnings = []) => ({ version, catalog: catalogVersion, warnings: [...warnings] });
    const resolve = (version) => catalog.resolve(version);

    // Een onbekend element: de namen die erop lijken, en de versies waarin het wel bestaat.
    // In welke versies een element wel bestaat, als zin, of null als het in geen enkele versie staat.
    function existsIn(element, version) {
        const versions = catalog.elementVersions(element);
        if (versions.length === 0) return null;
        const [first, last] = [versions[0], versions.at(-1)];
        if (compareVersions(version, first) < 0) return `${element} bestaat vanaf ${first}.`;
        if (compareVersions(version, last) > 0) {
            return `${element} staat laatst in ${last}; wat er veranderde, toont flux_get_upgrade.`;
        }
        return `${element} staat in ${versions.join(', ')}.`;
    }

    function unknownElement(error) {
        const { element, version } = error.details;
        const parts = [error.message];
        const known = version ? docs.elementNames(version) : [];
        const exists = version ? existsIn(element, version) : null;
        if (exists) {
            parts.push(exists);
        } else {
            const similar = closest(element, known);
            if (similar.length > 0) parts.push(`Bedoelde je ${similar.join(', ')}?`);
            parts.push(TOOL_HINTS.search);
        }
        return parts.join(' ');
    }

    // De tekst van een fout in de vraag, aangevuld met wat het model verder helpt.
    function explain(error) {
        if (error.details?.code === 'unknown-element') return unknownElement(error);
        const hint = TOOL_HINTS[error.details?.suggest];
        return hint ? `${error.message} ${hint}` : error.message;
    }

    // -----------------------------------------------------------------------------------------------------------

    const listVersions = {
        name: 'flux_list_versions',
        title: 'Flux-versies in de catalogus',
        description:
            'Welke versies van de Flux web-componenten (@domg-wc/*) deze server kent, en wat er per versie is: de ' +
            'datum, de vorige versie, het aantal wijzigingen per impact, de web-types, de dependencies, de analyse ' +
            "van de changelog en de pagina's uit Storybook. 'latest' is de nieuwste versie in deze catalogus, niet " +
            'per se de nieuwste release van Flux. Gebruik deze tool om te weten of een versie gekend is; voor wat er ' +
            "in een versie veranderde, gebruik je flux_get_upgrade. Met detail 'full' ook de samenvatting per versie.",
        inputSchema: input({ detail: DETAIL, cursor: CURSOR }),
        outputSchema: output(
            {
                latest: { type: 'string' },
                coverage: object({
                    oldest: { type: 'string' },
                    newest: { type: 'string' },
                    gaps: list(object({ version: { type: 'string' }, previousOf: { type: 'string' } })),
                    notIncluded: object({ majors: list({ type: 'integer' }), sideBranchPatches: strings }),
                }),
                versions: list(
                    object(
                        {
                            version: { type: 'string' },
                            date: nullable('string'),
                            previous: nullable('string'),
                            previousInCatalog: { type: 'boolean' },
                            impact: { type: 'object', additionalProperties: { type: 'integer' } },
                            webTypes: { type: 'boolean' },
                            packages: { type: 'boolean' },
                            changelogAnalysis: { type: 'string', enum: ['complete', 'partial', 'missing'] },
                            pages: { type: 'integer' },
                            pagesAnalysed: { type: 'integer' },
                            storybookUrl: nullable('string'),
                            summary: nullable('string'),
                        },
                        ['version', 'impact', 'changelogAnalysis', 'pages', 'pagesAnalysed'],
                    ),
                ),
            },
            ['latest', 'coverage', 'versions'],
        ),
        build({ detail = 'summary' }) {
            const pages = new Map(docs.listDocVersions().map((item) => [item.version, item]));
            const coverage = catalog.coverage();
            return {
                result: {
                    ...fixed(null),
                    latest: coverage.newest,
                    coverage: {
                        oldest: coverage.oldest,
                        newest: coverage.newest,
                        gaps: coverage.gaps,
                        notIncluded: { majors: [1], sideBranchPatches: SIDE_BRANCH_PATCHES },
                    },
                    versions: catalog.listVersions().map((item) => ({
                        version: item.version,
                        date: item.date,
                        previous: item.previous,
                        previousInCatalog: item.previousInCatalog,
                        impact: item.counts.impact,
                        webTypes: item.webTypes,
                        packages: item.packages,
                        changelogAnalysis: item.changelogAnalysis,
                        pages: pages.get(item.version)?.pages ?? 0,
                        pagesAnalysed: pages.get(item.version)?.analysed ?? 0,
                        storybookUrl: pages.get(item.version)?.url ?? null,
                        ...(detail === 'full' ? { summary: item.summary } : {}),
                    })),
                    sources: [
                        source('changelog', '*/changelog/release.json'),
                        source('changelog-analysis', '*/changelog-analysis/release.json'),
                        source('storybook', '*/storybook/index.json'),
                    ],
                },
                sections: [['versions']],
            };
        },
    };

    // -----------------------------------------------------------------------------------------------------------

    const searchDocs = {
        name: 'flux_search_docs',
        title: 'Zoek in de documentatie van Flux',
        description:
            "Zoekt in de documentatie van één versie van Flux (de pagina's uit Storybook): welke component, welk " +
            'patroon, welke richtlijn of welk recept past bij een vraag. Zoek in het Nederlands of het Engels, op ' +
            "functie ('datumkiezer', 'formulier validatie') of op naam ('vl-modal'). Geeft per pagina de titel, de " +
            'soort, de elementen met hun status, een samenvatting, een passage en de link. Beperk met kind, bv. ' +
            "'component' of 'pattern'. Ken je de component al, gebruik dan flux_get_component; voor alle gidsen of " +
            'patronen van een soort, flux_get_guidance.',
        inputSchema: input(
            {
                version: VERSION,
                query: string('De zoekvraag, bv. "datumkiezer" of "formulier validatie".'),
                kind: { type: 'string', enum: SEARCH_KINDS, description: "Enkel pagina's van deze soort." },
                limit: { type: 'integer', minimum: 1, maximum: 50, default: 10, description: 'Hoeveel resultaten.' },
                includeFluxTeam: {
                    type: 'boolean',
                    default: false,
                    description: "Ook de pagina's over het werk van het Flux-team zelf (Bijdragen, Beheren).",
                },
                cursor: CURSOR,
            },
            ['version', 'query'],
        ),
        outputSchema: output(
            {
                query: { type: 'string' },
                results: list(
                    object(
                        {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            kind: { type: 'string' },
                            status: nullable('string'),
                            elements: list(object({ name: { type: 'string' }, status: STATUS })),
                            summary: nullable('string'),
                            passage: nullable('string'),
                            score: { type: 'number' },
                            url: { type: 'string' },
                        },
                        ['id', 'title', 'kind', 'elements', 'score', 'url'],
                    ),
                ),
                total: { type: 'integer' },
                hiddenFluxTeam: { type: 'integer' },
            },
            ['query', 'results', 'total', 'hiddenFluxTeam'],
        ),
        build({ version, query, kind, limit = 10, includeFluxTeam = false }) {
            const at = resolve(version);
            const found = docs.searchDocs(query, { version: at.version, kind, limit, includeFluxTeam });
            const results = found.results.map((item) => {
                const page = docs.pageOf(at.version, item.id);
                const elements = item.elements.map((name) => ({
                    name,
                    status: statusOf({ element: docs.elementOf(at.version, name)?.element, page }),
                }));
                return {
                    id: item.id,
                    title: item.title,
                    kind: item.kind,
                    status: ['component', 'styles'].includes(item.kind) ? statusOf({ page }) : null,
                    elements,
                    summary: item.summary,
                    passage: item.passage,
                    score: item.score,
                    url: item.url,
                };
            });
            return {
                result: {
                    ...fixed(at.version, [at.warning].filter(Boolean)),
                    query: found.query,
                    results,
                    total: found.total,
                    hiddenFluxTeam: found.hiddenFluxTeam,
                    sources: [
                        source('storybook', `${at.version}/storybook/index.json`),
                        source('storybook-analysis', 'storybook-analysis/'),
                    ],
                },
                sections: [['results']],
            };
        },
    };

    // -----------------------------------------------------------------------------------------------------------

    const getComponent = {
        name: 'flux_get_component',
        title: 'Een component van Flux',
        description:
            'Alles over één component in één versie van Flux: de API (attributen, properties, slots en events ' +
            'uit de web-types), de voorbeelden per story, de status, en op vraag de documentatie en wat er de vorige ' +
            "versies aan veranderde. 'component' is een element ('vl-button' of 'button'), een Storybook-id " +
            "('components-atom-button', zoals in de Figma-description) of een link naar Storybook. Standaard de " +
            "secties 'api' en 'examples'; 'docs' geeft de hele pagina, 'history' de wijzigingen met impact. Status " +
            "'deprecated' komt uit de web-types, 'next' is een voorloper van v3; generatie 'legacy' in de metadata " +
            'is de technische basis, geen uitfasering. Zoek je nog welke component past, gebruik flux_search_docs; ' +
            'markup die je schreef, controleer je met flux_check_markup.',
        inputSchema: input(
            {
                version: VERSION,
                component: string(
                    "Een element ('vl-button', 'button'), een Storybook-id of een link naar Storybook.",
                    400,
                ),
                sections: {
                    type: 'array',
                    items: { type: 'string', enum: SECTIONS },
                    maxItems: SECTIONS.length,
                    description: "Welke secties: 'api', 'examples', 'docs', 'history'. Standaard 'api' en 'examples'.",
                },
                detail: DETAIL,
                cursor: CURSOR,
            },
            ['version', 'component'],
        ),
        outputSchema: output(
            {
                element: { type: 'string' },
                category: { type: 'string' },
                status: STATUS,
                description: nullable('string'),
                deprecated: { type: ['string', 'boolean', 'null'] },
                page: nullable('string'),
                title: nullable('string'),
                url: nullable('string'),
                summary: nullable('string'),
                analysis: { type: ['string', 'null'], enum: ['available', 'missing', null] },
                metadata: nullable('object'),
                api: object({
                    attributes: list({ type: 'object' }),
                    properties: list({ type: 'object' }),
                    slots: list({ type: 'object' }),
                    events: list({ type: 'object' }),
                    notes: list({ type: 'object' }),
                }),
                examples: list(
                    object(
                        {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            url: { type: 'string' },
                            html: nullable('string'),
                            js: nullable('string'),
                        },
                        ['id', 'name', 'url'],
                    ),
                ),
                docs: { type: 'string' },
                history: list(
                    object({
                        version: { type: 'string' },
                        entries: list(ENTRY),
                        api: nullable('object'),
                    }),
                ),
                related: object({ elements: strings, pages: strings }),
            },
            ['element', 'category', 'status', 'page', 'related'],
        ),
        build({ version, component, sections = ['api', 'examples'], detail = 'summary' }) {
            const at = resolve(version);
            const found = docs.getComponent(at.version, component);
            const page = found.page ? docs.pageOf(at.version, found.page) : null;
            const entry = docs.elementOf(at.version, found.element);
            const full = detail === 'full';
            const wanted = new Set(sections);
            const describe = (item) => (full && item.description ? { description: item.description } : {});
            const optional = (key, value) => (value != null && value !== false ? { [key]: value } : {});
            const result = {
                ...fixed(at.version, [at.warning].filter(Boolean)),
                element: found.element,
                category: found.category,
                status: statusOf({ element: entry.element, page }),
                description: found.description,
                deprecated: found.deprecated,
                page: found.page,
                title: found.title,
                url: found.url,
                summary: found.summary,
                analysis: found.analysis,
                metadata: found.status,
            };
            if (wanted.has('api')) {
                result.api = {
                    attributes: found.api.attributes.map((item) => ({
                        name: item.name,
                        type: item.value?.type ?? null,
                        default: item.default ?? null,
                        ...optional('deprecated', item.deprecated),
                        ...describe(item),
                    })),
                    properties: found.api.properties.map((item) => ({
                        name: item.name,
                        type: item.type ?? null,
                        ...optional('default', item.default),
                        ...optional('deprecated', item.deprecated),
                        ...describe(item),
                    })),
                    slots: found.api.slots.map((item) => ({ name: item.name ?? '', ...describe(item) })),
                    events: found.api.events.map((item) => ({
                        name: item.name,
                        ...optional('type', item.type),
                        ...describe(item),
                    })),
                    notes: found.notes.map(({ type, element, name, text }) => ({
                        type,
                        ...optional('element', element),
                        ...optional('name', name),
                        text,
                    })),
                };
            }
            if (wanted.has('examples')) result.examples = found.examples;
            if (wanted.has('docs') && found.page) result.docs = docs.getPage(at.version, found.page).markdown;
            if (wanted.has('history')) {
                result.history = (found.changes?.history ?? []).map((item) => ({
                    version: item.version,
                    entries: item.entries.map((change) => entryOf({ version: item.version, ...change }, full)),
                    api: item.webTypesDiff,
                }));
            }
            result.related = found.related;
            const analysisFile = page && found.analysis === 'available' ? `${page.id}/${page.inputHash}.json` : null;
            result.sources = [
                source('web-types', `${at.version}/web-types/${found.category}.web-types.json`),
                ...(page ? [source('storybook', `${at.version}/storybook/pages/${page.id}.md`, found.url)] : []),
                ...(analysisFile ? [source('storybook-analysis', `storybook-analysis/${analysisFile}`)] : []),
                ...(result.history ?? []).flatMap((item) => [
                    source('changelog', `${item.version}/changelog/`),
                    source('changelog-analysis', `${item.version}/changelog-analysis/`),
                ]),
            ];
            const links =
                found.page && !wanted.has('docs')
                    ? [
                          {
                              type: 'resource_link',
                              uri: `flux://${at.version}/docs/${found.page}`,
                              name: found.page,
                              title: found.title ?? found.page,
                              description: 'De volledige pagina uit Storybook, als Markdown.',
                              mimeType: 'text/markdown',
                          },
                      ]
                    : [];
            return {
                result,
                sections: [
                    ['api', 'attributes'],
                    ['api', 'properties'],
                    ['api', 'slots'],
                    ['api', 'events'],
                    ['api', 'notes'],
                    ['examples'],
                    { path: ['docs'], text: true },
                    ['history'],
                ],
                links,
            };
        },
    };

    // -----------------------------------------------------------------------------------------------------------

    const getGuidance = {
        name: 'flux_get_guidance',
        title: 'Gidsen, richtlijnen, patronen en recepten van Flux',
        description:
            'De gidsen, richtlijnen, patronen, recepten, styles en planning uit de documentatie van één versie van ' +
            "Flux. Zonder 'id' een index met per pagina de id, de soort, de titel en een samenvatting; beperk met " +
            "'kind' (bv. 'pattern') of met 'appliesTo' (enkel de pagina's die een element noemen, bv. " +
            "'vl-input-field'). Met 'id' de pagina zelf, als Markdown. De id van een pagina is de referentie in een " +
            "rapport, bv. 'patronen-formulier-validatie'. Een componentpagina haal je op met flux_get_component; " +
            'zoeken op een onderwerp doe je met flux_search_docs.',
        inputSchema: input(
            {
                version: VERSION,
                id: string('De id van een pagina, of een link naar Storybook. Zonder id: de index.', 400),
                kind: {
                    type: 'string',
                    enum: GUIDANCE_KINDS,
                    description:
                        "Enkel deze soort. Standaard alle behalve 'flux-team', het werk van het Flux-team zelf.",
                },
                appliesTo: string("Enkel de pagina's die dit element noemen, bv. 'vl-input-field'.", 100),
                limit: { type: 'integer', minimum: 1, maximum: 500, description: "Hoeveel pagina's in de index." },
                cursor: CURSOR,
            },
            ['version'],
        ),
        outputSchema: output({
            pages: list(
                object(
                    {
                        id: { type: 'string' },
                        kind: { type: 'string' },
                        title: { type: 'string' },
                        summary: nullable('string'),
                        url: { type: 'string' },
                    },
                    ['id', 'kind', 'title', 'url'],
                ),
            ),
            total: { type: 'integer' },
            hiddenFluxTeam: { type: 'integer' },
            page: object(
                {
                    id: { type: 'string' },
                    kind: { type: 'string' },
                    title: { type: 'string' },
                    url: { type: 'string' },
                    summary: nullable('string'),
                    analysis: { type: 'string', enum: ['available', 'missing'] },
                    links: strings,
                },
                ['id', 'kind', 'title', 'url', 'analysis', 'links'],
            ),
            markdown: { type: 'string' },
        }),
        build({ version, id, kind, appliesTo, limit }) {
            const at = resolve(version);
            const warnings = [at.warning].filter(Boolean);
            if (id != null) {
                const found = docs.getPage(at.version, id);
                if (found.kind === 'component') {
                    throw new CatalogError(
                        `${found.id} is een componentpagina; haal ze op met flux_get_component ` +
                            `(component: '${found.id}').`,
                    );
                }
                const page = docs.pageOf(at.version, found.id);
                return {
                    result: {
                        ...fixed(at.version, warnings),
                        page: {
                            id: found.id,
                            kind: found.kind,
                            title: found.title,
                            url: found.url,
                            summary: found.summary,
                            analysis: found.analysis,
                            links: found.links,
                        },
                        markdown: found.markdown,
                        sources: [
                            source('storybook', `${at.version}/storybook/pages/${found.id}.md`, found.url),
                            ...(found.analysis === 'available'
                                ? [
                                      source(
                                          'storybook-analysis',
                                          `storybook-analysis/${found.id}/${page.inputHash}.json`,
                                      ),
                                  ]
                                : []),
                        ],
                    },
                    sections: [{ path: ['markdown'], text: true }],
                };
            }
            const kinds = kind ? [kind] : DEFAULT_GUIDANCE_KINDS;
            const found = docs.listPages(at.version, { kind: kinds, appliesTo });
            const hiddenFluxTeam = kind ? 0 : docs.listPages(at.version, { kind: 'flux-team', appliesTo }).pages.length;
            const pages = found.pages.map(({ id: pageId, kind: pageKind, title, summary, url }) => ({
                id: pageId,
                kind: pageKind,
                title,
                summary,
                url,
            }));
            return {
                result: {
                    ...fixed(at.version, warnings),
                    pages: limit == null ? pages : pages.slice(0, limit),
                    total: pages.length,
                    hiddenFluxTeam,
                    sources: [
                        source('storybook', `${at.version}/storybook/index.json`),
                        source('storybook-analysis', 'storybook-analysis/'),
                    ],
                },
                sections: [['pages']],
            };
        },
    };

    // -----------------------------------------------------------------------------------------------------------

    // De versie waarvan een upgrade vertrekt: een versie uit de catalogus, een patch op een zijtak (de diffs
    // vertrekken dan van haar minor), of een versie vóór de oudste, zoals v1. Elke andere versie is een fout.
    function resolveFrom(from, versions) {
        const version = normalizeVersion(from);
        if (versions.includes(version)) return { version, warning: null };
        const base = sideBranchBase(versions, version);
        if (base) {
            const warning =
                `Flux ${version} is een patch op een zijtak en staat niet in de catalogus. De diffs vertrekken van ` +
                `${base}: fixes die al in de patches tot en met ${version} zaten, kunnen als wijziging verschijnen.`;
            return { version, warning };
        }
        if (compareVersions(version, versions[0]) < 0) return { version, warning: null };
        resolveVersion(versions, version);
        return { version, warning: null };
    }

    const getUpgrade = {
        name: 'flux_get_upgrade',
        title: 'Een upgrade van Flux',
        description:
            "Wat er verandert bij een upgrade van Flux van versie 'from' naar 'to', voor een afnemend project. " +
            "Geeft de wijzigingen per impact: 'action' (je moet iets aanpassen of nakijken, altijd met de actie), " +
            "'opt-in' (een nieuwe mogelijkheid) en 'automatic' (je krijgt ze mee), de netto wijzigingen aan de API " +
            'uit de web-types, wat zonder changelog-entry veranderde, de documentatie en de dependencies. Geef in ' +
            "'components' de elementen die het project gebruikt: dan komen ook de algemene wijzigingen ('general') " +
            "die elk project raken. Zonder 'from' enkel wat er in 'to' nieuw is. Een groot antwoord komt in delen: " +
            "haal ze allemaal op met 'cursor'. Wat er in de code van het project breekt, toont flux_check_markup met " +
            "'targetVersion'. Voor één ticket of één onderwerp, gebruik flux_find_changes.",
        inputSchema: input(
            {
                to: VERSION,
                from: string("De versie van het project, bv. '2.12.0'. Zonder from: wat er in 'to' nieuw is.", 40),
                components: {
                    type: 'array',
                    items: { type: 'string', maxLength: 100 },
                    maxItems: 300,
                    description: "De elementen die het project gebruikt, bv. ['vl-button', 'vl-alert'].",
                },
                impact: {
                    type: 'array',
                    items: { type: 'string', enum: IMPACTS },
                    minItems: 1,
                    maxItems: IMPACTS.length,
                    description:
                        "Welke impact: standaard 'action', 'opt-in' en 'automatic'; 'none' raakt geen project.",
                },
                detail: DETAIL,
                cursor: CURSOR,
            },
            ['to'],
        ),
        outputSchema: output(
            {
                resolved: object(
                    {
                        from: { type: 'string' },
                        base: { type: 'string' },
                        to: { type: 'string' },
                        versions: strings,
                        complete: { type: 'boolean' },
                        missing: nullable('object'),
                        crossesMajor: { type: 'boolean' },
                    },
                    ['from', 'base', 'to', 'versions', 'complete', 'crossesMajor'],
                ),
                components: strings,
                changes: byImpact,
                general: { type: ['object', 'null'], additionalProperties: list(ENTRY) },
                apiDelta: {
                    type: ['object', 'null'],
                    properties: {
                        added: list({ type: 'object' }),
                        removed: list({ type: 'object' }),
                        changed: list({ type: 'object' }),
                        descriptions: list({ type: 'object' }),
                    },
                },
                apiDeltaUnavailable: nullable('string'),
                unexplained: list(
                    object({
                        element: { type: 'string' },
                        change: { type: 'string', enum: ['added', 'removed', 'changed'] },
                    }),
                ),
                docs: list(
                    object({
                        change: { type: 'string', enum: ['added', 'changed', 'removed'] },
                        id: { type: 'string' },
                        title: { type: 'string' },
                        kind: { type: 'string' },
                        url: { type: 'string' },
                    }),
                ),
                docsUnavailable: nullable('string'),
                dependencies: nullable('object'),
                dependenciesUnavailable: nullable('string'),
                unlistedCommits: { type: ['array', 'null'], items: { type: 'object' } },
                summaries: list(object({ version: { type: 'string' }, summary: nullable('string') })),
                hiddenNoImpact: { type: 'integer' },
                hiddenDescriptions: { type: 'integer' },
            },
            ['resolved', 'changes', 'apiDelta', 'unexplained', 'docs', 'dependencies', 'hiddenNoImpact'],
        ),
        build(args) {
            const { to, from, components = [], impact = UPGRADE_IMPACTS, detail = 'summary' } = args;
            const versions = catalog.versions();
            const target = resolve(to);
            const warnings = [target.warning].filter(Boolean);
            const previous = catalog.listVersions().find((item) => item.version === target.version)?.previous;
            let start = previous;
            if (from != null) {
                const resolved = resolveFrom(from, versions);
                start = resolved.version;
                if (resolved.warning) warnings.push(resolved.warning);
            }
            if (start == null)
                throw new CatalogError(`Van ${target.version} is geen vorige versie gekend; geef 'from'.`);
            const names = [...new Set(components.map((name) => name.trim().toLowerCase()))].map((name) =>
                name.startsWith('vl-') ? name : `vl-${name}`,
            );
            const unknown = names.filter((name) => catalog.elementVersions(name).length === 0);
            if (unknown.length > 0) {
                warnings.push(`Deze elementen staan in geen enkele versie van de web-types: ${unknown.join(', ')}.`);
            }
            const full = detail === 'full';
            const changes = catalog.getChangesBetween(start, target.version, {
                component: names.length > 0 ? names : undefined,
                includeNoImpact: impact.includes('none'),
                includeDescriptions: full,
            });
            if (changes.warning) warnings.push(changes.warning);
            const impacts = IMPACTS.filter((item) => impact.includes(item));
            const grouped = (groups, withDetails) =>
                Object.fromEntries(
                    impacts.map((item) => [item, (groups?.[item] ?? []).map((entry) => entryOf(entry, withDetails))]),
                );

            const diff = changes.webTypesDiff;
            const strip = (value) => (full ? value : withoutDescriptions(value));
            const apiDelta = diff
                ? {
                      added: diff.added.map(({ docUrl, ...item }) => strip(item)),
                      removed: diff.removed.map(({ docUrl, ...item }) => strip(item)),
                      changed: diff.changed.map((item) => strip(item)),
                      ...(full ? { descriptions: diff.descriptions } : {}),
                  }
                : null;
            const unexplained = diff
                ? ['added', 'removed', 'changed'].flatMap((change) =>
                      diff[change]
                          .filter((item) => !item.inChangelog)
                          .map((item) => ({ element: item.element, change })),
                  )
                : [];

            let docsChanges = [];
            let docsUnavailable = null;
            const docVersions = docs.versions();
            if (docVersions.includes(changes.base) && docVersions.includes(target.version)) {
                const found = docs.getDocsChanges(changes.base, target.version);
                const relevant = (page) =>
                    names.length === 0 ||
                    UPGRADE_DOC_KINDS.includes(page.kind) ||
                    page.elements.some((element) => names.includes(element));
                docsChanges = ['added', 'changed', 'removed'].flatMap((change) =>
                    found[change]
                        .filter(relevant)
                        .map(({ id, title, kind, url }) => ({ change, id, title, kind, url })),
                );
            } else {
                docsUnavailable = `Geen documentatie uit Storybook voor ${changes.base} in de catalogus.`;
            }

            const result = (withDetails) => ({
                ...fixed(target.version, warnings),
                resolved: {
                    from: changes.from,
                    base: changes.base,
                    to: changes.to,
                    versions: changes.versions.map((item) => item.version),
                    complete: changes.complete,
                    missing: changes.missing,
                    crossesMajor: changes.from.split('.')[0] !== changes.to.split('.')[0],
                },
                components: names,
                changes: grouped(changes.changes, withDetails),
                general: changes.general ? grouped(changes.general, withDetails) : null,
                apiDelta,
                apiDeltaUnavailable: changes.webTypesDiffUnavailable,
                unexplained,
                docs: docsChanges,
                docsUnavailable,
                dependencies: changes.dependenciesDiff,
                dependenciesUnavailable: changes.dependenciesDiffUnavailable,
                unlistedCommits: changes.unlistedCommits,
                ...(full ? { summaries: changes.versions.map(({ version, summary }) => ({ version, summary })) } : {}),
                hiddenNoImpact: changes.hiddenNoImpact,
                hiddenDescriptions: changes.hiddenDescriptions,
                sources: dedupe([
                    ...changes.versions.flatMap(({ version }) => [
                        source('changelog', `${version}/changelog/`),
                        source('changelog-analysis', `${version}/changelog-analysis/`),
                    ]),
                    ...(diff
                        ? [
                              source('web-types', `${changes.base}/web-types/`),
                              source('web-types', `${target.version}/web-types/`),
                          ]
                        : []),
                    ...(changes.dependenciesDiff
                        ? [
                              source('packages', `${changes.base}/packages/`),
                              source('packages', `${target.version}/packages/`),
                          ]
                        : []),
                    ...(docsUnavailable
                        ? []
                        : [
                              source('storybook', `${changes.base}/storybook/index.json`),
                              source('storybook', `${target.version}/storybook/index.json`),
                          ]),
                ]),
            });
            const sections = [
                ...impacts.flatMap((item) => [
                    ['changes', item],
                    ['general', item],
                ]),
                ['apiDelta', 'added'],
                ['apiDelta', 'removed'],
                ['apiDelta', 'changed'],
                ['apiDelta', 'descriptions'],
                ['unexplained'],
                ['docs'],
                ['unlistedCommits'],
                ['summaries'],
            ];
            // Met componenten komen de uitleg en het voorbeeld er ook bij, als het antwoord dan in één deel past.
            if (!full && names.length > 0) {
                const detailed = result(true);
                const single = paginate(detailed, { tool: 'flux_get_upgrade', args, sections });
                if (single.parts == null) return { result: detailed, sections };
            }
            return { result: result(full), sections };
        },
    };

    // -----------------------------------------------------------------------------------------------------------

    const findChanges = {
        name: 'flux_find_changes',
        title: 'Zoek een wijziging in Flux',
        description:
            "In welke versie van Flux zit een ticket (bv. 'FLUX-800') of een wijziging over een onderwerp (bv. " +
            "'window ready')? Zoekt over alle versies in de catalogus, de nieuwste eerst, in de tekst, de uitleg en " +
            "de actie van elke entry van de changelog. Beperk met 'component'. Geeft per resultaat de versie, het " +
            'ticket, het type, de impact, de componenten, de samenvatting en de uitleg. Voor alles wat er tussen ' +
            'twee versies verandert, gebruik flux_get_upgrade.',
        inputSchema: input(
            {
                query: string("Een ticket, bv. 'FLUX-800', of woorden die allemaal moeten voorkomen."),
                component: string("Enkel wijzigingen aan dit element, bv. 'vl-alert'.", 100),
                includeNoImpact: {
                    type: 'boolean',
                    default: true,
                    description: "Ook wijzigingen met impact 'none', zoals testen en documentatie.",
                },
                limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Hoeveel resultaten.' },
                cursor: CURSOR,
            },
            ['query'],
        ),
        outputSchema: output(
            {
                query: { type: 'string' },
                results: list(
                    object(
                        {
                            version: { type: 'string' },
                            id: { type: 'string' },
                            ticket: nullable('string'),
                            type: { type: 'string' },
                            impact: IMPACT,
                            impactSource: { type: 'string' },
                            components: strings,
                            summary: { type: 'string' },
                            explanation: nullable('string'),
                            action: nullable('string'),
                        },
                        ['version', 'id', 'ticket', 'type', 'impact', 'components', 'summary'],
                    ),
                ),
                total: { type: 'integer' },
                hiddenNoImpact: { type: 'integer' },
                coverage: { type: 'object' },
            },
            ['query', 'results', 'total', 'hiddenNoImpact', 'coverage'],
        ),
        build({ query, component, includeNoImpact = true, limit = 20 }) {
            const found = catalog.findChanges(query, { component, includeNoImpact, limit });
            return {
                result: {
                    ...fixed(null),
                    query: found.query,
                    results: found.results.map((entry) => ({
                        version: entry.version,
                        id: entry.id,
                        ticket: entry.ticket,
                        type: entry.type,
                        impact: entry.impact,
                        impactSource: entry.impactSource,
                        components: entry.components,
                        summary: entry.summary,
                        explanation: entry.explanation,
                        action: entry.action,
                    })),
                    total: found.total,
                    hiddenNoImpact: found.hiddenNoImpact,
                    coverage: found.coverage,
                    sources: dedupe(
                        found.results.flatMap((entry) => [
                            source('changelog', `${entry.version}/changelog/${entry.file}`),
                            source('changelog-analysis', `${entry.version}/changelog-analysis/${entry.file}`),
                        ]),
                    ),
                },
                sections: [['results']],
            };
        },
    };

    // -----------------------------------------------------------------------------------------------------------

    // Waarom iets in de doelversie breekt: de entry van de changelog over dat element, bij voorkeur een die het
    // attribuut noemt, en anders de eerste met de meeste impact. null als de changelog niets over het element zegt.
    function entryFor(changes, finding) {
        const all = UPGRADE_IMPACTS.flatMap((impact) => changes.changes[impact] ?? []);
        const bare = finding.attribute?.replace(/^[.@?]/, '');
        const names = (entry) => [entry.text, entry.explanation, entry.action].filter(Boolean).join(' ');
        const found = (bare && all.find((entry) => names(entry).includes(bare))) ?? all[0] ?? null;
        if (!found) return null;
        const { version, id, ticket, impact, summary, action } = found;
        return { version, id, ticket: ticket ?? null, impact, summary, action: action ?? null };
    }

    const FINDING = object(
        {
            code: { type: 'string' },
            severity: { type: 'string', enum: SEVERITIES },
            message: { type: 'string' },
            element: nullable('string'),
            attribute: nullable('string'),
            line: { type: 'integer' },
            column: { type: 'integer' },
            suggestion: nullable('string'),
            source: { type: 'string' },
            entry: nullable('object'),
        },
        ['code', 'severity', 'message', 'element', 'attribute', 'line', 'column', 'suggestion', 'source'],
    );

    const checkMarkupTool = {
        name: 'flux_check_markup',
        title: 'Controleer markup met Flux-componenten',
        description:
            'Controleert markup met Flux web-componenten tegen de API in de web-types van één versie van Flux: ' +
            'onbekende elementen en attributen, ongeldige waarden, deprecated onderdelen, slots, properties en ' +
            "events, met regel en kolom. 'markup' is HTML, een lit-template of een heel .ts- of .js-bestand " +
            "(syntax 'lit', standaard): de tool neemt er de templates html`…` uit en controleert geen dynamische " +
            "waarden. Met 'targetVersion' ook wat er in die versie breekt (breaks-in-target), met de entry uit de " +
            'changelog: gebruik dat voor een migratie. Los elke error op. Een warning over een waarde of een slot ' +
            'kan een gat in de web-types zijn: kijk dan de documentatie na met flux_get_component. De tool toetst ' +
            'enkel de API; patronen en toegankelijkheid beoordeel je met flux_get_guidance.',
        inputSchema: input(
            {
                version: VERSION,
                markup: string(
                    'De markup: HTML, een lit-template of een heel .ts- of .js-bestand. Tot 50.000 tekens.',
                    50000,
                ),
                syntax: {
                    type: 'string',
                    enum: SYNTAXES,
                    default: 'lit',
                    description:
                        "'lit' (standaard): templates html`…`, met .prop, @event en ?attr; 'html': gewone HTML.",
                },
                targetVersion: string('Een nieuwere versie: wat breekt er in de markup bij een upgrade daarheen?', 40),
                cursor: CURSOR,
            },
            ['version', 'markup'],
        ),
        outputSchema: output(
            {
                targetVersion: nullable('string'),
                syntax: { type: 'string', enum: SYNTAXES },
                elements: { type: 'integer' },
                counts: object({ error: { type: 'integer' }, warning: { type: 'integer' }, info: { type: 'integer' } }),
                findings: list(FINDING),
            },
            ['targetVersion', 'syntax', 'elements', 'counts', 'findings'],
        ),
        build({ version, markup, syntax = 'lit', targetVersion }) {
            const at = resolve(version);
            const warnings = [at.warning].filter(Boolean);
            const findings = checkMarkup(markup, { syntax, ...docs.markupContextOf(at.version) }).map((finding) =>
                enrich(finding, at.version),
            );
            let target = null;
            if (targetVersion != null) {
                target = resolve(targetVersion);
                if (target.warning) warnings.push(target.warning);
                if (compareVersions(target.version, at.version) <= 0) {
                    throw new CatalogError(
                        `targetVersion (${target.version}) moet nieuwer zijn dan version (${at.version}).`,
                    );
                }
                // Wat in de doelversie een bevinding geeft en in de versie zelf niet, breekt bij de upgrade.
                const key = (finding) =>
                    [finding.code, finding.element, finding.attribute, finding.line, finding.column].join('|');
                const present = new Set(findings.map(key));
                const after = checkMarkup(markup, { syntax, ...docs.markupContextOf(target.version) });
                const changes = new Map();
                for (const finding of after) {
                    if (present.has(key(finding)) || finding.severity === 'info') continue;
                    if (!changes.has(finding.element)) {
                        const component = finding.element ? [finding.element] : undefined;
                        changes.set(
                            finding.element,
                            catalog.getChangesBetween(at.version, target.version, { component }),
                        );
                    }
                    const entry = finding.element ? entryFor(changes.get(finding.element), finding) : null;
                    const enriched = enrich(finding, target.version);
                    const why = entry
                        ? ` Zie ${entry.ticket ?? entry.id} in ${entry.version}.`
                        : ' De changelog zegt er niets over (unexplained).';
                    // Verklaart de changelog het, dan is het geen gat in de web-types.
                    const gap = / De web-types kunnen onvolledig zijn;[^.]*\./;
                    const message = entry ? enriched.message.replace(gap, '') : enriched.message;
                    findings.push({
                        ...enriched,
                        code: 'breaks-in-target',
                        message: `In ${target.version}: ${message}${why}`,
                        source: entry ? 'changelog' : 'unexplained',
                        entry,
                    });
                }
                findings.sort(
                    (a, b) =>
                        a.line - b.line ||
                        a.column - b.column ||
                        SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) ||
                        a.code.localeCompare(b.code),
                );
            }
            const counts = Object.fromEntries(
                SEVERITIES.map((severity) => [severity, findings.filter((item) => item.severity === severity).length]),
            );
            const elements = parseMarkup(markup, { syntax }).filter((element) =>
                element.name?.startsWith('vl-'),
            ).length;
            const versions = target ? [at.version, target.version] : [at.version];
            return {
                result: {
                    ...fixed(at.version, warnings),
                    targetVersion: target?.version ?? null,
                    syntax,
                    elements,
                    counts,
                    findings: findings.map((finding) => ({ ...finding, entry: finding.entry ?? null })),
                    sources: dedupe([
                        ...versions.map((item) => source('web-types', `${item}/web-types/`)),
                        ...versions.map((item) => source('storybook', `${item}/storybook/index.json`)),
                        ...(findings.some((item) => item.source === 'storybook-analysis')
                            ? [source('storybook-analysis', 'storybook-analysis/')]
                            : []),
                        ...(target
                            ? [
                                  source('changelog', '*/changelog/'),
                                  source('changelog-analysis', '*/changelog-analysis/'),
                              ]
                            : []),
                    ]),
                },
                sections: [['findings']],
            };
        },
    };

    // Een bevinding met wat het model verder helpt: bij een onbekend element de versies waarin het wel bestaat, bij een
    // onbekend attribuut de tool met de documentatie.
    function enrich(finding, version) {
        if (finding.code === 'unknown-element' && finding.element) {
            const exists = existsIn(finding.element, version);
            return exists ? { ...finding, message: `${finding.message} ${exists}` } : finding;
        }
        if (finding.code === 'unknown-attribute' && finding.severity === 'error') {
            return {
                ...finding,
                message: finding.message.replace(
                    /kijk de documentatie van de component na\.$/,
                    'kijk de documentatie na met flux_get_component.',
                ),
            };
        }
        return finding;
    }

    const tools = [listVersions, searchDocs, getComponent, getGuidance, getUpgrade, findChanges, checkMarkupTool];
    for (const tool of tools) tool.annotations = { title: tool.title, ...ANNOTATIONS };
    return { tools, explain };
}

// Een entry van de changelog zoals de tools ze tonen. De actie staat er altijd bij als de impact 'action' is; de
// uitleg en het voorbeeld met 'withDetails'.
function entryOf(entry, withDetails) {
    return {
        version: entry.version,
        id: entry.id,
        ticket: entry.ticket ?? entry.issues?.[0] ?? null,
        type: entry.type,
        impact: entry.impact,
        impactSource: entry.impactSource,
        components: entry.components,
        summary: entry.summary,
        ...(entry.impact === 'action' || withDetails ? { action: entry.action } : {}),
        ...(withDetails ? { explanation: entry.explanation, example: entry.example } : {}),
    };
}

// Een diff van de web-types zonder de beschrijvingen: enkel het contract.
function withoutDescriptions(value) {
    if (Array.isArray(value)) return value.map(withoutDescriptions);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => key !== 'description')
            .map(([key, item]) => [key, withoutDescriptions(item)]),
    );
}
