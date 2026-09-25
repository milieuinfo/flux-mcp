// Bouwt de gegevens die de scripts over een versie weten, uit de changelog en de commits in de catalogus.
//
//   pnpm run flux:web-components:changelog-build 2.20.0          # catalog/flux/2.20.0/changelog/
//   pnpm run flux:web-components:changelog-build --all           # alle versies in de catalogus
//   pnpm run flux:web-components:changelog-build --check         # faalt als een gebouwd bestand niet meer klopt
//   pnpm run flux:web-components:changelog-build --check 2.20.0  # enkel die versie controleren
//
// Naast changelog.md en commits.json komen in catalog/flux/<versie>/changelog/:
//   - changelog.json: het overzicht, met de entries en de tickets met hun bestand;
//   - tickets/<ticket>-<componenten>.json: per ticket de volledige entries, met de feiten uit de commits;
//   - api.json: de API-diff tegen de web-types van de vorige versie.
// Die bestanden zijn gegenereerd en staan in git. Wat een LLM schreef, staat apart in analysis/, met dezelfde
// bestandsnamen; het script controleert of die analyse bij de tickets past. Het script is deterministisch:
// opnieuw bouwen geeft dezelfde bestanden. Draai --all opnieuw wanneer de web-types van een vorige versie later
// binnenkomen.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReleaseFiles, compareReleaseFiles, writeReleaseFiles } from '../../../server/src/changelog.mjs';
import { compareVersions } from '../../../server/src/catalog.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');
const USAGE = 'Gebruik: pnpm run flux:web-components:changelog-build <versie> | --all | --check [<versie>]';
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/;
const TYPE_NAMES = { breaking: 'breaking', feature: 'features', fix: 'fixes', docs: 'docs', perf: 'perf', revert: 'reverts', other: 'overige' };
const IMPACT_NAMES = {
    action: 'actie nodig',
    'opt-in': 'nieuwe mogelijkheid',
    automatic: 'automatisch bij de upgrade',
    none: 'geen impact op het project',
};

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

const summarize = (counts, names) =>
    Object.entries(names)
        .filter(([key]) => counts[key] > 0)
        .map(([key, name]) => `${counts[key]} ${name}`)
        .join(', ') || 'geen';

function report(release) {
    console.log(`  ${release.entries.length} entries: ${summarize(release.counts.type, TYPE_NAMES)}`);
    console.log(`  impact: ${summarize(release.counts.impact, IMPACT_NAMES)}`);
    for (const entry of release.entries.filter((e) => e.impact === 'action')) {
        console.log(`    actie bij ${entry.id}: ${entry.action ?? 'nog niet geanalyseerd'}`);
    }
    list('toegankelijkheid', release.entries.filter((entry) => entry.labels.includes('a11y')));
    // Zonder analyse is de impact afgeleid: uit de commits of, zonder commits.json, uit het type en de tekst.
    const missingCommits = release.entries.some((entry) => entry.commits.length > 0 && !entry.source);
    if (missingCommits) {
        console.log(`  geen commits.json: pnpm run flux:web-components:changelog-commits ${release.version}`);
    }
    list(
        'nog niet geanalyseerd (zie prompts/changelog-analyse.md)',
        release.entries.filter((entry) => entry.impactSource !== 'analysis'),
    );
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
    const relative = path.relative(REPO_ROOT, path.join(CATALOG_DIR, version, 'changelog'));
    let built;
    try {
        built = buildReleaseFiles(CATALOG_DIR, version);
    } catch (error) {
        console.error(`${version}: ${error.message}`);
        failed = true;
        continue;
    }

    if (check) {
        const differences = compareReleaseFiles(CATALOG_DIR, version, built.files);
        if (differences.length === 0) {
            console.log(`${version}: ok`);
        } else {
            for (const { path: file, status } of differences) console.log(`${version}: ${relative}/${file} ${status}`);
            stale = true;
        }
        continue;
    }

    writeReleaseFiles(CATALOG_DIR, version, built.files);
    const tickets = built.files.filter((file) => file.path.startsWith('tickets/')).length;
    console.log(`Gebouwd: ${relative}/ (changelog.json, ${tickets} tickets${built.files.some((f) => f.path === 'api.json') ? ', api.json' : ''})`);
    report(built.release);
}

if (stale) console.log(`Bouw opnieuw: pnpm run flux:web-components:changelog-build ${requested ?? '--all'}`);
if (failed || stale) process.exit(1);
