// Bouwt changelog.json uit de changelog die changelog-copy en changelog-cleanup in de catalogus zetten.
//
//   pnpm run flux:web-components:changelog-build 2.20.0          # catalog/flux/2.20.0/changelog/changelog.json
//   pnpm run flux:web-components:changelog-build --all           # alle versies in de catalogus
//   pnpm run flux:web-components:changelog-build --check         # faalt als een changelog.json niet meer klopt
//   pnpm run flux:web-components:changelog-build --check 2.20.0  # enkel die versie controleren
//
// changelog.json is wat de MCP-server over een versie aanbiedt: elke entry met type, issues, componenten en
// labels, de handmatige annotaties uit catalog/flux/<versie>/annotations/changelog.json, en de API-diff tegen de
// web-types van de vorige versie. Het bestand is gegenereerd en staat in git, zodat een PR toont wat de server
// zal tonen. Draai --all opnieuw wanneer een annotatie wijzigt of de web-types van een vorige versie later
// binnenkomen. Het script is deterministisch: opnieuw bouwen geeft hetzelfde bestand.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReleaseFromCatalog, readAnnotations } from '../../../server/src/changelog.mjs';
import { compareVersions } from '../../../server/src/catalog.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');
const USAGE = 'Gebruik: pnpm run flux:web-components:changelog-build <versie> | --all | --check [<versie>]';
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/;
const TYPE_NAMES = { breaking: 'breaking', feature: 'features', fix: 'fixes', docs: 'docs', perf: 'perf', revert: 'reverts', other: 'overige' };

const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith('--'));
const positional = args.filter((arg) => !arg.startsWith('--'));
const check = flags.includes('--check');
const all = flags.includes('--all');

const unknown = flags.filter((flag) => !['--check', '--all'].includes(flag));
if (unknown.length > 0 || positional.length > 1 || (all && positional.length > 0) || (!all && !check && positional.length === 0)) {
    console.error(USAGE);
    process.exit(1);
}

// Laat zowel "2.20.0" als "v2.20.0" toe, zoals de shell-scripts.
const requested = positional[0]?.replace(/^v/, '');
if (requested !== undefined && !VERSION.test(requested)) {
    console.error(`Ongeldige versie: ${positional[0]}`);
    process.exit(1);
}

const versions = requested
    ? [requested]
    : fs
          .readdirSync(CATALOG_DIR)
          .filter((name) => VERSION.test(name) && fs.existsSync(path.join(CATALOG_DIR, name, 'changelog')))
          .sort(compareVersions);
if (versions.length === 0) {
    console.error('Geen changelogs in catalog/flux.');
    process.exit(1);
}

const firstLine = (entry) => entry.text.split('\n')[0];

function list(title, entries) {
    if (entries.length === 0) return;
    console.log(`  ${title}:`);
    for (const entry of entries) console.log(`    - ${firstLine(entry)} [${entry.id}]`);
}

// Wat de regels als 'met impact' zien, maar zonder component: daar zitten de missers, zoals een migratie van de
// eigen build. Een entry waarvoor een annotatie 'no-impact' al vastlegt, is beoordeeld.
function toReview(release, annotations) {
    return release.entries.filter(
        (entry) =>
            entry.components.length === 0 &&
            !entry.labels.includes('no-impact') &&
            !('no-impact' in (annotations?.entries?.[entry.id]?.labels ?? {})),
    );
}

function report(release, annotations) {
    const total = release.entries.length;
    const counts = Object.entries(TYPE_NAMES)
        .filter(([type]) => release.counts[type] > 0)
        .map(([type, name]) => `${release.counts[type]} ${name}`);
    console.log(`  ${total} entries: ${counts.join(', ') || 'geen'}`);
    list('geen impact op het project', release.entries.filter((entry) => entry.labels.includes('no-impact')));
    list('toegankelijkheid', release.entries.filter((entry) => entry.labels.includes('a11y')));
    list('te beoordelen, impact zonder component (leg vast met een annotatie)', toReview(release, annotations));
    if (release.api) {
        const silent = [...release.api.added, ...release.api.removed, ...release.api.changed].filter((item) => !item.inChangelog);
        if (silent.length > 0) {
            console.log(`  API-wijzigingen die de changelog niet vermeldt: ${silent.map((item) => item.element).join(', ')}`);
        }
    } else {
        console.log(`  geen API-diff: ${release.apiUnavailable}`);
    }
}

let failed = false;
let stale = false;
for (const version of versions) {
    const target = path.join(CATALOG_DIR, version, 'changelog', 'changelog.json');
    const relative = path.relative(REPO_ROOT, target);
    let release;
    try {
        release = buildReleaseFromCatalog(CATALOG_DIR, version);
    } catch (error) {
        console.error(`${version}: ${error.message}`);
        failed = true;
        continue;
    }
    const content = `${JSON.stringify(release, null, 2)}\n`;

    if (check) {
        const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf-8') : null;
        if (current === content) {
            console.log(`${version}: ok`);
        } else {
            console.log(`${version}: ${relative} ${current === null ? 'ontbreekt' : 'is verouderd'}`);
            stale = true;
        }
        continue;
    }

    fs.writeFileSync(target, content);
    console.log(`Gebouwd: ${relative}`);
    report(release, readAnnotations(CATALOG_DIR, version).annotations);
}

if (stale) console.log(`Bouw opnieuw: pnpm run flux:web-components:changelog-build ${requested ?? '--all'}`);
if (failed || stale) process.exit(1);
