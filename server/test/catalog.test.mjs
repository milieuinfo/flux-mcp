import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { CATALOG_DIR, CatalogError, compareVersions, createCatalog } from '../src/catalog.mjs';
import { buildReleaseFiles, compareReleaseFiles, writeReleaseFiles } from '../src/changelog.mjs';

// Een kopie van de echte catalogus met vers gebouwde bestanden, zodat de tests niet afhangen van gebouwde
// bestanden die niet meer kloppen. De bronnen (changelog.md, commits.json, analyse, web-types) zijn de echte.
let dir;
let catalog;

before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-catalog-'));
    for (const version of ['2.19.0', '2.20.0']) {
        for (const part of ['web-types', 'analysis', 'changelog/changelog.md', 'changelog/commits.json']) {
            fs.cpSync(path.join(CATALOG_DIR, version, part), path.join(dir, version, part), { recursive: true });
        }
    }
    for (const version of ['2.19.0', '2.20.0']) {
        writeReleaseFiles(dir, version, buildReleaseFiles(dir, version).files);
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
        assert.equal(versions[0].counts.type.feature, 4);
        assert.deepEqual(versions[0].counts.impact, { action: 1, 'opt-in': 3, automatic: 5, none: 9 });
        assert.match(versions[0].summary, /banner/);
    });
});

describe('getChangelog', () => {
    test('wat nieuw is, toont ook wat geen impact heeft, gemarkeerd', () => {
        const release = catalog.getChangelog('v2.20.0');
        assert.equal(release.entries.length, 18);
        assert.equal(release.hiddenNoImpact, 0);
        assert.equal(release.entries.find((e) => e.id === '6899016').impact, 'none');
        const impact = catalog.getChangelog('2.20.0', { includeNoImpact: false });
        assert.equal(impact.entries.length, 9);
        assert.equal(impact.hiddenNoImpact, 9);
    });

    test('een entry draagt de analyse, de uitleg uit de commit en de Storybook-pagina', () => {
        const banner = catalog.getChangelog('2.20.0').entries.find((e) => e.id === 'f2a3414');
        assert.equal(banner.ticket, 'FLUX-809');
        assert.equal(banner.file, 'tickets/FLUX-809-vl-alert.json');
        assert.equal(banner.impact, 'opt-in');
        assert.equal(banner.impactSource, 'analysis');
        assert.match(banner.explanation, /banner attribuut/);
        assert.match(banner.example, /<vl-alert banner/);
        assert.equal(banner.source.published, true);
        assert.deepEqual(
            banner.source.storybook.map((page) => page.id),
            ['components-block-alert--documentatie'],
        );
        assert.match(banner.source.storybook[0].added, /### Banner/);
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

    test('filter op type, impact en label', () => {
        assert.equal(catalog.getChangelog('2.20.0', { type: 'docs' }).entries.length, 7);
        assert.equal(catalog.getChangelog('2.20.0', { label: 'a11y' }).entries.length, 6);
        assert.deepEqual(
            catalog.getChangelog('2.20.0', { impact: 'action' }).entries.map((e) => e.id),
            ['d68ff04'],
        );
        assert.equal(catalog.getChangelog('2.20.0', { impact: 'none', includeNoImpact: false }).entries.length, 9);
        assert.throws(() => catalog.getChangelog('2.20.0', { impact: 'dringend' }), /Kies uit/);
    });

    test('een onbekende versie noemt wat er wel is', () => {
        assert.throws(() => catalog.getChangelog('2.18.0'), (error) => error instanceof CatalogError && /2\.20\.0, 2\.19\.0/.test(error.message));
        assert.throws(() => catalog.getChangelog('twee'), CatalogError);
        assert.throws(() => catalog.getChangelog('2.20.0', { type: 'feat' }), /Kies uit/);
    });
});

describe('getChangesBetween', () => {
    test('volledig bereik: beide versies, eerst wat actie vraagt, en de API-diff', () => {
        const result = catalog.getChangesBetween('2.18.0', '2.20.0');
        assert.equal(result.complete, true);
        assert.equal(result.missing, null);
        assert.deepEqual(
            result.versions.map((v) => v.version),
            ['2.19.0', '2.20.0'],
        );
        assert.deepEqual(Object.keys(result.changes), ['action', 'opt-in', 'automatic', 'none']);
        assert.deepEqual(
            result.changes.action.map((e) => [e.version, e.issues[0], Boolean(e.action)]),
            [
                ['2.19.0', 'FLUX-207', true],
                ['2.19.0', 'FLUX-213', true],
                ['2.19.0', 'FLUX-788', true],
                ['2.19.0', 'FLUX-471', true],
                ['2.20.0', 'FLUX-810', true],
            ],
        );
        assert.equal(result.changes['opt-in'].length, 9);
        assert.equal(result.changes.automatic.length, 11);
        // Zonder de pnpm-migratie, de documentatie en de testen: die raken het project van de afnemer niet.
        assert.deepEqual(result.changes.none, []);
        assert.equal(result.hiddenNoImpact, 10);
        assert.equal(catalog.getChangesBetween('2.18.0', '2.20.0', { includeNoImpact: true }).changes.none.length, 10);
        const alert = result.components.find((c) => c.name === 'vl-alert');
        assert.deepEqual(
            alert.changes.map((c) => [c.version, c.issues[0], c.impact]),
            [
                ['2.19.0', 'FLUX-207', 'opt-in'],
                ['2.20.0', 'FLUX-809', 'opt-in'],
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
            result.changes['opt-in'].map((e) => e.issues[0]),
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

    test('op woorden, ook in de uitleg uit de commit en de analyse', () => {
        // "window" staat enkel in de uitleg, niet in de changelog-tekst.
        assert.deepEqual(
            catalog.findChanges('window ready').results.map((r) => r.issues[0]),
            ['FLUX-788'],
        );
    });

    test('ook wat geen impact heeft, gemarkeerd', () => {
        const found = catalog.findChanges('cypress-axe');
        assert.equal(found.results.length, 1);
        assert.equal(found.results[0].impact, 'none');
        const hidden = catalog.findChanges('cypress-axe', { includeNoImpact: false });
        assert.equal(hidden.results.length, 0);
        assert.equal(hidden.hiddenNoImpact, 1);
    });
});

describe('gebouwde bestanden', () => {
    test('--check ziet verouderde, ontbrekende en overbodige bestanden; bouwen ruimt ze op', () => {
        const { files } = buildReleaseFiles(dir, '2.20.0');
        assert.deepEqual(compareReleaseFiles(dir, '2.20.0', files), []);

        const tickets = path.join(dir, '2.20.0', 'changelog', 'tickets');
        fs.writeFileSync(path.join(tickets, 'FLUX-999-vl-oud.json'), '{}\n');
        fs.appendFileSync(path.join(tickets, 'FLUX-809-vl-alert.json'), ' ');
        fs.rmSync(path.join(dir, '2.20.0', 'changelog', 'api.json'));
        assert.deepEqual(compareReleaseFiles(dir, '2.20.0', files), [
            { path: 'api.json', status: 'ontbreekt' },
            { path: 'tickets/FLUX-809-vl-alert.json', status: 'is verouderd' },
            { path: 'tickets/FLUX-999-vl-oud.json', status: 'is overbodig' },
        ]);

        writeReleaseFiles(dir, '2.20.0', files);
        assert.deepEqual(compareReleaseFiles(dir, '2.20.0', files), []);
        assert.equal(fs.existsSync(path.join(tickets, 'FLUX-999-vl-oud.json')), false);
    });
});
