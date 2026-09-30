// Haalt de dependencies van de gepubliceerde packages van een Flux Web Components release uit de registry.
//
//   pnpm run flux:packages:copy 2.20.0    # catalog/flux/2.20.0/packages/<naam>.json
//
// De versie is verplicht; 2.20.0 en v2.20.0 mogen allebei. Per package (@domg-wc/common, components, map en
// styles) komen naam, versie en dependencies in de catalogus; changelog:build vergelijkt ze met die van de vorige
// versie. De registry is die uit de Storybook-pagina 'Artifacts'; met FLUX_REGISTRY kies je een andere.
//
// De bronrepo volstaat hier niet: de build van Flux zet de dependencies pas bij het publiceren in de package.json.
// Het script is deterministisch voor een gepubliceerde versie. Een nieuwe run vervangt de map packages; een
// mislukte run laat de catalogus ongemoeid.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PACKAGES, packageFacts, SCOPE } from '../../../server/src/packages.mjs';
import { VERSION } from '../../common.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');
const DEFAULT_REGISTRY = 'https://repo.omgeving.vlaanderen.be/artifactory/api/npm/local-npm';
const REGISTRY = (process.env.FLUX_REGISTRY || DEFAULT_REGISTRY).replace(/\/$/, '');

if (process.argv.length !== 3) {
    console.error('Geef een versie op: pnpm run flux:packages:copy <versie>');
    process.exit(1);
}
const version = process.argv[2].replace(/^v/, '');
if (!VERSION.test(version)) {
    console.error(`Ongeldige versie: ${process.argv[2]}`);
    process.exit(1);
}

console.log(`Ophalen van ${REGISTRY} (${version})`);
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-packages-'));
process.on('exit', () => fs.rmSync(staging, { recursive: true, force: true }));
for (const name of PACKAGES) {
    const url = `${REGISTRY}/${SCOPE}/${name}/${version}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Geen ${SCOPE}/${name}@${version} op ${REGISTRY} (HTTP ${response.status}).`);
        console.error('Is de release gepubliceerd? Met FLUX_REGISTRY kies je een andere registry.');
        process.exit(1);
    }
    const facts = packageFacts(await response.json());
    if (facts.version !== version) {
        console.error(`De registry gaf ${facts.name}@${facts.version} voor ${SCOPE}/${name}@${version}.`);
        process.exit(1);
    }
    fs.writeFileSync(path.join(staging, `${name}.json`), `${JSON.stringify(facts, null, 2)}\n`);
    console.log(`  ${facts.name}: ${Object.keys(facts.dependencies ?? {}).length} dependencies`);
}

const target = path.join(CATALOG_DIR, version, 'packages');
fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.cpSync(staging, target, { recursive: true });
console.log(`Geschreven: ${path.relative(REPO_ROOT, target)}/`);
