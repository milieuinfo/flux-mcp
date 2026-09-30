// Laadt de dependencies van de gepubliceerde packages van een Flux-versie uit de catalogus en vergelijkt twee
// versies.
//
// packages:copy zet per package de dependencies uit de registry in catalog/flux/<versie>/packages/<naam>.json. Dat
// is wat een afnemer installeert: de build van Flux zet de dependencies pas bij het publiceren in de package.json,
// dus de bronrepo toont ze niet. Een dependency op een package van dezelfde release (@domg-wc/common 2.20.0 in
// @domg-wc/components 2.20.0) wijzigt bij elke versie en telt niet als wijziging.

import fs from 'node:fs';
import path from 'node:path';

export const SCOPE = '@domg-wc';
// De gepubliceerde packages; libs/integrations in de bronrepo is referentiecode, geen package.
export const PACKAGES = ['common', 'components', 'map', 'styles'];
// De soorten dependencies die bij een afnemer terechtkomen; devDependencies worden niet mee geïnstalleerd.
export const DEPENDENCY_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies'];

// Per package (@domg-wc/components, …) zijn naam, versie en dependencies, of null als er voor die versie geen
// packages in de catalogus staan.
export function loadPackages(catalogDir, version) {
    const dir = path.join(catalogDir, version, 'packages');
    if (!fs.existsSync(dir)) return null;
    const packages = new Map();
    for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort()) {
        const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        packages.set(content.name, content);
    }
    return packages;
}

// Wat packages:copy uit de metadata van de registry bewaart: enkel naam, versie en dependencies, alfabetisch, zonder
// tijdstempels of checksums. Zo is het bestand deterministisch.
export function packageFacts(metadata) {
    const facts = { name: metadata.name, version: metadata.version };
    for (const field of DEPENDENCY_FIELDS) {
        const deps = metadata[field];
        if (deps && Object.keys(deps).length > 0) {
            facts[field] = Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b)));
        }
    }
    return facts;
}

// Een dependency op een package van dezelfde release.
const ownRelease = (name, range, pkg) => name.startsWith(`${SCOPE}/`) && range === pkg.version;

function diffDependencies(before, after, beforePkg, afterPkg) {
    const added = Object.keys(after)
        .filter((name) => !(name in before))
        .map((name) => ({ name, version: after[name] }));
    const removed = Object.keys(before)
        .filter((name) => !(name in after))
        .map((name) => ({ name, version: before[name] }));
    const changed = Object.keys(after)
        .filter((name) => name in before && before[name] !== after[name])
        .filter((name) => !(ownRelease(name, before[name], beforePkg) && ownRelease(name, after[name], afterPkg)))
        .map((name) => ({ name, before: before[name], after: after[name] }));
    return added.length + removed.length + changed.length > 0 ? { added, removed, changed } : null;
}

// Vergelijkt twee resultaten van loadPackages: welke packages erbij kwamen of verdwenen, en per package de
// dependencies die erbij kwamen, verdwenen of een andere versie kregen.
export function diffPackages(before, after) {
    const added = [...after.keys()].filter((name) => !before.has(name)).sort();
    const removed = [...before.keys()].filter((name) => !after.has(name)).sort();
    const changed = [];
    for (const name of [...after.keys()].filter((key) => before.has(key)).sort()) {
        const diff = {};
        const [old, now] = [before.get(name), after.get(name)];
        for (const field of DEPENDENCY_FIELDS) {
            const fieldDiff = diffDependencies(old[field] ?? {}, now[field] ?? {}, old, now);
            if (fieldDiff) diff[field] = fieldDiff;
        }
        if (Object.keys(diff).length > 0) changed.push({ package: name, ...diff });
    }
    return { added, removed, changed };
}
