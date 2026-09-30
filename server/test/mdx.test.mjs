import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
    arrowFunction,
    declarationOf,
    dedent,
    evaluate,
    initializerOf,
    MdxError,
    parseExports,
    parseImports,
    parseLiteral,
    parseMdx,
    renderNodes,
    tidyMarkdown,
} from '../src/mdx.mjs';

// Rendert MDX met enkel HTML en expressies; een component geeft '[Naam]' terug, of undefined als het 'Onbekend' is.
function render(text, scope = {}) {
    const { nodes } = parseMdx(text, 'test.mdx');
    return tidyMarkdown(
        renderNodes(nodes, {
            file: 'test.mdx',
            scope: (name) => scope[name],
            component: (node) => (node.name === 'Onbekend' ? undefined : `[${node.name}]`),
        }),
    );
}

describe('parseMdx', () => {
    test('ESM-regels, ook over meerdere regels, los van de rest', () => {
        const { esm, nodes } = parseMdx("import { A,\n    B } from './a';\nexport const x = `y`;\n\n# Titel\n");
        assert.deepEqual(esm, ["import { A,\n    B } from './a';", 'export const x = `y`;']);
        assert.equal(nodes.filter((node) => node.type === 'text').map((node) => node.text).join('').trim(), '# Titel');
    });

    test('een codeblok en code tussen backticks blijven letterlijk', () => {
        const text =
            'Gebruik `<vl-button>` en `{x}`.\n\n```html\n<vl-button {x}></vl-button>\nimport x from "y";\n```\n';
        assert.equal(render(text), text);
    });

    test('een codeblok van vier backticks met blokken van drie erin', () => {
        const text = '````\n```js\na\n```\n<Canvas />\n````\n';
        assert.equal(render(text), text);
    });

    test('JSX met attributen, expressies en kinderen', () => {
        const { nodes } = parseMdx('<Canvas of={Stories.Default} sourceState="none" dark />\n');
        const element = nodes.find((node) => node.type === 'element');
        assert.equal(element.name, 'Canvas');
        assert.deepEqual(element.attributes, [
            { name: 'of', value: { type: 'expression', source: 'Stories.Default' } },
            { name: 'sourceState', value: { type: 'string', value: 'none' } },
            { name: 'dark', value: { type: 'boolean' } },
        ]);
    });

    test('JSX in een prop, met een apostrof in de tekst', () => {
        const { nodes } = parseMdx("<Blok text={<>op meerdere pagina's</>} />\n");
        assert.equal(nodes.find((node) => node.type === 'element').name, 'Blok');
    });

    test('een HTML-commentaar verdwijnt', () => {
        assert.equal(render('a <!-- weg --> b\n'), 'a  b\n');
    });

    test('een tag die niet sluit, geeft een fout met het bestand en de regel', () => {
        assert.throws(() => parseMdx('\n<Blok>\ntekst\n', 'x.mdx'), /x\.mdx:2: <Blok> sluit niet af/);
    });
});

describe('renderNodes', () => {
    test('een onbekend component laat de omzetting falen', () => {
        assert.throws(
            () => render('<Onbekend />\n'),
            (error) => error instanceof MdxError && /<Onbekend>/.test(error.message),
        );
    });

    test('een HTML-tabel wordt een Markdown-tabel', () => {
        const text =
            '<table><tr><th>Naam</th><th>Gebruik</th></tr>' +
            '<tr><td>Knop</td><td><code>{`<vl-button>`}</code></td></tr></table>\n';
        assert.equal(render(text), '| Naam | Gebruik |\n| --- | --- |\n| Knop | `<vl-button>` |\n');
    });

    test('nadruk, links, lijsten en titels worden Markdown', () => {
        const text =
            '<h3>Titel</h3>\n<p>Een <strong>vet</strong> woord en een <a href="https://x.be">link</a>.</p>\n' +
            '<ul><li>a</li><li>b</li></ul>\n';
        assert.equal(render(text), '### Titel\n\nEen **vet** woord en een [link](https://x.be).\n\n- a\n- b\n');
    });

    test('een element dat Storybook live toont, blijft HTML zonder style', () => {
        const alert = render('<vl-alert type="info" style={{ margin: 0 }}>Tekst</vl-alert>\n');
        assert.equal(alert, '<vl-alert type="info">Tekst</vl-alert>\n');
    });

    test('een expressie wordt haar waarde, een onbekende naam een fout', () => {
        assert.equal(render('Versie {versie}.\n', { versie: '2.20.0' }), 'Versie 2.20.0.\n');
        assert.throws(() => render('{onbekend}\n'), /onbekende naam \{onbekend\}/);
    });
});

describe('evaluate', () => {
    const scope = (values) => (name) => values[name];

    test('strings, template literals met namen, en commentaar', () => {
        assert.equal(evaluate("'a\\'b'"), "a'b");
        assert.equal(evaluate('`${a}/docs`', scope({ a: 'https://x' })), 'https://x/docs');
        assert.equal(evaluate('/* weg */'), undefined);
        assert.equal(evaluate("'a' + b", scope({ b: 'c' })), 'ac');
    });

    test('ternary, && en ||, vergelijkingen en methodes', () => {
        const values = scope({ ja: true, nee: false, x: 'a' });
        assert.equal(evaluate("ja ? 'ja' : 'nee'", values), 'ja');
        assert.equal(evaluate("nee && 'x'", values), false);
        assert.equal(evaluate("nee || 'y'", values), 'y');
        assert.equal(evaluate("x === 'a' ? 'gelijk' : 'anders'", values), 'gelijk');
        assert.equal(evaluate('`  tekst  `.trim()'), 'tekst');
    });

    test('een pijlfunctie uit een helper, met defaults en destructuring', () => {
        const html = arrowFunction(
            '(component: string, sourceCode = false) => `<x${sourceCode ? "" : " demo"}>${component}</x>`',
        );
        const nav = arrowFunction(
            '({ hashSync }: Partial<typeof args>) => `<nav${hashSync ? " hash-sync" : ""}></nav>`',
        );
        const values = scope({ html: { ...html, scope: () => undefined }, nav: { ...nav, scope: () => undefined } });
        assert.equal(evaluate("html('<b>a</b>')", values), '<x demo><b>a</b></x>');
        assert.equal(evaluate("html('<b>a</b>', true)", values), '<x><b>a</b></x>');
        assert.equal(evaluate('nav({ hashSync: true })', values), '<nav hash-sync></nav>');
        assert.equal(evaluate('nav({})', values), '<nav></nav>');
    });

    test('JSX met een apostrof', () => {
        assert.equal(evaluate("<p>zo'n tekst</p>").nodes[0].name, 'p');
    });

    test('wat niet letterlijk te bepalen is, geeft een fout', () => {
        assert.throws(() => evaluate('fetch(url)'), /kan de expressie niet bepalen/);
    });
});

describe('ESM en JavaScript', () => {
    test('parseImports', () => {
        assert.deepEqual(parseImports(["import A, { b as c, d } from './x';", "import * as S from './s.stories';"]), [
            {
                source: './x',
                default: 'A',
                namespace: null,
                named: [
                    { imported: 'b', local: 'c' },
                    { imported: 'd', local: 'd' },
                ],
            },
            { source: './s.stories', default: null, namespace: 'S', named: [] },
        ]);
    });

    test('parseExports', () => {
        const exports = [...parseExports(['export const x = `a`;', "export const y = 'b'"])];
        assert.deepEqual(exports, [['x', '`a`'], ['y', "'b'"]]);
    });

    test('initializerOf en declarationOf in TypeScript', () => {
        const ts =
            "import x from 'y';\nexport const a: string = `hallo ${b}`;\nconst b = 'wereld'\n" +
            'export function f(a) {\n    return a;\n}\n';
        assert.equal(initializerOf(ts, 'a'), '`hallo ${b}`');
        assert.equal(initializerOf(ts, 'b'), "'wereld'");
        assert.equal(declarationOf(ts, 'f'), 'export function f(a) {\n    return a;\n}');
        assert.equal(initializerOf(ts, 'c'), null);
    });

    test('parseLiteral', () => {
        assert.deepEqual(parseLiteral("{ 'Groen': '#0f0', blauw: \"#00f\", n: 1, ok: true, lijst: ['a'] }"), {
            Groen: '#0f0',
            blauw: '#00f',
            n: 1,
            ok: true,
            lijst: ['a'],
        });
    });
});

describe('dedent en tidyMarkdown', () => {
    test('dedent haalt de gemeenschappelijke inspringing en de lege randen weg', () => {
        assert.equal(dedent('\n    a\n      b\n\n'), 'a\n  b');
    });

    test('inspringing verdwijnt buiten lijsten en codeblokken, zodat ze geen codeblok wordt', () => {
        const markdown = 'Tekst\n\n        ingesprongen\n\n- lijst\n  vervolg\n\n```\n    code\n```\n\n\n\nEinde  \n';
        const expected = 'Tekst\n\ningesprongen\n\n- lijst\n  vervolg\n\n```\n    code\n```\n\nEinde\n';
        assert.equal(tidyMarkdown(markdown), expected);
    });
});
