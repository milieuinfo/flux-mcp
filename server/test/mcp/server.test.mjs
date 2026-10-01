import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { before, describe, test } from 'node:test';
import { createCatalog } from '../../src/catalog.mjs';
import { BUDGET } from '../../src/mcp/paging.mjs';
import { ERRORS } from '../../src/mcp/protocol.mjs';
import { render } from '../../src/mcp/render.mjs';
import { validate } from '../../src/mcp/schema.mjs';
import { createServer, INSTRUCTIONS, PROTOCOL_VERSIONS } from '../../src/mcp/server.mjs';

// De server op de echte catalogus. De golden tests vragen versies die volledig geanalyseerd zijn (2.17.0 en later) en
// nooit 'latest': een nieuwe release of een nachtelijke analyse van een oudere versie verandert ze zo niet. Wijzigt
// een antwoord bewust, maak de bestanden dan opnieuw: FLUX_UPDATE_GOLDEN=1 pnpm test.
const GOLDEN = path.join(import.meta.dirname, 'golden');
const UPDATE = process.env.FLUX_UPDATE_GOLDEN === '1';
const VERSION = '0.0.0-test';

let server;
let tools;
let id = 0;
const request = (method, params) => server.handle({ jsonrpc: '2.0', id: ++id, method, params });
const call = async (name, args) => (await request('tools/call', { name, arguments: args })).result;

before(() => {
    server = createServer({ version: VERSION, log: () => {} });
    tools = new Map(server.tools.map((tool) => [tool.name, tool]));
});

function golden(name, text) {
    const file = path.join(GOLDEN, name);
    if (UPDATE) {
        fs.mkdirSync(GOLDEN, { recursive: true });
        fs.writeFileSync(file, text);
        return;
    }
    assert.ok(fs.existsSync(file), `${name} ontbreekt; maak het met FLUX_UPDATE_GOLDEN=1 pnpm test`);
    const expected = fs.readFileSync(file, 'utf-8');
    assert.equal(
        text,
        expected,
        `${name} wijzigde; is dat bewust, maak het opnieuw met FLUX_UPDATE_GOLDEN=1 pnpm test`,
    );
}
const json = (value) => `${JSON.stringify(value, null, 4)}\n`;

// Alle delen van een antwoord, via nextCursor.
async function allParts(name, args) {
    const parts = [];
    let cursor;
    do {
        const result = await call(name, cursor ? { ...args, cursor } : args);
        assert.notEqual(result.isError, true, result.content[0].text);
        parts.push(result.structuredContent);
        cursor = result.structuredContent.nextCursor;
    } while (cursor);
    return parts;
}

// De delen samengevoegd: per sectie de lijsten na elkaar, of de tekst.
function merge(parts, sections) {
    const at = (object, keys) => keys.reduce((value, key) => value?.[key], object);
    const { part: _part, parts: _parts, nextCursor: _next, ...merged } = structuredClone(parts[0]);
    for (const section of sections) {
        const keys = Array.isArray(section) ? section : section.path;
        if (at(merged, keys) == null) continue;
        const values = parts.map((part) => at(part, keys));
        const parent = keys.slice(0, -1).reduce((value, key) => value[key], merged);
        parent[keys.at(-1)] = Array.isArray(section) ? values.flat() : values.join('');
    }
    return merged;
}

describe('initialize', () => {
    test('de revisie van de client als de server ze kent, anders de nieuwste', async () => {
        const known = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {} });
        assert.equal(known.result.protocolVersion, '2025-06-18');
        const unknown = await request('initialize', { protocolVersion: '2024-11-05', capabilities: {} });
        assert.equal(unknown.result.protocolVersion, PROTOCOL_VERSIONS[0]);
        assert.deepEqual(known.result.serverInfo, { name: 'flux-mcp', title: 'Flux MCP', version: VERSION });
        assert.deepEqual(Object.keys(known.result.capabilities), ['tools', 'resources', 'completions']);
    });

    test('de instructies noemen enkel tools die er zijn', () => {
        const named = INSTRUCTIONS.match(/flux_[a-z_]+/g);
        assert.ok(named.length > 0);
        for (const name of named) assert.ok(tools.has(name), `${name} is geen tool`);
    });
});

describe('tools/list', () => {
    test('zeven velden per tool, met annotaties voor een tool die enkel leest', async () => {
        const { result } = await request('tools/list', {});
        golden('tools-list.json', json(result));
        for (const tool of result.tools) {
            assert.match(tool.name, /^flux_[a-z_]+$/);
            assert.deepEqual(Object.keys(tool), [
                'name',
                'title',
                'description',
                'inputSchema',
                'outputSchema',
                'annotations',
            ]);
            assert.equal(tool.annotations.readOnlyHint, true);
            assert.equal(tool.annotations.openWorldHint, false);
            for (const name of tool.description.match(/flux_[a-z_]+/g) ?? []) {
                assert.ok(tools.has(name), `de beschrijving van ${tool.name} noemt ${name}`);
            }
        }
    });
});

describe('tools/call', () => {
    const CASES = [
        ['search-datumkiezer', 'flux_search_docs', { version: '2.20.0', query: 'datumkiezer' }],
        [
            'component-breadcrumb',
            'flux_get_component',
            { version: '2.20.0', component: 'vl-breadcrumb', sections: ['api', 'examples', 'history'] },
        ],
        ['guidance-patterns', 'flux_get_guidance', { version: '2.20.0', kind: 'pattern' }],
        ['guidance-page', 'flux_get_guidance', { version: '2.20.0', id: 'patronen-formulier-validatie' }],
        ['upgrade-alert', 'flux_get_upgrade', { from: '2.19.0', to: '2.20.0', components: ['vl-alert'] }],
        ['upgrade-patch', 'flux_get_upgrade', { from: '2.17.3', to: '2.18.0' }],
        ['find-flux-800', 'flux_find_changes', { query: 'FLUX-800' }],
    ];

    for (const [name, tool, args] of CASES) {
        const title = `${tool} ${JSON.stringify(args)}: byte voor byte, volgens het outputSchema, met Markdown`;
        test(title, async () => {
            const result = await call(tool, args);
            assert.notEqual(result.isError, true, result.content[0].text);
            assert.deepEqual(validate(tools.get(tool).outputSchema, result.structuredContent, 'structuredContent'), []);
            assert.equal(result.content[0].text, render(tool, result.structuredContent));
            assert.equal(result.structuredContent.catalog, VERSION);
            const { content, ...rest } = result;
            golden(`${name}.md`, content[0].text);
            golden(`${name}.json`, json({ ...rest, otherContent: content.slice(1) }));
        });
    }

    test('een onbekende tool is een protocolfout', async () => {
        const response = await request('tools/call', { name: 'flux_onbekend', arguments: {} });
        assert.equal(response.error.code, ERRORS.INVALID_PARAMS);
        assert.match(response.error.message, /Onbekende tool: flux_onbekend\. Gekend: flux_list_versions/);
    });

    test('ongeldige argumenten en een fout in de vraag geven isError, zonder structuredContent', async () => {
        const invalid = await call('flux_get_component', { version: '2.20.0' });
        assert.equal(invalid.isError, true);
        assert.match(invalid.content[0].text, /arguments mist 'component'/);
        assert.equal(invalid.structuredContent, undefined);
        const unknown = await call('flux_get_component', { version: '2.20.0', component: 'vl-buton' });
        assert.equal(unknown.isError, true);
        assert.equal(
            unknown.content[0].text,
            'vl-buton staat niet in de web-types van Flux 2.20.0. Bedoelde je vl-button? Zoek met flux_search_docs.',
        );
        const gone = await call('flux_get_component', { version: '2.20.0', component: 'vl-button-pill' });
        assert.match(
            gone.content[0].text,
            /vl-button-pill staat laatst in 2\.4\.0; wat er veranderde, toont flux_get_upgrade/,
        );
    });

    test('de versie: v-prefix, een patch op een zijtak met een waarschuwing, een nieuwere versie', async () => {
        assert.equal(
            (await call('flux_search_docs', { version: 'v2.20.0', query: 'knop' })).structuredContent.version,
            '2.20.0',
        );
        const patch = await call('flux_get_component', { version: '2.17.3', component: 'vl-button' });
        assert.equal(patch.structuredContent.version, '2.17.0');
        assert.match(patch.structuredContent.warnings[0], /2\.17\.3 is een patch op een zijtak/);
        assert.match(patch.content[0].text, /> \*\*Let op:\*\* Flux 2\.17\.3 is een patch op een zijtak/);
        const newer = await call('flux_get_upgrade', { to: '2.99.0' });
        assert.match(newer.content[0].text, /Werk flux-mcp bij/);
        const unknown = await call('flux_get_upgrade', { from: '2.10.7', to: '2.20.0' });
        assert.match(unknown.content[0].text, /2\.10\.7 staat niet in de catalogus/);
    });

    test('flux_get_upgrade vanaf v1: de diffs ontbreken, met de reden', async () => {
        const { structuredContent: result } = await call('flux_get_upgrade', { from: '1.48.2', to: '2.0.0' });
        assert.equal(result.resolved.crossesMajor, true);
        assert.equal(result.apiDelta, null);
        assert.match(result.apiDeltaUnavailable, /Geen web-types voor 1\.48\.2/);
        assert.match(result.docsUnavailable, /1\.48\.2/);
    });

    test('flux_list_versions: elke versie van de catalogus, de nieuwste eerst', async () => {
        const { structuredContent: result } = await call('flux_list_versions', {});
        const versions = createCatalog()
            .listVersions()
            .map((item) => item.version);
        assert.deepEqual(
            result.versions.map((item) => item.version),
            versions,
        );
        assert.equal(result.latest, versions[0]);
        assert.deepEqual(result.coverage.notIncluded.sideBranchPatches, [
            '2.4.1',
            '2.15.1',
            '2.17.1',
            '2.17.2',
            '2.17.3',
        ]);
        assert.deepEqual(validate(tools.get('flux_list_versions').outputSchema, result), []);
    });
});

describe('omvang', () => {
    const LARGEST = [
        ['flux_get_upgrade', { from: '2.0.0', to: '2.20.0' }],
        ['flux_get_upgrade', { from: '2.0.0', to: '2.20.0', detail: 'full' }],
        [
            'flux_get_component',
            {
                version: '2.20.0',
                component: 'vl-side-navigation-layout-next',
                sections: ['api', 'examples', 'docs', 'history'],
                detail: 'full',
            },
        ],
        ['flux_get_guidance', { version: '2.20.0', id: 'patronen-formulier-samengesteld-veld' }],
        ['flux_get_guidance', { version: '2.20.0' }],
        ['flux_list_versions', { detail: 'full' }],
    ];

    for (const [tool, args] of LARGEST) {
        test(`${tool} ${JSON.stringify(args)}: elk deel onder de grens, en samen het hele antwoord`, async () => {
            const parts = await allParts(tool, args);
            assert.ok(parts.length > 1, 'dit geval hoort meer dan één deel te geven');
            for (const part of parts) {
                assert.ok(
                    JSON.stringify(part).length <= BUDGET,
                    `deel ${part.part}: ${JSON.stringify(part).length} tekens`,
                );
                assert.deepEqual(validate(tools.get(tool).outputSchema, part), []);
            }
            const { result, sections } = tools.get(tool).build(args);
            assert.deepEqual(merge(parts, sections), JSON.parse(JSON.stringify(result)));
        });
    }

    test('een cursor met andere argumenten is een fout', async () => {
        const { structuredContent } = await call('flux_get_guidance', { version: '2.20.0' });
        const other = await call('flux_get_guidance', { version: '2.19.0', cursor: structuredContent.nextCursor });
        assert.equal(other.isError, true);
        assert.match(other.content[0].text, /hoort bij een andere vraag/);
    });
});

describe('resources', () => {
    test('de lijst en de templates', async () => {
        const { result: list } = await request('resources/list', {});
        assert.deepEqual(
            list.resources.map((resource) => resource.uri),
            ['flux://versions'],
        );
        const { result: templates } = await request('resources/templates/list', {});
        golden('resource-templates.json', json(templates));
    });

    test('elke soort resource, ook met latest', async () => {
        const read = async (uri) => (await request('resources/read', { uri })).result.contents[0];
        const versions = await read('flux://versions');
        assert.equal(versions.mimeType, 'application/json');
        assert.ok(JSON.parse(versions.text).versions.length > 0);
        assert.match((await read('flux://2.20.0/changelog')).text, /^# Flux 2\.20\.0 \(2026-09-18\)/);
        assert.match((await read('flux://latest/docs')).text, /^# De documentatie van Flux \d+\.\d+\.\d+/);
        assert.match((await read('flux://2.20.0/docs/afnemen-aan-de-slag')).text, /^# Aan De Slag/);
        const component = await read('flux://2.20.0/components/vl-alert');
        assert.equal(component.mimeType, 'text/markdown');
        assert.match(component.text, /## API[\s\S]*## Voorbeelden[\s\S]*## Documentatie[\s\S]*## Historiek/);
    });

    test('een onbekende resource is een fout', async () => {
        const unknown = await request('resources/read', { uri: 'flux://2.20.0/onbekend' });
        assert.equal(unknown.error.code, ERRORS.RESOURCE_NOT_FOUND);
        const page = await request('resources/read', { uri: 'flux://2.20.0/docs/onbestaand' });
        assert.equal(page.error.code, ERRORS.RESOURCE_NOT_FOUND);
        assert.match(page.error.message, /Geen pagina 'onbestaand'.*Zoek met flux_search_docs/);
    });

    test('aanvullen van version, page en component', async () => {
        const complete = async (uri, name, value, args) =>
            (
                await request('completion/complete', {
                    ref: { type: 'ref/resource', uri },
                    argument: { name, value },
                    ...(args ? { context: { arguments: args } } : {}),
                })
            ).result.completion;
        assert.deepEqual((await complete('flux://{version}/docs', 'version', '2.2')).values.slice(0, 2), [
            '2.20.0',
            '2.2.0',
        ]);
        assert.equal((await complete('flux://{version}/docs', 'version', '')).values[0], 'latest');
        const pages = await complete('flux://{version}/docs/{page}', 'page', 'patronen-formulier', {
            version: '2.20.0',
        });
        assert.ok(pages.values.length > 0 && pages.values.every((value) => value.startsWith('patronen-formulier')));
        const components = await complete('flux://{version}/components/{component}', 'component', 'vl-tabs');
        assert.ok(components.values.includes('vl-tabs-next'));
    });
});
