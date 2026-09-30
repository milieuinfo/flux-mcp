import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { setup, workspace } from '../helpers/runs.mjs';

let context;
let base;
before(async () => {
    context = await setup();
    base = workspace(context);
    const { code, stdout, stderr } = await base.run('flux:catalog:backfill', ['--skip-analysis', '1.0.0', '1.1.0']);
    if (code !== 0) throw new Error(`catalog:backfill faalde:\n${stdout}\n${stderr}`);
    const storybook = await base.run('flux:storybook:copy', ['--all']);
    if (storybook.code !== 0) throw new Error(`storybook:copy faalde:\n${storybook.stdout}\n${storybook.stderr}`);
});
after(async () => {
    base.remove();
    await context.close();
});

describe('flux:catalog:check', () => {
    test('klopt als de catalogus is wat de scripts uit de bron halen', async () => {
        const ws = base.copy();
        const { code, stdout, stderr } = await ws.run('flux:catalog:check', ['1.1.0']);
        assert.equal(code, 0, stdout + stderr);
        assert.match(stdout, /Klopt: web-types\/, packages\/, changelog\/, storybook\/ van 1\.1\.0/);
        ws.remove();
    });

    test('meldt een gewijzigd, een ontbrekend en een overbodig bestand', async () => {
        const ws = base.copy();
        const commits = 'catalog/flux/1.1.0/changelog/commits.json';
        ws.write(commits, ws.read(commits).replace('interne opkuis', 'andere opkuis'));
        ws.write('catalog/flux/1.1.0/web-types/extra.web-types.json', '{}\n');
        const { code, stderr } = await ws.run('flux:catalog:check', ['1.1.0']);
        assert.equal(code, 1);
        assert.match(stderr, /changelog\/commits\.json is anders/);
        assert.match(stderr, /web-types\/extra\.web-types\.json maakt de run niet meer/);
        ws.remove();
    });

    test('een versie die niet in de catalogus staat, zegt hoe je ze ophaalt', async () => {
        const { code, stderr } = await base.run('flux:catalog:check', ['1.2.0']);
        assert.equal(code, 1);
        assert.match(stderr, /pnpm run flux:catalog:update 1\.2\.0/);
    });
});
