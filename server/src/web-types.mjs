// Laadt de web-types van een Flux-versie uit de catalogus en vergelijkt de API van twee versies.
//
// web-types-copy zet ze plat in catalog/flux/<versie>/web-types/<soort>.web-types.json. De diff toont wat er aan
// de elementen veranderde: attributen, slots, properties en events die erbij kwamen, verdwenen of wijzigden, en
// wijzigingen in de beschrijving en in 'deprecated'. De doc-url telt niet mee: die bevat het versienummer en
// verschilt dus altijd.

import fs from 'node:fs';
import path from 'node:path';

const SUFFIX = '.web-types.json';

// De onderdelen van een element die we vergelijken, en waar ze in de web-types staan.
const PARTS = [
    ['attributes', (element) => element.attributes],
    ['slots', (element) => element.slots],
    ['properties', (element) => element.js?.properties],
    ['events', (element) => element.js?.events],
];
// De velden van een onderdeel waarvan we oud en nieuw tonen; van een beschrijving enkel de nieuwe tekst.
const FIELDS = ['type', 'default', 'deprecated'];

// Per element de soort (de naam van het bestand: atom, block, …) en het element zelf, of null als er voor die
// versie geen web-types in de catalogus staan.
export function loadWebTypes(catalogDir, version) {
    const dir = path.join(catalogDir, version, 'web-types');
    if (!fs.existsSync(dir)) return null;
    const elements = new Map();
    for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(SUFFIX)).sort()) {
        const category = file.slice(0, -SUFFIX.length);
        const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        for (const element of content.contributions?.html?.elements ?? []) {
            if (elements.has(element.name)) {
                throw new Error(
                    `${element.name} staat dubbel in de web-types van ${version}: in ${elements.get(element.name).category} en ${category}.`,
                );
            }
            elements.set(element.name, { category, element });
        }
    }
    return elements;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const compact = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== null));

// Attributen hebben hun type in value.type, properties en events rechtstreeks in type.
function normalize(item) {
    return {
        name: item.name ?? null,
        description: item.description ?? null,
        type: item.value?.type ?? item.type ?? null,
        default: item.default ?? null,
        deprecated: item.deprecated ?? null,
    };
}

// Een onderdeel matcht op zijn naam. Er bestaan onderdelen zonder naam (bv. slots van vl-wizard); die matchen op
// hun beschrijving.
function keyed(items) {
    const map = new Map();
    for (const item of items) {
        const base = item.name != null ? `name:${item.name}` : `description:${item.description ?? ''}`;
        let key = base;
        for (let n = 2; map.has(key); n++) key = `${base}#${n}`;
        map.set(key, normalize(item));
    }
    return map;
}

function diffItems(beforeItems, afterItems) {
    const before = keyed(beforeItems);
    const after = keyed(afterItems);
    const added = [...after].filter(([key]) => !before.has(key)).map(([, item]) => compact(item));
    const removed = [...before].filter(([key]) => !after.has(key)).map(([, item]) => compact(item));
    const changed = [];
    for (const [key, item] of after) {
        const old = before.get(key);
        if (!old || same(old, item)) continue;
        const change = { name: item.name };
        if (old.description !== item.description) change.description = item.description;
        for (const field of FIELDS) {
            if (!same(old[field], item[field])) change[field] = { before: old[field], after: item[field] };
        }
        changed.push(change);
    }
    return added.length + removed.length + changed.length > 0 ? { added, removed, changed } : null;
}

function diffElement(before, after) {
    const diff = {};
    if ((before.description ?? null) !== (after.description ?? null)) diff.description = after.description ?? null;
    if (!same(before.deprecated ?? null, after.deprecated ?? null)) {
        diff.deprecated = { before: before.deprecated ?? null, after: after.deprecated ?? null };
    }
    for (const [part, get] of PARTS) {
        const partDiff = diffItems(get(before) ?? [], get(after) ?? []);
        if (partDiff) diff[part] = partDiff;
    }
    return Object.keys(diff).length > 0 ? diff : null;
}

// Vergelijkt twee resultaten van loadWebTypes. 'mentioned' zijn de componenten die de changelog noemt: elk
// element krijgt inChangelog, zodat wijzigingen zonder changelog-entry opvallen.
export function diffWebTypes(before, after, { mentioned = new Set() } = {}) {
    const summary = (name, { category, element }) => ({
        element: name,
        category,
        inChangelog: mentioned.has(name),
        description: element.description ?? null,
        docUrl: element['doc-url'] ?? null,
    });
    const added = [...after.keys()].filter((name) => !before.has(name)).sort().map((name) => summary(name, after.get(name)));
    const removed = [...before.keys()].filter((name) => !after.has(name)).sort().map((name) => summary(name, before.get(name)));
    const changed = [];
    for (const name of [...after.keys()].filter((key) => before.has(key)).sort()) {
        const diff = diffElement(before.get(name).element, after.get(name).element);
        if (diff) {
            changed.push({ element: name, category: after.get(name).category, inChangelog: mentioned.has(name), ...diff });
        }
    }
    return { added, removed, changed };
}
