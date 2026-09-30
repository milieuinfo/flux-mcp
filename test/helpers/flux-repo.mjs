// Een kleine, nagemaakte flux-web-components voor de tests van de runs, als echte git-repo in een tijdelijke map. Ze
// heeft wat de scripts lezen: een component (vl-knop) met code, stories, documentatie, web-types en een Code Connect
// template, een losse pagina, en de changelog. Drie releases op develop-v1, elk met een commit
// 'chore(release): X.Y.Z [skip ci]' en een tag: 0.9.0 (het vertrekpunt), 1.0.0 en 1.1.0. De versienummers zijn
// verzonnen, zodat ze nooit met de echte catalogus te verwarren zijn.
//
// Daarnaast wat de site van Storybook (index.json) en de registry (de metadata van de packages) per versie geven;
// startSite zet ze op een lokale server.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

export const VERSIONS = ['1.0.0', '1.1.0'];
const COMPONENT = 'libs/components/src/atom/knop';
const STORIES = `${COMPONENT}/stories`;
const GITHUB = 'https://github.com/milieuinfo/flux-web-components';
const DOC_URL = 'https://flux.omgeving.vlaanderen.be/release-v1/DOMG-WC-VERSION/storybook/?path=/docs/';

// Wat vl-knop kan in een release: ghost vanaf 1.0.0; in 1.1.0 size, een zichtbare focus en een interne opkuis.
const STATES = {
    '0.9.0': {},
    '1.0.0': { ghost: true },
    '1.1.0': { ghost: true, size: true, focus: true, intern: true },
};

const json = (value) => `${JSON.stringify(value, null, 4)}\n`;

// De stories van vl-knop: [export, id, naam, template].
function stories({ ghost, size }) {
    return [
        ['KnopPrimary', 'knop-primary', 'vl-knop - primary', '<vl-knop>Klik</vl-knop>'],
        ...(ghost ? [['KnopGhost', 'knop-ghost', 'vl-knop - ghost', '<vl-knop ghost>Klik</vl-knop>']] : []),
        ...(size ? [['KnopSize', 'knop-size', 'vl-knop - size', '<vl-knop size="small">Klik</vl-knop>']] : []),
    ];
}

function component({ ghost, size, focus, intern }) {
    const properties = [...(ghost ? ['ghost: { type: Boolean }'] : []), ...(size ? ['size: { type: String }'] : [])];
    const button = intern ? '<button part="knop"><slot></slot></button>' : '<button><slot></slot></button>';
    return [
        "import { LitElement, css, html } from 'lit';",
        '',
        'export class VlKnop extends LitElement {',
        `    static properties = { ${properties.join(', ')} };`,
        ...(focus ? ['    static styles = css`button:focus-visible { outline: 2px solid; }`;'] : []),
        `    render() { return html\`${button}\`; }`,
        '}',
        '',
    ].join('\n');
}

function webTypes({ ghost, size }) {
    const attribute = (name, description, type, value) => ({ name, description, value: { type }, default: value });
    const attributes = [
        ...(ghost ? [attribute('ghost', 'Zonder achtergrond.', 'boolean', 'false')] : []),
        ...(size ? [attribute('size', 'De grootte.', "'small' | 'normal'", '"normal"')] : []),
    ];
    const knop = {
        name: 'vl-knop',
        description: 'Een knop voor een actie.',
        'doc-url': `${DOC_URL}components-atom-knop--documentatie`,
        attributes,
        slots: [{ name: '[default]', description: 'De tekst van de knop.' }],
        js: { properties: [], events: [{ name: 'vl-click', description: 'Bij een klik.' }] },
    };
    return json({
        $schema: 'https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json',
        name: 'flux-web-components',
        version: 'DOMG-WC-VERSION',
        'js-types-syntax': 'typescript',
        'description-markup': 'markdown',
        contributions: { html: { elements: [knop] } },
    });
}

function storiesFile(state) {
    return [
        "import { html } from 'lit';",
        "import { knopArgs } from './vl-knop.stories-arg';",
        "import knopDoc from './vl-knop.stories-doc.mdx';",
        '',
        'export default {',
        "    id: 'components-atom-knop',",
        "    title: 'Components - Atom/knop',",
        '    args: knopArgs,',
        '    parameters: { docs: { page: knopDoc } },',
        '};',
        ...stories(state).map(([name, , , template]) => `export const ${name} = () => html\`${template}\`;`),
        '',
    ].join('\n');
}

function docPage({ ghost, size }) {
    const section = (title, text, story) => [`## ${title}`, '', text, '', `<Canvas of={KnopStories.${story}} />`, ''];
    return [
        "import { ArgTypes, Canvas } from '@storybook/addon-docs/blocks';",
        "import * as KnopStories from './vl-knop.stories';",
        '',
        '# Knop',
        '',
        '<FluxComponentMetaData id="components-atom-knop" />',
        '',
        'Gebruik de knop voor een actie. Zie [aan de slag](/docs/afnemen-aan-de-slag--documentatie).',
        '',
        '<Canvas of={KnopStories.KnopPrimary} />',
        '',
        '<ArgTypes of={KnopStories.KnopPrimary} />',
        '',
        ...(ghost ? section('Ghost', 'Een knop zonder achtergrond, voor een kleinere actie.', 'KnopGhost') : []),
        ...(size ? section('Grootte', 'Een kleinere knop, bv. in een tabel.', 'KnopSize') : []),
    ].join('\n');
}

function gettingStarted({ install }) {
    return [
        "import { Meta } from '@storybook/addon-docs/blocks';",
        '',
        '<Meta title="Afnemen/Aan De Slag"/>',
        '',
        '# Aan De Slag',
        '',
        'Gebruik de [knop](/docs/components-atom-knop--documentatie) voor een actie.',
        ...(install ? ['', 'Installeer de packages met `pnpm add @domg-wc/components`.'] : []),
        '',
    ].join('\n');
}

// De bestanden van de eerste commit. De web-types genereert de release-commit, zoals bij Flux.
function initialFiles() {
    const state = STATES['0.9.0'];
    const metaData = {
        name: 'knop',
        docs: 'components-atom-knop--documentatie',
        condition: { generation: 'v2', wcag: 'reviewed' },
    };
    const docs = 'apps/storybook/docs';
    return {
        'package.json': json({ name: 'flux-web-components', private: true, devDependencies: { storybook: '9.1.5' } }),
        'figma.config.json': json({ codeConnect: { include: ['libs/**/*.figma.ts'], label: 'Web Components' } }),
        'resources/code-connect/escape-html.ts':
            "export const escapeHtml = (text: string) => text.replaceAll('<', '&lt;');\n",
        'apps/storybook/.storybook/flux-meta-data/json/components-atom.meta-data.json': json({
            'components-atom-knop': metaData,
        }),
        [`${docs}/1_changelog.mdx`]:
            "import { Meta } from '@storybook/addon-docs/blocks';\n\n<Meta title=\"Changelog\"/>\n",
        [`${docs}/a_afnemen/1_aan-de-slag.mdx`]: gettingStarted({}),
        [`${COMPONENT}/vl-knop.ts`]: component(state),
        [`${COMPONENT}/vl-knop.figma.ts`]: [
            '// url=https://www.figma.com/design/fluxtest/Flux?node-id=1-2',
            "import figma, { html } from '@figma/code-connect/html';",
            "import { escapeHtml } from '../../../../../resources/code-connect/escape-html';",
            '',
            "figma.connect('https://www.figma.com/design/fluxtest/Flux?node-id=1-2', {",
            "    example: () => html`<vl-knop>${escapeHtml('Klik')}</vl-knop>`,",
            '});',
            '',
        ].join('\n'),
        [`${STORIES}/vl-knop.stories.ts`]: storiesFile(state),
        [`${STORIES}/vl-knop.stories-arg.ts`]: 'export const knopArgs = { ghost: false };\n',
        [`${STORIES}/vl-knop.stories-doc.mdx`]: docPage(state),
    };
}

// De sectie van een release in CHANGELOG.md, met de links naar de commits zoals conventional-changelog ze schrijft.
// 'sections' is een lijst van [titel, [[tekst, sha of null], …]].
function changelogSection(version, previous, date, sections) {
    const link = previous && `${GITHUB}/compare/v${previous}...v${version}`;
    const lines = [previous ? `# [${version}](${link}) (${date})` : `# ${version} (${date})`, ''];
    for (const [title, entries] of sections) {
        lines.push(`### ${title}`, '');
        for (const [text, sha] of entries) {
            lines.push(sha ? `* ${text} ([${sha.slice(0, 7)}](${GITHUB}/commit/${sha}))` : `* ${text}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}

// Bouwt de repo. Geeft { dir, remove }.
export function createFluxRepo() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-web-components-'));
    let tick = 0;
    const git = (...args) => {
        // Vaste auteur en datums: dezelfde repo geeft zo dezelfde commits.
        const date = `2026-01-01T00:00:${String(tick).padStart(2, '0')}Z`;
        const who = { NAME: 'Flux', EMAIL: 'flux@example.com', DATE: date };
        const env = {};
        for (const role of ['AUTHOR', 'COMMITTER']) {
            for (const [key, value] of Object.entries(who)) env[`GIT_${role}_${key}`] = value;
        }
        return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf-8', env: { ...process.env, ...env } }).trim();
    };
    // Een commit met de bestanden in 'changes'; geeft de sha.
    const commit = (message, changes) => {
        for (const [file, content] of Object.entries(changes)) {
            fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
            fs.writeFileSync(path.join(dir, file), content);
        }
        git('add', '--all');
        tick++;
        git('commit', '--quiet', '--allow-empty', '-m', message);
        return git('rev-parse', 'HEAD');
    };
    let changelog = '';
    const release = (version, section) => {
        changelog = changelog ? `${section}\n${changelog}` : section;
        commit(`chore(release): ${version} [skip ci]`, {
            'libs/components/src/atom/atom.web-types.json': webTypes(STATES[version]),
            'resources/changelog/CHANGELOG.md': changelog,
        });
        git('tag', `v${version}`);
    };

    execFileSync('git', ['init', '--quiet', '--initial-branch', 'develop-v1', dir]);
    commit('chore: FLUX-0 - de eerste componenten', initialFiles());
    release('0.9.0', changelogSection('0.9.0', null, '2026-01-01', [
        ['Features', [['FLUX-0 - de eerste componenten', null]]],
    ]));

    // 1.0.0: vl-knop krijgt een ghost-variant, en de pagina 'Aan de slag' legt de installatie uit.
    const ghost = commit('feat: FLUX-1 - vl-knop - ghost variant\n\nMet ghost heeft vl-knop geen achtergrond.', {
        [`${COMPONENT}/vl-knop.ts`]: component(STATES['1.0.0']),
        [`${STORIES}/vl-knop.stories.ts`]: storiesFile(STATES['1.0.0']),
        [`${STORIES}/vl-knop.stories-doc.mdx`]: docPage(STATES['1.0.0']),
    });
    const install = commit('docs: FLUX-2 - aan de slag - installatie met pnpm', {
        'apps/storybook/docs/a_afnemen/1_aan-de-slag.mdx': gettingStarted({ install: true }),
    });
    release('1.0.0', changelogSection('1.0.0', '0.9.0', '2026-01-15', [
        ['Features', [['FLUX-1 - vl-knop - ghost variant', ghost]]],
        ['Documentation', [['FLUX-2 - aan de slag - installatie met pnpm', install]]],
        ['BREAKING CHANGES', [['start van v1', null]]],
    ]));

    // 1.1.0: een fix voor de focus, een interne opkuis die niet in de changelog staat, en een attribuut size.
    const focus = commit(
        'fix: FLUX-3 - vl-knop - focus zichtbaar bij het toetsenbord\n\n' +
            'De focus van vl-knop is zichtbaar voor wie met het toetsenbord werkt (WCAG 2.4.7).',
        { [`${COMPONENT}/vl-knop.ts`]: component({ ghost: true, focus: true }) },
    );
    commit('chore: FLUX-4 - vl-knop - interne opkuis', {
        [`${COMPONENT}/vl-knop.ts`]: component({ ghost: true, focus: true, intern: true }),
    });
    const size = commit('feat: FLUX-5 - vl-knop - attribuut size', {
        [`${COMPONENT}/vl-knop.ts`]: component(STATES['1.1.0']),
        [`${STORIES}/vl-knop.stories.ts`]: storiesFile(STATES['1.1.0']),
        [`${STORIES}/vl-knop.stories-doc.mdx`]: docPage(STATES['1.1.0']),
    });
    release('1.1.0', changelogSection('1.1.0', '1.0.0', '2026-02-01', [
        ['Bug Fixes', [['FLUX-3 - vl-knop - focus zichtbaar bij het toetsenbord', focus]]],
        ['Features', [['FLUX-5 - vl-knop - attribuut size', size]]],
    ]));

    return { dir, remove: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

// index.json van de Storybook van een versie, in formaat v5.
export function storybookIndex(version) {
    const knop = `../../${STORIES}/vl-knop.stories.ts`;
    const title = 'Components - Atom/knop';
    const startPage = './docs/a_afnemen/1_aan-de-slag.mdx';
    const entries = [
        ['changelog--documentatie', 'docs', 'Changelog', 'documentatie', './docs/1_changelog.mdx'],
        ['afnemen-aan-de-slag--documentatie', 'docs', 'Afnemen/Aan De Slag', 'documentatie', startPage],
        ['components-atom-knop--documentatie', 'docs', title, 'documentatie', knop],
        ...stories(STATES[version]).map(([, id, name]) => [`components-atom-knop--${id}`, 'story', title, name, knop]),
    ];
    const entry = ([id, type, name, story, importPath]) => [id, { id, type, title: name, name: story, importPath }];
    return { v: 5, entries: Object.fromEntries(entries.map(entry)) };
}

// De metadata van een package op de registry, zoals npm ze per versie geeft.
export function packageMetadata(name, version) {
    const lit = version === '1.1.0' ? '3.2.0' : '3.1.0';
    const dependencies = {
        common: { lit },
        components: { '@domg-wc/common': version, '@domg-wc/styles': version, lit },
        map: { '@domg-wc/common': version, ol: '10.0.0' },
        styles: {},
    }[name];
    return { name: `@domg-wc/${name}`, version, description: 'Nagemaakt voor de tests.', dependencies };
}

// Een lokale server met index.json van elke Storybook en de registry: /release-v1/<versie>/storybook/index.json en
// /registry/@domg-wc/<naam>/<versie>. Geeft { url, registry, close }.
export async function startSite() {
    const server = http.createServer((request, response) => {
        const send = (status, body) => {
            response.writeHead(status, { 'content-type': 'application/json' });
            response.end(JSON.stringify(body));
        };
        const storybook = /^\/release-v1\/([^/]+)\/storybook\/index\.json$/.exec(request.url);
        if (storybook && storybook[1] in STATES) return send(200, storybookIndex(storybook[1]));
        const registry = /^\/registry\/@domg-wc\/(common|components|map|styles)\/([^/]+)$/.exec(request.url);
        if (registry && VERSIONS.includes(registry[2])) return send(200, packageMetadata(registry[1], registry[2]));
        send(404, { error: 'niet gevonden' });
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    return { url, registry: `${url}/registry`, close: () => new Promise((resolve) => server.close(resolve)) };
}
