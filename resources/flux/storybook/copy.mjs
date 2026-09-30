// Zet de documentatie uit de Storybook van een Flux-release om naar Markdown, in catalog/flux/<versie>/storybook/.
// Zie docs/beslissingen/ADR-003-storybook-per-versie.md.
//
//   pnpm run flux:storybook:copy 2.20.0
//   pnpm run flux:storybook:copy --all              # alle versies in de catalogus
//   pnpm run flux:storybook:copy --check [versie]   # bouwt opnieuw en vergelijkt, schrijft niets
//   FLUX_REPO=~/pad/naar/flux-web-components pnpm run flux:storybook:copy 2.20.0
//
// De inhoud komt uit de bronrepo op tag v<versie>: de MDX, de stories en de metadata van de componenten. Van de
// Storybook van die versie gebruiken we enkel index.json: de id's, de titels en welk bestand bij welke pagina hoort.
// De web-types van die versie moeten in de catalogus staan (web-types:copy): ze koppelen elementen aan pagina's.
//
// Het resultaat:
//   storybook/index.json         de pagina's, met hun bronnen, elementen, status, stories en inputHash;
//   storybook/pages/<id>.md      de tekst van elke pagina als Markdown, zonder versienummer.
// Opnieuw draaien geeft dezelfde bestanden. Een blok of expressie die niet om te zetten is, laat het script falen:
// er mag niets ongemerkt verdwijnen. De map wordt pas vervangen als alles gelukt is.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANALYSIS_DIR, buildStorybook, storybookFiles } from '../../../server/src/storybook.mjs';
import { storybookBase } from '../../../server/src/storybook-url.mjs';
import { loadWebTypes } from '../../../server/src/web-types.mjs';
import { checkoutRelease } from './source.mjs';
import { VERSION } from '../../common.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');
const USAGE = 'Gebruik: pnpm run flux:storybook:copy [--check] <versie> | --all | --check';

const args = process.argv.slice(2);
const check = args.includes('--check');
const all = args.includes('--all');
const positional = args.filter((arg) => !arg.startsWith('--'));
const unknown = args.filter((arg) => arg.startsWith('--') && !['--check', '--all'].includes(arg));
if (positional.length > 1 || (all && positional.length > 0) || unknown.length > 0) {
    console.error(USAGE);
    process.exit(1);
}
const byVersion = (a, b) => {
    const [pa, pb] = [a, b].map((v) => v.split(/[.-]/).map((part) => (/^\d+$/.test(part) ? Number(part) : part)));
    for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
    return a.localeCompare(b);
};
const catalogVersions = () =>
    fs
        .readdirSync(CATALOG_DIR)
        .filter((name) => VERSION.test(name) && fs.existsSync(path.join(CATALOG_DIR, name, 'web-types')))
        .sort(byVersion);

let versions;
if (positional.length === 1) {
    const version = positional[0].replace(/^v/, '');
    if (!VERSION.test(version)) {
        console.error(`Ongeldige versie: ${positional[0]}. ${USAGE}`);
        process.exit(1);
    }
    versions = [version];
} else if (all) {
    versions = catalogVersions();
} else if (check) {
    versions = catalogVersions().filter((version) => fs.existsSync(path.join(CATALOG_DIR, version, 'storybook')));
} else {
    console.error(USAGE);
    process.exit(1);
}

async function fetchIndex(version) {
    const url = `${storybookBase(version)}index.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Geen index.json voor Storybook ${version}: HTTP ${response.status} op ${url}`);
    return response.json();
}

let failed = false;
for (const version of versions) {
    console.log(`== storybook:copy ${version}${check ? ' --check' : ''}`);
    const webTypes = loadWebTypes(CATALOG_DIR, version);
    if (!webTypes) {
        console.error(`Geen web-types voor ${version} in de catalogus. Haal ze eerst op:`);
        console.error(`pnpm run flux:web-types:copy ${version}`);
        process.exit(1);
    }
    let built;
    let source;
    try {
        const index = await fetchIndex(version);
        source = checkoutRelease(version);
        built = buildStorybook({ index, repo: source.repo, webTypes, version });
    } catch (error) {
        console.error(`[FOUT] ${error.message}`);
        process.exit(1);
    } finally {
        source?.remove();
    }
    if (built.errors.length > 0) {
        console.error(`[FOUT] ${built.errors.length} pagina's zijn niet om te zetten:`);
        for (const error of built.errors) console.error(`  - ${error}`);
        console.error('Voeg een regel toe in server/src/storybook.mjs of mdx.mjs, met een test, en draai opnieuw.');
        process.exit(1);
    }

    const files = storybookFiles(built);
    const target = path.join(CATALOG_DIR, version, 'storybook');
    if (check) {
        const expected = new Map(files.map((file) => [file.path, file.content]));
        const differences = [];
        for (const [file, content] of expected) {
            const existing = path.join(target, file);
            if (!fs.existsSync(existing)) differences.push(`${file} ontbreekt`);
            else if (fs.readFileSync(existing, 'utf-8') !== content) differences.push(`${file} is verouderd`);
        }
        const pagesDir = path.join(target, 'pages');
        for (const name of fs.existsSync(pagesDir) ? fs.readdirSync(pagesDir) : []) {
            if (!expected.has(`pages/${name}`)) differences.push(`pages/${name} is overbodig`);
        }
        if (differences.length > 0) {
            failed = true;
            console.error(`[FOUT] ${version}/storybook klopt niet meer met de bron:`);
            for (const difference of differences.slice(0, 20)) console.error(`  - ${difference}`);
            if (differences.length > 20) console.error(`  … en ${differences.length - 20} meer`);
            console.error(`Draai opnieuw: pnpm run flux:storybook:copy ${version}`);
        } else {
            console.log(`  ok: ${files.length} bestanden kloppen`);
        }
        continue;
    }

    // Eerst alles in een tijdelijke map, dan de oude map vervangen: een mislukte run laat de catalogus ongemoeid.
    const staging = fs.mkdtempSync(path.join(path.dirname(target), '.storybook-'));
    for (const file of files) {
        fs.mkdirSync(path.dirname(path.join(staging, file.path)), { recursive: true });
        fs.writeFileSync(path.join(staging, file.path), file.content);
    }
    fs.rmSync(target, { recursive: true, force: true });
    fs.renameSync(staging, target);

    const { pages, skipped } = built.index;
    const kinds = {};
    for (const page of pages) kinds[page.kind] = (kinds[page.kind] ?? 0) + 1;
    const analysed = pages.filter((page) =>
        fs.existsSync(path.join(CATALOG_DIR, ANALYSIS_DIR, page.id, `${page.inputHash}.json`)),
    ).length;
    console.log(`  ${pages.length} pagina's (${Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(', ')})`);
    console.log(`  overgeslagen: ${skipped.map((page) => `${page.id} (${page.reason})`).join(', ') || 'niets'}`);
    console.log(`  analyse: ${analysed} van ${pages.length} pagina's hebben er een voor hun inhoud`);
    for (const warning of built.warnings) console.log(`  let op: ${warning}`);
}
if (failed) process.exit(1);
if (!check && versions.length > 0) {
    const shown = versions.length === 1 ? versions[0] : '<versie>';
    console.log(`\nAnalyseer daarna wat nieuw is: pnpm run flux:storybook:analyse ${shown}`);
}
