import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { addedDocumentation, areaOf, bodyOf, commitFacts, MAX_ADDED_LINES, storybookPageOf, storybookUrl } from '../src/commits.mjs';

// Een stukje index.json van een Storybook, zoals changelog-commits het ophaalt.
const index = {
    entries: {
        'components-block-alert--documentatie': {
            type: 'docs',
            id: 'components-block-alert--documentatie',
            title: 'Components - Block/alert',
            importPath: '../../libs/components/src/block/alert/stories/vl-alert.stories.ts',
        },
        'components-block-alert--alert-default': {
            type: 'story',
            id: 'components-block-alert--alert-default',
            title: 'Components - Block/alert',
            importPath: '../../libs/components/src/block/alert/stories/vl-alert.stories.ts',
        },
        'patronen-formulier-cross-validatie--documentatie': {
            type: 'docs',
            id: 'patronen-formulier-cross-validatie--documentatie',
            title: 'Patronen/Formulier/cross-validatie',
            importPath: './docs/f_patronen/formulier/3b_cross-validatie/formulier-cross-validatie.mdx',
        },
        'patronen-formulier-cross-validatie--match': {
            type: 'story',
            id: 'patronen-formulier-cross-validatie--match',
            title: 'Patronen/Formulier/cross-validatie',
            importPath: './docs/f_patronen/formulier/3b_cross-validatie/formulier-cross-validatie.stories.ts',
        },
    },
};

describe('areaOf', () => {
    test('code en styling van de gepubliceerde packages', () => {
        assert.equal(areaOf('libs/components/src/block/alert/vl-alert.component.ts'), 'code');
        assert.equal(areaOf('libs/components/src/block/alert/vl-alert.model.ts'), 'code');
        assert.equal(areaOf('libs/common/src/util/sticky-scroll.ts'), 'code');
        assert.equal(areaOf('libs/components/src/block/alert/vl-alert.flux-css.ts'), 'styles');
        assert.equal(areaOf('libs/components/src/block/properties/vl-properties.raw.css'), 'styles');
        assert.equal(areaOf('libs/styles/src/vl-accessibility.ts'), 'styles');
    });

    test('testen, ook in de packages', () => {
        assert.equal(areaOf('libs/components/src/block/alert/vl-alert.component.cy.ts'), 'tests');
        assert.equal(areaOf('apps/storybook-e2e/src/e2e/components/block/breadcrumb/vl-breadcrumb.stories.cy.ts'), 'tests');
    });

    test('documentatie en Storybook', () => {
        assert.equal(areaOf('libs/components/src/block/alert/stories/vl-alert.stories-doc.mdx'), 'docs');
        assert.equal(areaOf('apps/storybook/docs/g_recepten/van-npm-naar-pnpm.mdx'), 'docs');
        assert.equal(areaOf('apps/storybook/resources/planning/planning-2026.png'), 'docs');
        assert.equal(areaOf('libs/components/src/block/alert/stories/vl-alert.stories-arg.ts'), 'storybook');
        assert.equal(areaOf('apps/storybook/.storybook/preview.ts'), 'storybook');
    });

    test('voorbeelden en tooling raken de packages niet', () => {
        assert.equal(areaOf('libs/integrations/src/form/cross-validation/vl-form-cross-validation.component.ts'), 'examples');
        assert.equal(areaOf('apps/playground-lit/src/app/app.component.ts'), 'examples');
        assert.equal(areaOf('package.json'), 'tooling');
        assert.equal(areaOf('resources/ci-jenkins/release/.releaserc-release'), 'tooling');
        assert.equal(areaOf('libs/components/project.json'), 'tooling');
    });
});

describe('bodyOf', () => {
    test('zonder onderwerp en trailers', () => {
        assert.equal(bodyOf('fix: onderwerp\n\nUitleg.\n\nCo-Authored-By: Iemand <x@y>\n'), 'Uitleg.');
        assert.equal(bodyOf('fix: onderwerp\n'), '');
    });

    test('harde regeleinden binnen een alinea verdwijnen, lijsten blijven', () => {
        const message = [
            'feat: onderwerp',
            '',
            'Een alinea die over',
            'twee regels loopt.',
            '',
            '- eerste item',
            '- tweede item dat',
            '  doorloopt',
        ].join('\n');
        assert.equal(bodyOf(message), 'Een alinea die over twee regels loopt.\n\n- eerste item\n- tweede item dat doorloopt');
    });
});

describe('addedDocumentation', () => {
    test('toegevoegde tekst zonder imports en JSX-blokken, niet-aansluitende delen gescheiden', () => {
        const diff = [
            'diff --git a/x.mdx b/x.mdx',
            '+++ b/x.mdx',
            '@@ -1,0 +1,4 @@',
            "+import { Meta } from '@storybook/addon-docs/blocks';",
            '+### Banner',
            '+',
            '+Een banner over de volle breedte.',
            '@@ -20,1 +24,2 @@',
            '-oude regel',
            '+<Canvas of={VlAlertStories.Banner} />',
            '+Nieuwe regel.',
        ].join('\n');
        assert.equal(addedDocumentation(diff), '### Banner\n\nEen banner over de volle breedte.\n\n[…]\n\nNieuwe regel.');
    });

    test('zonder toegevoegde tekst null', () => {
        assert.equal(addedDocumentation('@@ -1,1 +0,0 @@\n-weg'), null);
    });

    test('te veel tekst: enkel de titels', () => {
        const lines = Array.from({ length: MAX_ADDED_LINES + 1 }, (_, i) => (i === 0 ? '+## Titel' : `+regel ${i}`));
        assert.equal(addedDocumentation(['@@ -0,0 +1 @@', ...lines].join('\n')), `## Titel\n(${MAX_ADDED_LINES + 1} regels toegevoegd of gewijzigd; lees de pagina zelf)`);
    });
});

describe('storybookPageOf', () => {
    test('de documentatie en de args van een component staan op de docs-pagina van zijn stories', () => {
        for (const file of ['vl-alert.stories-doc.mdx', 'vl-alert.stories-arg.ts', 'vl-alert.stories.ts']) {
            assert.equal(storybookPageOf(`libs/components/src/block/alert/stories/${file}`, index).id, 'components-block-alert--documentatie');
        }
    });

    test('een losse MDX-pagina en de stories erbij', () => {
        const dir = 'apps/storybook/docs/f_patronen/formulier/3b_cross-validatie';
        assert.equal(storybookPageOf(`${dir}/formulier-cross-validatie.mdx`, index).id, 'patronen-formulier-cross-validatie--documentatie');
        assert.equal(storybookPageOf(`${dir}/formulier-cross-validatie.stories.ts`, index).id, 'patronen-formulier-cross-validatie--documentatie');
    });

    test('geen pagina voor code of een onbekend bestand', () => {
        assert.equal(storybookPageOf('libs/components/src/block/alert/vl-alert.component.ts', index), null);
        assert.equal(storybookPageOf('apps/storybook/docs/onbekend.mdx', index), null);
    });
});

describe('commitFacts', () => {
    test('soorten, gepubliceerde bestanden en Storybook-pagina met de toegevoegde documentatie', () => {
        const doc = 'libs/components/src/block/alert/stories/vl-alert.stories-doc.mdx';
        const facts = commitFacts({
            sha: 'a'.repeat(40),
            message: 'feat: FLUX-809 - vl-alert - banner variant\n',
            files: [
                { status: 'M', path: 'libs/components/src/block/alert/vl-alert.component.ts' },
                { status: 'M', path: 'libs/components/src/block/alert/vl-alert.flux-css.ts' },
                { status: 'M', path: doc },
                { status: 'M', path: 'libs/components/src/block/alert/vl-alert.component.cy.ts' },
            ],
            diffs: { [doc]: '@@ -1,0 +1,1 @@\n+### Banner' },
            index,
            version: '2.20.0',
        });
        assert.equal(facts.body, null);
        assert.equal(facts.published, true);
        assert.deepEqual(facts.areas, { code: 1, styles: 1, docs: 1, tests: 1 });
        assert.deepEqual(facts.publishedFiles, [
            'libs/components/src/block/alert/vl-alert.component.ts',
            'libs/components/src/block/alert/vl-alert.flux-css.ts',
        ]);
        assert.deepEqual(facts.storybook, [
            {
                id: 'components-block-alert--documentatie',
                title: 'Components - Block/alert',
                url: storybookUrl('2.20.0', 'components-block-alert--documentatie'),
                added: '### Banner',
            },
        ]);
        assert.equal(facts.storybook[0].url, 'https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-block-alert--documentatie');
    });

    test('een commit enkel aan tooling raakt de packages niet', () => {
        const facts = commitFacts({
            sha: 'b'.repeat(40),
            message: 'feat: FLUX-708 - migratie van npm naar pnpm\n\nUitleg.',
            files: [{ status: 'M', path: 'package.json' }, { status: 'D', path: 'package-lock.json' }],
            diffs: {},
            index,
            version: '2.20.0',
        });
        assert.equal(facts.published, false);
        assert.deepEqual(facts.areas, { tooling: 2 });
        assert.equal(facts.body, 'Uitleg.');
    });
});
