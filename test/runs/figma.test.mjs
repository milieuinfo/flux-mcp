import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { setup, workspace } from '../helpers/runs.mjs';

let context;
let ws;
const TEMPLATES = 'catalog/figma/code-connect/v1';
const DESCRIPTION = 'catalog/figma/descriptions/v1/atom/vl-knop.figma.md';
before(async () => {
    context = await setup();
    ws = workspace(context);
    const { code, stdout, stderr } = await ws.run('figma:code-connect:copy', ['1.1.0']);
    if (code !== 0) throw new Error(`figma:code-connect:copy faalde:\n${stdout}\n${stderr}`);
});
after(async () => {
    ws.remove();
    await context.close();
});

describe('figma:code-connect:copy', () => {
    test('zet de templates plat per soort, met de helpers in util/ en de imports herschreven', () => {
        assert.deepEqual(ws.list(TEMPLATES), ['atom', 'figma.config.json', 'manifest.json', 'util']);
        assert.deepEqual(ws.list(`${TEMPLATES}/util`), ['escape-html.ts']);
        const template = ws.read(`${TEMPLATES}/atom/vl-knop.figma.ts`);
        assert.match(template, /from '\.\.\/util\/escape-html'/);
        assert.deepEqual(ws.json(`${TEMPLATES}/figma.config.json`).codeConnect.include, ['**/*.figma.ts']);
    });

    test('manifest.json zegt welke release erin zit, met de publieke repo als bron', () => {
        const manifest = ws.json(`${TEMPLATES}/manifest.json`);
        assert.equal(manifest.library, 'v1');
        assert.equal(manifest.version, '1.1.0');
        assert.equal(manifest.sourceRef, 'v1.1.0');
        assert.equal(manifest.sourceRepository, 'https://github.com/milieuinfo/flux-web-components.git');
        assert.equal(manifest.templateCount, 1);
    });

    test('een ongeldige versie faalt voor er iets vervangen wordt', async () => {
        const { code, stderr } = await ws.run('figma:code-connect:copy', ['abc']);
        assert.equal(code, 1);
        assert.match(stderr, /Ongeldige versie: abc/);
        assert.ok(ws.exists(`${TEMPLATES}/manifest.json`));
    });
});

describe('figma:descriptions:write', () => {
    test('bouwt de payload met de Figma node, de description en de documentation link', async () => {
        ws.write(DESCRIPTION, '---\nstorybook: components-atom-knop\n---\n\n# vl-knop\n\n## Figma\n\nEen knop.\n');
        const { code, stdout, stderr } = await ws.run('figma:descriptions:write', ['1.1.0']);
        assert.equal(code, 0, stdout + stderr);
        const [knop] = ws.json('dist/descriptions/1.1.0.json');
        assert.equal(knop.nodeId, '1:2');
        assert.match(knop.description, /^Een knop\.\n\nGegenereerd uit flux-mcp/);
        const storybook = `${context.site.url}/release-v1/1.1.0/storybook/`;
        assert.equal(knop.documentationLink, `${storybook}?path=/docs/components-atom-knop--documentatie`);
    });

    test('weigert een Storybook-pagina die in die release niet bestaat', async () => {
        ws.write(DESCRIPTION, '---\nstorybook: components-atom-onbekend\n---\n\n## Figma\n\nEen knop.\n');
        const { code, stderr } = await ws.run('figma:descriptions:write', ['1.1.0']);
        assert.equal(code, 1);
        assert.match(stderr, /components-atom-onbekend bestaat niet in 1\.1\.0/);
    });
});

describe('figma:code-connect:publish', () => {
    test('zonder FIGMA_TOKEN zegt het welk token nodig is, en roept het de Code Connect CLI niet aan', async () => {
        const { code, stderr } = await ws.run('figma:code-connect:publish', ['--dry-run'], { FIGMA_TOKEN: '' });
        assert.equal(code, 1);
        assert.match(stderr, /FIGMA_TOKEN ontbreekt/);
    });
});
