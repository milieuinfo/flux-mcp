import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { CATALOG_DIR, CatalogError, compareVersions, createCatalog } from '../src/catalog.mjs';
import { buildReleaseFromCatalog } from '../src/changelog.mjs';

// Een kopie van de echte catalogus met vers gebouwde changelog.json, zodat de tests niet afhangen van wat er
// gecommit is. De annotaties staan enkel in de kopie.
let dir;
let catalog;

before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-catalog-'));
    for (const version of ['2.19.0', '2.20.0']) {
        fs.cpSync(path.join(CATALOG_DIR, version, 'web-types'), path.join(dir, version, 'web-types'), { recursive: true });
        fs.cpSync(path.join(CATALOG_DIR, version, 'changelog', 'changelog.md'), path.join(dir, version, 'changelog', 'changelog.md'));
    }
    fs.mkdirSync(path.join(dir, '2.20.0', 'annotations'));
    fs.writeFileSync(
        path.join(dir, '2.20.0', 'annotations', 'changelog.json'),
        JSON.stringify({
            migration: 'Controleer je eigen vl-link in het label-slot van vl-cascader-item.',
            entries: {
                f2a3414: { migration: 'Gebruik banner in plaats van een eigen volle-breedte alert.' },
                6899016: { labels: { 'no-impact': true } },
            },
        }),
    );
    for (const version of ['2.19.0', '2.20.0']) {
        fs.writeFileSync(path.join(dir, version, 'changelog', 'changelog.json'), JSON.stringify(buildReleaseFromCatalog(dir, version)));
    }
    catalog = createCatalog(dir);
});

after(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('compareVersions', () => {
    test('semver, met een prerelease voor de release', () => {
        assert.deepEqual(['2.10.0', '2.9.1', '2.20.0-beta.1', '2.20.0', '1.48.2'].sort(compareVersions), [
            '1.48.2',
            '2.9.1',
            '2.10.0',
            '2.20.0-beta.1',
            '2.20.0',
        ]);
    });
});

describe('listVersions', () => {
    test('nieuwste eerst, met de keten naar de vorige versie', () => {
        const versions = catalog.listVersions();
        assert.deepEqual(
            versions.map((v) => [v.version, v.previous, v.previousInCatalog, v.webTypes]),
            [
                ['2.20.0', '2.19.0', true, true],
                ['2.19.0', '2.18.0', false, true],
            ],
        );
        assert.equal(versions[0].counts.feature, 4);
    });
});

describe('getChangelog', () => {
    test('wat nieuw is, toont ook wat geen impact heeft, gemarkeerd', () => {
        const release = catalog.getChangelog('v2.20.0');
        assert.equal(release.entries.length, 18);
        assert.equal(release.hiddenNoImpact, 0);
        assert.deepEqual(release.entries.find((e) => e.id === '6899016').labels, ['no-impact']);
        const impact = catalog.getChangelog('2.20.0', { includeNoImpact: false });
        assert.equal(impact.entries.length, 9);
        assert.equal(impact.hiddenNoImpact, 9);
    });

    test('filter op component, zonder vl-, met de API-diff van dat element', () => {
        const release = catalog.getChangelog('2.20.0', { component: 'alert' });
        assert.deepEqual(
            release.entries.map((e) => e.issues[0]),
            ['FLUX-809'],
        );
        assert.deepEqual(
            release.api.changed.map((c) => c.element),
            ['vl-alert'],
        );
    });

    test('filter op type en label', () => {
        assert.equal(catalog.getChangelog('2.20.0', { type: 'docs' }).entries.length, 7);
        assert.equal(catalog.getChangelog('2.20.0', { label: 'a11y' }).entries.length, 5);
        assert.equal(catalog.getChangelog('2.20.0', { label: 'no-impact' }).entries.length, 9);
        assert.equal(catalog.getChangelog('2.20.0', { label: 'no-impact', includeNoImpact: false }).entries.length, 9);
    });

    test('een onbekende versie noemt wat er wel is', () => {
        assert.throws(() => catalog.getChangelog('2.18.0'), (error) => error instanceof CatalogError && /2\.20\.0, 2\.19\.0/.test(error.message));
        assert.throws(() => catalog.getChangelog('twee'), CatalogError);
        assert.throws(() => catalog.getChangelog('2.20.0', { type: 'feat' }), /Kies uit/);
    });
});

describe('getChangesBetween', () => {
    test('volledig bereik: beide versies, breaking eerst, migraties en API-diff', () => {
        const result = catalog.getChangesBetween('2.18.0', '2.20.0');
        assert.equal(result.complete, true);
        assert.equal(result.missing, null);
        assert.deepEqual(
            result.versions.map((v) => v.version),
            ['2.19.0', '2.20.0'],
        );
        assert.deepEqual(Object.keys(result.changes), ['breaking', 'feature', 'fix', 'docs', 'perf', 'revert', 'other']);
        // Zonder de pnpm-migratie, de documentatie en de testen: die raken het project van de afnemer niet.
        assert.equal(result.changes.feature.length, 10);
        assert.equal(result.changes.fix.length, 14);
        assert.deepEqual(result.changes.docs, []);
        assert.equal(result.hiddenNoImpact, 11);
        assert.equal(catalog.getChangesBetween('2.18.0', '2.20.0', { includeNoImpact: true }).changes.docs.length, 7);
        assert.deepEqual(
            result.migrations.map((m) => [m.version, m.entry]),
            [
                ['2.20.0', null],
                ['2.20.0', 'f2a3414'],
            ],
        );
        const alert = result.components.find((c) => c.name === 'vl-alert');
        assert.deepEqual(
            alert.changes.map((c) => [c.version, c.issues[0]]),
            [
                ['2.19.0', 'FLUX-207'],
                ['2.20.0', 'FLUX-809'],
            ],
        );
        assert.match(alert.docUrl, /2\.20\.0/);
        // Geen web-types voor 2.18.0, dus geen netto API-diff.
        assert.equal(result.api, null);
        assert.equal(result.apiUnavailable, 'Geen web-types voor 2.18.0 in de catalogus.');
    });

    test('met web-types aan beide kanten een netto API-diff', () => {
        const result = catalog.getChangesBetween('2.19.0', '2.20.0', { component: 'vl-alert' });
        assert.deepEqual(
            result.api.changed.map((c) => c.element),
            ['vl-alert'],
        );
        assert.deepEqual(
            result.changes.feature.map((e) => e.issues[0]),
            ['FLUX-809'],
        );
    });

    test('een onderbroken keten wordt gemeld', () => {
        const result = catalog.getChangesBetween('2.15.0', '2.20.0');
        assert.equal(result.complete, false);
        assert.deepEqual(result.missing, { version: '2.18.0', previousOf: '2.19.0' });
        assert.match(result.warning, /mist 2\.18\.0/);
        assert.deepEqual(
            result.versions.map((v) => v.version),
            ['2.19.0', '2.20.0'],
        );
    });

    test("'from' moet lager zijn dan 'to'", () => {
        assert.throws(() => catalog.getChangesBetween('2.20.0', '2.19.0'), CatalogError);
    });
});

describe('getComponentHistory', () => {
    test('vl-alert over beide versies, nieuwste eerst', () => {
        const history = catalog.getComponentHistory('vl-alert');
        assert.equal(history.known, true);
        assert.equal(history.category, 'block');
        assert.deepEqual(
            history.history.map((h) => [h.version, h.entries.map((e) => e.issues[0])]),
            [
                ['2.20.0', ['FLUX-809']],
                ['2.19.0', ['FLUX-207']],
            ],
        );
        assert.deepEqual(
            history.history[0].api.changed.attributes.added.map((a) => a.name),
            ['banner'],
        );
        assert.equal(history.history[1].apiUnavailable, 'Geen web-types voor 2.18.0 in de catalogus.');
        assert.deepEqual(history.coverage, { oldest: '2.19.0', newest: '2.20.0', gaps: [] });
    });

    test('scope eerst, dan vermeldingen', () => {
        const history = catalog.getComponentHistory('vl-breadcrumb', { from: '2.20.0' });
        assert.deepEqual(
            history.history[0].entries.map((e) => [e.match, e.issues[0]]),
            [
                ['scope', 'FLUX-800'],
                ['mention', 'FLUX-800'],
            ],
        );
    });

    test('een component met enkel een API-wijziging', () => {
        const history = catalog.getComponentHistory('vl-checkbox');
        assert.equal(history.history.length, 1);
        assert.deepEqual(history.history[0].entries, []);
        assert.equal(history.history[0].api.changed.attributes.changed[0].name, 'blur-validation');
    });

    test('een thema als scope', () => {
        const history = catalog.getComponentHistory('form-control');
        assert.deepEqual(
            history.history.flatMap((h) => h.entries.map((e) => e.issues[0])),
            ['FLUX-791'],
        );
        assert.equal(history.known, false);
    });
});

describe('findChanges', () => {
    test('op issue-key', () => {
        const result = catalog.findChanges('flux-800');
        assert.equal(result.results.length, 3);
        assert.ok(result.results.every((r) => r.version === '2.20.0'));
    });

    test('op woorden, ook wat geen impact heeft, gemarkeerd', () => {
        assert.deepEqual(
            catalog.findChanges('focus side-sheet').results.map((r) => r.issues[0]),
            ['FLUX-810'],
        );
        const found = catalog.findChanges('cypress-axe');
        assert.equal(found.results.length, 1);
        assert.deepEqual(found.results[0].labels, ['no-impact']);
        const hidden = catalog.findChanges('cypress-axe', { includeNoImpact: false });
        assert.equal(hidden.results.length, 0);
        assert.equal(hidden.hiddenNoImpact, 1);
    });
});
