// Controleert de documentatie uit Storybook in de catalogus, zonder netwerk: de pagina's van elke versie, en elke
// analyse in de versies die ze gebruiken. Zie docs/beslissingen/ADR-003-storybook-per-versie.md.
//
//   pnpm run flux:storybook:check              # alle versies
//   pnpm run flux:storybook:check 2.20.0       # één versie
//   pnpm run flux:storybook:check --prune      # verwijdert ook analyses die geen versie gebruikt
//
// Een analyse (catalog/flux/storybook-analysis/<pagina>/<inputHash>.json) moet kloppen in elke versie waarin de
// pagina die inhoud heeft: een voorbeeld per story, en in elk voorbeeld enkel vl-elementen en attributen uit de
// web-types van die versie, tenzij een note ze als 'not-in-web-types' vermeldt. Faalt als iets niet klopt.
//
// Pagina's zonder analyse zijn geen fout: het script toont ze, met het commando om ze te analyseren. Een analyse die
// geen versie meer gebruikt, blijft staan tot je --prune meegeeft: wat een LLM schreef, is niet opnieuw te maken.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkStorybook, storybookVersions } from '../../../server/src/storybook.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');
const USAGE = 'Gebruik: pnpm run flux:storybook:check [--prune] [<versie>]';

const args = process.argv.slice(2);
const prune = args.includes('--prune');
const positional = args.filter((arg) => !arg.startsWith('--'));
if (positional.length > 1 || args.some((arg) => arg.startsWith('--') && arg !== '--prune')) {
    console.error(USAGE);
    process.exit(1);
}
const available = storybookVersions(CATALOG_DIR);
if (available.length === 0) {
    console.error('Geen Storybook in catalog/flux. Haal ze eerst op:');
    console.error('pnpm run flux:storybook:copy <versie>');
    process.exit(1);
}
const requested = positional[0]?.replace(/^v/, '');
if (requested && !available.includes(requested)) {
    console.error(`Geen Storybook voor ${requested} in de catalogus. Haal ze eerst op:`);
    console.error(`pnpm run flux:storybook:copy ${requested}`);
    process.exit(1);
}
if (prune && requested) {
    console.error('--prune kijkt naar alle versies; geef dan geen versie mee.');
    process.exit(1);
}

const versions = requested ? [requested] : available;
const { errors, missing, orphans } = checkStorybook(CATALOG_DIR, versions);

console.log(`Gecontroleerd: ${versions.length === 1 ? versions[0] : `${versions.length} versies`}.`);
for (const version of versions) {
    const without = missing.get(version) ?? [];
    const index = path.join(CATALOG_DIR, version, 'storybook', 'index.json');
    const total = JSON.parse(fs.readFileSync(index, 'utf-8')).pages.length;
    console.log(`  ${version}: ${total - without.length} van ${total} pagina's geanalyseerd`);
}
if (missing.size > 0) {
    console.log('Nog te analyseren, per versie:');
    for (const version of missing.keys()) console.log(`  pnpm run flux:storybook:analyse ${version}`);
}
if (orphans.length > 0) {
    if (prune) {
        for (const file of orphans) fs.rmSync(path.join(CATALOG_DIR, file));
        for (const dir of new Set(orphans.map((file) => path.dirname(path.join(CATALOG_DIR, file))))) {
            if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
        }
        console.log(`Verwijderd: ${orphans.length} analyses die geen versie nog gebruikt.`);
    } else {
        console.log(`${orphans.length} analyses gebruikt geen enkele versie nog; verwijder ze met --prune:`);
        for (const file of orphans.slice(0, 10)) console.log(`  ${file}`);
        if (orphans.length > 10) console.log(`  … en ${orphans.length - 10} meer`);
    }
}
if (errors.length > 0) {
    console.error(`\n[FOUT] ${errors.length} problemen:`);
    for (const error of errors) console.error(`  - ${error}`);
    console.error('Verbeter de analyse, of draai storybook:copy opnieuw voor een pagina die niet klopt.');
    process.exit(1);
}
console.log('Klopt.');
