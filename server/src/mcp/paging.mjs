// Verdeelt een groot antwoord van een tool over delen (ADR-004, sectie 4, omvang). De grens is 30.000 tekens,
// gemeten op de JSON van structuredContent: tekens en geen tokens, zodat de grens niet van een tokenizer afhangt en
// dezelfde vraag altijd dezelfde delen geeft.
//
//   paginate(result, { tool, args, sections, cursor })  →  het deel dat de cursor vraagt, standaard het eerste
//
// 'sections' zijn de paden in 'result' die kunnen groeien, in de volgorde waarin een model ze moet krijgen: lijsten,
// of met { path, text: true } een tekst, die op lege regels buiten codeblokken gesplitst wordt. Samen vormen ze één
// rij; een deel stopt bij het laatste stuk dat nog onder de grens past. Al de rest van 'result' staat op elk deel.
// Past alles in één deel, dan blijft het antwoord zoals het is. Anders krijgt elk deel 'part' en 'parts', en elk deel
// behalve het laatste een 'nextCursor'.
//
// De cursor is ondoorzichtig voor het model, maar enkel een codering van de tool, een hash van de andere argumenten
// en het nummer van het deel. Met andere argumenten is hij ongeldig.

import { createHash } from 'node:crypto';
import { CatalogError } from '../catalog.mjs';

export const BUDGET = 30000;
// Wat 'part', 'parts' en 'nextCursor' ongeveer innemen.
const PAGING_FIELDS = 200;

const at = (object, path) => path.reduce((value, key) => value?.[key], object);
function put(object, path, value) {
    const parent = path.slice(0, -1).reduce((current, key) => current[key], object);
    parent[path.at(-1)] = value;
}
const pathOf = (section) => (Array.isArray(section) ? section : section.path);
const isText = (section) => !Array.isArray(section) && section.text === true;

// Splitst een tekst op lege regels buiten codeblokken, zonder iets te verliezen: de stukken achter elkaar zijn de
// tekst. Een codeblok blijft zo heel, tenzij het zelf groter is dan een deel.
export function splitText(text) {
    const chunks = [];
    let current = '';
    let fence = null;
    for (const line of text.split(/(?<=\n)/)) {
        const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
        if (marker && (fence === null || marker.startsWith(fence))) fence = fence === null ? marker : null;
        current += line;
        if (fence === null && line.trim() === '' && current.trim() !== '') {
            chunks.push(current);
            current = '';
        }
    }
    if (current) chunks.push(current);
    return chunks;
}

// Een hash van de argumenten zonder cursor, met de sleutels gesorteerd.
function hashOf(args) {
    const stable = (value) => {
        if (Array.isArray(value)) return value.map(stable);
        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.keys(value)
                    .filter((key) => key !== 'cursor')
                    .sort()
                    .map((key) => [key, stable(value[key])]),
            );
        }
        return value;
    };
    return createHash('sha256')
        .update(JSON.stringify(stable(args ?? {})))
        .digest('hex')
        .slice(0, 16);
}

const encode = (cursor) => Buffer.from(JSON.stringify(cursor)).toString('base64url');

function decode(cursor, tool, hash, parts) {
    let decoded;
    try {
        decoded = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf-8'));
    } catch {
        throw new CatalogError('Deze cursor is ongeldig. Vraag opnieuw zonder cursor, en gebruik dan nextCursor.');
    }
    if (decoded?.t !== tool || decoded?.h !== hash) {
        throw new CatalogError(
            'Deze cursor hoort bij een andere vraag. Gebruik nextCursor met dezelfde argumenten als de vraag die ' +
                'hem gaf, of vraag opnieuw zonder cursor.',
        );
    }
    if (!Number.isInteger(decoded.p) || decoded.p < 1 || decoded.p >= parts) {
        const size = parts === 1 ? 'past in één deel; vraag zonder cursor' : `heeft ${parts} delen`;
        throw new CatalogError(`Deze cursor wijst naar een deel dat niet bestaat: het antwoord ${size}.`);
    }
    return decoded.p;
}

export function paginate(result, { tool, args, sections, cursor = null, budget = BUDGET }) {
    const present = sections.filter((section) => at(result, pathOf(section)) != null);
    const items = present.flatMap((section, index) => {
        const value = at(result, pathOf(section));
        const pieces = isText(section) ? splitText(value) : value;
        // Een stuk tekst deelt de aanhalingstekens met de rest; een element van een lijst krijgt een komma.
        const size = (piece) => JSON.stringify(piece).length + (isText(section) ? -2 : 1);
        return pieces.map((piece) => ({ index, piece, size: size(piece) }));
    });
    const empty = structuredClone(result);
    for (const section of present) put(empty, pathOf(section), isText(section) ? '' : []);
    const base = JSON.stringify(empty).length + PAGING_FIELDS;

    const parts = [[]];
    let size = base;
    for (const item of items) {
        if (parts.at(-1).length > 0 && size + item.size > budget) {
            parts.push([]);
            size = base;
        }
        parts.at(-1).push(item);
        size += item.size;
    }
    const hash = hashOf(args);
    if (parts.length === 1) {
        if (cursor != null) decode(cursor, tool, hash, 1);
        return result;
    }
    const number = cursor == null ? 0 : decode(cursor, tool, hash, parts.length);
    const part = structuredClone(empty);
    present.forEach((section, index) => {
        const pieces = parts[number].filter((item) => item.index === index).map((item) => item.piece);
        put(part, pathOf(section), isText(section) ? pieces.join('') : pieces);
    });
    part.part = number + 1;
    part.parts = parts.length;
    if (number + 1 < parts.length) part.nextCursor = encode({ t: tool, h: hash, p: number + 1 });
    return part;
}
