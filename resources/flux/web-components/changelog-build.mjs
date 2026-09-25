// Bouwt changelog.json uit de changelog die changelog-copy en changelog-cleanup in de catalogus zetten.
//
//   pnpm run flux:web-components:changelog-build 2.20.0          # catalog/flux/2.20.0/changelog/changelog.json
//   pnpm run flux:web-components:changelog-build --all           # alle versies in de catalogus
//   pnpm run flux:web-components:changelog-build --check         # faalt als een changelog.json niet meer klopt
//   pnpm run flux:web-components:changelog-build --check 2.20.0  # enkel die versie controleren
//
// changelog.json is wat de MCP-server over een versie aanbiedt: elke entry met type, issues, componenten, impact en
// labels, de feiten uit de commits (commits.json, van changelog-commits), de analyse uit
// catalog/flux/<versie>/analysis/changelog.json, en de API-diff tegen de web-types van de vorige versie. Het
// bestand is gegenereerd en staat in git, zodat een PR toont wat de server zal tonen. Draai --all opnieuw wanneer
// de analyse wijzigt of de web-types van een vorige versie later binnenkomen. Het script is deterministisch:
// opnieuw bouwen geeft hetzelfde bestand.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReleaseFromCatalog } from '../../../server/src/changelog.mjs';
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
    report(release);
}

if (stale) console.log(`Bouw opnieuw: pnpm run flux:web-components:changelog-build ${requested ?? '--all'}`);
if (failed || stale) process.exit(1);
