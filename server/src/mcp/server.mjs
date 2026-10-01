// De MCP-server: de capabilities, de instructies en de koppeling van de methodes aan de tools en de resources
// (ADR-004). Zonder transport; server/bin/flux-mcp.mjs koppelt hem aan stdio, de tests roepen handle() rechtstreeks.
//
//   createServer({ catalogDir, version, log })  →  { handle(message) → antwoord of null, tools }
//
// De server is deterministisch per versie van flux-mcp: dezelfde vraag geeft byte voor byte hetzelfde antwoord, ook
// in de volgorde van zoekresultaten. 'version' is die versie, standaard uit server/package.json; elk antwoord noemt
// ze in 'catalog'.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG_DIR, CatalogError, createCatalog } from '../catalog.mjs';
import { createDocs } from '../docs.mjs';
import { paginate } from './paging.mjs';
import { dispatch, ERRORS, RpcError } from './protocol.mjs';
import { render } from './render.mjs';
import { createResources } from './resources.mjs';
import { validate } from './schema.mjs';
import { createTools } from './tools.mjs';

// De revisies van de specificatie met een handshake bij initialize, de nieuwste eerst. Vraagt de client er een die de
// server kent, dan antwoordt hij met die; anders met de nieuwste (ADR-004, sectie 8).
export const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18'];

// De instructies voor het model, zoals in sectie 7 van ADR-004, beperkt tot wat er in dit increment is: nog zonder
// prompts (sectie 10).
export const INSTRUCTIONS =
    'Flux-MCP levert kennis over de Flux web-componenten (@domg-wc/*) per versie. Neem de versie van ' +
    '@domg-wc/components uit de package.json van het project en geef ze mee aan elke tool; latest is de nieuwste ' +
    'versie in deze catalogus. Zoek met flux_search_docs, haal een component op met flux_get_component, en gidsen, ' +
    'richtlijnen, patronen en recepten met flux_get_guidance. Voor een upgrade: flux_get_upgrade, met de componenten ' +
    'die het project gebruikt; in welke versie een ticket zit: flux_find_changes. Controleer gegenereerde of ' +
    'gewijzigde markup met flux_check_markup. De API komt uit de web-types; tekst uit een bron *-analysis schreef ' +
    'een LLM. De server leest of wijzigt geen code; dat doe jij in het project.';

const MANIFEST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../package.json');

// De versie van flux-mcp, uit server/package.json.
export function packageVersion() {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf-8')).version;
}

export function createServer({
    catalogDir = CATALOG_DIR,
    version = packageVersion(),
    log = (text) => process.stderr.write(`${text}\n`),
} = {}) {
    const catalog = createCatalog(catalogDir);
    const docs = createDocs(catalogDir, { catalog });
    const { tools, explain } = createTools({ catalog, docs, catalogVersion: version });
    const byName = new Map(tools.map((tool) => [tool.name, tool]));
    const resources = createResources({ catalog, docs, tools: byName, explain });

    const failed = (text) => ({ content: [{ type: 'text', text }], isError: true });

    function callTool({ name, arguments: args = {} } = {}) {
        const tool = byName.get(name);
        if (!tool) {
            const known = [...byName.keys()].join(', ');
            throw new RpcError(ERRORS.INVALID_PARAMS, `Onbekende tool: ${name}. Gekend: ${known}.`);
        }
        const problems = validate(tool.inputSchema, args, 'arguments');
        if (problems.length > 0) return failed(`Ongeldige argumenten voor ${name}: ${problems.join(' ')}`);
        try {
            const { result, sections, links = [] } = tool.build(args);
            const part = paginate(result, { tool: name, args, sections, cursor: args.cursor });
            return { content: [{ type: 'text', text: render(name, part) }, ...links], structuredContent: part };
        } catch (error) {
            if (error instanceof CatalogError) return failed(explain(error));
            log(`Fout in ${name}: ${error.stack ?? error}`);
            return failed(
                'Er ging iets mis in flux-mcp; de details staan in de log van de server. Probeer het met andere ' +
                    'argumenten, of meld het aan Team Flux.',
            );
        }
    }

    const methods = {
        initialize({ protocolVersion, clientInfo } = {}) {
            const negotiated = PROTOCOL_VERSIONS.includes(protocolVersion) ? protocolVersion : PROTOCOL_VERSIONS[0];
            const client = clientInfo?.name ?? 'een client';
            log(`flux-mcp ${version}: ${client} vraagt ${protocolVersion}, krijgt ${negotiated}.`);
            return {
                protocolVersion: negotiated,
                capabilities: {
                    tools: { listChanged: false },
                    resources: { subscribe: false, listChanged: false },
                    completions: {},
                },
                serverInfo: { name: 'flux-mcp', title: 'Flux MCP', version },
                instructions: INSTRUCTIONS,
            };
        },
        'notifications/initialized': () => {},
        'notifications/cancelled': () => {},
        ping: () => ({}),
        'tools/list': () => ({
            tools: tools.map(({ name, title, description, inputSchema, outputSchema, annotations }) => ({
                name,
                title,
                description,
                inputSchema,
                outputSchema,
                annotations,
            })),
        }),
        'tools/call': callTool,
        'resources/list': () => ({ resources: resources.list() }),
        'resources/templates/list': () => ({ resourceTemplates: resources.templates() }),
        'resources/read': ({ uri } = {}) => resources.read(uri),
        'completion/complete': (params) => resources.complete(params),
    };

    return { handle: (message) => dispatch(message, methods, log), tools };
}
