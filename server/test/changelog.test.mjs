import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildRelease, deriveImpact, deriveLabels, parseChangelog, sourceOf, validateAnalysis } from '../src/changelog.mjs';

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

// Feiten zoals changelog-commits ze schrijft, voor één commit.
const facts = (sha, overrides = {}) => ({
    sha,
    body: null,
    published: true,
    areas: { code: 1 },
    publishedFiles: ['libs/components/src/block/alert/vl-alert.component.ts'],
    storybook: [],
    ...overrides,
});

describe('deriveImpact', () => {
    const impact = (line, section = 'Bug Fixes', source = null) => deriveImpact(entry(`${line} ${commit(SHA_A)}`, section), source);

    test('breaking vraagt altijd actie', () => {
        assert.equal(deriveImpact(entry('start van v2', 'BREAKING CHANGES'), null), 'action');
    });

    test('met de feiten uit de commit: raakt ze de packages niet, dan geen impact', () => {
        const tooling = facts(SHA_A, { published: false, areas: { tooling: 39 }, publishedFiles: [] });
        assert.equal(impact('FLUX-708 - migratie van npm naar pnpm', 'Features', tooling), 'none');
    });

    test('met de feiten uit de commit wegen die zwaarder dan signaalwoorden', () => {
        // "flaky testen" in de tekst, maar de commit wijzigt de code van de component.
        assert.equal(impact('FLUX-788 - vl-header-next - flaky testen en ready-event', 'Bug Fixes', facts(SHA_A)), 'automatic');
    });

    test('een feature is een nieuwe mogelijkheid, een fix komt automatisch', () => {
        assert.equal(impact('FLUX-809 - vl-alert - banner variant', 'Features', facts(SHA_A)), 'opt-in');
        assert.equal(impact('FLUX-800 - vl-breadcrumb-item - focus outline', 'Bug Fixes', facts(SHA_A)), 'automatic');
    });

    test('zonder de feiten: documentatie en signaalwoorden geven geen impact', () => {
        assert.equal(impact("FLUX-708 - recept 'Van npm naar pnpm' voor afnemers", 'Documentation'), 'none');
        assert.equal(impact('FLUX-795 - Critical dependency waarschuwingen van cypress-axe onderdrukt'), 'none');
        assert.equal(impact('FLUX-790 - storybook - de changelog feats hadden de fixes style'), 'none');
        assert.equal(impact('FLUX-809 - vl-alert - banner variant', 'Features'), 'opt-in');
    });
});

describe('deriveLabels', () => {
    const labels = (line, source = null) => deriveLabels(entry(`${line} ${commit(SHA_A)}`), source);

    test('cypress-axe is geen toegankelijkheid', () => {
        assert.deepEqual(labels('FLUX-795 - Critical dependency waarschuwingen van cypress-axe onderdrukt').labels, []);
    });

    test('aria is toegankelijkheid', () => {
        assert.deepEqual(labels('FLUX-794 - vl-upload - aria-invalid en gekende toegankelijkheidsbeperking').labels, ['a11y']);
    });

    test('WCAG-criterium uit de tekst', () => {
        const result = labels('FLUX-471 - vl-header, vl-header-next - skip-to-content link (WCAG 2.4.1)');
        assert.deepEqual(result.labels, ['a11y']);
        assert.deepEqual(result.wcag, ['2.4.1']);
    });

    test('ook de uitleg in de commit telt mee', () => {
        const body = 'De paren worden nu als description list gerenderd, zodat screenreaders ze aankondigen.';
        assert.deepEqual(labels('FLUX-219 - vl-description-data - label/waarde als description list', facts(SHA_A, { body })).labels, [
            'a11y',
        ]);
    });

    test('een gewone wijziging krijgt geen labels', () => {
        assert.deepEqual(labels('FLUX-809 - vl-alert - banner variant'), { labels: [], wcag: [] });
    });
});

describe('sourceOf', () => {
    const commits = (list) => ({ version: '2.20.0', commits: Object.fromEntries(list.map((f) => [f.sha, f])) });

    test('zonder commits.json geen feiten', () => {
        assert.equal(sourceOf(entry(`iets ${commit(SHA_A)}`), null), null);
    });

    test('een entry zonder commit heeft geen feiten', () => {
        assert.equal(sourceOf(entry('start van v2', 'BREAKING CHANGES'), commits([])), null);
    });

    test('meerdere commits worden samengevoegd', () => {
        const line = `FLUX-1 - vl-alert - iets ([aaaaaaa](${REPO}/commit/${SHA_A}), [bbbbbbb](${REPO}/commit/${SHA_B}))`;
        const page = (added) => ({ id: 'components-block-alert--documentatie', title: 'alert', url: 'u', added });
        const source = sourceOf(
            entry(line),
            commits([
                facts(SHA_A, { body: 'Eerste.', published: false, areas: { docs: 1 }, publishedFiles: [], storybook: [page('A')] }),
                facts(SHA_B, { body: 'Tweede.', storybook: [page('B')] }),
            ]),
        );
        assert.equal(source.body, 'Eerste.\n\nTweede.');
        assert.equal(source.published, true);
        assert.deepEqual(source.areas, { docs: 1, code: 1 });
        assert.deepEqual(source.storybook, [page('A\n\n[…]\n\nB')]);
    });

    test('een commit die ontbreekt in commits.json is een fout', () => {
        assert.throws(() => sourceOf(entry(`iets ${commit(SHA_A)}`), commits([])), /changelog-commits 2\.20\.0/);
    });
});

describe('validateAnalysis', () => {
    const ids = ['aaaaaaa', 'bbbbbbb'];

    test('een geldige analyse', () => {
        assert.doesNotThrow(() =>
            validateAnalysis(
                {
                    summary: 'Samenvatting',
                    entries: {
                        aaaaaaa: { impact: 'action', explanation: 'Uitleg', action: 'Doe dit', example: '```html\n…\n```' },
                        bbbbbbb: { impact: 'none', explanation: 'Uitleg', a11y: false },
                    },
                },
                ids,
            ),
        );
    });

    test('fouten worden allemaal gemeld, met de bron erbij', () => {
        const analysis = {
            titel: 'x',
            entries: {
                zzzzzzz: { impact: 'none', explanation: 'x' },
                aaaaaaa: { impact: 'dringend', explanation: '', notitie: 'x' },
                bbbbbbb: { impact: 'opt-in', explanation: 'x', action: 'Doe dit', a11y: 'ja' },
            },
        };
        assert.throws(
            () => validateAnalysis(analysis, ids, 'test.json'),
            (error) =>
                [
                    /test\.json/,
                    /onbekende sleutel 'titel'/,
                    /onbekende entry 'zzzzzzz'/,
                    /'impact' moet een van/,
                    /'explanation' moet/,
                    /onbekende sleutel 'notitie'/,
                    /'action' hoort enkel bij impact 'action'/,
                    /'a11y' moet true of false/,
                ].every((pattern) => pattern.test(error.message)),
        );
    });

    test("impact 'action' vraagt een action", () => {
        assert.throws(() => validateAnalysis({ entries: { aaaaaaa: { impact: 'action', explanation: 'x' } } }, ids), /vraagt een 'action'/);
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
    const commits = {
        version: '2.20.0',
        commits: {
            [SHA_A]: facts(SHA_A, { body: 'Een banner over de volle breedte.' }),
            [SHA_B]: facts(SHA_B),
            [SHA_C]: facts(SHA_C, { published: false, areas: { tests: 2 }, publishedFiles: [] }),
        },
    };

    test('tellingen, componenten en API-diff', () => {
        const release = buildRelease({ markdown, webTypes, previousWebTypes });
        assert.equal(release.schema, 1);
        assert.deepEqual(release.counts.type, { breaking: 0, feature: 2, fix: 1, docs: 0, perf: 0, revert: 0, other: 0 });
        // Zonder commits.json: 'flaky testen' geeft geen impact.
        assert.deepEqual(release.counts.impact, { action: 0, 'opt-in': 2, automatic: 0, none: 1 });
        // De entry over vl-button zonder impact telt niet mee; vl-header-next staat niet in de web-types.
        assert.deepEqual(release.components, [
            { name: 'vl-alert', category: 'block', docUrl: 'https://storybook/vl-alert' },
            { name: 'vl-header-next', category: null, docUrl: null },
        ]);
        assert.equal(release.api.base, '2.19.0');
        assert.equal(release.api.changed[0].element, 'vl-alert');
        assert.equal(release.api.changed[0].inChangelog, true);
        assert.equal(release.apiUnavailable, null);
        assert.ok(release.entries.every((e) => e.source === null && e.impactSource === 'derived'));
    });

    test('zonder web-types van de vorige versie geen API-diff, met de reden', () => {
        const release = buildRelease({ markdown, webTypes });
        assert.equal(release.api, null);
        assert.equal(release.apiUnavailable, 'Geen web-types voor 2.19.0 in de catalogus.');
    });

    test('de feiten uit de commits komen bij de entry', () => {
        const release = buildRelease({ markdown, commits });
        assert.equal(release.entries[0].source.body, 'Een banner over de volle breedte.');
        assert.equal(release.entries[2].impact, 'none');
    });

    test('commits.json van een andere versie is een fout', () => {
        assert.throws(() => buildRelease({ markdown, commits: { ...commits, version: '2.19.0' } }), /hoort bij 2\.19\.0/);
    });

    test('de analyse bepaalt impact, uitleg, actie en voorbeeld', () => {
        const analysis = {
            summary: 'Een banner en een fix.',
            entries: {
                aaaaaaa: { impact: 'opt-in', explanation: 'Met banner …', example: '```html\n<vl-alert banner></vl-alert>\n```' },
                bbbbbbb: { impact: 'action', explanation: 'Het event komt nu op het element.', action: 'Luister op het element.', a11y: true },
            },
        };
        const release = buildRelease({ markdown, commits, analysis });
        assert.equal(release.summary, 'Een banner en een fix.');
        const [banner, header, button] = release.entries;
        assert.equal(banner.impactSource, 'analysis');
        assert.equal(banner.example, '```html\n<vl-alert banner></vl-alert>\n```');
        assert.equal(header.impact, 'action');
        assert.equal(header.action, 'Luister op het element.');
        assert.deepEqual(header.labels, ['a11y']);
        assert.equal(button.impactSource, 'derived');
        assert.equal(release.counts.impact.action, 1);
    });

    test('een analyse die niet klopt, laat de build falen', () => {
        assert.throws(() => buildRelease({ markdown, analysis: { entries: { zzzzzzz: {} } }, analysisSource: 'x.json' }), /x\.json/);
    });

    test('deterministisch', () => {
        const build = () => JSON.stringify(buildRelease({ markdown, commits, webTypes, previousWebTypes }));
        assert.equal(build(), build());
    });
});
