import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import {
    buildStorybook,
    checkStorybook,
    discardAnalyses,
    kindOf,
    normalizeLinks,
    renderPage,
    storybookFiles,
    storyIdPart,
    validateAnalysis,
} from '../src/storybook.mjs';

// Een kleine bronrepo: een component met een eigen pagina, een component met het sjabloon, een losse MDX-pagina en
// de changelog. 'changes' vervangt of voegt bestanden toe.
const COMPONENT = 'libs/components/src/atom/knop/stories';
const FILES = {
    'package.json': JSON.stringify({ devDependencies: { storybook: '9.1.5' } }),
    'apps/storybook/.storybook/flux-meta-data/json/components-atom.meta-data.json': JSON.stringify({
        'components-atom-knop': {
            name: 'knop',
            docs: 'components-atom-knop--documentatie',
            condition: { generation: 'v2', wcag: 'reviewed' },
        },
    }),
    'apps/storybook/docs/1_changelog.mdx':
        "import { Meta } from '@storybook/addon-docs/blocks';\n\n<Meta title=\"Changelog\"/>\n\n# Changelog\n",
    'apps/storybook/docs/a_afnemen/1_aan-de-slag.mdx':
        "import { Meta } from '@storybook/addon-docs/blocks';\n\n" +
        '<Meta title="Afnemen/Aan De Slag"/>\n\n# Aan De Slag\n\n' +
        'Zie [knop](/docs/components-atom-knop--documentatie).\n',
    [`${COMPONENT}/vl-knop.stories.ts`]: [
        "import { html } from 'lit';",
        "import { knopArgs } from './vl-knop.stories-arg';",
        "import knopDoc from './vl-knop.stories-doc.mdx';",
        '',
        "export default { id: 'components-atom-knop', parameters: { docs: { page: knopDoc } } };",
        'export const KnopPrimary = () => html`<vl-knop>Klik</vl-knop>`;',
        'export const KnopXSmall = () => html`<vl-knop ghost>Klik</vl-knop>`;',
        '',
    ].join('\n'),
    [`${COMPONENT}/vl-knop.stories-arg.ts`]: 'export const knopArgs = { ghost: false };\n',
    [`${COMPONENT}/voorbeeld.ts`]: "import { html } from 'lit';\nexport const x = html`<vl-knop ghost></vl-knop>`;\n",
    [`${COMPONENT}/vl-knop.stories-doc.mdx`]: [
        "import { ArgTypes, Canvas, Source } from '@storybook/addon-docs/blocks';",
        "import * as KnopStories from './vl-knop.stories';",
        "import voorbeeld from './voorbeeld.ts?raw';",
        '',
        '# Knop',
        '',
        '<FluxComponentMetaData id="components-atom-knop" />',
        '',
        'Gebruik de knop voor een actie. Zie [aan de slag](/docs/afnemen-aan-de-slag--documentatie).',
        '',
        '```js',
        "import { VlKnop } from '@domg-wc/components/atom';",
        '```',
        '',
        '<Canvas of={KnopStories.KnopPrimary} />',
        '',
        '<ArgTypes of={KnopStories.KnopPrimary} />',
        '',
        '<FluxAlert type="warning">',
        '{`',
        '    Let op de focus.',
        '`}',
        '</FluxAlert>',
        '',
        '<Source code={voorbeeld} language="ts" />',
        '',
        '<Canvas of={KnopStories.KnopXSmall} />',
        '',
    ].join('\n'),
    'libs/components/src/atom/sjabloon/stories/vl-sjabloon.stories.ts':
        "export default { id: 'components-atom-sjabloon' };\nexport const SjabloonDefault = {};\n",
};

const KNOP = `../../${COMPONENT}/vl-knop.stories.ts`;
const SJABLOON = '../../libs/components/src/atom/sjabloon/stories/vl-sjabloon.stories.ts';
const AAN_DE_SLAG = './docs/a_afnemen/1_aan-de-slag.mdx';
const SJABLOON_TITLE = 'Components - Atom/sjabloon';
const INDEX = {
    v: 5,
    entries: Object.fromEntries(
        [
            ['changelog--documentatie', 'docs', 'Changelog', 'documentatie', './docs/1_changelog.mdx'],
            ['afnemen-aan-de-slag--documentatie', 'docs', 'Afnemen/Aan De Slag', 'documentatie', AAN_DE_SLAG],
            ['components-atom-knop--documentatie', 'docs', 'Components - Atom/knop', 'documentatie', KNOP],
            ['components-atom-knop--knop-primary', 'story', 'Components - Atom/knop', 'vl-knop - primary', KNOP],
            ['components-atom-knop--knop-x-small', 'story', 'Components - Atom/knop', 'vl-knop - x small', KNOP],
            ['components-atom-sjabloon--documentatie', 'docs', SJABLOON_TITLE, 'documentatie', SJABLOON],
            ['components-atom-sjabloon--sjabloon-default', 'story', SJABLOON_TITLE, 'vl-sjabloon', SJABLOON],
        ].map(([id, type, title, name, importPath]) => [id, { id, type, title, name, importPath }]),
    ),
};

const BASE = 'https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/';
const docUrl = (id) => `${BASE}?path=/docs/${id}--documentatie`;
function webTypes({ ghostDefault = 'false', description = 'Zonder opmaak.' } = {}) {
    const element = (name, text, page, attributes) => ({
        name,
        description: text,
        'doc-url': docUrl(page),
        attributes,
    });
    return new Map([
        [
            'vl-knop',
            {
                category: 'atom',
                element: element('vl-knop', 'Een knop.', 'components-atom-knop', [
                    { name: 'ghost', description, default: ghostDefault },
                ]),
            },
        ],
        [
            'vl-sjabloon',
            { category: 'atom', element: element('vl-sjabloon', 'Een sjabloon.', 'components-atom-sjabloon', []) },
        ],
    ]);
}

function repo(changes = {}) {
    const files = { ...FILES, ...changes };
    return {
        read: (file) => files[file] ?? null,
        list: (dir) => Object.keys(files).filter((file) => file.startsWith(`${dir}/`)).sort(),
    };
}

const build = (changes, options) =>
    buildStorybook({ index: INDEX, repo: repo(changes), webTypes: webTypes(options), version: '2.20.0' });
const pageOf = (built, id) => ({
    ...built.index.pages.find((page) => page.id === id),
    markdown: built.pages.find((page) => page.id === id)?.markdown,
});

describe('buildStorybook', () => {
    const built = build();

    test('een pagina per docs-pagina uit index.json, zonder de changelog', () => {
        assert.deepEqual(built.errors, []);
        assert.deepEqual(built.index.pages.map((page) => [page.id, page.kind]), [
            ['afnemen-aan-de-slag', 'guide'],
            ['components-atom-knop', 'component'],
            ['components-atom-sjabloon', 'component'],
        ]);
        const skipped = { id: 'changelog', title: 'Changelog', reason: 'de changelog staat in changelog/' };
        assert.deepEqual(built.index.skipped, [skipped]);
        assert.equal(built.index.storybook, '9.1.5');
    });

    test('een componentpagina: stories, API, waarschuwing, code en relatieve links', () => {
        const { markdown } = pageOf(built, 'components-atom-knop');
        assert.equal(
            markdown,
            [
                '# Knop',
                '',
                'Gebruik de knop voor een actie. Zie [aan de slag](/?path=/docs/afnemen-aan-de-slag--documentatie).',
                '',
                '```js',
                "import { VlKnop } from '@domg-wc/components/atom';",
                '```',
                '',
                '> Story: [vl-knop - primary](/?path=/story/components-atom-knop--knop-primary)',
                '',
                '> API: vl-knop',
                '',
                '> [!WARNING]',
                '> **Opgelet**',
                '> Let op de focus.',
                '',
                '```ts',
                "import { html } from 'lit';",
                'export const x = html`<vl-knop ghost></vl-knop>`;',
                '```',
                '',
                '> Story: [vl-knop - x small](/?path=/story/components-atom-knop--knop-x-small)',
                '',
            ].join('\n'),
        );
    });

    test('de gegevens van een pagina in index.json', () => {
        const page = pageOf(built, 'components-atom-knop');
        assert.deepEqual(page.elements, ['vl-knop']);
        assert.deepEqual(page.status, { condition: { generation: 'v2', wcag: 'reviewed' } });
        assert.deepEqual(page.links, ['afnemen-aan-de-slag']);
        const stories = ['components-atom-knop--knop-primary', 'components-atom-knop--knop-x-small'];
        assert.deepEqual(page.stories.map((story) => story.id), stories);
        assert.deepEqual(page.sources, [
            `${COMPONENT}/vl-knop.stories-arg.ts`,
            `${COMPONENT}/vl-knop.stories-doc.mdx`,
            `${COMPONENT}/vl-knop.stories.ts`,
            `${COMPONENT}/voorbeeld.ts`,
        ]);
        assert.match(page.inputHash, /^[0-9a-f]{12}$/);
    });

    test('een pagina zonder eigen MDX volgt het sjabloon', () => {
        assert.equal(
            pageOf(built, 'components-atom-sjabloon').markdown,
            '# Sjabloon\n\nEen sjabloon.\n\n## Voorbeeld\n\n' +
                '> Story: [vl-sjabloon](/?path=/story/components-atom-sjabloon--sjabloon-default)\n\n' +
                '## Configuratie\n\n> API: vl-sjabloon\n',
        );
    });

    test('een onbekend blok laat de pagina falen, met het bestand', () => {
        const failed = build({ [`${COMPONENT}/vl-knop.stories-doc.mdx`]: '# Knop\n\n<Nieuw />\n' });
        assert.deepEqual(failed.errors, [`${COMPONENT}/vl-knop.stories-doc.mdx: onbekend blok <Nieuw>.`]);
        assert.equal(failed.index.pages.some((page) => page.id === 'components-atom-knop'), false);
    });

    test('een afbeelding uit een import wordt haar pad in de bronrepo', () => {
        const mdx = "import schema from './schema.png';\n\n# Knop\n\n<img src={schema} alt=\"Schema\" />\n";
        const built = build({ [`${COMPONENT}/vl-knop.stories-doc.mdx`]: mdx, [`${COMPONENT}/schema.png`]: 'png' });
        assert.deepEqual(built.errors, []);
        assert.equal(pageOf(built, 'components-atom-knop').markdown, `# Knop\n\n![Schema](/${COMPONENT}/schema.png)\n`);
    });

    test('een story die niet in index.json staat, laat de pagina falen', () => {
        const mdx = "import * as S from './vl-knop.stories';\n\n<Canvas of={S.Bestaat} />\n";
        const failed = build({ [`${COMPONENT}/vl-knop.stories-doc.mdx`]: mdx });
        assert.match(failed.errors[0], /story S\.Bestaat staat niet in index\.json/);
    });

    test('het overzicht van de componenten linkt enkel naar een pagina als de metadata docs heeft', () => {
        const meta = 'apps/storybook/.storybook/flux-meta-data/json/components-atom.meta-data.json';
        const built = build({
            [meta]: JSON.stringify({
                'components-atom-knop': {
                    name: 'knop',
                    docs: 'components-atom-knop--documentatie',
                    condition: { generation: 'v2' },
                },
                'map-actions-select': { name: 'select action', condition: { generation: 'v2' } },
            }),
            'apps/storybook/docs/a_afnemen/1_aan-de-slag.mdx':
                "import { Meta } from '@storybook/addon-docs/blocks';\n\n" +
                '<Meta title="Afnemen/Aan De Slag"/>\n\n<FluxComponentOverview />\n',
        });
        const { markdown } = pageOf(built, 'afnemen-aan-de-slag');
        const rows = markdown.split('\n').filter((line) => /^\| (\[knop|select)/.test(line));
        assert.deepEqual(rows.map((row) => row.split(' | ')[0]), [
            '| [knop](/?path=/docs/components-atom-knop--documentatie)',
            '| select action',
        ]);
    });

    test('de docs-pagina in de korte vorm docs: { page }', () => {
        const stories = FILES[`${COMPONENT}/vl-knop.stories.ts`]
            .replace("import knopDoc from", 'import page from')
            .replace('docs: { page: knopDoc }', 'docs: { page }');
        const short = pageOf(build({ [`${COMPONENT}/vl-knop.stories.ts`]: stories }), 'components-atom-knop');
        const full = pageOf(built, 'components-atom-knop');
        assert.equal(short.markdown, full.markdown);
        assert.ok(short.sources.includes(`${COMPONENT}/vl-knop.stories-doc.mdx`));
    });
});

describe('voorbeeldcomponenten uit libs/integrations', () => {
    // Een story die een voorbeeldcomponent rendert via een alias uit tsconfig.base.json, zoals de patronen.
    const INTEGRATION = 'libs/integrations/src/voorbeeld';
    const changes = (component = 'export const html = `<vl-knop ghost></vl-knop>`;\n') => ({
        'tsconfig.base.json': JSON.stringify({
            compilerOptions: { paths: { '@domg-wc/integrations/voorbeeld': [`${INTEGRATION}/index.ts`] } },
        }),
        [`${COMPONENT}/vl-knop.stories.ts`]: FILES[`${COMPONENT}/vl-knop.stories.ts`].replace(
            "import { html } from 'lit';",
            "import { html } from 'lit';\nimport { VlVoorbeeld } from '@domg-wc/integrations/voorbeeld';",
        ),
        [`${INTEGRATION}/index.ts`]: "export * from './voorbeeld.component';\n",
        [`${INTEGRATION}/voorbeeld.component.ts`]: component,
    });
    const page = (component) => pageOf(build(changes(component)), 'components-atom-knop');

    test('de code van de voorbeeldcomponent hoort bij de bronnen van de pagina', () => {
        assert.deepEqual(
            page().sources.filter((file) => file.startsWith('libs/integrations/')),
            [`${INTEGRATION}/index.ts`, `${INTEGRATION}/voorbeeld.component.ts`],
        );
    });

    test('een andere voorbeeldcomponent geeft een andere hash', () => {
        assert.notEqual(page('export const html = `<vl-knop></vl-knop>`;\n').inputHash, page().inputHash);
    });

    test('zonder tsconfig.base.json volgt de hash de alias niet', () => {
        const { 'tsconfig.base.json': _tsconfig, ...rest } = changes();
        const without = pageOf(build(rest), 'components-atom-knop');
        assert.equal(without.sources.some((file) => file.startsWith('libs/integrations/')), false);
    });
});

describe('inputHash', () => {
    const hash = (changes, options) => pageOf(build(changes, options), 'components-atom-knop').inputHash;
    const base = hash();
    const doc = `${COMPONENT}/vl-knop.stories-doc.mdx`;

    test('een nieuwe import of andere inspringing telt niet', () => {
        const file = `${COMPONENT}/vl-knop.stories.ts`;
        const meta = "import { Meta } from '@storybook/blocks';\nimport * as KnopStories";
        const mdx = FILES[doc].replace('import * as KnopStories', meta);
        const stories = FILES[file].replace('export const KnopPrimary', '\n\n    export const KnopPrimary');
        assert.equal(hash({ [doc]: mdx, [file]: stories }), base);
    });

    test('een andere tekst telt wel', () => {
        assert.notEqual(hash({ [doc]: FILES[doc].replace('een actie', 'een handeling') }), base);
    });

    test('een import in een codeblok is inhoud', () => {
        assert.notEqual(hash({ [doc]: FILES[doc].replace('components/atom', 'components/block') }), base);
    });

    test('de imports van een bestand dat de pagina toont, zijn inhoud', () => {
        const shown = `${COMPONENT}/voorbeeld.ts`;
        assert.notEqual(hash({ [shown]: FILES[shown].replace("from 'lit'", "from 'lit-html'") }), base);
    });

    test('het contract in de web-types telt, de beschrijving niet', () => {
        assert.notEqual(hash({}, { ghostDefault: 'true' }), base);
        assert.equal(hash({}, { description: 'Een andere beschrijving.' }), base);
    });

    // De hash van de knop met 'changes', en vl-icon in de web-types met 'attributes' (zonder: niet in de web-types).
    // vl-icon heeft een eigen pagina, maar niet deze.
    const icon = (attributes) => ({ category: 'atom', element: { name: 'vl-icon', attributes } });
    const hashWithIcon = (changes, attributes) =>
        pageOf(
            buildStorybook({
                index: INDEX,
                repo: repo(changes),
                webTypes: new Map([
                    ...webTypes(),
                    ...(attributes ? [['vl-icon', icon(attributes)]] : []),
                ]),
                version: '2.20.0',
            }),
            'components-atom-knop',
        ).inputHash;
    const iconOnly = [{ name: 'icon', default: 'x' }];

    test('van een ander element in de stories tellen enkel de namen van zijn attributen', () => {
        const stories = `${COMPONENT}/vl-knop.stories.ts`;
        const withIcon = {
            [stories]: FILES[stories].replace(
                '<vl-knop>Klik</vl-knop>',
                '<vl-knop><vl-icon icon="x"></vl-icon></vl-knop>',
            ),
        };
        assert.notEqual(hashWithIcon(withIcon, iconOnly), hashWithIcon(withIcon), 'het element komt in de web-types');
        assert.notEqual(hashWithIcon(withIcon, [...iconOnly, { name: 'small' }]), hashWithIcon(withIcon, iconOnly));
        const otherDefault = [{ name: 'icon', default: 'y', description: 'Een andere beschrijving.' }];
        assert.equal(hashWithIcon(withIcon, otherDefault), hashWithIcon(withIcon, iconOnly), 'default en beschrijving');
    });

    test('een element dat enkel in de MDX staat, telt niet mee', () => {
        const mdx = { [doc]: FILES[doc].replace('```js', '```html\n<vl-icon></vl-icon>\n```\n\n```js') };
        assert.equal(hashWithIcon(mdx, iconOnly), hashWithIcon(mdx));
    });

    test('de metadata telt niet', () => {
        const meta = 'apps/storybook/.storybook/flux-meta-data/json/components-atom.meta-data.json';
        assert.equal(hash({ [meta]: FILES[meta].replace('reviewed', 'FLUX-1') }), base);
    });
});

describe('id\'s en soorten', () => {
    test('storyIdPart doet wat Storybook met de naam van een export doet', () => {
        const cases = {
            ButtonIconOnlyGhost: 'button-icon-only-ghost',
            SpacerXSmall: 'spacer-x-small',
            HTMLElement: 'html-element',
            Grid2Col: 'grid-2-col',
        };
        for (const [name, id] of Object.entries(cases)) assert.equal(storyIdPart(name), id);
    });

    test('kindOf volgt het eerste deel van de titel', () => {
        assert.equal(kindOf('Components - Block/alert'), 'component');
        assert.equal(kindOf('map/actions/draw'), 'component');
        assert.equal(kindOf('Patronen/Formulier/demo'), 'pattern');
        assert.equal(kindOf('Bijdragen/Storybook'), 'flux-team');
        assert.equal(kindOf('Iets Nieuws/x'), 'other');
    });

    test('normalizeLinks maakt links naar dezelfde Storybook relatief, en laat andere staan', () => {
        const markdown = [
            '[a](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/x--documentatie)',
            '[b](?path=/story/y--z)',
            '[c](https://flux.omgeving.vlaanderen.be/release-v1/1.48.2/storybook/?path=/docs/x--documentatie)',
            '> <a href="/docs/x--documentatie#ontwerp">x</a>',
            '```',
            '[d](/docs/x--documentatie)',
            '```',
        ].join('\n');
        assert.equal(
            normalizeLinks(markdown, '2.20.0'),
            [
                '[a](/?path=/docs/x--documentatie)',
                '[b](/?path=/story/y--z)',
                '[c](https://flux.omgeving.vlaanderen.be/release-v1/1.48.2/storybook/?path=/docs/x--documentatie)',
                '> <a href="/?path=/docs/x--documentatie#ontwerp">x</a>',
                '```',
                '[d](/docs/x--documentatie)',
                '```',
            ].join('\n'),
        );
    });
});

describe('de analyse', () => {
    const page = pageOf(build(), 'components-atom-knop');
    const analysis = {
        schema: 1,
        page: page.id,
        inputHash: page.inputHash,
        analysedFor: '2.20.0',
        summary: 'Een knop voor een actie.',
        keywords: ['knop', 'button'],
        examples: {
            'components-atom-knop--knop-primary': { html: '<vl-knop>Klik</vl-knop>' },
            'components-atom-knop--knop-x-small': { html: '<vl-knop ghost aria-label="Klik">Klik</vl-knop>' },
        },
        notes: [],
    };
    const withExample = (html) => ({
        ...analysis,
        examples: { ...analysis.examples, 'components-atom-knop--knop-x-small': { html } },
    });
    const problems = (value) => validateAnalysis(value, page, webTypes()).join();

    test('een analyse die klopt', () => {
        assert.deepEqual(validateAnalysis(analysis, page, webTypes()), []);
    });

    test('een ontbrekend voorbeeld, een onbekende sleutel en een andere hash', () => {
        const { 'components-atom-knop--knop-x-small': _, ...examples } = analysis.examples;
        const problems = validateAnalysis({ ...analysis, inputHash: 'x', extra: 1, examples }, page, webTypes());
        assert.equal(problems.length, 3);
        assert.match(problems.join('\n'), /onbekende sleutel 'extra'/);
        assert.match(problems.join('\n'), /inputHash is 'x'/);
        assert.match(problems.join('\n'), /geen voorbeeld voor story components-atom-knop--knop-x-small/);
    });

    test('een attribuut of element buiten de web-types, tenzij een note het vermeldt', () => {
        assert.match(problems(withExample('<vl-knop groot></vl-knop>')), /attribuut 'groot'/);
        assert.match(problems(withExample('<vl-ander></vl-ander>')), /<vl-ander> staat niet in de web-types/);
        const note = {
            type: 'not-in-web-types',
            element: 'vl-knop',
            name: 'groot',
            text: 'Staat in de code.',
            source: 'x.ts',
        };
        const noted = { ...withExample('<vl-knop groot></vl-knop>'), notes: [note] };
        assert.deepEqual(validateAnalysis(noted, page, webTypes()), []);
    });

    test('lit-syntax in een voorbeeld wordt geweigerd', () => {
        assert.match(problems(withExample('<vl-knop ?ghost=${x}></vl-knop>')), /lit-syntax/);
    });

    test('renderPage zet de voorbeelden, de API en absolute links in de pagina', () => {
        const rendered = renderPage({
            version: '2.20.0',
            page,
            markdown: page.markdown,
            analysis,
            webTypes: webTypes(),
        });
        assert.match(rendered, /^# Knop\n\nFlux 2\.20\.0 · \[Storybook\]/);
        assert.match(rendered, /Status: generatie: v2 · wcag: reviewed/);
        const story = `**vl-knop - primary** ([Storybook](${BASE}?path=/story/components-atom-knop--knop-primary))`;
        assert.ok(rendered.includes(`${story}\n\n\`\`\`html\n<vl-knop>Klik</vl-knop>\n\`\`\``));
        assert.ok(rendered.includes('**API van `vl-knop`**'));
        assert.ok(rendered.includes('| `ghost` |  | `false` | Zonder opmaak. |'));
        assert.ok(rendered.includes(`[aan de slag](${BASE}?path=/docs/afnemen-aan-de-slag--documentatie)`));
        assert.ok(!rendered.includes('> Story:'));
    });

    test('renderPage maakt links absoluut: naar Storybook van die versie, een afbeelding naar de tag', () => {
        const markdown =
            '# X\n\n![Schema](/apps/storybook/docs/img/x.png)\n\n> <a href="/?path=/docs/y--documentatie">y</a>\n\n' +
            '```\n![code](/apps/z.png)\n```\n';
        const page = { id: 'x', elements: [], status: null };
        const rendered = renderPage({ version: '2.20.0', page, markdown, analysis: null, webTypes: webTypes() });
        const tag = 'https://github.com/milieuinfo/flux-web-components/raw/v2.20.0';
        assert.ok(rendered.includes(`![Schema](${tag}/apps/storybook/docs/img/x.png)`));
        assert.ok(rendered.includes(`<a href="${BASE}?path=/docs/y--documentatie">`));
        assert.ok(rendered.includes('![code](/apps/z.png)'));
    });
});

describe('checkStorybook', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-storybook-'));
    after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const built = build();
    for (const file of storybookFiles(built)) {
        fs.mkdirSync(path.dirname(path.join(dir, '2.20.0', 'storybook', file.path)), { recursive: true });
        fs.writeFileSync(path.join(dir, '2.20.0', 'storybook', file.path), file.content);
    }
    // De web-types, zoals web-types:copy ze zet.
    fs.mkdirSync(path.join(dir, '2.20.0', 'web-types'), { recursive: true });
    const elements = [...webTypes().values()].map(({ element }) => element);
    const webTypesFile = path.join(dir, '2.20.0', 'web-types', 'atom.web-types.json');
    fs.writeFileSync(webTypesFile, JSON.stringify({ contributions: { html: { elements } } }));
    const page = built.index.pages.find((p) => p.id === 'components-atom-knop');
    const write = (file, content) => {
        fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
        fs.writeFileSync(path.join(dir, file), JSON.stringify(content));
    };

    test('pagina\'s zonder analyse zijn geen fout', () => {
        const result = checkStorybook(dir);
        assert.deepEqual(result.errors, []);
        const pages = ['afnemen-aan-de-slag', 'components-atom-knop', 'components-atom-sjabloon'];
        assert.deepEqual(result.missing.get('2.20.0'), pages);
    });

    test('een analyse die niet klopt, en een analyse die geen versie gebruikt', () => {
        const analysis = { schema: 1, page: page.id, inputHash: page.inputHash };
        const empty = { ...analysis, summary: 'x', keywords: [], examples: {}, notes: [] };
        write(`storybook-analysis/${page.id}/${page.inputHash}.json`, empty);
        write(`storybook-analysis/${page.id}/000000000000.json`, {});
        const result = checkStorybook(dir);
        assert.equal(result.errors.length, 2);
        const file = /^2\.20\.0: storybook-analysis\/components-atom-knop\/[0-9a-f]{12}\.json: /;
        assert.match(result.errors[0], file);
        assert.match(result.errors[0], /geen voorbeeld voor story components-atom-knop--knop-primary\./);
        assert.deepEqual(result.orphans, [`storybook-analysis/${page.id}/000000000000.json`]);
    });
});

describe('discardAnalyses', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-storybook-'));
    after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const write = (file) => {
        fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
        fs.writeFileSync(path.join(dir, file), '{}');
    };

    test('verwijdert de analyses van de reeks, en een map die leeg wordt; de rest blijft', () => {
        write('storybook-analysis/pagina-a/aaaaaaaaaaaa.json');
        write('storybook-analysis/pagina-b/bbbbbbbbbbbb.json');
        write('storybook-analysis/pagina-b/111111111111.json');
        write('storybook-analysis/pagina-c/cccccccccccc.json');
        const removed = discardAnalyses(dir, [
            { id: 'pagina-a', inputHash: 'aaaaaaaaaaaa' },
            { id: 'pagina-b', inputHash: 'bbbbbbbbbbbb' },
            { id: 'pagina-d', inputHash: 'dddddddddddd' },
        ]);
        assert.deepEqual(removed, [
            path.join('storybook-analysis', 'pagina-a', 'aaaaaaaaaaaa.json'),
            path.join('storybook-analysis', 'pagina-b', 'bbbbbbbbbbbb.json'),
        ]);
        assert.equal(fs.existsSync(path.join(dir, 'storybook-analysis', 'pagina-a')), false);
        assert.equal(fs.existsSync(path.join(dir, 'storybook-analysis', 'pagina-b', '111111111111.json')), true);
        assert.equal(fs.existsSync(path.join(dir, 'storybook-analysis', 'pagina-c', 'cccccccccccc.json')), true);
    });
});
