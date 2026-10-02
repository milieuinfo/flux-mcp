// Controleert markup met Flux web-componenten tegen de web-types van een versie (ADR-004, sectie 4.7), zonder
// dependencies. Eén implementatie voor de tool flux_check_markup en voor storybook:check, dat er de voorbeelden van de
// analyses mee toetst.
//
//   parseMarkup(source, { syntax })                →  de elementen, met hun attributen, positie en ouder
//   checkMarkup(source, { syntax, webTypes, ... }) →  de bevindingen, gesorteerd op positie
//
// 'syntax' is 'html' of 'lit'. In lit mag de invoer een template zijn of een heel .ts- of .js-bestand: de module neemt
// er de templates html`…` uit, ook die in een ${…} van een andere template, en zonder zo'n template de hele tekst.
// Een ${…} is een placeholder: een dynamische waarde controleert de module niet. attr=${…} is een attribuut,
// .prop=${…} een property, @event=${…} een event en ?attr=${…} een boolean attribuut. Een tag die pas bij het
// uitvoeren gekend is (unsafeStatic, literal), geeft een bevinding 'dynamic-tag'.
//
// De tokenizer houdt regel en kolom bij in de oorspronkelijke tekst, slaat commentaar en de inhoud van <script> en
// <style> over, en leest de inhoud van een <template> als markup. De ouder van een element is het element waarin het
// staat; in een geneste template het element waarin de ${…} staat. Een slot controleert hij enkel bij een direct kind
// van een vl-element: het slot-attribuut werkt enkel daar.
//
// De web-types kunnen onvolledig zijn: een attribuut dat wel in de code staat, zoals ellipsis van vl-breadcrumb in
// 2.20.0, geeft een fout, tenzij een analyse van Storybook het als 'not-in-web-types' noteert ('notes'). Dan is het
// een waarschuwing.

// ---------------------------------------------------------------------------------------------------------------
// Wat elk HTML-element kent.

// Attributen die op elk HTML-element mogen, naast aria-*, data-* en on*.
export const GLOBAL_ATTRIBUTES = new Set([
    'accesskey', 'autocapitalize', 'autofocus', 'class', 'contenteditable', 'dir', 'draggable', 'enterkeyhint',
    'exportparts', 'hidden', 'id', 'inert', 'inputmode', 'is', 'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype',
    'lang', 'name', 'nonce', 'part', 'popover', 'role', 'slot', 'spellcheck', 'style', 'tabindex', 'title', 'translate',
]);
export const isGlobalAttribute = (name) => GLOBAL_ATTRIBUTES.has(name) || /^(aria|data)-|^on[a-z]/.test(name);

// Properties die elk HTML-element heeft en die je in lit met .prop zet, naast aria* (ariaLabel) en on* (onclick).
const STANDARD_PROPERTIES = new Set([
    'accessKey', 'autocapitalize', 'autofocus', 'className', 'contentEditable', 'dir', 'draggable', 'enterKeyHint',
    'hidden', 'id', 'inert', 'innerHTML', 'innerText', 'inputMode', 'lang', 'nonce', 'outerHTML', 'outerText',
    'popover', 'role', 'scrollLeft', 'scrollTop', 'slot', 'spellcheck', 'style', 'tabIndex', 'textContent', 'title',
    'translate',
]);
const isStandardProperty = (name) => STANDARD_PROPERTIES.has(name) || /^aria[A-Z]|^on[a-z]+$/.test(name);

// De events die de browser op elk element kan afvuren.
const STANDARD_EVENTS = new Set([
    'abort', 'animationcancel', 'animationend', 'animationiteration', 'animationstart', 'auxclick', 'beforeinput',
    'beforetoggle', 'blur', 'cancel', 'change', 'click', 'close', 'compositionend', 'compositionstart',
    'compositionupdate', 'contextmenu', 'copy', 'cut', 'dblclick', 'drag', 'dragend', 'dragenter', 'dragleave',
    'dragover', 'dragstart', 'drop', 'error', 'focus', 'focusin', 'focusout', 'formdata', 'gotpointercapture', 'input',
    'invalid', 'keydown', 'keypress', 'keyup', 'load', 'lostpointercapture', 'mousedown', 'mouseenter', 'mouseleave',
    'mousemove', 'mouseout', 'mouseover', 'mouseup', 'paste', 'pointercancel', 'pointerdown', 'pointerenter',
    'pointerleave', 'pointermove', 'pointerout', 'pointerover', 'pointerup', 'reset', 'resize', 'scroll', 'scrollend',
    'select', 'selectionchange', 'slotchange', 'submit', 'toggle', 'touchcancel', 'touchend', 'touchmove', 'touchstart',
    'transitioncancel', 'transitionend', 'transitionrun', 'transitionstart', 'wheel',
]);

// Elementen zonder sluittag.
const VOID = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',
]);
// Elementen waarvan de inhoud geen markup is.
const RAW_TEXT = new Set(['script', 'style']);

export const SYNTAXES = ['lit', 'html'];
export const SEVERITIES = ['error', 'warning', 'info'];

// Staat in de tekst van een template op de plaats van een ${…}.
const PLACEHOLDER = '\uE000';
// Een tag-functie waarvan de template markup is: html`…`, en svg`…` en staticHtml`…` van lit.
const TEMPLATE_TAG = /(?:^|[^\w$])(html|svg|staticHtml)\s*$/;

// ---------------------------------------------------------------------------------------------------------------
// De templates uit JavaScript of TypeScript.

// Leest een template literal vanaf de backtick op 'start'. Geeft { unit, end }: de tekst met een PLACEHOLDER per
// ${…}, voor elk teken de plaats in de bron, en de geneste templates per placeholder. Met 'whole' is de hele bron
// vanaf 'start' de template, ook na een backtick.
function readTemplate(source, start, { whole = false } = {}) {
    const unit = { text: '', origin: [], nested: [] };
    let i = whole ? start : start + 1;
    while (i < source.length) {
        const char = source[i];
        if (char === '\\' && !whole) {
            unit.text += source.slice(i, i + 2);
            unit.origin.push(i, i + 1);
            i += 2;
        } else if (char === '`' && !whole) {
            return { unit, end: i + 1 };
        } else if (char === '$' && source[i + 1] === '{') {
            const expression = readExpression(source, i + 2);
            unit.text += PLACEHOLDER;
            unit.origin.push(i);
            for (const nested of expression.templates) unit.nested.push({ at: unit.text.length - 1, unit: nested });
            i = expression.end;
        } else {
            unit.text += char;
            unit.origin.push(i);
            i++;
        }
    }
    return { unit, end: source.length };
}

// Leest een expressie tot de } die haar sluit, met strings, commentaar en geneste templates. Geeft de templates met
// markup erin en de plaats na de }.
function readExpression(source, start) {
    const templates = [];
    let depth = 1;
    let i = start;
    while (i < source.length) {
        const char = source[i];
        if (char === '"' || char === "'") {
            i = skipString(source, i);
        } else if (char === '/' && source[i + 1] === '/') {
            i = source.indexOf('\n', i) === -1 ? source.length : source.indexOf('\n', i);
        } else if (char === '/' && source[i + 1] === '*') {
            i = source.indexOf('*/', i + 2) === -1 ? source.length : source.indexOf('*/', i + 2) + 2;
        } else if (char === '`') {
            const { unit, end } = readTemplate(source, i);
            if (TEMPLATE_TAG.test(source.slice(Math.max(0, i - 20), i))) templates.push(unit);
            else templates.push(...unit.nested.map((item) => item.unit));
            i = end;
        } else {
            if (char === '{') depth++;
            if (char === '}' && --depth === 0) return { templates, end: i + 1 };
            i++;
        }
    }
    return { templates, end: source.length };
}

function skipString(source, start) {
    const quote = source[start];
    let i = start + 1;
    while (i < source.length && source[i] !== quote && source[i] !== '\n') i += source[i] === '\\' ? 2 : 1;
    return i + 1;
}

// De templates met markup in een bestand: elke html`…` buiten strings en commentaar, met de templates die erin genest
// zijn. Zonder zo'n template de hele tekst, met ${…} als placeholder.
function templatesOf(source) {
    const units = [];
    let i = 0;
    while (i < source.length) {
        const char = source[i];
        if (char === '"' || char === "'") {
            i = skipString(source, i);
        } else if (char === '/' && source[i + 1] === '/') {
            const end = source.indexOf('\n', i);
            i = end === -1 ? source.length : end;
        } else if (char === '/' && source[i + 1] === '*') {
            const end = source.indexOf('*/', i + 2);
            i = end === -1 ? source.length : end + 2;
        } else if (char === '`') {
            const { unit, end } = readTemplate(source, i);
            if (TEMPLATE_TAG.test(source.slice(Math.max(0, i - 20), i))) units.push(unit);
            else units.push(...unit.nested.map((item) => item.unit));
            i = end;
        } else {
            i++;
        }
    }
    if (units.length > 0) return units;
    // Geen template: de hele tekst is markup, met ${…} als placeholder.
    return [readTemplate(source, 0, { whole: true }).unit];
}

// ---------------------------------------------------------------------------------------------------------------
// HTML.

const NAME = /[^\s"'>/=\uE000]/;

// Leest de elementen van één template of HTML-tekst. 'parent' is het element waarin de template staat.
function tokenize(unit, elements, parent) {
    const { text, origin } = unit;
    const stack = parent == null ? [] : [parent];
    const top = () => stack.at(-1) ?? null;
    const placeholderParents = new Map();
    let i = 0;
    while (i < text.length) {
        const char = text[i];
        if (char === PLACEHOLDER) {
            placeholderParents.set(i, top());
            i++;
            continue;
        }
        if (char !== '<') {
            i++;
            continue;
        }
        if (text.startsWith('<!--', i)) {
            const end = text.indexOf('-->', i + 4);
            i = end === -1 ? text.length : end + 3;
            continue;
        }
        if (text[i + 1] === '!' || text[i + 1] === '?') {
            const end = text.indexOf('>', i);
            i = end === -1 ? text.length : end + 1;
            continue;
        }
        if (text[i + 1] === '/') {
            const match = /^<\/\s*([^\s>]*)\s*>?/.exec(text.slice(i));
            const name = (match?.[1] ?? '').toLowerCase();
            const at = stack.findLastIndex((id) => elements[id].tag === name);
            if (at >= (parent == null ? 0 : 1)) stack.length = at;
            i += match ? match[0].length : 2;
            continue;
        }
        const dynamic = text[i + 1] === PLACEHOLDER;
        const nameMatch = dynamic ? null : /^[A-Za-z][A-Za-z0-9:._-]*/.exec(text.slice(i + 1));
        if (!dynamic && !nameMatch) {
            i++;
            continue;
        }
        if (dynamic) placeholderParents.set(i + 1, top());
        const tag = dynamic ? PLACEHOLDER : nameMatch[0].toLowerCase();
        const element = { tag, name: dynamic ? null : tag, dynamic, offset: origin[i], parent: top(), attributes: [] };
        let j = i + 1 + (dynamic ? 1 : nameMatch[0].length);
        let selfClosing = false;
        // De attributen, tot > of />.
        while (j < text.length) {
            while (j < text.length && /\s/.test(text[j])) j++;
            if (text[j] === '>') {
                j++;
                break;
            }
            if (text[j] === '/' && text[j + 1] === '>') {
                selfClosing = true;
                j += 2;
                break;
            }
            if (text[j] === PLACEHOLDER) {
                placeholderParents.set(j, top());
                j++;
                continue;
            }
            const start = j;
            while (j < text.length && NAME.test(text[j])) j++;
            if (j === start) {
                j++;
                continue;
            }
            const raw = text.slice(start, j);
            let value = null;
            let valueEnd = j;
            let k = j;
            while (k < text.length && /\s/.test(text[k])) k++;
            if (text[k] === '=') {
                k++;
                while (k < text.length && /\s/.test(text[k])) k++;
                const quote = text[k] === '"' || text[k] === "'" ? text[k] : null;
                if (quote) {
                    const close = text.indexOf(quote, k + 1);
                    value = text.slice(k + 1, close === -1 ? text.length : close);
                    valueEnd = close === -1 ? text.length : close + 1;
                } else {
                    let end = k;
                    while (end < text.length && !/[\s>]/.test(text[end])) end++;
                    value = text.slice(k, end);
                    valueEnd = end;
                }
                j = valueEnd;
            }
            const prefix = /^[.@?]/.exec(raw)?.[0] ?? '';
            const bare = raw.slice(prefix.length);
            element.attributes.push({
                raw,
                prefix,
                // Een property is hoofdlettergevoelig; een attribuut en een event niet in HTML.
                name: prefix === '.' || prefix === '@' ? bare : bare.toLowerCase(),
                value: value?.includes(PLACEHOLDER) ? null : value,
                dynamic: Boolean(value?.includes(PLACEHOLDER)),
                offset: origin[start],
            });
        }
        const id = elements.push(element) - 1;
        i = j;
        if (dynamic || (!VOID.has(tag) && !selfClosing)) stack.push(id);
        if (RAW_TEXT.has(tag)) {
            const close = text.toLowerCase().indexOf(`</${tag}`, i);
            for (let p = i; p < (close === -1 ? text.length : close); p++) {
                if (text[p] === PLACEHOLDER) placeholderParents.set(p, id);
            }
            i = close === -1 ? text.length : close;
        }
    }
    for (const item of unit.nested) tokenize(item.unit, elements, placeholderParents.get(item.at) ?? parent);
}

// De posities in een tekst als regel en kolom, vanaf 1.
function locator(source) {
    const starts = [0];
    for (let i = 0; i < source.length; i++) if (source[i] === '\n') starts.push(i + 1);
    return (offset) => {
        let low = 0;
        let high = starts.length - 1;
        while (low < high) {
            const middle = Math.ceil((low + high) / 2);
            if (starts[middle] <= offset) low = middle;
            else high = middle - 1;
        }
        return { line: low + 1, column: offset - starts[low] + 1 };
    };
}

// De elementen in markup: { tag, name, dynamic, line, column, parent, attributes }, met parent de index van het
// element waarin het staat, of null. Een attribuut is { raw, prefix, name, value, dynamic, line, column }: 'prefix'
// is '', '.', '@' of '?', 'value' null als ze ontbreekt of dynamisch is.
export function parseMarkup(source, { syntax = 'lit' } = {}) {
    const text = String(source ?? '');
    const units =
        syntax === 'lit'
            ? templatesOf(text)
            : [{ text, origin: Array.from({ length: text.length }, (_, index) => index), nested: [] }];
    const elements = [];
    for (const unit of units) tokenize(unit, elements, null);
    const at = locator(text);
    return elements.map(({ offset, attributes, ...element }) => ({
        ...element,
        ...at(offset),
        attributes: attributes.map(({ offset: position, ...attribute }) => ({ ...attribute, ...at(position) })),
    }));
}

// ---------------------------------------------------------------------------------------------------------------
// De controle.

// De waarden van een type als "'info' | 'success'", of null als het type geen lijst van letterlijke waarden is.
export function valuesOf(type) {
    if (typeof type !== 'string' || !type.includes("'")) return null;
    const parts = type.split('|').map((part) => part.trim());
    if (!parts.every((part) => /^'[^']*'$/.test(part))) return null;
    return parts.map((part) => part.slice(1, -1));
}

// De bewerkingsafstand tussen twee namen (Levenshtein).
function distance(a, b) {
    let row = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
        const next = [i];
        for (let j = 1; j <= b.length; j++) {
            next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        row = next;
    }
    return row[b.length];
}

// De drie namen die het dichtst bij een naam liggen, bij een gelijke afstand alfabetisch. De afstand telt zonder
// 'vl-', en enkel tot een derde van de naam: 'vl-buton' geeft vl-button, niet vl-icon.
export function closest(name, candidates, count = 3) {
    const core = (value) => value.replace(/^vl-/, '');
    const limit = Math.max(1, Math.floor(core(name).length / 3));
    return [...candidates]
        .map((candidate) => ({ candidate, distance: distance(core(name), core(candidate)) }))
        .filter((item) => item.distance <= limit)
        .sort((a, b) => a.distance - b.distance || a.candidate.localeCompare(b.candidate))
        .slice(0, count)
        .map((item) => item.candidate);
}

// De namen van de slots van een element. De web-types schrijven ze niet altijd als naam: 'image (slot)' en 'legend slot
// (vereist)' worden image en legend; het standaardslot '[default]' en een slot zonder naam vallen weg.
export function slotNames(element) {
    return (element.slots ?? [])
        .map((item) => item.name)
        .filter((name) => typeof name === 'string' && name !== '[default]')
        .map((name) =>
            name
                .replace(/\(.*?\)/g, '')
                .replace(/\bslot\b/g, '')
                .trim(),
        )
        .filter(Boolean);
}

const kebab = (name) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
const ORDER = { error: 0, warning: 1, info: 2 };

// Controleert markup tegen de web-types van één versie. Geeft de bevindingen, gesorteerd op regel, kolom en code:
// { code, severity, message, element, attribute, line, column, suggestion, source }.
//
//   webTypes   de web-types van de versie, zoals loadWebTypes ze geeft
//   notes      de notes van analyses van Storybook: { type: 'not-in-web-types', element, name } maakt van een fout
//              over dat element of attribuut een waarschuwing
//   next       de namen van de elementen met generatie v3-next
//   strict     lit-syntax in HTML is een fout, zoals storybook:check dat voor de voorbeelden van een analyse vraagt
export function checkMarkup(source, { syntax = 'lit', webTypes, notes = [], next = new Set(), strict = false } = {}) {
    const elements = parseMarkup(source, { syntax });
    const findings = [];
    // Hoofdletterongevoelig, zoals HTML: een note over 'zoomInTooltip' geldt voor zoomintooltip.
    const lower = (value) => (value == null ? null : String(value).toLowerCase());
    const known = (element, name = null) =>
        notes.some(
            (note) => note.type === 'not-in-web-types' && note.element === element && lower(note.name) === lower(name),
        );
    const add = (finding) => findings.push({ attribute: null, suggestion: null, source: 'web-types', ...finding });
    const names = [...(webTypes?.keys() ?? [])];

    for (const element of elements) {
        const at = { line: element.line, column: element.column };
        if (element.dynamic) {
            add({
                code: 'dynamic-tag',
                severity: 'info',
                message: 'Een tag die pas bij het uitvoeren gekend is (unsafeStatic, literal): niet gecontroleerd.',
                element: null,
                ...at,
                source: 'markup',
            });
        }
        // Een slot op een direct kind van een vl-element.
        const parent = element.parent == null ? null : elements[element.parent];
        const slot = element.attributes.find((attribute) => attribute.name === 'slot' && attribute.prefix === '');
        if (slot?.value && parent?.name?.startsWith('vl-') && webTypes?.has(parent.name)) {
            const slots = slotNames(webTypes.get(parent.name).element);
            if (!slots.includes(slot.value)) {
                const noted = known(parent.name, slot.value);
                const listed =
                    slots.length > 0 ? `; de slots zijn ${slots.join(', ')}` : '; de web-types noemen geen slots';
                add({
                    code: 'unknown-slot',
                    severity: 'warning',
                    message:
                        `${parent.name} heeft geen slot '${slot.value}' in de web-types${listed}.` +
                        (noted
                            ? ' Een analyse van Storybook noteert het als niet in de web-types.'
                            : ' De web-types kunnen onvolledig zijn; kijk de documentatie van de component na.'),
                    element: parent.name,
                    attribute: 'slot',
                    line: slot.line,
                    column: slot.column,
                    suggestion: closest(slot.value, slots)[0] ?? null,
                    source: noted ? 'storybook-analysis' : 'web-types',
                });
            }
        }
        if (!element.name?.startsWith('vl-')) continue;
        const entry = webTypes?.get(element.name)?.element;
        if (!entry) {
            const noted = known(element.name);
            const similar = closest(element.name, names);
            add({
                code: 'unknown-element',
                severity: noted ? 'warning' : 'error',
                message:
                    `<${element.name}> staat niet in de web-types van deze versie.` +
                    (noted ? ' Een analyse van Storybook noteert het als niet in de web-types.' : ''),
                element: element.name,
                ...at,
                suggestion: similar.length > 0 ? similar.join(', ') : null,
                source: noted ? 'storybook-analysis' : 'web-types',
            });
            continue;
        }
        if (entry.deprecated) {
            const text = typeof entry.deprecated === 'string' ? ` ${entry.deprecated}` : '';
            add({
                code: 'deprecated-element',
                severity: 'warning',
                message: `<${element.name}> is deprecated.${text}`,
                element: element.name,
                ...at,
            });
        }
        if (next.has(element.name)) {
            add({
                code: 'next-element',
                severity: 'info',
                message: `<${element.name}> is een voorloper van v3 (generatie v3-next).`,
                element: element.name,
                ...at,
                source: 'storybook',
            });
        }
        const attributes = entry.attributes ?? [];
        const properties = entry.js?.properties ?? [];
        const events = entry.js?.events ?? [];
        for (const attribute of element.attributes) {
            const where = {
                element: element.name,
                attribute: attribute.raw,
                line: attribute.line,
                column: attribute.column,
            };
            if (strict && attribute.prefix) {
                add({
                    code: 'lit-syntax',
                    severity: 'error',
                    message: `'${attribute.raw}' op <${element.name}> is lit-syntax; schrijf gewone HTML.`,
                    ...where,
                    source: 'markup',
                });
                continue;
            }
            if (attribute.prefix === '.') {
                const name = attribute.name;
                const isKnown =
                    properties.some((item) => item.name === name) ||
                    attributes.some((item) => item.name === name || item.name === kebab(name)) ||
                    isStandardProperty(name);
                if (!isKnown) {
                    add({
                        code: 'unknown-property',
                        severity: 'warning',
                        message: `<${element.name}> heeft geen property '${name}' in de web-types.`,
                        ...where,
                        suggestion:
                            closest(
                                name,
                                properties.map((item) => item.name),
                            )[0] ?? null,
                    });
                }
                continue;
            }
            if (attribute.prefix === '@') {
                if (!events.some((item) => item.name === attribute.name) && !STANDARD_EVENTS.has(attribute.name)) {
                    add({
                        code: 'unknown-event',
                        severity: 'warning',
                        message:
                            `<${element.name}> vuurt geen event '${attribute.name}' af volgens de web-types; ` +
                            'komt het van een element erin, dan klopt het wel.',
                        ...where,
                        suggestion:
                            closest(
                                attribute.name,
                                events.map((item) => item.name),
                            )[0] ?? null,
                    });
                }
                continue;
            }
            if (isGlobalAttribute(attribute.name)) continue;
            const definition = attributes.find((item) => item.name.toLowerCase() === attribute.name);
            if (!definition) {
                const noted = known(element.name, attribute.name);
                add({
                    code: 'unknown-attribute',
                    severity: noted ? 'warning' : 'error',
                    message:
                        `<${element.name}> heeft geen attribuut '${attribute.name}' in de web-types.` +
                        (noted
                            ? ' Een analyse van Storybook noteert het als niet in de web-types.'
                            : ' De web-types kunnen onvolledig zijn; kijk de documentatie van de component na.'),
                    ...where,
                    suggestion:
                        closest(
                            attribute.name,
                            attributes.map((item) => item.name),
                        )[0] ?? null,
                    source: noted ? 'storybook-analysis' : 'web-types',
                });
                continue;
            }
            if (definition.deprecated) {
                const text = typeof definition.deprecated === 'string' ? ` ${definition.deprecated}` : '';
                add({
                    code: 'deprecated-attribute',
                    severity: 'warning',
                    message: `'${attribute.name}' op <${element.name}> is deprecated.${text}`,
                    ...where,
                });
            }
            if (attribute.prefix !== '' || attribute.value == null) continue;
            const values = valuesOf(definition.value?.type);
            if (values && !values.includes(attribute.value)) {
                add({
                    code: 'invalid-attribute-value',
                    severity: 'warning',
                    message:
                        `'${attribute.value}' is geen waarde van '${attribute.name}' op <${element.name}> volgens de ` +
                        'web-types. Die kunnen onvolledig zijn: de beschrijving van het attribuut laat soms meer toe.',
                    ...where,
                    suggestion:
                        values.length <= 10
                            ? `Kies uit ${values.map((value) => `'${value}'`).join(', ')}.`
                            : (closest(attribute.value, values)[0] ?? null),
                });
            }
            if (['false', 'true'].includes(definition.default) && attribute.value.toLowerCase() === 'false') {
                add({
                    code: 'boolean-attribute-false',
                    severity: 'warning',
                    message:
                        `${attribute.name}="false" zet '${attribute.name}' op <${element.name}> net aan: een boolean ` +
                        'attribuut geldt zodra het er staat.',
                    ...where,
                    suggestion:
                        syntax === 'lit'
                            ? `Laat het attribuut weg, of gebruik ?${attribute.name}=\${…}.`
                            : 'Laat het attribuut weg.',
                });
            }
        }
    }
    return findings.sort(
        (a, b) =>
            a.line - b.line ||
            a.column - b.column ||
            ORDER[a.severity] - ORDER[b.severity] ||
            a.code.localeCompare(b.code),
    );
}
