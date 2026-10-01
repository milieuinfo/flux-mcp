// De resources van de MCP-server (ADR-004, sectie 5). Tools blijven de ingang voor een model; resources zijn er voor
// de gebruiker, bv. met @ in Claude Code, en voor clients die een resource wel kunnen lezen maar geen tool aanroepen.
//
//   flux://versions                             de versies, als JSON
//   flux://{version}/changelog                  de changelog van één versie, met de analyse, als Markdown
//   flux://{version}/docs                       de index van de pagina's, als Markdown
//   flux://{version}/docs/{page}                één pagina, samengevoegd
//   flux://{version}/components/{component}     één component, zoals flux_get_component met alle secties
//
// {version} mag 'latest' zijn, of een patch op een zijtak: de inhoud noemt de effectieve versie. resources/list geeft
// enkel flux://versions; de rest staat in resources/templates/list, want 26 versies met samen 5500 pagina's is te veel
// voor een lijst. Een resource wordt niet in delen geknipt: wie ze leest, vroeg ze zelf.

import { CatalogError } from '../catalog.mjs';
import { ERRORS, RpcError } from './protocol.mjs';
import { render, renderChangelog, renderDocsIndex } from './render.mjs';

export const RESOURCES = [
    {
        uri: 'flux://versions',
        name: 'versions',
        title: 'Flux-versies in de catalogus',
        description: 'De versies van Flux in deze catalogus, met per versie wat er is, als JSON.',
        mimeType: 'application/json',
    },
];

export const TEMPLATES = [
    {
        uriTemplate: 'flux://{version}/changelog',
        name: 'changelog',
        title: 'De changelog van een versie van Flux',
        description: 'Wat er in één versie veranderde, per impact, met de actie, de uitleg en een voorbeeld.',
        mimeType: 'text/markdown',
    },
    {
        uriTemplate: 'flux://{version}/docs',
        name: 'docs',
        title: 'De documentatie van een versie van Flux',
        description: "De index van de pagina's uit Storybook van één versie, per soort.",
        mimeType: 'text/markdown',
    },
    {
        uriTemplate: 'flux://{version}/docs/{page}',
        name: 'docs-page',
        title: 'Een pagina uit de documentatie van Flux',
        description: 'Eén pagina uit Storybook, met haar voorbeelden, de API uit de web-types en absolute links.',
        mimeType: 'text/markdown',
    },
    {
        uriTemplate: 'flux://{version}/components/{component}',
        name: 'component',
        title: 'Een component van Flux',
        description: 'Alles over één component in één versie: API, voorbeelden, documentatie en historiek.',
        mimeType: 'text/markdown',
    },
];

const ROUTES = [
    [/^flux:\/\/versions$/, 'versions'],
    [/^flux:\/\/([^/]+)\/changelog$/, 'changelog'],
    [/^flux:\/\/([^/]+)\/docs$/, 'docs'],
    [/^flux:\/\/([^/]+)\/docs\/([^/]+)$/, 'page'],
    [/^flux:\/\/([^/]+)\/components\/([^/]+)$/, 'component'],
];
// Zoveel waarden geeft completion/complete hoogstens, zoals de specificatie vraagt.
const MAX_COMPLETIONS = 100;

export function createResources({ catalog, docs, tools, explain }) {
    const contents = (uri, mimeType, text) => ({ contents: [{ uri, mimeType, text }] });

    function read(uri) {
        const route = ROUTES.map(([pattern, name]) => [pattern.exec(String(uri ?? '')), name]).find(([match]) => match);
        if (!route) throw new RpcError(ERRORS.RESOURCE_NOT_FOUND, `Onbekende resource: ${uri}.`, { uri });
        const [[, ...raw], name] = route;
        const [version, item] = raw.map(decodeURIComponent);
        try {
            if (name === 'versions') {
                const { result } = tools.get('flux_list_versions').build({ detail: 'full' });
                return contents(uri, 'application/json', `${JSON.stringify(result, null, 4)}\n`);
            }
            const at = catalog.resolve(version);
            if (name === 'changelog') {
                return contents(uri, 'text/markdown', renderChangelog(catalog.getChangelog(at.version), at));
            }
            if (name === 'docs') {
                return contents(
                    uri,
                    'text/markdown',
                    renderDocsIndex(at.version, docs.listPages(at.version).pages, at),
                );
            }
            if (name === 'page') {
                const page = docs.getPage(at.version, item);
                const warning = at.warning ? `> **Let op:** ${at.warning}\n\n` : '';
                return contents(uri, 'text/markdown', `${warning}${page.markdown}`);
            }
            const args = { version, component: item, sections: ['api', 'examples', 'docs', 'history'], detail: 'full' };
            const { result } = tools.get('flux_get_component').build(args);
            return contents(uri, 'text/markdown', render('flux_get_component', result));
        } catch (error) {
            if (!(error instanceof CatalogError)) throw error;
            throw new RpcError(ERRORS.RESOURCE_NOT_FOUND, explain(error), { uri });
        }
    }

    // Vult {version}, {page} en {component} aan. De pagina's en componenten komen uit de versie die al ingevuld is,
    // of anders uit de nieuwste.
    function complete({ ref, argument, context } = {}) {
        const empty = { completion: { values: [], total: 0, hasMore: false } };
        if (ref?.type !== 'ref/resource') return empty;
        const value = String(argument?.value ?? '').toLowerCase();
        let candidates = [];
        if (argument?.name === 'version') {
            candidates = ['latest', ...catalog.versions().reverse()];
        } else if (argument?.name === 'page' || argument?.name === 'component') {
            let version;
            try {
                version = catalog.resolve(context?.arguments?.version ?? 'latest').version;
            } catch {
                version = catalog.resolve('latest').version;
            }
            candidates =
                argument.name === 'page'
                    ? docs.listPages(version, { includeFluxTeam: true }).pages.map((page) => page.id)
                    : docs.elementNames(version);
        }
        // Eerst wat met de waarde begint, dan wat ze bevat.
        const starts = candidates.filter((candidate) => candidate.toLowerCase().startsWith(value));
        const contains = candidates.filter((candidate) => !starts.includes(candidate) && candidate.includes(value));
        const values = [...starts, ...contains];
        return {
            completion: {
                values: values.slice(0, MAX_COMPLETIONS),
                total: values.length,
                hasMore: values.length > MAX_COMPLETIONS,
            },
        };
    }

    return { list: () => RESOURCES, templates: () => TEMPLATES, read, complete };
}
