import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { checkMarkup, closest, parseMarkup, slotNames, valuesOf } from '../src/markup.mjs';

// Nagemaakte web-types: genoeg om elke code te tonen.
const webTypes = new Map(
    [
        {
            name: 'vl-knop',
            attributes: [
                { name: 'type', value: { kind: 'plain', type: "'primary' | 'secondary'" }, default: 'primary' },
                { name: 'disabled', default: 'false' },
                { name: 'oud', deprecated: 'Gebruik nieuw.' },
                { name: 'preLine', default: 'false' },
            ],
            slots: [{ name: '[default]' }, { name: 'icoon (slot)' }],
            js: { properties: [{ name: 'data', type: 'object' }], events: [{ name: 'vl-klik' }] },
        },
        { name: 'vl-oud', deprecated: 'Gebruik vl-knop.' },
        { name: 'vl-tabs-next' },
    ].map((element) => [element.name, { category: 'atom', element }]),
);
const check = (source, options = {}) => checkMarkup(source, { webTypes, ...options });
const codes = (findings) =>
    findings.map((finding) => `${finding.line}:${finding.column} ${finding.severity} ${finding.code}`);

describe('parseMarkup', () => {
    test('HTML: elementen, attributen, regel en kolom, en de ouder', () => {
        const elements = parseMarkup('<vl-knop type="primary" disabled>\n  <span slot=icoon>x</span>\n</vl-knop>', {
            syntax: 'html',
        });
        assert.deepEqual(
            elements.map((element) => [element.name, element.line, element.column, element.parent]),
            [
                ['vl-knop', 1, 1, null],
                ['span', 2, 3, 0],
            ],
        );
        assert.deepEqual(elements[0].attributes, [
            { raw: 'type', prefix: '', name: 'type', value: 'primary', dynamic: false, line: 1, column: 10 },
            { raw: 'disabled', prefix: '', name: 'disabled', value: null, dynamic: false, line: 1, column: 25 },
        ]);
        assert.equal(elements[1].attributes[0].value, 'icoon');
    });

    test('commentaar, script en style slaat hij over; een template leest hij als markup', () => {
        const html = [
            '<!-- <vl-commentaar></vl-commentaar> -->',
            '<script>const x = "<vl-script>";</script>',
            '<style>vl-stijl { color: red }</style>',
            '<template><vl-knop></vl-knop></template>',
            '<br><vl-knop/><vl-oud></vl-oud>',
        ].join('\n');
        const names = parseMarkup(html, { syntax: 'html' }).map((element) => element.name);
        assert.deepEqual(names, ['script', 'style', 'template', 'vl-knop', 'br', 'vl-knop', 'vl-oud']);
        const [, , template, inside] = parseMarkup(html, { syntax: 'html' });
        assert.equal(inside.parent, 2, 'het element in de template');
        assert.equal(template.line, 4);
    });

    test('lit: de templates uit een bestand, ook geneste, met de ouder van de geneste template', () => {
        const source = [
            "import { css, html } from 'lit';",
            '// html`<vl-commentaar></vl-commentaar>`',
            "const tekst = 'html`<vl-string></vl-string>`';",
            'const stijl = css`vl-css { }`;',
            'const lijst = `<vl-gewone-string></vl-gewone-string>`;',
            'render() {',
            '    return html`<vl-knop .data=${this.data} @vl-klik=${() => this.klik()} ?disabled=${!this.ok}>',
            '        ${this.items.map((item) => html`<span slot="icoon">${item}</span>`)}',
            '    </vl-knop>`;',
            '}',
        ].join('\n');
        const elements = parseMarkup(source);
        assert.deepEqual(
            elements.map((element) => [element.name, element.line, element.column, element.parent]),
            [
                ['vl-knop', 7, 17, null],
                ['span', 8, 41, 0],
            ],
        );
        assert.deepEqual(
            elements[0].attributes.map((attribute) => [
                attribute.prefix,
                attribute.name,
                attribute.dynamic,
                attribute.column,
            ]),
            [
                ['.', 'data', true, 26],
                ['@', 'vl-klik', true, 45],
                ['?', 'disabled', true, 75],
            ],
        );
    });

    test('lit zonder template: de hele tekst is markup; een dynamische tag heeft geen naam', () => {
        const elements = parseMarkup('<vl-knop type=${t}></vl-knop>\n<${tag}></${tag}>');
        assert.deepEqual(
            elements.map((element) => [element.name, element.dynamic, element.line]),
            [
                ['vl-knop', false, 1],
                [null, true, 2],
            ],
        );
        assert.equal(elements[0].attributes[0].dynamic, true);
    });
});

describe('checkMarkup', () => {
    test('elk element en attribuut tegen de web-types, met regel en kolom', () => {
        const source = [
            '<vl-knopp></vl-knopp>',
            '<vl-oud></vl-oud><vl-tabs-next></vl-tabs-next>',
            '<vl-knop type="tertiary" disabled="false" oud groot preline aria-label="x" data-x="1"></vl-knop>',
        ].join('\n');
        const findings = check(source, { syntax: 'html', next: new Set(['vl-tabs-next']) });
        assert.deepEqual(codes(findings), [
            '1:1 error unknown-element',
            '2:1 warning deprecated-element',
            '2:18 info next-element',
            '3:10 warning invalid-attribute-value',
            '3:26 warning boolean-attribute-false',
            '3:43 warning deprecated-attribute',
            '3:47 error unknown-attribute',
        ]);
        assert.equal(findings[0].suggestion, 'vl-knop');
        assert.match(findings[1].message, /Gebruik vl-knop/);
        assert.equal(findings[3].suggestion, "Kies uit 'primary', 'secondary'.");
        assert.equal(findings[6].attribute, 'groot');
    });

    test('een note "not-in-web-types" maakt van een fout een waarschuwing, hoofdletterongevoelig', () => {
        const notes = [
            { type: 'not-in-web-types', element: 'vl-knop', name: 'Groot' },
            { type: 'not-in-web-types', element: 'vl-nieuw' },
        ];
        const findings = check('<vl-knop groot></vl-knop><vl-nieuw></vl-nieuw>', { syntax: 'html', notes });
        assert.deepEqual(
            findings.map((finding) => [finding.code, finding.severity, finding.source]),
            [
                ['unknown-attribute', 'warning', 'storybook-analysis'],
                ['unknown-element', 'warning', 'storybook-analysis'],
            ],
        );
    });

    test('lit: properties, events en een dynamische tag; dynamische waarden controleert hij niet', () => {
        const source =
            'html`<vl-knop type=${t} .data=${d} .disabled=${x} .fout=${f} ' +
            '@click=${c} @vl-klik=${k} @vl-x=${x}></vl-knop><${tag}></${tag}>`';
        assert.deepEqual(codes(check(source)), [
            '1:51 warning unknown-property',
            '1:88 warning unknown-event',
            '1:109 info dynamic-tag',
        ]);
    });

    test('een slot enkel op een direct kind van een vl-element, met de namen opgekuist', () => {
        const source = [
            '<vl-knop>',
            '  <span slot="icoon"></span>',
            '  <span slot="titel"></span>',
            '  <div><span slot="diep"></span></div>',
            '</vl-knop>',
        ].join('\n');
        const findings = check(source, { syntax: 'html' });
        assert.deepEqual(codes(findings), ['3:9 warning unknown-slot']);
        assert.match(findings[0].message, /vl-knop heeft geen slot 'titel' in de web-types; de slots zijn icoon\./);
    });

    test('strict: lit-syntax in HTML is een fout, zoals storybook:check vraagt', () => {
        const findings = check('<vl-knop ?disabled=${x} @vl-klik=${y}></vl-knop>', { syntax: 'html', strict: true });
        assert.deepEqual(codes(findings), ['1:10 error lit-syntax', '1:25 error lit-syntax']);
        assert.match(findings[0].message, /'\?disabled' op <vl-knop> is lit-syntax; schrijf gewone HTML/);
    });
});

describe('hulpfuncties', () => {
    test('valuesOf: enkel een lijst van letterlijke waarden', () => {
        assert.deepEqual(valuesOf("'a' | 'b'"), ['a', 'b']);
        assert.equal(valuesOf('string'), null);
        assert.equal(valuesOf("'string: 'button'' | ''submit''"), null);
    });

    test('slotNames: zonder [default], zonder naam, en opgekuist', () => {
        const element = {
            slots: [{ name: '[default]' }, { name: 'legend slot (vereist)' }, { name: null }, { name: 'x' }],
        };
        assert.deepEqual(slotNames(element), ['legend', 'x']);
    });

    test('closest: zonder vl-, tot een derde van de naam', () => {
        assert.deepEqual(closest('vl-buton', ['vl-button', 'vl-icon', 'vl-step']), ['vl-button']);
    });
});
