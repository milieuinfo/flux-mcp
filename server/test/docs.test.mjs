import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { CATALOG_DIR, CatalogError } from '../src/catalog.mjs';
import { buildReleaseFiles, writeReleaseFiles } from '../src/changelog.mjs';
import { createDocs, mainElement, statusOf } from '../src/docs.mjs';
import { checkStorybook } from '../src/storybook.mjs';

// Een kopie van de echte catalogus voor 2.19.0 en 2.20.0: de Storybook, de web-types en de bronnen van de changelog,
// met vers gebouwde bestanden. De analyse van vl-button schrijft de test zelf, zodat ze niet afhangt van een run
// van Claude Code.
const SOURCES = [
    'web-types',
    'storybook',
    'packages',
    'changelog-analysis',
    'changelog/changelog.md',
    'changelog/commits.json',
];
const VERSIONS = ['2.19.0', '2.20.0'];
const STORYBOOK = (version) => `https://flux.omgeving.vlaanderen.be/release-v2/${version}/storybook/`;
const GHOST = 'components-atom-button--button-icon-only-ghost';
let dir;
let docs;
let button;

before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-docs-'));
    for (const version of VERSIONS) {
        for (const part of SOURCES) {
            fs.cpSync(path.join(CATALOG_DIR, version, part), path.join(dir, version, part), { recursive: true });
        }
        writeReleaseFiles(dir, version, buildReleaseFiles(dir, version).files);
    }
    const index = JSON.parse(fs.readFileSync(path.join(dir, '2.20.0', 'storybook', 'index.json'), 'utf-8'));
    button = index.pages.find((page) => page.id === 'components-atom-button');
    const example = { html: '<vl-button>Klik op mij</vl-button>' };
    const examples = Object.fromEntries(button.stories.map((story) => [story.id, example]));
    examples[GHOST] = { html: '<vl-button icon="trash" label="Verwijder" ghost></vl-button>' };
    const analysis = {
        schema: 1,
        page: button.id,
        inputHash: button.inputHash,
        analysedFor: '2.20.0',
        summary: 'Knop voor een actie op de pagina.',
        keywords: ['knop', 'drukknop', 'button'],
        examples,
        notes: [],
    };
    fs.mkdirSync(path.join(dir, 'storybook-analysis', button.id), { recursive: true });
    const file = path.join(dir, 'storybook-analysis', button.id, `${button.inputHash}.json`);
    fs.writeFileSync(file, JSON.stringify(analysis));
    docs = createDocs(dir);
});

after(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('listDocVersions', () => {
    test('nieuwste eerst, met het aantal pagina\'s en analyses', () => {
        const versions = docs.listDocVersions();
        assert.deepEqual(versions.map((v) => [v.version, v.storybook, v.pages]), [
            ['2.20.0', '9.1.5', 233],
            ['2.19.0', '9.1.5', 231],
        ]);
        assert.equal(versions[0].analysed, 1);
    });
});

describe('listPages', () => {
    test('zonder de pagina\'s van het Flux-team, tenzij gevraagd', () => {
        const all = docs.listPages('2.20.0');
        assert.equal(all.hiddenFluxTeam, 11);
        assert.equal(all.pages.some((page) => page.kind === 'flux-team'), false);
        assert.equal(docs.listPages('2.20.0', { includeFluxTeam: true }).pages.length, 233);
    });

    test('per soort en per element, zonder versie de nieuwste', () => {
        const recipes = docs.listPages(null, { kind: 'recipe' });
        assert.equal(recipes.version, '2.20.0');
        assert.ok(recipes.pages.some((page) => page.id === 'recepten-van-npm-naar-pnpm'));
        const { pages } = docs.listPages('2.20.0', { element: 'button' });
        assert.deepEqual(pages.map((page) => page.id), ['components-atom-button']);
    });

    test('een onbekende soort of versie geeft een CatalogError', () => {
        assert.throws(() => docs.listPages('2.20.0', { kind: 'onbekend' }), CatalogError);
        assert.throws(() => docs.listPages('2.18.0'), /Beschikbaar: 2\.20\.0, 2\.19\.0/);
    });
});

describe('getPage', () => {
    test('een pagina met haar voorbeelden, de API en absolute links', () => {
        const page = docs.getPage('2.20.0', 'vl-button');
        assert.equal(page.id, 'components-atom-button');
        assert.equal(page.analysis, 'available');
        assert.equal(page.summary, 'Knop voor een actie op de pagina.');
        assert.ok(page.markdown.includes('```html\n<vl-button icon="trash" label="Verwijder" ghost></vl-button>\n```'));
        assert.ok(page.markdown.includes('**API van `vl-button`**'));
        const inputGroup = 'components-form-input-group--documentatie';
        assert.ok(page.markdown.includes(`${STORYBOOK('2.20.0')}?path=/docs/${inputGroup}`));
        assert.ok(!page.markdown.includes('> Story:'));
    });

    test('een pagina met dezelfde inhoud in een andere versie gebruikt dezelfde analyse', () => {
        const page = docs.getPage('2.19.0', 'button');
        assert.equal(page.analysis, 'available');
        assert.ok(page.markdown.includes(`${STORYBOOK('2.19.0')}?path=/story/${GHOST}`));
        assert.ok(page.markdown.includes('<vl-button icon="trash" label="Verwijder" ghost></vl-button>'));
    });

    test('een pagina zonder analyse toont de naam en de link van elke story', () => {
        const page = docs.getPage('2.20.0', 'alert');
        assert.equal(page.analysis, 'missing');
        const storybook = STORYBOOK('2.20.0').replace(/[.?/]/g, '\\$&');
        const link = `\\(\\[Storybook\\]\\(${storybook}\\?path=/story/components-block-alert--`;
        const story = new RegExp(`\\*\\*vl-alert[^*]*\\*\\* ${link}`);
        assert.match(page.markdown, story);
    });

    test('een afbeelding linkt naar het bestand op de tag, een HTML-link naar de Storybook van die versie', () => {
        const recipe = docs.getPage('2.20.0', 'recepten-typing-bestanden').markdown;
        const tag = 'https://github.com/milieuinfo/flux-web-components/raw/v2.20.0';
        assert.ok(recipe.includes(`](${tag}/apps/storybook/resources/afnemen/autocomplete.png)`));
        const share = docs.getPage('2.20.0', 'components-block-share-buttons-share-button');
        const buttons = 'components-block-share-buttons-share-buttons--documentatie';
        const link = `${STORYBOOK('2.20.0')}?path=/docs/${buttons}#ontwerp`;
        assert.ok(share.markdown.includes(`href="${link}"`));
        assert.deepEqual(share.links, ['components-block-share-buttons-share-buttons']);
    });

    test('op id, element, Storybook-link, of met de kandidaten als het niet eenduidig is', () => {
        assert.equal(docs.getPage('2.20.0', 'afnemen-aan-de-slag').id, 'afnemen-aan-de-slag');
        const link = 'https://x/?path=/docs/afnemen-aan-de-slag--documentatie';
        assert.equal(docs.getPage('2.20.0', link).id, 'afnemen-aan-de-slag');
        assert.equal(docs.getPage('2.20.0', 'text').id, 'components-atom-text');
        assert.throws(
            () => docs.getPage('2.20.0', 'onbestaand'),
            (error) => /Geen pagina 'onbestaand'/.test(error.message) && error.details.suggest === 'search',
        );
    });
});

describe('getComponent', () => {
    test('de API, de voorbeelden per story, de status en de historiek', () => {
        const component = docs.getComponent('2.20.0', 'button');
        assert.equal(component.element, 'vl-button');
        assert.equal(component.page, 'components-atom-button');
        assert.ok(component.api.attributes.some((attribute) => attribute.name === 'cta-link'));
        const ghost = component.examples.find((example) => example.id === GHOST);
        assert.equal(ghost.html, '<vl-button icon="trash" label="Verwijder" ghost></vl-button>');
        assert.equal(component.status.condition.wcag, 'reviewed');
        assert.equal(component.changes.component, 'vl-button');
    });

    test('zonder analyse zijn de voorbeelden leeg, maar staan de stories er', () => {
        const component = docs.getComponent('2.20.0', 'vl-alert');
        assert.equal(component.analysis, 'missing');
        assert.ok(component.examples.length > 0);
        assert.equal(component.examples[0].html, null);
    });

    test('een element dat niet in de web-types staat', () => {
        const unknown = /staat niet in de web-types van Flux 2\.20\.0/;
        assert.throws(() => docs.getComponent('2.20.0', 'vl-onbestaand'), unknown);
        assert.throws(
            () => docs.getComponent('2.20.0', 'vl-onbestaand'),
            (error) => error.details.code === 'unknown-element' && error.details.element === 'vl-onbestaand',
        );
    });

    test('met een Storybook-id of -link: het hoofdelement van de pagina, de andere in related', () => {
        assert.equal(docs.getComponent('2.20.0', 'components-atom-button').element, 'vl-button');
        const link = 'https://x/?path=/story/components-block-next-tabs--tabs-default';
        const tabs = docs.getComponent('2.20.0', link);
        assert.equal(tabs.element, 'vl-tabs-next');
        assert.deepEqual(tabs.related.elements, ['vl-tab-link-next', 'vl-tab-next', 'vl-tab-panel-next']);
        assert.equal(docs.getComponent('2.20.0', 'components-block-tabs-tabs').element, 'vl-tabs');
    });

    test('een pagina zonder element zegt dat', () => {
        assert.throws(
            () => docs.getComponent('2.20.0', 'components-atom-button-style'),
            /components-atom-button-style toont geen element/,
        );
    });
});

describe('mainElement', () => {
    const page = (id, elements) => ({ id, elements });

    test('het element dat het langste einde van de id vormt, zonder vl-, map- en -next', () => {
        const radio = page('components-form-radio-group', ['vl-radio', 'vl-radio-group']);
        assert.equal(mainElement(radio), 'vl-radio-group');
        const items = ['vl-map-side-sheet-menu', 'vl-map-side-sheet-menu-item'];
        const menu = page('map-side-sheet-side-sheet-menu-item', items);
        assert.equal(mainElement(menu), 'vl-map-side-sheet-menu-item');
        assert.equal(mainElement(page('components-block-x', ['vl-y'])), 'vl-y');
        assert.equal(mainElement(page('components-block-x', ['vl-y', 'vl-z'])), null);
    });
});

describe('statusOf', () => {
    test('deprecated, next, internal of stable; legacy is stable', () => {
        const generation = (value) => ({ title: 'Components/x', status: { condition: { generation: value } } });
        assert.equal(statusOf({ element: { deprecated: true }, page: generation('v2') }), 'deprecated');
        assert.equal(statusOf({ element: {}, page: generation('v3-next') }), 'next');
        assert.equal(statusOf({ page: { title: 'Components - Atom/button-style (intern)' } }), 'internal');
        assert.equal(statusOf({ element: {}, page: generation('legacy') }), 'stable');
        assert.equal(statusOf({ element: {} }), 'stable');
    });
});

describe('listPages met appliesTo', () => {
    test('de pagina\'s die een element noemen, als heel woord', () => {
        const { pages } = docs.listPages('2.20.0', { appliesTo: 'vl-input-field', kind: 'pattern' });
        assert.ok(pages.length > 0);
        assert.ok(pages.every((page) => page.kind === 'pattern'));
        const tab = docs.listPages('2.20.0', { appliesTo: 'vl-tab' }).pages.map((page) => page.id);
        assert.ok(!tab.includes('components-block-next-tabs'), 'vl-tab-next is geen vermelding van vl-tab');
    });

    test('een element dat niet in de web-types staat, is een fout', () => {
        assert.throws(
            () => docs.listPages('2.20.0', { appliesTo: 'vl-onbestaand' }),
            (error) => error.details.code === 'unknown-element',
        );
    });
});

describe('searchDocs', () => {
    test('zoekt ook in de zoektermen van de analyse', () => {
        assert.equal(docs.searchDocs('drukknop', { version: '2.20.0' }).results[0].id, 'components-atom-button');
    });

    test('vindt de patronen voor formuliervalidatie, met een passage', () => {
        const { results } = docs.searchDocs('formulier validatie', { version: '2.20.0' });
        const hit = results.find((result) => result.id === 'patronen-formulier-validatie');
        assert.ok(hit);
        assert.ok(hit.passage);
    });

    test('een lege zoekvraag geeft een CatalogError', () => {
        assert.throws(() => docs.searchDocs('  '), CatalogError);
    });
});

describe('getDocsChanges', () => {
    test('de pagina\'s die bijkwamen en wijzigden tussen 2.19.0 en 2.20.0', () => {
        const changes = docs.getDocsChanges('2.19.0', '2.20.0');
        const added = changes.added.map((page) => page.id).sort();
        assert.deepEqual(added, ['planning-flux-ai-frontend-uniformisering', 'recepten-van-npm-naar-pnpm']);
        assert.deepEqual(changes.removed, []);
        assert.ok(changes.changed.some((page) => page.id === 'components-block-alert'));
        assert.ok(changes.changed.some((page) => page.id === 'components-block-breadcrumb'));
        assert.ok(!changes.changed.some((page) => page.id === 'components-atom-button'));
        assert.equal(changes.hiddenFluxTeam, 6);
        const all = docs.getDocsChanges('2.19.0', '2.20.0', { includeFluxTeam: true });
        assert.equal(all.changed.length, changes.changed.length + 6);
    });

    test('van een nieuwere naar een oudere versie is geen upgrade', () => {
        assert.throws(() => docs.getDocsChanges('2.20.0', '2.19.0'), /geen upgrade/);
    });
});

describe('de catalogus', () => {
    test('de analyse van de test klopt, en storybook:check vindt niets in de echte catalogus', () => {
        assert.deepEqual(checkStorybook(dir).errors, []);
        assert.deepEqual(checkStorybook(CATALOG_DIR).errors, []);
    });
});
