// Wat de evaluatie van een recept na de run van Claude Code zelf controleert (flux:server:eval-recipe): het rapport
// dat het recept schreef, de gekende verschillen die de migratie moest oplossen, en de afwijkingen die de validatie
// moest vinden. Los van Claude, zodat de tests het zonder netwerk en zonder model toetsen.
//
//   reportProblems(text, { template, frontmatter, tickets })  →  wat er aan het rapport ontbreekt
//   deviationsOf(text)                                        →  de afwijkingen in een afwijkingenrapport
//   deviationProblems(text, { expected, forbidden, changed }) →  het formaat, de gemiste en de verboden afwijkingen
//   answerReportOf(answer)                                    →  het rapport in een antwoord, in een blok ~~~markdown
//   changedLinesOf(patch)                                     →  per bestand de regels die een patch toevoegt
//   fileProblems(dir, files)                                  →  welke verwachtingen over bestanden niet kloppen
//   packageProblems(manifest, packages)                       →  welke packages niet exact op hun versie staan
//   leftoverProblems(status)                                  →  welke nieuwe bestanden het recept achterliet
//   modifiedProblems(status, paths)                           →  welke bestanden het recept wijzigde of verwijderde

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

// De tekst van een sectie '## kop' van een rapport, tot de volgende '## '; '' als ze ontbreekt.
function sectionOf(text, heading) {
    const start = text.search(new RegExp(`^## ${heading}$`, 'm'));
    if (start === -1) return '';
    const rest = text.slice(start).split('\n').slice(1).join('\n');
    const end = rest.search(/^## /m);
    return end === -1 ? rest : rest.slice(0, end);
}

// Het formaat van een afwijking (ADR-004, sectie 6.4).
const DEVIATION_FIELDS = ['regel', 'locatie', 'ernst', 'uitkomst', 'norm', 'vereist'];
const SEVERITIES = ['error', 'warning', 'info'];
const OUTCOMES = ['volgt-norm', 'normkandidaat', 'te-beslissen'];
const LOCATION = /^(\S+):(\d+)$/;
const EMPTY = ['', '-', '—'];

// De afwijkingen in de sectie 'Afwijkingen': per kop '### A-001: titel' de velden '- veld: waarde' en de tekst tot
// de volgende kop. Een veld telt enkel de eerste keer, zodat een lijst in de beschrijving het niet overschrijft.
export function deviationsOf(text) {
    return sectionOf(text, 'Afwijkingen')
        .split(/^### /m)
        .slice(1)
        .map((part) => {
            const [heading, ...lines] = part.split('\n');
            const match = /^(A-\d{3,}):\s*(.+)$/.exec(heading.trim());
            const fields = {};
            for (const line of lines) {
                const field = /^- ([a-z]+):\s*(.*)$/.exec(line);
                if (field && DEVIATION_FIELDS.includes(field[1]) && !(field[1] in fields)) {
                    fields[field[1]] = field[2].trim();
                }
            }
            return { heading: heading.trim(), id: match?.[1] ?? null, title: match?.[2] ?? '', fields };
        });
}

// Wat er aan het formaat van de afwijkingen schort, en of de sectie Normkandidaten dezelfde id's noemt als de
// afwijkingen met uitkomst normkandidaat.
function formatProblems(deviations, text) {
    const problems = [];
    const ids = new Set();
    for (const { heading, id, fields } of deviations) {
        if (!id) {
            problems.push(`De kop '### ${heading}' is geen 'A-001: …'.`);
            continue;
        }
        if (ids.has(id)) problems.push(`${id} staat er twee keer.`);
        ids.add(id);
        for (const field of DEVIATION_FIELDS) {
            if (!(field in fields)) problems.push(`${id} mist '- ${field}:'.`);
        }
        if (fields.locatie != null && !LOCATION.test(fields.locatie)) {
            problems.push(`${id}: de locatie '${fields.locatie}' is geen pad:regel.`);
        }
        if (fields.ernst != null && !SEVERITIES.includes(fields.ernst)) {
            problems.push(`${id}: de ernst '${fields.ernst}' is geen ${SEVERITIES.join(', ')}.`);
        }
        if (fields.uitkomst != null && !OUTCOMES.includes(fields.uitkomst)) {
            problems.push(`${id}: de uitkomst '${fields.uitkomst}' is geen ${OUTCOMES.join(', ')}.`);
        }
    }
    const candidates = deviations.filter(({ fields }) => fields.uitkomst === 'normkandidaat').map(({ id }) => id);
    const listed = [...sectionOf(text, 'Normkandidaten').matchAll(/^- (A-\d{3,})\b/gm)].map((match) => match[1]);
    for (const id of candidates.filter((id) => !listed.includes(id))) {
        problems.push(`${id} is een normkandidaat, maar staat niet in de sectie Normkandidaten.`);
    }
    for (const id of listed.filter((id) => !candidates.includes(id))) {
        problems.push(`${id} staat in de sectie Normkandidaten, maar heeft geen uitkomst normkandidaat.`);
    }
    return problems;
}

// Ligt de locatie van een afwijking in een van de bereiken 'pad:12' of 'pad:12-20'?
function within({ fields }, locations) {
    const match = LOCATION.exec(fields.locatie ?? '');
    if (!match) return false;
    const line = Number(match[2]);
    return locations.some((location) => {
        const [, file, from, to] = /^(\S+):(\d+)(?:-(\d+))?$/.exec(location);
        return file === match[1] && line >= Number(from) && line <= Number(to ?? from);
    });
}

// Klopt een veld met de verwachting? '—' vraagt een leeg veld; een andere waarde moet erin staan, zodat
// 'migratie naar 2.19.0 of hoger (FLUX-610)' klopt met '2.19.0'.
function fieldMatches(actual, expected) {
    const value = (actual ?? '').trim().toLowerCase();
    if (EMPTY.includes(expected)) return EMPTY.includes(value);
    return value.includes(expected.toLowerCase());
}

// Elke verwachte afwijking is { id, regel, locaties, norm?, vereist? }: een afwijking met die regel op een van de
// locaties, met die norm en dat vereiste. Een verboden afwijking is { reason, title?, locaties? }: geen afwijking
// waarvan de titel op de reguliere expressie past, op die locaties. Andere afwijkingen mogen: het model kan er meer
// vinden dan verwacht. Met 'changed' (changedLinesOf) moet elke afwijking op een regel van de diff staan, zoals bij
// review.
export function deviationProblems(text, { expected = [], forbidden = [], changed = null }) {
    const deviations = deviationsOf(text);
    const problems = formatProblems(deviations, text);
    for (const want of expected) {
        const found = deviations.filter(
            (deviation) => deviation.fields.regel === want.regel && within(deviation, want.locaties),
        );
        if (found.length === 0) {
            problems.push(`${want.id} ontbreekt: ${want.regel} op ${want.locaties.join(', ')}.`);
            continue;
        }
        const checked = ['norm', 'vereist'].filter((field) => want[field] != null);
        if (!found.some(({ fields }) => checked.every((field) => fieldMatches(fields[field], want[field])))) {
            const [first] = found;
            const actual = checked.map((field) => `${field} '${first.fields[field] ?? ''}'`).join(', ');
            const wanted = checked.map((field) => `${field} '${want[field]}'`).join(', ');
            problems.push(`${want.id} staat er als ${first.id}, met ${actual}; verwacht ${wanted}.`);
        }
    }
    if (changed) {
        for (const deviation of deviations) {
            const match = LOCATION.exec(deviation.fields.locatie ?? '');
            if (match && !changed[match[1]]?.has(Number(match[2]))) {
                problems.push(`${deviation.id} staat op ${match[0]}, buiten de diff.`);
            }
        }
    }
    for (const rule of forbidden) {
        const pattern = new RegExp(rule.title ?? '.', 'i');
        for (const deviation of deviations) {
            if (pattern.test(deviation.title) && (!rule.locaties || within(deviation, rule.locaties))) {
                problems.push(`${deviation.id} had er niet mogen staan: ${rule.reason}.`);
            }
        }
    }
    return problems;
}

// Het rapport dat een recept zonder bestand, zoals review, in zijn antwoord geeft: het laatste blok tussen een regel
// '~~~markdown' en een regel '~~~'. Het rapport zelf mag codeblokken met ``` bevatten. null als het ontbreekt.
export function answerReportOf(answer) {
    const blocks = [...(answer ?? '').matchAll(/^~~~markdown\n([\s\S]*?)\n~~~$/gm)];
    return blocks.length ? `${blocks.at(-1)[1]}\n` : null;
}

// Per bestand de regels die een patch (git diff) toevoegt of wijzigt, met hun nummer in de nieuwe versie:
// { 'index.html': Set { 41, 42, … } }.
export function changedLinesOf(patch) {
    const changed = {};
    let file = null;
    let line = 0;
    for (const text of patch.split('\n')) {
        const target = /^\+\+\+ b\/(.+)$/.exec(text);
        const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(text);
        if (target) {
            file = target[1];
            changed[file] ??= new Set();
        } else if (hunk) {
            line = Number(hunk[1]);
        } else if (file && text.startsWith('+')) {
            changed[file].add(line++);
        } else if (file && !text.startsWith('-') && !text.startsWith('\\')) {
            line++;
        }
    }
    return changed;
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

// De bestanden die 'git status --porcelain' als gewijzigd, verwijderd of hernoemd toont. Een recept dat geen code
// wijzigt, zoals valideren, laat ze ongemoeid; met 'paths' gaat het enkel om die bestanden, zoals het
// afwijkingenrapport dat verbeteren leest.
export function modifiedProblems(status, paths = null) {
    return status
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('?? '))
        .map((line) => line.slice(3).trim())
        .filter((file) => !paths || paths.includes(file))
        .map((file) =>
            paths
                ? `Het recept wijzigde ${file}, maar mag dat bestand niet wijzigen.`
                : `Het recept wijzigde ${file}, maar mag geen code wijzigen.`,
        );
}
