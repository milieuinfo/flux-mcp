import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { setup, workspace } from '../helpers/runs.mjs';

// catalog:update en catalog:backfill draaien de andere scripts na elkaar, met de nagemaakte claude voor de analyse.
let context;
before(async () => (context = await setup()));
after(() => context.close());

// Wat er van een versie in de catalogus staat.
const parts = (ws, version) => ws.list(`catalog/flux/${version}`);

describe('flux:catalog:update', { concurrency: true }, () => {
    test('--skip-analysis haalt de bronnen en de Storybook op, en bouwt, zonder claude', async () => {
        const ws = workspace(context);
        const { code, stdout, stderr } = await ws.run('flux:catalog:update', ['--skip-analysis', '1.1.0']);
        assert.equal(code, 0, stdout + stderr);
        assert.deepEqual(parts(ws, '1.1.0'), ['changelog', 'packages', 'storybook', 'web-types']);
        assert.match(stdout, /Zonder analyse\. Later: pnpm run flux:changelog:analyse 1\.1\.0/);
        assert.deepEqual(ws.claudeRuns(), []);
        ws.remove();
    });

    test('met de analyse: de changelog, de volgende versie, en Storybook, gecontroleerd', async () => {
        const ws = workspace(context);
        assert.equal((await ws.run('flux:catalog:update', ['1.1.0'])).code, 0);
        const { code, stdout, stderr } = await ws.run('flux:catalog:update', ['1.0.0']);
        assert.equal(code, 0, stdout + stderr);
        // 1.0.0 kwam na 1.1.0 binnen: 1.1.0 kreeg diffs, dus ook haar analyse draaide opnieuw.
        assert.match(stdout, /Klaar: 1\.0\.0 en 1\.1\.0 staan in de catalogus, geanalyseerd en gecontroleerd\./);
        assert.ok(ws.exists('catalog/flux/1.1.0/changelog/web-types-diff.json'));
        for (const version of ['1.0.0', '1.1.0']) {
            const expected = ['changelog', 'changelog-analysis', 'packages', 'storybook', 'web-types'];
            assert.deepEqual(parts(ws, version), expected);
        }
        assert.ok(ws.list('catalog/flux/storybook-analysis').includes('components-atom-knop'));
        ws.remove();
    });

    test('een stap die faalt, stopt alles en zegt waarmee je verder gaat', async () => {
        const ws = workspace(context);
        const { code, stderr } = await ws.run('flux:catalog:update', ['--skip-analysis', '1.2.0']);
        assert.equal(code, 1);
        assert.match(stderr, /\[FOUT\] web-types:copy 1\.2\.0 faalde/);
        assert.match(stderr, /pnpm run flux:web-types:copy 1\.2\.0/);
        ws.remove();
    });
});

describe('flux:catalog:backfill', { concurrency: true }, () => {
    test('--skip-analysis neemt de releases van develop-v1 op, van oud naar nieuw', async () => {
        const ws = workspace(context);
        const { code, stdout, stderr } = await ws.run('flux:catalog:backfill', ['--skip-analysis', '1.0.0', '1.1.0']);
        assert.equal(code, 0, stdout + stderr);
        assert.match(stdout, /2 releases op develop-v1: 1\.0\.0, 1\.1\.0/);
        for (const version of ['1.0.0', '1.1.0']) {
            assert.deepEqual(parts(ws, version), ['changelog', 'packages', 'web-types']);
        }
        assert.deepEqual(ws.claudeRuns(), []);
        ws.remove();
    });

    test('met --max 1 analyseert het één versie, en hetzelfde commando herneemt', async () => {
        const ws = workspace(context);
        const first = await ws.run('flux:catalog:backfill', ['--max', '1', '1.0.0', '1.1.0']);
        assert.equal(first.code, 0, first.stdout + first.stderr);
        assert.match(first.stdout, /Nog te analyseren: 1\.1\.0\. Herneem met hetzelfde commando\./);
        const second = await ws.run('flux:catalog:backfill', ['1.0.0', '1.1.0']);
        assert.equal(second.code, 0, second.stdout + second.stderr);
        assert.match(second.stdout, /Fase 1: alle bronnen stonden er al\./);
        assert.match(second.stdout, /Klaar: 1\.0\.0 tot en met 1\.1\.0 staan in de catalogus, geanalyseerd/);
        ws.remove();
    });

    test('weigert een versie die geen release op develop-v1 is', async () => {
        const ws = workspace(context);
        const { code, stderr } = await ws.run('flux:catalog:backfill', ['1.0.0', '1.0.5']);
        assert.equal(code, 1);
        assert.match(stderr, /1\.0\.5 is geen release op develop-v1/);
        ws.remove();
    });
});
