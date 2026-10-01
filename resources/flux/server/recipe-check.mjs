// Wat de evaluatie van een recept na de run van Claude Code zelf controleert (flux:server:eval-recipe): het rapport
// dat het recept schreef, en de gekende verschillen die de migratie moest oplossen. Los van Claude, zodat de tests het
// zonder netwerk en zonder model toetsen.
//
//   reportProblems(text, { template, frontmatter, tickets })  →  wat er aan het rapport ontbreekt
//   fileProblems(dir, files)                                  →  welke verwachtingen over bestanden niet kloppen
//   packageProblems(manifest, packages)                       →  welke packages niet exact op hun versie staan
//   leftoverProblems(status)                                  →  welke nieuwe bestanden het recept achterliet

import fs from 'node:fs';
import path from 'node:path';

// De plaatshouders van een sjabloon, bv. '<x.y.z>' of '<Per stap wat er wijzigde …>'. Een rapport mag ze niet meer
// bevatten; HTML in het rapport, zoals <vl-alert type="info">, is geen plaatshouder.
const placeholdersOf = (template) => [...new Set([...template.matchAll(/<[^<>]+>/g)].map((match) => match[0]))];

// De frontmatter van Markdown als { sleutel: waarde }, of null.
function frontmatterOf(text) {
    const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
    if (!match) return null;
    return Object.fromEntries(
        match[1]
            .split('\n')
            .map((line) => /^([a-z0-9-]+):\s*(.*)$/.exec(line))
            .filter(Boolean)
            .map(([, key, value]) => [key, value.trim()]),
    );
}

// De koppen '## …' van een sjabloon of rapport.
const headings = (text) => [...text.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());

export function reportProblems(text, { template, frontmatter = {}, tickets = [] }) {
    const problems = [];
    const found = frontmatterOf(text);
    if (!found) return ['Het rapport heeft geen frontmatter.'];
    const placeholders = placeholdersOf(template);
    for (const [key, original] of Object.entries(frontmatterOf(template) ?? {})) {
        const value = found[key];
        if (!value) problems.push(`De frontmatter mist '${key}'.`);
        else if (value === original && placeholders.includes(value)) {
            problems.push(`'${key}' is nog de plaatshouder uit het sjabloon: ${value}`);
        }
    }
    for (const [key, value] of Object.entries(frontmatter)) {
        if (found[key] && found[key] !== value) problems.push(`'${key}' is '${found[key]}', verwacht '${value}'.`);
    }
    const body = text.slice(text.indexOf('\n---\n', 4) + 5);
    for (const heading of headings(template)) {
        const start = body.indexOf(`## ${heading}\n`);
        if (start === -1) {
            problems.push(`De sectie '${heading}' ontbreekt.`);
            continue;
        }
        const rest = body.slice(start + heading.length + 4);
        const content = rest.slice(0, rest.search(/^## /m) === -1 ? rest.length : rest.search(/^## /m)).trim();
        if (!content) problems.push(`De sectie '${heading}' is leeg.`);
        else if (placeholders.some((placeholder) => content.includes(placeholder))) {
            problems.push(`De sectie '${heading}' bevat nog een plaatshouder uit het sjabloon.`);
        }
    }
    for (const ticket of tickets) {
        if (!text.includes(ticket)) problems.push(`Het rapport noemt ${ticket} niet.`);
    }
    return problems;
}

// Elke verwachting is { file, present | absent, reason }: een reguliere expressie die er wel of niet in mag staan.
export function fileProblems(dir, files) {
    const problems = [];
    for (const { file, present, absent, reason } of files) {
        const target = path.join(dir, file);
        if (!fs.existsSync(target)) {
            problems.push(`${file} ontbreekt (${reason}).`);
            continue;
        }
        const text = fs.readFileSync(target, 'utf-8');
        if (present && !new RegExp(present).test(text)) problems.push(`${file}: ${reason}; niet gevonden: ${present}`);
        if (absent && new RegExp(absent).test(text)) problems.push(`${file}: ${reason}; staat er nog: ${absent}`);
    }
    return problems;
}

export function packageProblems(manifest, packages) {
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
    return Object.entries(packages)
        .filter(([name, version]) => dependencies[name] !== version)
        .map(([name, version]) => `${name} staat op '${dependencies[name] ?? 'niets'}', verwacht exact ${version}.`);
}

// De nieuwe bestanden uit 'git status --porcelain --untracked-files=all', behalve het rapport in .flux/rapporten/. Een
// recept mag geen tijdelijk bestand in het project achterlaten.
export function leftoverProblems(status) {
    return status
        .split('\n')
        .filter((line) => line.startsWith('?? '))
        .map((line) => line.slice(3).trim())
        .filter((file) => !file.startsWith('.flux/rapporten/'))
        .map((file) => `Het recept liet een nieuw bestand achter: ${file}.`);
}
