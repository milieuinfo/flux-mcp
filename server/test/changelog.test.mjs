import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { applyAnnotations, buildRelease, deriveLabels, parseChangelog } from '../src/changelog.mjs';

const REPO = 'https://github.com/milieuinfo/flux-web-components';
const commit = (sha) => `([${sha.slice(0, 7)}](${REPO}/commit/${sha}))`;
const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);
const SHA_C = 'c'.repeat(40);

const entry = (line, section = 'Bug Fixes') =>
    parseChangelog(`# [2.20.0](${REPO}/compare/v2.19.0...v2.20.0) (2026-09-18)\n\n### ${section}\n\n* ${line}\n`).entries[0];

describe('parseChangelog: versiekop', () => {
    test('minor release met compare-url', () => {
        const release = parseChangelog(`# [2.20.0](${REPO}/compare/v2.19.0...v2.20.0) (2026-09-18)\n`);
        assert.equal(release.version, '2.20.0');
        assert.equal(release.date, '2026-09-18');
        assert.equal(release.previous, '2.19.0');
        assert.equal(release.compareUrl, `${REPO}/compare/v2.19.0...v2.20.0`);
    });

    test('patch release met ##', () => {
        const release = parseChangelog(`## [2.12.1](${REPO}/compare/v2.12.0...v2.12.1) (2026-03-02)\n`);
        assert.equal(release.version, '2.12.1');
        assert.equal(release.previous, '2.12.0');
    });

    test('eerste release zonder link', () => {
        const release = parseChangelog('# 1.0.0 (2024-01-15)\n\n### Features\n\n* eerste versie\n');
        assert.equal(release.version, '1.0.0');
        assert.equal(release.date, '2024-01-15');
        assert.equal(release.previous, null);
        assert.equal(release.compareUrl, null);
        assert.equal(release.entries.length, 1);
    });

    test('geen versiekop is een fout', () => {
        assert.throws(() => parseChangelog('### Features\n\n* iets\n'), /Geen versiekop/);
    });

    test('meer dan één versie is een fout', () => {
        const markdown = `# [2.20.0](${REPO}/compare/v2.19.0...v2.20.0) (2026-09-18)\n\n# [2.19.0](${REPO}/compare/v2.18.0...v2.19.0) (2026-08-25)\n`;
        assert.throws(() => parseChangelog(markdown), /changelog-cleanup/);
    });
});

describe('parseChangelog: entries', () => {
    test('key, scope, samenvatting en commit', () => {
        const parsed = entry(`FLUX-809 - vl-alert - banner variant ${commit(SHA_A)}`, 'Features');
        assert.equal(parsed.id, 'aaaaaaa');
        assert.equal(parsed.type, 'feature');
        assert.deepEqual(parsed.issues, ['FLUX-809']);
        assert.equal(parsed.scope, 'vl-alert');
        assert.deepEqual(parsed.components, ['vl-alert']);
        assert.equal(parsed.summary, 'banner variant');
        assert.equal(parsed.text, 'FLUX-809 - vl-alert - banner variant');
        assert.deepEqual(parsed.commits, [{ sha: SHA_A, url: `${REPO}/commit/${SHA_A}` }]);
    });

    test('oude UIG-key', () => {
        const parsed = entry(`UIG-3301 - vl-properties-next - collapsed-styling verbeterd ${commit(SHA_A)}`);
        assert.deepEqual(parsed.issues, ['UIG-3301']);
        assert.deepEqual(parsed.components, ['vl-properties-next']);
    });

    test('zonder key, met scope', () => {
        const parsed = entry(`storybook - typo gecorrigeerd ${commit(SHA_A)}`);
        assert.deepEqual(parsed.issues, []);
        assert.equal(parsed.scope, 'storybook');
        assert.deepEqual(parsed.topics, ['storybook']);
        assert.equal(parsed.summary, 'typo gecorrigeerd');
    });

    test('zonder key en zonder scope', () => {
        const parsed = entry(`aanpassingen om flaky testen stabiel te krijgen ${commit(SHA_A)}`);
        assert.equal(parsed.scope, null);
        assert.equal(parsed.summary, 'aanpassingen om flaky testen stabiel te krijgen');
    });

    test('key zonder scope', () => {
        const parsed = entry(`FLUX-708 - migratie van npm naar pnpm ${commit(SHA_A)}`);
        assert.deepEqual(parsed.issues, ['FLUX-708']);
        assert.equal(parsed.scope, null);
        assert.equal(parsed.summary, 'migratie van npm naar pnpm');
    });

    test('scope met meerdere componenten, gescheiden door , en /', () => {
        assert.deepEqual(entry(`FLUX-471 - vl-header, vl-header-next - skip link ${commit(SHA_A)}`).components, [
            'vl-header',
            'vl-header-next',
        ]);
        assert.deepEqual(entry(`FLUX-788 - vl-header-next / vl-footer-next - ready-event ${commit(SHA_A)}`).components, [
            'vl-header-next',
            'vl-footer-next',
        ]);
    });

    test('scope die een thema is, en componenten die in de tekst genoemd worden', () => {
        const parsed = entry(`FLUX-800 - vl-cascader - breadcrumb opgebouwd met vl-breadcrumb ${commit(SHA_A)}`);
        assert.deepEqual(parsed.mentions, ['vl-breadcrumb']);
        const topic = entry(`FLUX-791 - form-control - submit op Enter ${commit(SHA_A)}`);
        assert.deepEqual(topic.components, []);
        assert.deepEqual(topic.topics, ['form-control']);
        assert.deepEqual(entry(`native vl-select - iets ${commit(SHA_A)}`).mentions, ['vl-select']);
    });

    test("' - ' in de samenvatting blijft in de samenvatting", () => {
        const parsed = entry(`FLUX-1 - vl-map - laag A - laag B ${commit(SHA_A)}`);
        assert.equal(parsed.scope, 'vl-map');
        assert.equal(parsed.summary, 'laag A - laag B');
    });

    test('closes na de commit', () => {
        const parsed = entry(
            `FLUX-795 - waarschuwingen onderdrukt ${commit(SHA_A)}, closes [component-driven/cypress-axe#99](https://github.com/component-driven/cypress-axe/issues/99)`,
        );
        assert.equal(parsed.summary, 'waarschuwingen onderdrukt');
        assert.deepEqual(parsed.closes, [
            { ref: 'component-driven/cypress-axe#99', url: 'https://github.com/component-driven/cypress-axe/issues/99' },
        ]);
    });

    test('meerdere commits', () => {
        const line = `FLUX-1 - vl-alert - iets ([aaaaaaa](${REPO}/commit/${SHA_A}), [bbbbbbb](${REPO}/commit/${SHA_B}))`;
        assert.deepEqual(
            entry(line).commits.map((c) => c.sha),
            [SHA_A, SHA_B],
        );
    });

    test('angular-stijl met vetgedrukte scope', () => {
        const parsed = entry(`**vl-alert:** oude API verwijderd ${commit(SHA_A)}`);
        assert.equal(parsed.scope, 'vl-alert');
        assert.equal(parsed.summary, 'oude API verwijderd');
    });

    test('onbekende sectie wordt other, met de titel bewaard', () => {
        const parsed = entry(`iets ${commit(SHA_A)}`, 'Miscellaneous Chores');
        assert.equal(parsed.type, 'other');
        assert.equal(parsed.section, 'Miscellaneous Chores');
    });

    test('breaking changes zonder commit, met een vervolgregel', () => {
        const release = parseChangelog(
            [
                `# [2.0.0](${REPO}/compare/v1.48.2...v2.0.0) (2025-06-02)`,
                '',
                '### Features',
                '',
                `* UIG-3304 - storybook verbeteringen, button-pill verwijderd ${commit(SHA_A)}`,
                '',
                '',
                '### BREAKING CHANGES',
                '',
                '* start van v2',
                'vl-button-pill bestaat niet meer.',
                '',
                'Gebruik vl-pill.',
                '* tweede breaking change',
            ].join('\n'),
        );
        const breaking = release.entries.filter((e) => e.type === 'breaking');
        assert.deepEqual(
            breaking.map((e) => e.id),
            ['breaking-1', 'breaking-2'],
        );
        assert.equal(breaking[0].text, 'start van v2\nvl-button-pill bestaat niet meer.\n\nGebruik vl-pill.');
        assert.deepEqual(breaking[0].commits, []);
        assert.equal(release.entries[0].type, 'feature');
    });

    test('⚠ BREAKING CHANGES is ook breaking', () => {
        assert.equal(entry('iets', '⚠ BREAKING CHANGES').type, 'breaking');
    });

    test('dezelfde commit twee keer geeft twee verschillende ids', () => {
        const release = parseChangelog(
            `# [2.20.0](${REPO}/compare/v2.19.0...v2.20.0) (2026-09-18)\n\n### Features\n\n* a ${commit(SHA_C)}\n\n### Bug Fixes\n\n* b ${commit(SHA_C)}\n`,
        );
        assert.deepEqual(
            release.entries.map((e) => e.id),
            ['ccccccc', 'ccccccc-2'],
        );
    });
});

describe('deriveLabels', () => {
    const labels = (line) => deriveLabels(entry(`${line} ${commit(SHA_A)}`));

    test('cypress-axe heeft geen impact en is geen toegankelijkheid', () => {
        assert.deepEqual(labels('FLUX-795 - Critical dependency waarschuwingen van cypress-axe onderdrukt').labels, ['no-impact']);
    });

    test('flaky testen hebben geen impact', () => {
        assert.deepEqual(labels('FLUX-788 - vl-header-next / vl-footer-next - flaky testen en ready-event').labels, ['no-impact']);
    });

    test('storybook als scope heeft geen impact', () => {
        assert.deepEqual(labels('FLUX-790 - storybook - de changelog feats hadden de fixes style').labels, ['no-impact']);
    });

    test('aria is toegankelijkheid', () => {
        assert.deepEqual(labels('FLUX-794 - vl-upload - aria-invalid en gekende toegankelijkheidsbeperking').labels, ['a11y']);
    });

    test('WCAG-criterium uit de tekst', () => {
        const result = labels('FLUX-471 - vl-header, vl-header-next - skip-to-content link (WCAG 2.4.1)');
        assert.deepEqual(result.labels, ['a11y']);
        assert.deepEqual(result.wcag, ['2.4.1']);
    });

    test('een gewone wijziging krijgt geen labels', () => {
        assert.deepEqual(labels('FLUX-809 - vl-alert - banner variant'), { labels: [], wcag: [] });
    });

    test('documentatie heeft geen impact, ook met toegankelijkheid erin', () => {
        const docs = (line) => deriveLabels(entry(`${line} ${commit(SHA_A)}`, 'Documentation')).labels;
        assert.deepEqual(docs("FLUX-708 - recept 'Van npm naar pnpm' voor afnemers"), ['no-impact']);
        assert.deepEqual(docs('FLUX-802 - componenten overzicht - WCAG status'), ['a11y', 'no-impact']);
    });

    test('een wijziging aan de eigen build zonder signaalwoord valt erdoor: daarvoor dient een annotatie', () => {
        assert.deepEqual(deriveLabels(entry(`FLUX-708 - migratie van npm naar pnpm ${commit(SHA_A)}`, 'Features')).labels, []);
    });
});

describe('applyAnnotations', () => {
    const release = () => ({
        summary: null,
        migration: null,
        entries: [
            { id: 'aaaaaaa', labels: ['no-impact'], note: null, migration: null },
            { id: 'bbbbbbb', labels: [], note: null, migration: null },
        ],
    });

    test('zonder annotaties blijft alles hetzelfde', () => {
        assert.deepEqual(applyAnnotations(release(), null), release());
    });

    test('samenvatting, migratie, notitie en labels', () => {
        const result = applyAnnotations(release(), {
            summary: 'Samenvatting',
            migration: 'Doe dit',
            entries: {
                aaaaaaa: { labels: { 'no-impact': false, a11y: true }, note: 'Toch belangrijk' },
                bbbbbbb: { migration: 'Vervang X door Y' },
            },
        });
        assert.equal(result.summary, 'Samenvatting');
        assert.equal(result.migration, 'Doe dit');
        assert.deepEqual(result.entries[0], { id: 'aaaaaaa', labels: ['a11y'], note: 'Toch belangrijk', migration: null });
        assert.equal(result.entries[1].migration, 'Vervang X door Y');
    });

    test('een onbekende entry, sleutel of label is een fout', () => {
        assert.throws(() => applyAnnotations(release(), { entries: { zzzzzzz: { note: 'x' } } }, 'test.json'), /test\.json[\s\S]*zzzzzzz/);
        assert.throws(() => applyAnnotations(release(), { titel: 'x' }), /onbekende sleutel 'titel'/);
        assert.throws(() => applyAnnotations(release(), { entries: { aaaaaaa: { notitie: 'x' } } }), /onbekende sleutel 'notitie'/);
        assert.throws(() => applyAnnotations(release(), { entries: { aaaaaaa: { labels: { breaking: true } } } }), /onbekend label/);
        assert.throws(() => applyAnnotations(release(), { entries: { aaaaaaa: { labels: { a11y: 'ja' } } } }), /true of false/);
        assert.throws(() => applyAnnotations(release(), { summary: '' }), /niet-lege tekst/);
    });
});

describe('buildRelease', () => {
    const markdown = [
        `# [2.20.0](${REPO}/compare/v2.19.0...v2.20.0) (2026-09-18)`,
        '',
        '### Features',
        '',
        `* FLUX-809 - vl-alert - banner variant ${commit(SHA_A)}`,
        `* FLUX-1 - vl-header-next - iets ${commit(SHA_B)}`,
        '',
        '### Bug Fixes',
        '',
        `* FLUX-2 - vl-button - flaky testen ${commit(SHA_C)}`,
    ].join('\n');
    const element = (name, extra = {}) => ({ name, 'doc-url': `https://storybook/${name}`, ...extra });
    const webTypes = new Map([
        ['vl-alert', { category: 'block', element: element('vl-alert', { attributes: [{ name: 'banner' }] }) }],
        ['vl-button', { category: 'atom', element: element('vl-button') }],
    ]);
    const previousWebTypes = new Map([
        ['vl-alert', { category: 'block', element: element('vl-alert', { attributes: [] }) }],
        ['vl-button', { category: 'atom', element: element('vl-button') }],
    ]);

    test('tellingen, componenten en API-diff', () => {
        const release = buildRelease({ markdown, webTypes, previousWebTypes });
        assert.equal(release.schema, 1);
        assert.equal(release.counts.feature, 2);
        assert.equal(release.counts.fix, 1);
        assert.equal(release.counts['no-impact'], 1);
        // De entry over vl-button zonder impact telt niet mee; vl-header-next staat niet in de web-types.
        assert.deepEqual(release.components, [
            { name: 'vl-alert', category: 'block', docUrl: 'https://storybook/vl-alert' },
            { name: 'vl-header-next', category: null, docUrl: null },
        ]);
        assert.equal(release.api.base, '2.19.0');
        assert.equal(release.api.changed[0].element, 'vl-alert');
        assert.equal(release.api.changed[0].inChangelog, true);
        assert.equal(release.apiUnavailable, null);
    });

    test('zonder web-types van de vorige versie geen API-diff, met de reden', () => {
        const release = buildRelease({ markdown, webTypes });
        assert.equal(release.api, null);
        assert.equal(release.apiUnavailable, 'Geen web-types voor 2.19.0 in de catalogus.');
    });

    test('annotaties komen in het resultaat', () => {
        const release = buildRelease({ markdown, annotations: { entries: { ccccccc: { labels: { 'no-impact': false } } } } });
        assert.deepEqual(release.entries[2].labels, []);
        assert.equal(release.counts['no-impact'], 0);
    });

    test('deterministisch', () => {
        const build = () => JSON.stringify(buildRelease({ markdown, webTypes, previousWebTypes }));
        assert.equal(build(), build());
    });
});
