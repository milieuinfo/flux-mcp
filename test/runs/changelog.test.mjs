import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { runAll, setup, sources, workspace } from '../helpers/runs.mjs';

let context;
let ws;
// De bronnen van 1.0.0 en 1.1.0, en de build.

before(async () => {
    context = await setup();
    ws = workspace(context);
    await runAll(ws, [...sources('1.0.0'), ...sources('1.1.0'), ['flux:changelog:build', '--all']]);
});
after(async () => {
    ws.remove();
    await context.close();
});

describe('de bronnen van de changelog', () => {
    test('changelog:copy en changelog:cleanup houden enkel de sectie van de versie over', () => {
        const changelog = ws.read('catalog/flux/1.1.0/changelog/changelog.md');
        const compare = 'https://github.com/milieuinfo/flux-web-components/compare/v1.0.0...v1.1.0';
        assert.ok(changelog.startsWith(`# [1.1.0](${compare})`), changelog);
        assert.doesNotMatch(changelog, /1\.0\.0\]|0\.9\.0/);
        assert.deepEqual(ws.list('catalog/flux/1.1.0/changelog').includes('CHANGELOG.md'), false);
    });

    test('packages:copy bewaart per package de naam, de versie en de dependencies uit de registry', () => {
        const packages = ['common.json', 'components.json', 'map.json', 'styles.json'];
        assert.deepEqual(ws.list('catalog/flux/1.1.0/packages'), packages);
        const components = ws.json('catalog/flux/1.1.0/packages/components.json');
        assert.equal(components.name, '@domg-wc/components');
        assert.equal(components.dependencies.lit, '3.2.0');
        assert.equal(components.description, undefined);
    });

    test('changelog:commits haalt de feiten uit de commits, ook die buiten de changelog', () => {
        const commits = ws.json('catalog/flux/1.1.0/changelog/commits.json');
        const facts = Object.values(commits.commits);
        const focus = facts.find((fact) => /zichtbaar voor wie met het toetsenbord/.test(fact.body));
        assert.equal(focus.published, true);
        const size = facts.find((fact) => fact.storybook.length > 0);
        assert.equal(size.storybook[0].id, 'components-atom-knop--documentatie');
        assert.ok(size.storybook[0].url.startsWith(`${context.site.url}/release-v1/1.1.0/storybook/`));
        const unlisted = commits.unlisted.map((commit) => commit.subject);
        assert.deepEqual(unlisted, ['chore: FLUX-4 - vl-knop - interne opkuis']);
    });
});

describe('flux:changelog:build', () => {
    test('bouwt per versie het overzicht, de tickets en de diffs tegen de vorige versie', () => {
        const release = ws.json('catalog/flux/1.1.0/changelog/release.json');
        assert.equal(release.previous, '1.0.0');
        assert.deepEqual(release.tickets.map((ticket) => ticket.ticket), ['FLUX-3', 'FLUX-5']);
        assert.equal(release.unlistedCommits.length, 1);
        const webTypes = ws.json('catalog/flux/1.1.0/changelog/web-types-diff.json');
        assert.deepEqual(webTypes.changed.map((change) => change.element), ['vl-knop']);
        assert.deepEqual(webTypes.changed[0].attributes.added.map((attribute) => attribute.name), ['size']);
        const dependencies = ws.json('catalog/flux/1.1.0/changelog/dependencies-diff.json');
        assert.ok(dependencies.changed.some((change) => change.package === '@domg-wc/components'));
    });

    test('1.0.0 heeft geen diffs: 0.9.0 staat niet in de catalogus', () => {
        const release = ws.json('catalog/flux/1.0.0/changelog/release.json');
        assert.equal(release.previous, '0.9.0');
        assert.match(release.webTypesDiffUnavailable, /0\.9\.0/);
        assert.deepEqual(ws.list('catalog/flux/1.0.0/changelog').includes('web-types-diff.json'), false);
    });

    test('--check klopt na de build, en faalt als een gebouwd bestand niet meer klopt', async () => {
        assert.equal((await ws.run('flux:changelog:build', ['--check'])).code, 0);
        const file = 'catalog/flux/1.1.0/changelog/release.json';
        const original = ws.read(file);
        ws.write(file, original.replace('"1.0.0"', '"0.9.0"'));
        const stale = await ws.run('flux:changelog:build', ['--check']);
        ws.write(file, original);
        assert.equal(stale.code, 1);
        assert.match(stale.stdout + stale.stderr, /1\.1\.0/);
    });
});

describe('fouten in de bronnen', () => {
    test('packages:copy faalt voor een versie die niet op de registry staat', async () => {
        const { code, stderr } = await ws.run('flux:packages:copy', ['1.2.0']);
        assert.equal(code, 1);
        assert.match(stderr, /Geen @domg-wc\/common@1\.2\.0/);
        assert.equal(ws.exists('catalog/flux/1.2.0/packages'), false);
    });

    test('changelog:cleanup zonder changelog zegt welk script eerst moet draaien', async () => {
        const { code, stderr } = await ws.run('flux:changelog:cleanup', ['1.2.0']);
        assert.equal(code, 1);
        assert.match(stderr, /pnpm run flux:changelog:copy 1\.2\.0/);
    });
});
