// Bouwt uit catalog/figma/descriptions/v2/<soort>/*.figma.md de descriptions en documentation links voor de
// Figma-library, met de Storybook-links van één Flux-release.
//
//   pnpm run figma:descriptions:write 2.20.0
//
// De library volgt de major van de versie (2.21.0 → v2); met FIGMA_MAJOR_VERSION=3 kies je een andere. Elk
// .figma.md bestand staat in dezelfde soort en heet zoals het Code Connect template waar het bij hoort
// (descriptions/v2/atom/vl-button.figma.md hoort bij code-connect/v2/atom/vl-button.figma.ts). De Figma node
// komt uit de url-header van dat template; kopieer de templates dus eerst met figma:web-components:copy-figma.
// De Storybook-pagina staat in de frontmatter van het .figma.md bestand, de tekst voor Figma onder "## Figma".
//
// Het resultaat, dist/descriptions/<versie>.json, schrijf je in een Figma-branch weg. Dat kan niet vanuit dit
// script: descriptions en documentation links zijn enkel via de Plugin API te wijzigen, niet via de REST API.
// De payload is wegwerp en staat niet in git: genereer ze opnieuw wanneer je ze nodig hebt.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const STORYBOOK = (version) => `https://flux.omgeving.vlaanderen.be/release-v2/${version}/storybook`;
// Figma toont langere teksten wel, maar een description is een samenvatting: de details staan in Storybook.
const MAX_LENGTH = 1200;
// Onder elke description, zodat niemand ze in Figma aanpast: de volgende update zou dat overschrijven.
const FOOTER = (file, generatedAt) =>
    `Gegenereerd uit flux-mcp, catalog/figma/descriptions/${LIBRARY}/${file} op ${generatedAt}. ` +
    'Pas deze tekst daar aan, niet in Figma: de volgende update overschrijft hem.';

// Het tijdstip van deze build, als 'YYYY-MM-DD HH:MM' in lokale tijd.
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const GENERATED_AT =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}`;

const version = (process.argv[2] ?? '').replace(/^v/, '');
if (!version) {
    console.error('Gebruik: pnpm run figma:descriptions:write <versie>');
    process.exit(1);
}

// De Figma-library volgt de major van de Flux-release; FIGMA_MAJOR_VERSION overrulet dat ("3" of "v3").
const LIBRARY = `v${(process.env.FIGMA_MAJOR_VERSION || version.split('.')[0]).replace(/^v/, '')}`;
const DESCRIPTIONS_DIR = path.join(REPO_ROOT, 'catalog', 'figma', 'descriptions', LIBRARY);
const catalogDir = path.join(REPO_ROOT, 'catalog', 'figma', 'code-connect', LIBRARY);
if (!fs.existsSync(catalogDir)) {
    console.error(`Geen templates in de catalogus voor ${LIBRARY}. Haal ze eerst op: pnpm run figma:web-components:copy-figma ${version}`);
    process.exit(1);
}

// Per template '<soort>/<naam>' de Figma node, bv. 'atom/vl-button' → '24:1865'.
function templatesIn(dir) {
    const found = new Map();
    for (const file of fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.figma.ts')).sort()) {
        const url = /^\/\/\s*url=(.*)$/m.exec(fs.readFileSync(path.join(dir, file), 'utf-8'))?.[1] ?? '';
        const nodeId = /node-id=(\d+)-(\d+)/.exec(url);
        if (nodeId) found.set(file.replace('.figma.ts', ''), `${nodeId[1]}:${nodeId[2]}`);
    }
    return found;
}

function parseDescription(file) {
    const content = fs.readFileSync(file, 'utf-8');
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(content)?.[1] ?? '';
    const storybook = /^storybook:\s*(\S+)\s*$/m.exec(frontmatter)?.[1] ?? '';
    const figma = /^## Figma\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(content)?.[1]?.trim() ?? '';
    return { storybook, figma };
}

const nodes = templatesIn(catalogDir);
const entries = [];
const errors = [];

if (!fs.existsSync(DESCRIPTIONS_DIR)) {
    console.error(`Geen descriptions voor ${LIBRARY}: ${path.relative(REPO_ROOT, DESCRIPTIONS_DIR)} bestaat niet.`);
    process.exit(1);
}

for (const file of fs.readdirSync(DESCRIPTIONS_DIR, { recursive: true }).filter((f) => f.endsWith('.figma.md')).sort()) {
    const key = file.replace('.figma.md', '');
    const name = path.basename(key);
    const { storybook, figma } = parseDescription(path.join(DESCRIPTIONS_DIR, file));
    const nodeId = nodes.get(key);

    if (!nodeId) errors.push(`${file}: geen template ${key}.figma.ts in versie ${version}`);
    if (!storybook) errors.push(`${file}: geen storybook in de frontmatter`);
    if (figma.length > MAX_LENGTH) errors.push(`${file}: description is ${figma.length} tekens (max ${MAX_LENGTH})`);
    if (!nodeId || !storybook) continue;

    entries.push({
        key,
        name,
        nodeId,
        description: figma && `${figma}\n\n${FOOTER(file, GENERATED_AT)}`,
        documentationLink: `${STORYBOOK(version)}/?path=/docs/${storybook}--documentatie`,
        storybook,
    });
}

// Een link naar een pagina die in die release niet bestaat, stuurt de lezer naar een lege Storybook.
try {
    const index = await fetch(`${STORYBOOK(version)}/index.json`).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    });
    const ids = new Set(Object.keys(index.entries));
    for (const entry of entries) {
        if (!ids.has(`${entry.storybook}--documentatie`)) {
            errors.push(`${entry.key}.figma.md: Storybook-pagina ${entry.storybook} bestaat niet in ${version}`);
        }
    }
} catch (error) {
    console.warn(`Storybook-index van ${version} niet bereikbaar (${error.message}); links niet gecontroleerd.`);
}

if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
}

const withoutText = [...nodes.keys()].filter((key) => !entries.find((e) => e.key === key && e.description));
const target = path.join(REPO_ROOT, 'dist', 'descriptions', `${version}.json`);
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(
    target,
    JSON.stringify(
        entries.map(({ key, storybook, ...entry }) => entry),
        null,
        4
    ) + '\n'
);

console.log(
    `dist/descriptions/${version}.json: ${entries.length} componenten, ` +
        `${entries.filter((e) => e.description).length} met description.`
);
if (withoutText.length > 0) {
    console.log(`Nog zonder description: ${withoutText.join(', ')}`);
}
