import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, test } from 'node:test';
import {
    fileProblems,
    leftoverProblems,
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
