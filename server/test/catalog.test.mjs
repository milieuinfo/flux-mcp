import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import {
    CATALOG_DIR,
    CatalogError,
    compareVersions,
    createCatalog,
    resolveVersion,
    sideBranchBase,
} from '../src/catalog.mjs';
import { buildReleaseFiles, compareReleaseFiles, writeReleaseFiles } from '../src/changelog.mjs';

// Een kopie van de echte catalogus met vers gebouwde bestanden, zodat de tests niet afhangen van gebouwde
// bestanden die niet meer kloppen. De bronnen (changelog.md, commits.json, analyse, web-types, packages) zijn de echte.
const SOURCES = ['web-types', 'packages', 'changelog-analysis', 'changelog/changelog.md', 'changelog/commits.json'];
let dir;
let catalog;

before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-catalog-'));
    for (const version of ['2.19.0', '2.20.0']) {
        for (const part of SOURCES) {
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

describe('resolveVersion', () => {
    const versions = ['2.16.0', '2.17.0', '2.18.0', '2.19.0', '2.20.0'];

    test('latest, een versie met of zonder v', () => {
        assert.deepEqual(resolveVersion(versions, 'latest'), { version: '2.20.0', requested: 'latest', warning: null });
        assert.equal(resolveVersion(versions, 'v2.18.0').version, '2.18.0');
    });

    test('een patch op een zijtak valt terug op haar minor, met een waarschuwing', () => {
        const resolved = resolveVersion(versions, '2.17.3');
        assert.equal(resolved.version, '2.17.0');
        assert.equal(resolved.requested, '2.17.3');
        assert.match(resolved.warning, /2\.17\.3 is een patch op een zijtak.*geldt voor 2\.17\.0/);
        assert.equal(sideBranchBase(versions, '2.17.3'), '2.17.0');
        assert.equal(sideBranchBase(versions, '2.17.4'), null, 'enkel de patches uit ADR-002');
    });

    test('een andere versie is een fout; een nieuwere zegt dat flux-mcp een update nodig heeft', () => {
        assert.throws(() => resolveVersion(versions, '2.17.4'), /2\.17\.4 staat niet in de catalogus\. Beschikbaar/);
        assert.throws(() => resolveVersion(versions, '2.20.1'), /de nieuwste is 2\.20\.0\. Werk flux-mcp bij/);
        assert.throws(() => resolveVersion(versions, 'twee'), /Ongeldige versie/);
    });
});

describe('listVersions', () => {
    test('nieuwste eerst, met de keten naar de vorige versie', () => {
        const versions = catalog.listVersions();
        assert.deepEqual(
            versions.map((v) => [v.version, v.previous, v.previousInCatalog, v.webTypes, v.packages]),
            [
                ['2.20.0', '2.19.0', true, true, true],
                ['2.19.0', '2.18.0', false, true, true],
            ],
        );
        assert.equal(versions[0].counts.type.feature, 4);
        assert.deepEqual(versions[0].counts.impact, { action: 1, 'opt-in': 3, automatic: 5, none: 9 });
        assert.match(versions[0].summary, /banner/);
        assert.deepEqual(
            versions.map((v) => v.changelogAnalysis),
            ['complete', 'complete'],
        );
    });
});

describe('elementVersions', () => {
    test('de versies waarin een element in de web-types staat', () => {
        assert.deepEqual(catalog.elementVersions('button'), ['2.19.0', '2.20.0']);
        assert.deepEqual(catalog.elementVersions('vl-onbestaand'), []);
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
        assert.match(banner.explanation, /\bbanner\b/);
        assert.match(banner.example, /<vl-alert banner/);
        assert.equal(banner.source.published, true);
        assert.deepEqual(
            banner.source.storybook.map((page) => page.id),
            ['components-block-alert--documentatie'],
        );
        assert.match(banner.source.storybook[0].added, /### Banner/);
    });

    test('filter op component, zonder vl-, met de diff van de web-types van dat element', () => {
        const release = catalog.getChangelog('2.20.0', { component: 'alert' });
        assert.deepEqual(
            release.entries.map((e) => e.issues[0]),
            ['FLUX-809'],
        );
        assert.deepEqual(
            release.webTypesDiff.changed.map((c) => c.element),
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
        assert.throws(
            () => catalog.getChangelog('2.18.0'),
            (error) => error instanceof CatalogError && /2\.20\.0, 2\.19\.0/.test(error.message),
        );
        assert.throws(() => catalog.getChangelog('twee'), CatalogError);
        assert.throws(() => catalog.getChangelog('2.20.0', { type: 'feat' }), /Kies uit/);
    });
});

describe('getChangesBetween', () => {
    test('volledig bereik: beide versies, eerst wat actie vraagt, en de diff van de web-types', () => {
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
                ['2.19.0', 'FLUX-213', true],
                ['2.19.0', 'FLUX-219', true],
                ['2.19.0', 'FLUX-236', true],
                ['2.19.0', 'FLUX-788', true],
                ['2.19.0', 'FLUX-471', true],
                ['2.20.0', 'FLUX-810', true],
            ],
        );
        assert.equal(result.changes['opt-in'].length, 10);
        assert.equal(result.changes.automatic.length, 9);
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
        // Geen web-types en geen packages voor 2.18.0, dus geen netto diff van de web-types en de dependencies.
        assert.equal(result.webTypesDiff, null);
        assert.equal(result.webTypesDiffUnavailable, 'Geen web-types voor 2.18.0 in de catalogus.');
        assert.equal(result.dependenciesDiff, null);
        assert.equal(result.dependenciesDiffUnavailable, 'Geen packages voor 2.18.0 in de catalogus.');
        // Geen commits buiten de changelog die de packages raken, in beide versies.
        assert.deepEqual(result.unlistedCommits, []);
    });

    test('van 2.19.0 naar 2.20.0: het contract en de dependencies, met de beschrijvingen verborgen', () => {
        const result = catalog.getChangesBetween('2.19.0', '2.20.0');
        assert.deepEqual(
            result.webTypesDiff.changed.map((c) => c.element),
            ['vl-alert'],
        );
        assert.equal('descriptions' in result.webTypesDiff, false);
        assert.equal(result.hiddenDescriptions, 12);
        assert.deepEqual(result.dependenciesDiff, { base: '2.19.0', added: [], removed: [], changed: [] });
        const all = catalog.getChangesBetween('2.19.0', '2.20.0', { includeDescriptions: true });
        assert.equal(all.webTypesDiff.descriptions.length, 12);
        assert.equal(all.hiddenDescriptions, 0);
    });

    test('met web-types aan beide kanten een netto diff van de web-types', () => {
        const result = catalog.getChangesBetween('2.19.0', '2.20.0', { component: 'vl-alert' });
        assert.deepEqual(
            result.webTypesDiff.changed.map((c) => c.element),
            ['vl-alert'],
        );
        assert.deepEqual(
            result.changes['opt-in'].map((e) => e.issues[0]),
            ['FLUX-809'],
        );
    });

    test('met een lijst van componenten, en general: wat geen component, thema of element noemt', () => {
        const result = catalog.getChangesBetween('2.19.0', '2.20.0', { component: ['vl-alert', 'breadcrumb'] });
        assert.deepEqual(
            result.webTypesDiff.changed.map((c) => c.element),
            ['vl-alert'],
        );
        const components = Object.values(result.changes).flat().flatMap((entry) => entry.components);
        assert.ok(components.includes('vl-alert') && components.includes('vl-breadcrumb'));
        const general = Object.values(result.general).flat();
        assert.ok(general.every((e) => !e.components.length && !e.topics.length && !e.mentions.length));
        assert.equal(catalog.getChangesBetween('2.19.0', '2.20.0').general, null, 'enkel met componenten');
    });

    test('base is from, tenzij from een patch op een zijtak is', () => {
        assert.equal(catalog.getChangesBetween('2.19.0', '2.20.0').base, '2.19.0');
        const real = createCatalog(CATALOG_DIR);
        const patch = real.getChangesBetween('2.17.3', '2.20.0');
        assert.equal(patch.base, '2.17.0');
        assert.equal(patch.webTypesDiff.base, '2.17.0');
        assert.equal(patch.dependenciesDiff.base, '2.17.0');
        assert.deepEqual(
            patch.versions.map((v) => v.version),
            ['2.18.0', '2.19.0', '2.20.0'],
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
            history.history[0].webTypesDiff.changed.attributes.added.map((a) => a.name),
            ['banner'],
        );
        assert.equal(history.history[1].webTypesDiffUnavailable, 'Geen web-types voor 2.18.0 in de catalogus.');
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

    test('een component met enkel een nieuwe beschrijving in de web-types: standaard verborgen', () => {
        const history = catalog.getComponentHistory('vl-checkbox');
        assert.deepEqual(history.history, []);
        assert.equal(history.hiddenDescriptions, 1);
    });

    test('met includeDescriptions toch getoond', () => {
        const history = catalog.getComponentHistory('vl-checkbox', { includeDescriptions: true });
        assert.equal(history.history.length, 1);
        assert.deepEqual(history.history[0].entries, []);
        assert.equal(history.history[0].webTypesDiff.changed, null);
        assert.equal(history.history[0].webTypesDiff.descriptions.attributes[0].name, 'blur-validation');
        assert.equal(history.hiddenDescriptions, 0);
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

    test('beperkt tot een component en een aantal; total telt alles', () => {
        const all = catalog.findChanges('flux-800');
        const limited = catalog.findChanges('flux-800', { limit: 1 });
        assert.equal(limited.results.length, 1);
        assert.equal(limited.total, all.results.length);
        const alert = catalog.findChanges('alert', { component: 'vl-alert' });
        assert.ok(alert.results.length > 0);
        assert.ok(alert.results.every((r) => r.components.includes('vl-alert') || r.mentions.includes('vl-alert')));
    });
});

describe('gebouwde bestanden', () => {
    test('--check ziet verouderde, ontbrekende en overbodige bestanden; bouwen ruimt ze op', () => {
        const { files } = buildReleaseFiles(dir, '2.20.0');
        assert.deepEqual(compareReleaseFiles(dir, '2.20.0', files), []);

        const tickets = path.join(dir, '2.20.0', 'changelog', 'tickets');
        fs.writeFileSync(path.join(tickets, 'FLUX-999-vl-oud.json'), '{}\n');
        fs.appendFileSync(path.join(tickets, 'FLUX-809-vl-alert.json'), ' ');
        fs.rmSync(path.join(dir, '2.20.0', 'changelog', 'web-types-diff.json'));
        assert.deepEqual(compareReleaseFiles(dir, '2.20.0', files), [
            { path: 'web-types-diff.json', status: 'ontbreekt' },
            { path: 'tickets/FLUX-809-vl-alert.json', status: 'is verouderd' },
            { path: 'tickets/FLUX-999-vl-oud.json', status: 'is overbodig' },
        ]);

        writeReleaseFiles(dir, '2.20.0', files);
        assert.deepEqual(compareReleaseFiles(dir, '2.20.0', files), []);
        assert.equal(fs.existsSync(path.join(tickets, 'FLUX-999-vl-oud.json')), false);
    });
});
