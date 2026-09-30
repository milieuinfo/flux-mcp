// Zet MDX om naar Markdown, zonder dependencies. storybook.mjs gebruikt dit voor de documentatie uit Storybook; zie
// docs/beslissingen/ADR-003-storybook-per-versie.md.
//
//   const { esm, nodes } = parseMdx(text);
//   const markdown = renderNodes(nodes, { scope, component, file });
//
// MDX is Markdown met drie extra's: ESM-regels (import en export), JSX-elementen en expressies tussen accolades. We
// parsen enkel die drie; de Markdown blijft tekst. Codeblokken en code tussen backticks blijven letterlijk, zodat een
// '<' of '{' daarin geen JSX wordt.
//
// Wat een element wordt, hangt van zijn naam af:
//   - een naam met een hoofdletter (Canvas, FluxAlert, …) is een component: 'component' in de context zet het om, of
//     geeft undefined en dan faalt de omzetting. Zo verdwijnt er niets ongemerkt;
//   - een naam in kleine letters is HTML. Tabellen, code, nadruk, links, lijsten en titels worden Markdown; andere
//     elementen, zoals een vl-alert die Storybook live toont, blijven HTML.
// Een expressie wordt haar waarde: een tekst, een template literal, een constante uit 'scope', of JSX. Kan dat niet,
// dan faalt de omzetting met het bestand en de expressie.

export class MdxError extends Error {}

const VOID = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',
]);
// Attributen die enkel voor de weergave in Storybook dienen.
const DROPPED_ATTRIBUTES = new Set(['style', 'className', 'class', 'key', 'ref', 'target', 'rel', 'sandbox']);
const short = (text) => (text.length > 80 ? `${text.slice(0, 80)}…` : text).replace(/\s+/g, ' ');

// De tekst zonder gemeenschappelijke inspringing en zonder lege regels vooraan en achteraan. Template literals in
// de MDX springen mee in met de code eromheen.
export function dedent(text) {
    const lines = String(text).replace(/\r\n/g, '\n').split('\n');
    while (lines.length > 0 && lines[0].trim() === '') lines.shift();
    while (lines.length > 0 && lines.at(-1).trim() === '') lines.pop();
    const indents = lines.filter((line) => line.trim() !== '').map((line) => /^[ \t]*/.exec(line)[0].length);
    const indent = indents.length > 0 ? Math.min(...indents) : 0;
    return lines.map((line) => line.slice(Math.min(indent, /^[ \t]*/.exec(line)[0].length))).join('\n');
}

// ---------------------------------------------------------------------------------------------------------------
// JavaScript scannen: genoeg om het einde van een expressie of een ESM-regel te vinden.

// Het einde (exclusief) van een string die op 'start' begint met ' of ".
function scanString(text, start) {
    const quote = text[start];
    for (let i = start + 1; i < text.length; i++) {
        if (text[i] === '\\') i++;
        else if (text[i] === quote) return i + 1;
        else if (text[i] === '\n') break;
    }
    throw new MdxError(`Een string sluit niet af: ${short(text.slice(start))}`);
}

// Het einde (exclusief) van een template literal die op 'start' begint met een backtick.
function scanTemplate(text, start, parser) {
    for (let i = start + 1; i < text.length; i++) {
        if (text[i] === '\\') i++;
        else if (text[i] === '`') return i + 1;
        else if (text[i] === '$' && text[i + 1] === '{') i = scanJs(text, i + 2, parser) - 1;
    }
    throw new MdxError(`Een template literal sluit niet af: ${short(text.slice(start))}`);
}

// Scant JavaScript vanaf 'start' tot de '}' die de expressie sluit, en geeft de positie na die '}'. JSX in de
// expressie ('text={<>…</>}') parst de parser, zodat een apostrof in de tekst geen string wordt.
function scanJs(text, start, parser) {
    let depth = 0;
    let previous = '';
    for (let i = start; i < text.length; i++) {
        const c = text[i];
        if (c === "'" || c === '"') {
            i = scanString(text, i) - 1;
        } else if (c === '`') {
            i = scanTemplate(text, i, parser) - 1;
        } else if (c === '/' && text[i + 1] === '/') {
            while (i < text.length && text[i] !== '\n') i++;
            continue;
        } else if (c === '/' && text[i + 1] === '*') {
            const end = text.indexOf('*/', i + 2);
            if (end < 0) throw new MdxError(`Een commentaar sluit niet af: ${short(text.slice(i))}`);
            i = end + 1;
            continue;
        } else if (c === '<' && /[A-Za-z>]/.test(text[i + 1] ?? '') && /^$|[(,=:?[{}!&|>]$|return$/.test(previous)) {
            const sub = new Parser(text, parser?.file);
            sub.i = i;
            sub.element();
            i = sub.i - 1;
        } else if ('{[('.includes(c)) {
            depth++;
        } else if ('}])'.includes(c)) {
            if (depth === 0) {
                if (c !== '}') throw new MdxError(`Onverwachte '${c}' in een expressie: ${short(text.slice(start))}`);
                return i + 1;
            }
            depth--;
        }
        if (!/\s/.test(c)) previous = /[A-Za-z]/.test(c) ? `${/[A-Za-z]+$/.exec(previous)?.[0] ?? ''}${c}` : c;
    }
    throw new MdxError(`Een expressie sluit niet af: ${short(text.slice(start))}`);
}

// ---------------------------------------------------------------------------------------------------------------
// Parsen.

class Parser {
    constructor(text, file) {
        this.text = text.replace(/\r\n/g, '\n');
        this.file = file;
        this.i = 0;
    }

    fail(message) {
        const line = this.text.slice(0, this.i).split('\n').length;
        throw new MdxError(`${this.file ?? 'MDX'}:${line}: ${message}`);
    }

    atLineStart() {
        return this.i === 0 || this.text[this.i - 1] === '\n';
    }

    // Knopen tot het einde, of tot de sluittag van 'closing' ('' voor een fragment), die op 'openedAt' openging.
    // Enkel op het hoogste niveau (closing === null) is een regel die met import of export begint ESM.
    flow(closing = null, openedAt = this.i) {
        const nodes = [];
        let text = '';
        const flush = () => {
            if (text) nodes.push({ type: 'text', text });
            text = '';
        };
        while (this.i < this.text.length) {
            if (this.atLineStart()) {
                const fence = /^[ \t]*(`{3,}|~{3,})[^\n]*/.exec(this.text.slice(this.i));
                if (fence) {
                    flush();
                    nodes.push({ type: 'code', text: this.fence(fence[1]) });
                    continue;
                }
                if (closing === null && /^(import|export)\s/.test(this.text.slice(this.i, this.i + 7))) {
                    flush();
                    const start = this.i;
                    nodes.push({ type: 'esm', text: this.esm(), start, end: this.i });
                    continue;
                }
            }
            const c = this.text[this.i];
            const next = this.text[this.i + 1] ?? '';
            if (c === '`') {
                text += this.codeSpan();
            } else if (c === '\\' && '{}<>'.includes(next)) {
                text += c + next;
                this.i += 2;
            } else if (c === '<' && next === '/') {
                if (closing === null) this.fail(`Een sluittag zonder open tag: ${short(this.text.slice(this.i))}`);
                const match = /^<\/([A-Za-z][\w.:-]*)?\s*>/.exec(this.text.slice(this.i));
                if (!match || (match[1] ?? '') !== closing) {
                    this.fail(`Verwacht </${closing}>, gevonden: ${short(this.text.slice(this.i, this.i + 40))}`);
                }
                this.i += match[0].length;
                flush();
                return nodes;
            } else if (c === '<' && this.text.startsWith('<!--', this.i)) {
                const end = this.text.indexOf('-->', this.i);
                if (end < 0) this.fail('Een HTML-commentaar sluit niet af.');
                flush();
                this.i = end + 3;
            } else if (c === '<' && /^<https?:\/\//.test(this.text.slice(this.i, this.i + 10))) {
                const end = this.text.indexOf('>', this.i);
                text += this.text.slice(this.i, end + 1);
                this.i = end + 1;
            } else if (c === '<' && /[A-Za-z>]/.test(next)) {
                flush();
                nodes.push(this.element());
            } else if (c === '{') {
                flush();
                const start = this.i + 1;
                this.i = scanJs(this.text, start, this);
                nodes.push({ type: 'expression', source: this.text.slice(start, this.i - 1) });
            } else {
                text += c;
                this.i++;
            }
        }
        if (closing !== null) {
            this.i = openedAt;
            this.fail(`<${closing}> sluit niet af.`);
        }
        flush();
        return nodes;
    }

    // Een codeblok, letterlijk, tot en met de regel die het sluit.
    fence(marker) {
        const start = this.i;
        let end = this.text.indexOf('\n', this.i);
        const closing = new RegExp(`^[ \\t]*${marker[0] === '`' ? '`' : '~'}{${marker.length},}[ \\t]*$`);
        while (end >= 0) {
            const lineStart = end + 1;
            const lineEnd = this.text.indexOf('\n', lineStart);
            const line = this.text.slice(lineStart, lineEnd < 0 ? undefined : lineEnd);
            if (closing.test(line)) {
                this.i = lineEnd < 0 ? this.text.length : lineEnd + 1;
                return this.text.slice(start, this.i);
            }
            end = lineEnd;
        }
        this.i = this.text.length;
        return this.text.slice(start);
    }

    // Code tussen backticks, letterlijk. Zonder sluitende backticks is het gewone tekst.
    codeSpan() {
        const run = /^`+/.exec(this.text.slice(this.i))[0];
        let search = this.i + run.length;
        while (true) {
            const found = this.text.indexOf(run, search);
            if (found < 0) break;
            if (this.text[found + run.length] !== '`' && this.text[found - 1] !== '`') {
                const span = this.text.slice(this.i, found + run.length);
                this.i = found + run.length;
                return span;
            }
            search = found + 1;
        }
        this.i += run.length;
        return run;
    }

    // Een ESM-regel: tot het einde van de instructie.
    esm() {
        const start = this.i;
        let depth = 0;
        for (let i = this.i; i < this.text.length; i++) {
            const c = this.text[i];
            if (c === "'" || c === '"') i = scanString(this.text, i) - 1;
            else if (c === '`') i = scanTemplate(this.text, i, this) - 1;
            else if (c === '/' && this.text[i + 1] === '/') {
                while (i < this.text.length && this.text[i + 1] !== '\n') i++;
            }
            else if ('{[('.includes(c)) depth++;
            else if ('}])'.includes(c)) depth--;
            else if (c === '\n' && depth === 0) {
                const statement = this.text.slice(start, i).trim();
                const nextLine = this.text.slice(i + 1).split('\n')[0];
                const continues =
                    /^\s+\S/.test(nextLine) || /^[.)\]}]/.test(nextLine.trim()) || /[=,(+]$/.test(statement);
                if (statement.endsWith(';') || !continues) {
                    this.i = i + 1;
                    return this.text.slice(start, i);
                }
            }
        }
        this.i = this.text.length;
        return this.text.slice(start);
    }

    // Een JSX-element of fragment, vanaf '<'.
    element() {
        const openedAt = this.i;
        this.i++;
        if (this.text[this.i] === '>') {
            this.i++;
            return { type: 'element', name: '', attributes: [], children: this.flow('', openedAt) };
        }
        const name = /^[A-Za-z][\w.:-]*/.exec(this.text.slice(this.i))[0];
        this.i += name.length;
        const attributes = [];
        while (true) {
            while (/\s/.test(this.text[this.i] ?? '')) this.i++;
            if (this.i >= this.text.length) this.fail(`<${name}> sluit niet af.`);
            if (this.text.startsWith('/>', this.i)) {
                this.i += 2;
                return { type: 'element', name, attributes, children: [] };
            }
            if (this.text[this.i] === '>') {
                this.i++;
                break;
            }
            if (this.text[this.i] === '{') {
                const start = this.i + 1;
                this.i = scanJs(this.text, start, this);
                attributes.push({ spread: this.text.slice(start, this.i - 1) });
                continue;
            }
            const attribute = /^[^\s=/>{}"']+/.exec(this.text.slice(this.i))?.[0];
            if (!attribute) this.fail(`Onverwacht teken in <${name}>: ${short(this.text.slice(this.i, this.i + 20))}`);
            this.i += attribute.length;
            while (/[ \t]/.test(this.text[this.i] ?? '')) this.i++;
            if (this.text[this.i] !== '=') {
                attributes.push({ name: attribute, value: { type: 'boolean' } });
                continue;
            }
            this.i++;
            while (/\s/.test(this.text[this.i] ?? '')) this.i++;
            const c = this.text[this.i];
            if (c === '"' || c === "'") {
                const end = this.text.indexOf(c, this.i + 1);
                if (end < 0) this.fail(`Attribuut ${attribute} van <${name}> sluit niet af.`);
                const value = this.text.slice(this.i + 1, end);
                attributes.push({ name: attribute, value: { type: 'string', value } });
                this.i = end + 1;
            } else if (c === '{') {
                const start = this.i + 1;
                this.i = scanJs(this.text, start, this);
                const source = this.text.slice(start, this.i - 1);
                attributes.push({ name: attribute, value: { type: 'expression', source } });
            } else if (c === '<') {
                attributes.push({ name: attribute, value: { type: 'element', node: this.element() } });
            } else {
                this.fail(`Onverwachte waarde voor ${attribute} in <${name}>.`);
            }
        }
        if (/^[a-z]/.test(name) && VOID.has(name.toLowerCase())) {
            return { type: 'element', name, attributes, children: [] };
        }
        return { type: 'element', name, attributes, children: this.flow(name, openedAt) };
    }
}

// Parset MDX. 'esm' zijn de import- en export-regels, 'nodes' de rest.
export function parseMdx(text, file) {
    const nodes = new Parser(text, file).flow(null);
    return { esm: nodes.filter((node) => node.type === 'esm').map((node) => node.text), nodes };
}

// De imports uit ESM-regels: per regel de bron en de namen die ze krijgt.
//   import X from './a.mdx'             → { source, default: 'X' }
//   import * as S from './a.stories'    → { source, namespace: 'S' }
//   import { A, B as C } from './b'     → { source, named: [{ imported: 'A', local: 'A' }, …] }
export function parseImports(esm) {
    const imports = [];
    for (const statement of esm) {
        const match = /^\s*import\s+([\s\S]*?)\s+from\s+(['"])(.*?)\2/.exec(statement);
        if (!match) continue;
        const [, clause, , source] = match;
        const entry = { source, default: null, namespace: null, named: [] };
        const namespace = /\*\s+as\s+([\w$]+)/.exec(clause);
        if (namespace) entry.namespace = namespace[1];
        const named = /\{([\s\S]*)\}/.exec(clause);
        if (named) {
            for (const part of named[1].split(',').map((item) => item.trim()).filter(Boolean)) {
                const [imported, local] = part.split(/\s+as\s+/);
                entry.named.push({ imported: imported.trim(), local: (local ?? imported).trim() });
            }
        }
        const rest = clause.replace(/\{[\s\S]*\}/, '').replace(/\*\s+as\s+[\w$]+/, '');
        const defaultName = /^\s*([\w$]+)\s*(,|$)/.exec(rest);
        if (defaultName) entry.default = defaultName[1];
        imports.push(entry);
    }
    return imports;
}

// De constanten uit 'export const X = …': per naam de bron van de waarde.
export function parseExports(esm) {
    const exports = new Map();
    for (const statement of esm) {
        const match = /^\s*export\s+const\s+([\w$]+)\s*=\s*([\s\S]*?);?\s*$/.exec(statement);
        if (match) exports.set(match[1], match[2]);
    }
    return exports;
}

// ---------------------------------------------------------------------------------------------------------------
// Waarden.

function unescapeJs(text) {
    return text.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, code) => {
        if (code[0] === 'u') return String.fromCodePoint(parseInt(code.replace(/[u{}]/g, ''), 16));
        if (code[0] === 'x' && code.length === 3) return String.fromCharCode(parseInt(code.slice(1), 16));
        return { n: '\n', t: '\t', r: '', '\n': '' }[code] ?? code;
    });
}

// De posities waar 'match' een operator vindt buiten strings, template literals, JSX en haakjes. 'match(text, i)'
// geeft de lengte van de operator op i, of 0.
function topLevel(text, match) {
    const found = [];
    let depth = 0;
    let previous = '';
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === "'" || c === '"') {
            i = scanString(text, i) - 1;
        } else if (c === '`') {
            i = scanTemplate(text, i) - 1;
        } else if (c === '<' && /[A-Za-z>]/.test(text[i + 1] ?? '') && /^$|[(,=:?[{}!&|>]$/.test(previous)) {
            const sub = new Parser(text);
            sub.i = i;
            sub.element();
            i = sub.i - 1;
        } else if ('{[('.includes(c)) {
            depth++;
        } else if ('}])'.includes(c)) {
            depth--;
        } else if (depth === 0) {
            const length = match(text, i);
            if (length > 0) {
                found.push([i, length]);
                i += length - 1;
            }
        }
        if (!/\s/.test(c)) previous = text[i];
    }
    return found;
}

// Splitst op een operator buiten strings, template literals, JSX en haakjes.
function splitTopLevel(text, operator) {
    const isOperator = (t, i) => {
        if (!t.startsWith(operator, i)) return 0;
        if (operator === '+' && (t[i + 1] === '+' || t[i - 1] === '+')) return 0;
        if (operator === '=' && (/[=!<>]/.test(t[i - 1] ?? '') || /[=>]/.test(t[i + 1] ?? ''))) return 0;
        return operator.length;
    };
    const parts = [];
    let start = 0;
    for (const [i, length] of topLevel(text, isOperator)) {
        parts.push(text.slice(start, i));
        start = i + length;
    }
    parts.push(text.slice(start));
    return parts;
}

// De voorwaarde, de waarde als ze klopt en de waarde als ze niet klopt, of null zonder '?' op het hoogste niveau.
function ternary(text) {
    const marks = topLevel(text, (t, i) =>
        (t[i] === '?' && !'.?'.includes(t[i + 1] ?? '') && t[i - 1] !== '?') || t[i] === ':' ? 1 : 0,
    );
    const question = marks.findIndex(([i]) => text[i] === '?');
    if (question < 0) return null;
    let depth = 0;
    for (let k = question + 1; k < marks.length; k++) {
        if (text[marks[k][0]] === '?') depth++;
        else if (depth > 0) depth--;
        else {
            const [at, end] = [marks[question][0], marks[k][0]];
            return [text.slice(0, at), text.slice(at + 1, end), text.slice(end + 1)];
        }
    }
    return null;
}

// De positie van het haakje dat het haakje op 'open' sluit.
function matchingClose(text, open) {
    const close = { '(': ')', '[': ']', '{': '}' }[text[open]];
    let depth = 0;
    for (let i = open; i < text.length; i++) {
        const c = text[i];
        if (c === "'" || c === '"') i = scanString(text, i) - 1;
        else if (c === '`') i = scanTemplate(text, i) - 1;
        else if ('([{'.includes(c)) depth++;
        else if (')]}'.includes(c)) {
            depth--;
            if (depth === 0) return c === close ? i : -1;
        }
    }
    return -1;
}

const truthy = (value) =>
    !(value === undefined || value === null || value === false || ['', 'false', '0'].includes(value));

// Een pijlfunctie met een expressie als body, zoals '(component: string, sourceCode = false) => `…`', of null.
// Enkel om HTML uit een helper te kunnen tonen: ze wordt nooit uitgevoerd, enkel uitgerekend met evaluate.
export function arrowFunction(source) {
    let s = source.trim();
    let params;
    if (s[0] === '(') {
        const close = matchingClose(s, 0);
        if (close < 0) return null;
        params = s.slice(1, close);
        s = s.slice(close + 1).trim();
    } else {
        const match = /^([A-Za-z_$][\w$]*)\s*/.exec(s);
        if (!match) return null;
        params = match[1];
        s = s.slice(match[0].length);
    }
    s = s.replace(/^:[^=]*?(?==>)/, '').trim();
    if (!s.startsWith('=>')) return null;
    const body = s.slice(2).trim();
    if (body.startsWith('{')) return null;
    const param = (text) => {
        const [left, ...rest] = splitTopLevel(text, '=');
        const fallback = rest.length > 0 ? rest.join('=').trim() : undefined;
        const target = left.trim();
        if (target.startsWith('{')) {
            const names = splitTopLevel(target.slice(1, matchingClose(target, 0)), ',')
                .filter((part) => part.trim())
                .map((part) => {
                    const [name, ...value] = splitTopLevel(part, '=');
                    const fallback = value.length > 0 ? value.join('=').trim() : undefined;
                    return { name: name.split(':')[0].trim(), default: fallback };
                });
            return { destructure: names, default: fallback };
        }
        return { name: target.split(':')[0].trim(), default: fallback };
    };
    return { params: params.trim() ? splitTopLevel(params, ',').filter((p) => p.trim()).map(param) : [], body };
}

// Roept een pijlfunctie van arrowFunction aan met de argumenten in 'args' (bron). 'fn.scope' geeft de namen van de
// module waarin ze staat.
function invoke(fn, args, scope, file) {
    const values = args.trim() ? splitTopLevel(args, ',').map((arg) => evaluate(arg, scope, file)) : [];
    const bound = new Map();
    fn.params.forEach((param, n) => {
        let value = values[n];
        if (value === undefined && param.default !== undefined) value = evaluate(param.default, fn.scope, file);
        if (param.destructure) {
            const object = value?.literal ?? {};
            for (const { name, default: fallback } of param.destructure) {
                const item = object[name];
                if (item === undefined) {
                    bound.set(name, fallback === undefined ? null : evaluate(fallback, fn.scope, file));
                }
                else bound.set(name, typeof item === 'object' ? { literal: item } : String(item));
            }
        } else {
            bound.set(param.name, value === undefined ? null : value);
        }
    });
    return evaluate(fn.body, (name) => (bound.has(name) ? bound.get(name) : fn.scope(name)), file);
}

function stripComments(source) {
    let result = '';
    for (let i = 0; i < source.length; i++) {
        const c = source[i];
        if (c === "'" || c === '"' || c === '`') {
            const end = c === '`' ? scanTemplate(source, i) : scanString(source, i);
            result += source.slice(i, end);
            i = end - 1;
        } else if (c === '/' && source[i + 1] === '*') {
            i = source.indexOf('*/', i + 2) + 1;
        } else if (c === '/' && source[i + 1] === '/') {
            while (i < source.length && source[i + 1] !== '\n') i++;
        } else {
            result += c;
        }
    }
    return result;
}

// De waarde van een expressie: een tekst, { nodes } voor JSX, { literal } voor een object of array, of undefined voor
// een lege expressie of commentaar. 'scope' geeft de waarde van een naam, undefined als ze onbekend is, of null als
// ze bestaat maar geen waarde heeft. Een functie uit 'scope' ({ params, body, scope }) wordt uitgerekend.
export function evaluate(source, scope = () => undefined, file) {
    // JSX eerst: een apostrof in de tekst is geen string.
    const s = source.trim().startsWith('<') ? source.trim() : stripComments(source).trim();
    if (s === '') return undefined;
    const sub = (text) => evaluate(text, scope, file);
    const fail = () => {
        throw new MdxError(`${file ?? 'MDX'}: kan de expressie niet bepalen: {${short(s)}}`);
    };
    if ((s[0] === "'" || s[0] === '"') && scanString(s, 0) === s.length) return unescapeJs(s.slice(1, -1));
    if (s[0] === '`' && scanTemplate(s, 0) === s.length) return template(s.slice(1, -1), scope, file);
    if (s[0] === '<') {
        const parser = new Parser(s, file);
        const node = parser.element();
        if (parser.text.slice(parser.i).trim() === '') return { nodes: [node] };
    }
    // Van de laagste naar de hoogste voorrang.
    const condition = ternary(s);
    if (condition) return truthy(sub(condition[0])) ? sub(condition[1]) : sub(condition[2]);
    for (const operator of ['||', '&&']) {
        const parts = splitTopLevel(s, operator);
        if (parts.length === 1) continue;
        let value;
        for (const part of parts) {
            value = sub(part);
            if (operator === '||' ? truthy(value) : !truthy(value)) return value;
        }
        return value;
    }
    for (const operator of ['===', '!==']) {
        const parts = splitTopLevel(s, operator);
        if (parts.length !== 2) continue;
        const equal = toText(sub(parts[0])) === toText(sub(parts[1]));
        return String(operator === '===' ? equal : !equal);
    }
    const sum = splitTopLevel(s, '+');
    if (sum.length > 1) return sum.map((part) => toText(sub(part))).join('');
    if (s[0] === '!') return String(!truthy(sub(s.slice(1))));
    if (/^[A-Za-z_$][\w$]*$/.test(s)) {
        if (s === 'true' || s === 'false') return s;
        if (s === 'null' || s === 'undefined') return undefined;
        const value = scope(s);
        if (value === undefined) throw new MdxError(`${file ?? 'MDX'}: onbekende naam {${s}}`);
        return value === null ? undefined : value;
    }
    if (/^-?\d+(\.\d+)?$/.test(s)) return s;
    if (s[0] === '(' && matchingClose(s, 0) === s.length - 1) return sub(s.slice(1, -1));
    const method = /^([\s\S]+)\.(trim|toString|toLowerCase|toUpperCase)\(\)$/.exec(s);
    if (method) {
        const value = sub(method[1]);
        if (typeof value !== 'string') fail();
        return value[method[2]]();
    }
    const call = /^([A-Za-z_$][\w$]*)\s*\(/.exec(s);
    if (call && matchingClose(s, call[0].length - 1) === s.length - 1) {
        const fn = scope(call[1]);
        if (fn?.params) return invoke(fn, s.slice(call[0].length, -1), scope, file);
    }
    if (s[0] === '{' || s[0] === '[') {
        try {
            return { literal: parseLiteral(s) };
        } catch {
            fail();
        }
    }
    fail();
}

function template(body, scope, file) {
    let result = '';
    for (let i = 0; i < body.length; i++) {
        const c = body[i];
        if (c === '\\') {
            result += unescapeJs(body.slice(i, i + 2));
            i++;
        } else if (c === '$' && body[i + 1] === '{') {
            const end = scanJs(body, i + 2);
            result += toText(evaluate(body.slice(i + 2, end - 1), scope, file));
            i = end - 1;
        } else {
            result += c;
        }
    }
    return result;
}

const toText = (value) => (value === undefined || value === null || typeof value === 'object' ? '' : String(value));

// Het einde (exclusief) van een instructie in JavaScript die op 'start' begint: een ';' buiten haakjes, of een nieuwe
// regel waarna iets nieuws begint zonder inspringing.
export function statementEnd(text, start) {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
        const c = text[i];
        if (c === "'" || c === '"') i = scanString(text, i) - 1;
        else if (c === '`') i = scanTemplate(text, i) - 1;
        else if (c === '/' && text[i + 1] === '/') while (i < text.length && text[i + 1] !== '\n') i++;
        else if (c === '/' && text[i + 1] === '*') i = text.indexOf('*/', i + 2) + 1;
        else if ('{[('.includes(c)) depth++;
        else if ('}])'.includes(c)) depth--;
        else if (c === ';' && depth === 0) return i + 1;
        else if (c === '\n' && depth === 0) {
            const statement = text.slice(start, i).trim();
            const next = text.slice(i + 1).split('\n').find((line) => line.trim() !== '') ?? '';
            const continues =
                /^\s/.test(next) || /^[.)\]}?:+|&]/.test(next) || /(=|\(|,|=>|\+|\?|:|&&|\|\|)$/.test(statement);
            if (statement && !continues) return i;
        }
    }
    return text.length;
}

// De bron van de waarde van 'const <name> = …' in JavaScript of TypeScript, of null.
export function initializerOf(text, name) {
    const declaration = `(?:^|\\n)\\s*(?:export\\s+)?(?:const|let|var)\\s+${name}\\s*(?::[^=\\n]+)?=\\s*`;
    const match = new RegExp(declaration).exec(text);
    if (!match) return null;
    const start = match.index + match[0].length;
    return text.slice(start, statementEnd(text, start)).trim().replace(/;$/, '');
}

// De volledige declaratie van '<name>' (een const of een function), of null.
export function declarationOf(text, name) {
    const kinds = `(?:(?:const|let|var)\\s+${name}\\b|(?:async\\s+)?function\\s+${name}\\b)`;
    const match = new RegExp(`(?:^|\\n)([ \\t]*(?:export\\s+)?${kinds})`).exec(text);
    if (!match) return null;
    const start = match.index + match[0].length - match[1].length;
    return text.slice(start, statementEnd(text, start)).trim();
}

// Een letterlijke waarde uit JavaScript: een object, een array, een tekst, een getal of een boolean. Voor props als
// colors={{ 'Naam': '#fff' }}.
export function parseLiteral(source) {
    const text = stripComments(source).trim();
    let i = 0;
    const ws = () => {
        while (/\s/.test(text[i] ?? '')) i++;
    };
    const value = () => {
        ws();
        const c = text[i];
        if (c === '{' || c === '[') {
            const object = c === '{';
            const result = object ? {} : [];
            i++;
            while (true) {
                ws();
                if (text[i] === (object ? '}' : ']')) {
                    i++;
                    return result;
                }
                if (object) {
                    let key;
                    if (text[i] === "'" || text[i] === '"') {
                        const end = scanString(text, i);
                        key = unescapeJs(text.slice(i + 1, end - 1));
                        i = end;
                    } else {
                        key = /^[\w$-]+/.exec(text.slice(i))?.[0];
                        if (!key) throw new MdxError(`Geen letterlijke waarde: ${short(text)}`);
                        i += key.length;
                    }
                    ws();
                    if (text[i++] !== ':') throw new MdxError(`Geen letterlijke waarde: ${short(text)}`);
                    result[key] = value();
                } else {
                    result.push(value());
                }
                ws();
                if (text[i] === ',') i++;
            }
        }
        if (c === "'" || c === '"') {
            const end = scanString(text, i);
            const result = unescapeJs(text.slice(i + 1, end - 1));
            i = end;
            return result;
        }
        if (c === '`') {
            const end = scanTemplate(text, i);
            const result = template(text.slice(i + 1, end - 1), () => undefined);
            i = end;
            return result;
        }
        const token = /^[\w.-]+/.exec(text.slice(i))?.[0];
        if (!token) throw new MdxError(`Geen letterlijke waarde: ${short(text)}`);
        i += token.length;
        if (token === 'true' || token === 'false') return token === 'true';
        if (/^-?\d/.test(token)) return Number(token);
        throw new MdxError(`Geen letterlijke waarde: ${short(text)}`);
    };
    const result = value();
    ws();
    if (i < text.length) throw new MdxError(`Geen letterlijke waarde: ${short(text)}`);
    return result;
}

// ---------------------------------------------------------------------------------------------------------------
// Renderen.

// De waarde van een attribuut: een tekst, true voor een attribuut zonder waarde, { nodes } voor JSX, of undefined.
export function attributeValue(node, name, ctx) {
    const attribute = node.attributes.find((a) => a.name === name);
    if (!attribute) return undefined;
    const { value } = attribute;
    if (value.type === 'string') return value.value;
    if (value.type === 'boolean') return true;
    if (value.type === 'element') return { nodes: [value.node] };
    return evaluate(value.source, ctx.scope, ctx.file);
}

// De bron van een attribuut in accolades, zoals of={Stories.Default}, of undefined.
export function attributeSource(node, name) {
    const value = node.attributes.find((a) => a.name === name)?.value;
    return value?.type === 'expression' ? value.source.trim() : value?.type === 'string' ? value.value : undefined;
}

// Een waarde als Markdown: tekst zoals ze is, JSX gerenderd.
export function valueToMarkdown(value, ctx) {
    if (value === undefined || value === false || value === 'false') return '';
    if (typeof value === 'object' && value.nodes) return renderNodes(value.nodes, ctx);
    return String(value);
}

// Tekst die in HTML of een tabelcel geen tag mag lijken.
const escapeTags = (text) => text.replace(/<(?=[A-Za-z/!])/g, '&lt;');

function renderChildrenText(node, ctx, { escape = false } = {}) {
    return node.children
        .map((child) => {
            if (child.type === 'expression') {
                const value = evaluate(child.source, ctx.scope, ctx.file);
                if (typeof value === 'object' && value?.nodes) return renderNodes(value.nodes, ctx);
                return escape ? escapeTags(toText(value)) : toText(value);
            }
            return renderNodes([child], ctx);
        })
        .join('');
}

const inline = (text) => text.replace(/\s*\n\s*/g, ' ').trim();
const block = (text) => `\n\n${text.trim()}\n\n`;

// Een HTML-tabel als Markdown-tabel. Een cel wordt één regel; een nieuwe regel in een cel wordt <br>.
function table(node, ctx) {
    const rows = [];
    const collect = (element) => {
        for (const child of element.children.filter((c) => c.type === 'element')) {
            const name = child.name.toLowerCase();
            if (name === 'tr') {
                const cells = child.children.filter((c) => c.type === 'element' && /^t[hd]$/i.test(c.name));
                rows.push({
                    header: cells.length > 0 && cells.every((c) => c.name.toLowerCase() === 'th'),
                    cells: cells.map((cell) =>
                        renderChildrenText(cell, { ...ctx, inTable: true }, { escape: true })
                            .trim()
                            .replace(/\n\s*\n/g, '<br>')
                            .replace(/\s*\n\s*/g, ' ')
                            .replace(/\|/g, '\\|'),
                    ),
                });
            } else if (['thead', 'tbody', 'tfoot'].includes(name)) {
                collect(child);
            }
        }
    };
    collect(node);
    if (rows.length === 0) return '';
    const width = Math.max(...rows.map((row) => row.cells.length));
    const line = (cells) => `| ${[...cells, ...Array(width - cells.length).fill('')].join(' | ')} |`;
    const [first, ...rest] = rows[0].header ? rows : [{ cells: Array(width).fill('') }, ...rows];
    return block([line(first.cells), line(Array(width).fill('---')), ...rest.map((row) => line(row.cells))].join('\n'));
}

// Een HTML-element, zoals Storybook het zou tonen.
function html(node, ctx) {
    const name = node.name.toLowerCase();
    const children = () => renderChildrenText(node, ctx, { escape: true });
    switch (name) {
        case 'br':
            return ctx.inTable ? '<br>' : '\n';
        case 'hr':
            return block('---');
        case 'code': {
            const text = inline(children()).replace(/&lt;/g, '<');
            const ticks = text.includes('`') ? '``' : '`';
            return text ? `${ticks}${text}${ticks}` : '';
        }
        case 'strong':
        case 'b': {
            const text = inline(children());
            return text ? `**${text}**` : '';
        }
        case 'em':
        case 'i': {
            const text = inline(children());
            return text ? `*${text}*` : '';
        }
        case 'a': {
            const href = attributeValue(node, 'href', ctx);
            const text = inline(children());
            return typeof href === 'string' ? `[${text || href}](${href})` : text;
        }
        case 'img': {
            const src = attributeValue(node, 'src', ctx);
            return `![${attributeValue(node, 'alt', ctx) ?? ''}](${src ?? ''})`;
        }
        case 'p':
            return block(children());
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
            return block(`${'#'.repeat(Number(name[1]))} ${inline(children())}`);
        case 'ul':
        case 'ol': {
            const items = node.children.filter((c) => c.type === 'element' && c.name.toLowerCase() === 'li');
            const lines = items.map((item, n) => {
                const text = renderChildrenText(item, ctx, { escape: true }).trim().replace(/\n/g, '\n   ');
                return `${name === 'ol' ? `${n + 1}.` : '-'} ${text}`;
            });
            return block(lines.join('\n'));
        }
        case 'table':
            return table(node, ctx);
        case 'pre':
            return block(`\`\`\`\n${dedent(renderChildrenText(node, ctx).replace(/&lt;/g, '<'))}\n\`\`\``);
        case 'details':
            return block(children());
        case 'summary':
            return block(`**${inline(children())}**`);
        case 'div':
        case 'section':
        case 'main':
        case 'article':
        case 'header':
        case 'footer':
        case 'figure':
        case 'center':
            return block(children());
        case 'span':
        case 'small':
        case 'sup':
        case 'sub':
        case 'u':
        case 'label':
        case 'li':
            return children();
        default: {
            // Een element dat Storybook live toont, zoals een vl-alert: als HTML, met de inhoud als Markdown.
            const attributes = node.attributes
                .filter((a) => a.name && !DROPPED_ATTRIBUTES.has(a.name) && !/^on[A-Z]/.test(a.name))
                .map((a) => {
                    const value = attributeValue(node, a.name, ctx);
                    if (value === true) return ` ${a.name}`;
                    if (value === undefined || typeof value === 'object') return '';
                    return ` ${a.name}="${String(value).replace(/"/g, '&quot;')}"`;
                })
                .join('');
            if (VOID.has(name)) return `<${node.name}${attributes}>`;
            const content = children();
            return content.includes('\n')
                ? block(`<${node.name}${attributes}>\n\n${content.trim()}\n\n</${node.name}>`)
                : `<${node.name}${attributes}>${content}</${node.name}>`;
        }
    }
}

// Rendert knopen als Markdown. De context bevat:
//   scope(naam)             de waarde van een naam in een expressie, of undefined;
//   component(node, ctx)    de Markdown voor een component, of undefined als het onbekend is;
//   file                    het bestand, voor de foutmeldingen.
export function renderNodes(nodes, ctx) {
    let out = '';
    for (const node of nodes) {
        if (node.type === 'text' || node.type === 'code') out += node.text;
        else if (node.type === 'expression') out += valueToMarkdown(evaluate(node.source, ctx.scope, ctx.file), ctx);
        else if (node.type === 'element' && node.name === '') out += renderNodes(node.children, ctx);
        else if (node.type === 'element' && /^[A-Z]|\./.test(node.name)) {
            const result = ctx.component(node, ctx);
            if (result === undefined) throw new MdxError(`${ctx.file ?? 'MDX'}: onbekend blok <${node.name}>.`);
            out += result;
        } else if (node.type === 'element') out += html(node, ctx);
    }
    return out;
}

// Ruimt de Markdown op: hoogstens één lege regel na elkaar en geen witruimte op het einde van een regel. Buiten een
// lijst verdwijnt de inspringing: MDX kent geen ingesprongen code, maar Markdown maakt er een codeblok van. Tekst uit
// JSX springt vaak mee in met de code eromheen. Codeblokken blijven zoals ze zijn.
export function tidyMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let fence = null;
    let inList = false;
    for (const line of lines) {
        const marker = /^[ \t]*(`{3,}|~{3,})/.exec(line)?.[1];
        if (fence) {
            out.push(line);
            const closes = marker && marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker;
            if (closes) fence = null;
            continue;
        }
        const trimmed = line.replace(/[ \t]+$/, '');
        if (trimmed === '') {
            if (out.length > 0 && out.at(-1) !== '') out.push('');
            continue;
        }
        if (/^[ \t]*([-*+]|\d+[.)])[ \t]/.test(trimmed)) inList = true;
        else if (!/^[ \t]/.test(trimmed)) inList = false;
        if (marker) fence = marker;
        out.push(inList || marker ? trimmed : trimmed.replace(/^[ \t]+/, ''));
    }
    while (out.at(-1) === '') out.pop();
    return `${out.join('\n')}\n`;
}
