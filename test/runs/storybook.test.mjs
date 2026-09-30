import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { runAll, setup, workspace } from '../helpers/runs.mjs';

let context;
let ws;
before(async () => {
    context = await setup();
    ws = workspace(context);
    await runAll(ws, [
        ['flux:web-types:copy', '1.0.0'],
        ['flux:web-types:copy', '1.1.0'],
        ['flux:storybook:copy', '--all'],
    ]);
});
after(async () => {
    ws.remove();
    await context.close();
});

describe('flux:storybook:copy', () => {
    test('zet de pagina van elke versie om naar Markdown, met een index.json', () => {
        const index = ws.json('catalog/flux/1.1.0/storybook/index.json');
        assert.deepEqual(index.pages.map((page) => page.id), ['afnemen-aan-de-slag', 'components-atom-knop']);
        assert.deepEqual(index.skipped.map((page) => page.id), ['changelog']);
        const knop = index.pages.find((page) => page.id === 'components-atom-knop');
        assert.deepEqual(knop.elements, ['vl-knop']);
        assert.deepEqual(knop.stories.map((story) => story.id), [
            'components-atom-knop--knop-primary',
            'components-atom-knop--knop-ghost',
            'components-atom-knop--knop-size',
        ]);
        const markdown = ws.read('catalog/flux/1.1.0/storybook/pages/components-atom-knop.md');
        assert.match(markdown, /^# Knop/);
        assert.match(markdown, /> Story: \[vl-knop - size\]\(\/\?path=\/story\/components-atom-knop--knop-size\)/);
        assert.match(markdown, /> API: vl-knop/);
    });

    test('een pagina die niet wijzigde, heeft in beide versies dezelfde inputHash', () => {
        const hashes = (version) => {
            const { pages } = ws.json(`catalog/flux/${version}/storybook/index.json`);
            return Object.fromEntries(pages.map((page) => [page.id, page.inputHash]));
        };
        const [older, newer] = [hashes('1.0.0'), hashes('1.1.0')];
        assert.equal(older['afnemen-aan-de-slag'], newer['afnemen-aan-de-slag']);
        assert.notEqual(older['components-atom-knop'], newer['components-atom-knop']);
    });

    test('--check vergelijkt met een nieuwe omzetting en meldt een pagina die niet meer klopt', async () => {
        assert.equal((await ws.run('flux:storybook:copy', ['--check', '1.1.0'])).code, 0);
        const file = 'catalog/flux/1.1.0/storybook/pages/components-atom-knop.md';
        const original = ws.read(file);
        ws.write(file, `${original}\nmet de hand gewijzigd\n`);
        const stale = await ws.run('flux:storybook:copy', ['--check', '1.1.0']);
        ws.write(file, original);
        assert.equal(stale.code, 1);
        assert.match(stale.stderr, /pages\/components-atom-knop\.md is verouderd/);
    });

    test('zonder web-types zegt het welk script eerst moet draaien', async () => {
        const { code, stderr } = await ws.run('flux:storybook:copy', ['1.2.0']);
        assert.equal(code, 1);
        assert.match(stderr, /pnpm run flux:web-types:copy 1\.2\.0/);
    });
});

describe('flux:storybook:check', () => {
    test('klopt zonder analyses, en toont welke versies nog een analyse nodig hebben', async () => {
        const { code, stdout } = await ws.run('flux:storybook:check');
        assert.equal(code, 0);
        assert.match(stdout, /pnpm run flux:storybook:analyse 1\.1\.0/);
        assert.match(stdout, /Klopt\./);
    });

    test('faalt op een analyse met een attribuut dat niet in de web-types staat', async () => {
        const { pages } = ws.json('catalog/flux/1.1.0/storybook/index.json');
        const page = pages.find((candidate) => candidate.id === 'components-atom-knop');
        const example = { html: '<vl-knop kleur="rood">Klik</vl-knop>' };
        const examples = Object.fromEntries(page.stories.map((story) => [story.id, example]));
        const analysis = { schema: 1, page: page.id, inputHash: page.inputHash, analysedFor: '1.1.0' };
        const file = `catalog/flux/storybook-analysis/${page.id}/${page.inputHash}.json`;
        ws.write(file, JSON.stringify({ ...analysis, summary: 'x', keywords: ['x'], examples, notes: [] }));
        const { code, stderr } = await ws.run('flux:storybook:check', ['1.1.0']);
        assert.equal(code, 1);
        assert.match(stderr, /kleur/);
    });
});
