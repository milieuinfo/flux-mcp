// Controleert of wat de catalogus van een versie bevat, nog is wat de scripts vandaag uit de bron halen. Het haalt de
// bronnen van die versie opnieuw op en bouwt ze, in een kopie van deze repo, en vergelijkt het resultaat met de
// catalogus. Zo valt een wijziging in een script of in de bron op, en blijft de catalogus in git reproduceerbaar.
//
//   pnpm run flux:catalog:check 2.20.0
//   FLUX_REPO=~/pad/naar/flux-web-components pnpm run flux:catalog:check 2.20.0   # sneller
//
// Het vergelijkt web-types/, packages/, changelog/ en storybook/ van die versie. De analyses niet: die schrijft een
// LLM, en ze zijn niet opnieuw te maken. Het heeft de bronrepo, de registry en de Storybook van de release nodig;
// FLUX_REPO, FLUX_REGISTRY en FLUX_STORYBOOK_URL werken zoals bij de andere scripts.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../../common.mjs';
import { createWorkspace } from '../../workspace.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');
// Wat de scripts van een versie maken, en in welke volgorde.
const PARTS = ['web-types', 'packages', 'changelog', 'storybook'];
const STEPS = [
    'web-types:copy',
    'packages:copy',
    'changelog:copy',
    'changelog:cleanup',
    'changelog:commits',
    'changelog:build',
    'storybook:copy',
];

if (process.argv.length !== 3) {
    console.error('Geef een versie op: pnpm run flux:catalog:check <versie>');
    process.exit(1);
}
const version = process.argv[2].replace(/^v/, '');
if (!VERSION.test(version)) {
    console.error(`Ongeldige versie: ${process.argv[2]}`);
    process.exit(1);
}
if (!fs.existsSync(path.join(CATALOG_DIR, version))) {
    console.error(`${version} staat niet in de catalogus. Haal de release eerst op:`);
    console.error(`pnpm run flux:catalog:update ${version}`);
    process.exit(1);
}

// De kopie heeft de hele catalogus van flux: de build vergelijkt met de web-types en de packages van de vorige
// versie, en controleert de analyse. Wat de scripts van deze versie maken, gaat eruit.
const workspace = createWorkspace({ prefix: 'flux-catalog-check-', catalog: ['flux'] });
const fresh = path.join(workspace, 'catalog', 'flux', version);
process.on('exit', () => fs.rmSync(workspace, { recursive: true, force: true }));
for (const part of PARTS) fs.rmSync(path.join(fresh, part), { recursive: true, force: true });

for (const step of STEPS) {
    console.log(`== ${step} ${version}`);
    const result = spawnSync('pnpm', ['run', '--silent', `flux:${step}`, version], {
        cwd: workspace,
        stdio: 'inherit',
    });
    if (result.status !== 0) {
        console.error(`\n[FOUT] ${step} ${version} faalde; de catalogus is niet vergeleken.`);
        process.exit(1);
    }
}

// Alle bestanden onder een map, relatief tegenover die map.
function files(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)))
        .sort();
}

const differences = [];
for (const part of PARTS) {
    const [existing, rebuilt] = [path.join(CATALOG_DIR, version, part), path.join(fresh, part)];
    const [before, after] = [files(existing), files(rebuilt)];
    for (const file of after) {
        if (!before.includes(file)) differences.push(`${part}/${file} ontbreekt in de catalogus`);
        else if (!fs.readFileSync(path.join(existing, file)).equals(fs.readFileSync(path.join(rebuilt, file)))) {
            differences.push(`${part}/${file} is anders`);
        }
    }
    for (const file of before.filter((name) => !after.includes(name))) {
        differences.push(`${part}/${file} maakt de run niet meer`);
    }
}

if (differences.length > 0) {
    console.error(`\n[FOUT] De catalogus van ${version} is niet meer wat de scripts uit de bron halen:`);
    for (const difference of differences.slice(0, 30)) console.error(`  - ${difference}`);
    if (differences.length > 30) console.error(`  … en ${differences.length - 30} meer`);
    console.error('Kijk na wat er wijzigde. Wil je wat de scripts nu maken, draai dan:');
    console.error(`pnpm run flux:catalog:update ${version}`);
    process.exit(1);
}
const parts = PARTS.map((part) => `${part}/`).join(', ');
console.log(`\nKlopt: ${parts} van ${version} zijn wat de scripts uit de bron halen.`);
