import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createDocs } from '../server/src/docs.mjs';
import { checkMarkup } from '../server/src/markup.mjs';
import {
    answerReportOf,
    changedLinesOf,
    deviationProblems,
    deviationsOf,
    fileProblems,
    leftoverProblems,
    modifiedProblems,
    packageProblems,
    reportProblems,
} from '../resources/flux/server/recipe-check.mjs';

const template = [
    '---',
    'workflow: migreren',
    'bronversie: <x.y.z>',
    'resultaat: <geslaagd | gedeeltelijk | gestopt>',
    '---',
    '',
    '# Migratie',
    '',
    '## Analyse',
    '',
    '<Per wijziging de versie, de id en het ticket.>',
    '',
    '## Verificatie',
    '',
    '<De build en de e2e-testen.>',
    '',
].join('\n');

const report = (overrides = {}) => {
    const {
        frontmatter = 'workflow: migreren\nbronversie: 2.12.1\nresultaat: geslaagd',
        analyse,
        verificatie,
    } = overrides;
    return [
        '---',
        frontmatter,
        '---',
        '',
        '# Migratie naar Flux 2.20.0',
        '',
        '## Analyse',
        '',
        analyse ?? 'FLUX-620 in 2.15.0: `<vl-functional-header title-label="x">` in plaats van title.',
        '',
        '## Verificatie',
        '',
        verificatie ?? 'pnpm run test:e2e: groen.',
        '',
    ].join('\n');
};
const options = { template, frontmatter: { bronversie: '2.12.1', resultaat: 'geslaagd' }, tickets: ['FLUX-620'] };

describe('reportProblems', () => {
    test('een volledig rapport, ook met HTML erin', () => {
        assert.deepEqual(reportProblems(report(), options), []);
    });

    test('een plaatshouder, een lege sectie, een andere waarde en een ontbrekend ticket', () => {
        const text = report({
            frontmatter: 'workflow: migreren\nbronversie: <x.y.z>\nresultaat: gedeeltelijk',
            analyse: '<Per wijziging de versie, de id en het ticket.>',
            verificatie: '',
        });
        assert.deepEqual(reportProblems(text, options), [
            "'bronversie' is nog de plaatshouder uit het sjabloon: <x.y.z>",
            "'bronversie' is '<x.y.z>', verwacht '2.12.1'.",
            "'resultaat' is 'gedeeltelijk', verwacht 'geslaagd'.",
            "De sectie 'Analyse' bevat nog een plaatshouder uit het sjabloon.",
            "De sectie 'Verificatie' is leeg.",
            'Het rapport noemt FLUX-620 niet.',
        ]);
    });

    test('zonder frontmatter of zonder sectie', () => {
        assert.deepEqual(reportProblems('# Geen frontmatter', options), ['Het rapport heeft geen frontmatter.']);
        const without = report().replace('## Verificatie', '## Iets anders');
        assert.ok(reportProblems(without, options).includes("De sectie 'Verificatie' ontbreekt."));
    });
});

describe('fileProblems en packageProblems', () => {
    test('wat er wel of niet in een bestand moet staan, en de versies in package.json', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-recept-'));
        fs.writeFileSync(path.join(dir, 'index.html'), '<vl-functional-header title-label="x"></vl-functional-header>');
        const files = [
            { file: 'index.html', present: 'title-label="x"', reason: 'FLUX-620' },
            { file: 'index.html', absent: 'title-label', reason: 'omgekeerd' },
            { file: 'ontbreekt.html', present: 'x', reason: 'een bestand' },
        ];
        assert.deepEqual(fileProblems(dir, files), [
            'index.html: omgekeerd; staat er nog: title-label',
            'ontbreekt.html ontbreekt (een bestand).',
        ]);
        fs.rmSync(dir, { recursive: true, force: true });
        const manifest = { dependencies: { '@domg-wc/components': '2.20.0', '@domg-wc/common': '^2.20.0' } };
        assert.deepEqual(packageProblems(manifest, { '@domg-wc/components': '2.20.0', '@domg-wc/common': '2.20.0' }), [
            "@domg-wc/common staat op '^2.20.0', verwacht exact 2.20.0.",
        ]);
    });
});

describe('leftoverProblems', () => {
    test('een nieuw bestand naast het rapport', () => {
        const status = ' M index.html\n?? .flux/rapporten/2026-10-01-migreren.md\n?? e2e/tijdelijk.spec.js\n';
        assert.deepEqual(leftoverProblems(status), [
            'Het recept liet een nieuw bestand achter: e2e/tijdelijk.spec.js.',
        ]);
    });
});

describe('modifiedProblems', () => {
    test('een gewijzigd, verwijderd of hernoemd bestand, niet het nieuwe rapport', () => {
        const status = ' M index.html\nD  src/oud.js\nR  a.js -> b.js\n?? .flux/rapporten/2026-10-02-valideren.md\n';
        assert.deepEqual(modifiedProblems(status), [
            'Het recept wijzigde index.html, maar mag geen code wijzigen.',
            'Het recept wijzigde src/oud.js, maar mag geen code wijzigen.',
            'Het recept wijzigde a.js -> b.js, maar mag geen code wijzigen.',
        ]);
    });

    test('met paden enkel die bestanden, zoals het afwijkingenrapport dat verbeteren leest', () => {
        const report = '.flux/rapporten/2026-10-02-valideren.md';
        assert.deepEqual(modifiedProblems(` M index.html\n M ${report}\n`, [report]), [
            `Het recept wijzigde ${report}, maar mag dat bestand niet wijzigen.`,
        ]);
        assert.deepEqual(modifiedProblems(' M index.html\n', [report]), []);
    });
});

// Een afwijking in het formaat van ADR-004 (sectie 6.4); 'fields' vervangt of schrapt velden.
const deviation = (id, title, fields = {}) => {
    const all = {
        regel: 'richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip',
        locatie: 'index.html:40',
        ernst: 'error',
        uitkomst: 'volgt-norm',
        norm: '—',
        vereist: '—',
        ...fields,
    };
    const lines = Object.entries(all)
        .filter(([, value]) => value != null)
        .map(([field, value]) => `- ${field}: ${value}`);
    return [`### ${id}: ${title}`, '', ...lines, '', 'Het veld heeft enkel een placeholder.', '', '- regel: geen veld'];
};
const deviationReport = (deviations, candidates = 'Geen.') =>
    [
        ...['---', 'workflow: valideren', '---', '', '## Afwijkingen', '', ...deviations.flat(), ''],
        ...['## Normkandidaten', '', candidates, '', '## Verificatie', '', 'git status: ongewijzigd.', ''],
    ].join('\n');

describe('deviationsOf', () => {
    test('de kop, de velden en enkel het eerste voorkomen van een veld', () => {
        const [found] = deviationsOf(deviationReport([deviation('A-001', 'het e-mailveld heeft geen label')]));
        assert.equal(found.id, 'A-001');
        assert.equal(found.title, 'het e-mailveld heeft geen label');
        assert.equal(found.fields.regel, 'richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip');
        assert.equal(found.fields.locatie, 'index.html:40');
    });

    test('het sjabloon van valideren heeft één voorbeeld met alle velden', () => {
        const template = fs.readFileSync(new URL('../server/templates/valideren.md', import.meta.url), 'utf-8');
        const [example, ...rest] = deviationsOf(template);
        assert.equal(rest.length, 0);
        assert.equal(example.id, 'A-001');
        assert.deepEqual(Object.keys(example.fields), ['regel', 'locatie', 'ernst', 'uitkomst', 'norm', 'vereist']);
    });
});

describe('answerReportOf en changedLinesOf', () => {
    test('het laatste blok ~~~markdown in een antwoord, met codeblokken erin', () => {
        const report = '---\nworkflow: review\n---\n\n```html\n<vl-button></vl-button>\n```';
        const answer = [
            ...['Een voorlopig blok:', '', '~~~markdown', 'oud', '~~~', ''],
            ...['Het rapport:', '', '~~~markdown', report, '~~~', '', 'Klaar.'],
        ].join('\n');
        assert.equal(answerReportOf(answer), `${report}\n`);
        assert.equal(answerReportOf('Geen rapport.'), null);
    });

    test('de toegevoegde en gewijzigde regels in de nieuwe versie, per bestand', () => {
        const patch = [
            'diff --git a/index.html b/index.html',
            '--- a/index.html',
            '+++ b/index.html',
            '@@ -2,3 +2,4 @@',
            ' <form>',
            '-<vl-alert closable="false">',
            '+<vl-alert icon="check" closable="false">',
            '+<vl-textarea></vl-textarea>',
            ' </form>',
            '@@ -10 +11 @@',
            '-<p>oud</p>',
            '+<p>nieuw</p>',
            '\\ No newline at end of file',
            'diff --git a/nieuw.js b/nieuw.js',
            '--- /dev/null',
            '+++ b/nieuw.js',
            '@@ -0,0 +1,2 @@',
            '+een',
            '+twee',
        ].join('\n');
        const changed = changedLinesOf(patch);
        assert.deepEqual([...changed['index.html']], [3, 4, 11]);
        assert.deepEqual([...changed['nieuw.js']], [1, 2]);
    });
});

describe('deviationProblems', () => {
    const expected = [
        { id: 'N4', regel: 'richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip', locaties: ['index.html:40'] },
        {
            id: 'N5',
            regel: 'patronen-formulier-cross-validatie',
            locaties: ['index.html:49-50', 'src/main.js:12-20'],
            norm: 'nieuw sinds 2.12.1',
            vereist: '2.19.0',
        },
    ];
    const forbidden = [{ reason: 'label mag', title: '\\blabel\\b', locaties: ['index.html:39'] }];
    const n5 = (fields = {}) =>
        deviation('A-002', 'eigen controle van de ophaaldatum', {
            regel: 'patronen-formulier-cross-validatie',
            locatie: 'src/main.js:14',
            uitkomst: 'normkandidaat',
            norm: 'nieuw sinds 2.12.1',
            vereist: 'migratie naar 2.19.0 of hoger (CrossValidationMixin, FLUX-610)',
            ...fields,
        });

    test('alle verwachte afwijkingen, een extra afwijking en een normkandidaat', () => {
        const text = deviationReport(
            [deviation('A-001', 'het e-mailveld heeft geen label'), n5(), deviation('A-003', 'iets anders', {})],
            '- A-002: de controle bij het indienen is eenvoudiger dan de mixin.',
        );
        assert.deepEqual(deviationProblems(text, { expected, forbidden }), []);
    });

    test('een gemiste afwijking, een verkeerde norm en een verboden afwijking', () => {
        const text = deviationReport(
            [deviation('A-001', 'het veld Naam heeft een label', { locatie: 'index.html:39' }), n5({ vereist: '—' })],
            '- A-002: eenvoudiger.',
        );
        assert.deepEqual(deviationProblems(text, { expected, forbidden }), [
            'N4 ontbreekt: richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip op index.html:40.',
            "N5 staat er als A-002, met norm 'nieuw sinds 2.12.1', vereist '—'; " +
                "verwacht norm 'nieuw sinds 2.12.1', vereist '2.19.0'.",
            'A-001 had er niet mogen staan: label mag.',
        ]);
    });

    test('met de diff: een afwijking buiten de gewijzigde regels', () => {
        const text = deviationReport([deviation('A-001', 'het e-mailveld heeft geen label')]);
        const changed = { 'index.html': new Set([41, 42]) };
        assert.deepEqual(deviationProblems(text, { changed }), ['A-001 staat op index.html:40, buiten de diff.']);
        assert.deepEqual(deviationProblems(text, { changed: { 'index.html': new Set([40]) } }), []);
    });

    test('het formaat: de kop, de velden, hun waarden en de sectie Normkandidaten', () => {
        const text = deviationReport(
            [
                deviation('A-001', 'zonder ernst', { ernst: null, locatie: 'index.html' }),
                deviation('A-001', 'dubbel', { uitkomst: 'later' }),
                deviation('Afwijking 3', 'geen id'),
                n5({ ernst: 'hoog' }),
            ],
            '- A-001: geen kandidaat.',
        );
        assert.deepEqual(deviationProblems(text, {}), [
            "A-001 mist '- ernst:'.",
            "A-001: de locatie 'index.html' is geen pad:regel.",
            'A-001 staat er twee keer.',
            "A-001: de uitkomst 'later' is geen volgt-norm, normkandidaat, te-beslissen.",
            "De kop '### Afwijking 3: geen id' is geen 'A-001: …'.",
            "A-002: de ernst 'hoog' is geen error, warning, info.",
            'A-002 is een normkandidaat, maar staat niet in de sectie Normkandidaten.',
            'A-001 staat in de sectie Normkandidaten, maar heeft geen uitkomst normkandidaat.',
        ]);
    });
});

// De verwachtingen voor de evaluatie van valideren, getoetst aan de echte catalogus en aan de toepassing in de fixture:
// zo verouderen ze niet stil als de fixture of de catalogus wijzigt.
// Voor review komt de pull request erbij: de patch op een kopie van de toepassing, zoals de evaluatie het doet.
for (const name of ['valideren.json', 'review.json']) describe(`server/test/fixtures/${name}`, () => {
    const fixtures = new URL('../server/test/fixtures/', import.meta.url);
    const config = JSON.parse(fs.readFileSync(new URL(name, fixtures), 'utf-8'));
    let app = new URL(`${config.app}/`, fixtures);
    const patch = config.pr ? fs.readFileSync(new URL(config.pr.patch, fixtures), 'utf-8') : null;
    if (patch) {
        const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-review-'));
        fs.cpSync(app, copy, { recursive: true });
        execFileSync('git', ['apply', fileURLToPath(new URL(config.pr.patch, fixtures))], { cwd: copy });
        app = pathToFileURL(`${copy}/`);
        after(() => fs.rmSync(copy, { recursive: true, force: true }));
    }
    const pinned = config.packages['@domg-wc/components'];
    const { normversie } = config.report.frontmatter;
    const docs = createDocs();
    const changes = docs.getDocsChanges(pinned, normversie);
    // Een regel is een pagina van de normversie, of anders een code van flux_check_markup.
    const pages = new Set(docs.listPages(normversie).pages.map((page) => page.id));
    const [onPages, onCodes] = [true, false].map((page) =>
        config.deviations.expected.filter(({ regel }) => pages.has(regel) === page),
    );
    const normOf = (id) => {
        if (changes.added.some((page) => page.id === id)) return `nieuw sinds ${pinned}`;
        if (changes.changed.some((page) => page.id === id)) return `gewijzigd sinds ${pinned}`;
        return '—';
    };
    const ranges = (locaties) =>
        locaties.map((location) => {
            const [, file, from, to] = /^(\S+):(\d+)(?:-(\d+))?$/.exec(location);
            return { file, from: Number(from), to: Number(to ?? from) };
        });

    test('elke locatie ligt in een bestand van de toepassing', () => {
        const all = [...config.deviations.expected, ...config.deviations.forbidden].flatMap(({ locaties = [] }) =>
            ranges(locaties),
        );
        for (const { file, from, to } of all) {
            const lines = fs.readFileSync(new URL(file, app), 'utf-8').split('\n').length;
            assert.ok(from >= 1 && from <= to && to <= lines, `${file}:${from}-${to} valt buiten ${lines} regels`);
        }
    });

    test('een pagina van de normversie heeft de norm die getDocsChanges geeft', () => {
        for (const want of onPages) assert.equal(want.norm, normOf(want.regel), `${want.id}: ${want.regel}`);
    });

    test('een code van flux_check_markup komt op die plek uit de gepinde versie', () => {
        const context = docs.markupContextOf(pinned);
        for (const want of onCodes) {
            const found = ranges(want.locaties).some(({ file, from, to }) =>
                checkMarkup(fs.readFileSync(new URL(file, app), 'utf-8'), { syntax: 'html', ...context }).some(
                    (finding) => finding.code === want.regel && finding.line >= from && finding.line <= to,
                ),
            );
            assert.ok(found, `${want.id}: ${want.regel} op ${want.locaties.join(', ')}`);
            assert.equal(want.norm, '—');
        }
    });

    if (patch) {
        test('de patch is nog toe te passen, en elke verwachte afwijking ligt in de diff', () => {
            const changed = changedLinesOf(patch);
            for (const want of config.deviations.expected) {
                const inDiff = ranges(want.locaties).some(({ file, from, to }) =>
                    [...(changed[file] ?? [])].some((line) => line >= from && line <= to),
                );
                assert.ok(inDiff, `${want.id} op ${want.locaties.join(', ')} ligt niet in de diff`);
            }
        });
    }
});

// Het afwijkingenrapport dat verbeteren als invoer krijgt: het rapport van een run van valideren, met de uitkomsten
// die het team in de review zette. Het formaat moet kloppen, en wat de evaluatie laat liggen, moet erin staan.
describe('server/test/fixtures/verbeteren.json', () => {
    const fixtures = new URL('../server/test/fixtures/', import.meta.url);
    const config = JSON.parse(fs.readFileSync(new URL('verbeteren.json', fixtures), 'utf-8'));
    const [[target, source]] = Object.entries(config.add);
    const text = fs.readFileSync(new URL(source, fixtures), 'utf-8');

    test('het rapport is een afwijkingenrapport in het formaat van ADR-004, en verbeteren leest het', () => {
        assert.deepEqual(deviationProblems(text, {}), []);
        assert.match(text, /^---\nworkflow: valideren\n/);
        assert.deepEqual(config.arguments, [target]);
        assert.deepEqual(config.unchanged, [target]);
    });

    test('elke uitkomst komt voor, en de evaluatie noemt elke afwijking', () => {
        const deviations = deviationsOf(text);
        const outcome = (id) => deviations.find((deviation) => deviation.id === id).fields;
        assert.deepEqual(config.report.tickets, deviations.map(({ id }) => id));
        for (const id of ['A-003', 'A-011', 'A-013', 'A-014']) assert.equal(outcome(id).uitkomst, 'te-beslissen');
        assert.equal(outcome('A-012').uitkomst, 'normkandidaat');
        assert.equal(outcome('A-018').uitkomst, 'volgt-norm');
        assert.equal(outcome('A-018').vereist, 'migratie naar 2.19.0 of hoger');
    });
});

// De evaluatie van uitbreiden vraagt een ticket aan de nagemaakte Jira: dat ticket moet in de fixture staan.
describe('server/test/fixtures/uitbreiden.json', () => {
    test('het ticket uit de argumenten staat in de tickets van de nagemaakte Jira', () => {
        const fixtures = new URL('../server/test/fixtures/', import.meta.url);
        const config = JSON.parse(fs.readFileSync(new URL('uitbreiden.json', fixtures), 'utf-8'));
        const tickets = JSON.parse(fs.readFileSync(new URL(config.jira, fixtures), 'utf-8'));
        assert.ok(tickets[config.arguments[0]], config.arguments[0]);
        assert.equal(config.report.frontmatter.ticket, config.arguments[0]);
    });
});
