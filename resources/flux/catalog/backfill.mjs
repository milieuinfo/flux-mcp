// Neemt een reeks releases in één keer op in de catalogus: alle releases van Flux van <van> tot en met <tot>, zoals
// Flux ze op develop-v<major> maakte. Zie docs/beslissingen/ADR-002-historische-catalogus-v2.md.
//
//   pnpm run flux:catalog:backfill 2.0.0 2.18.0
//   pnpm run flux:catalog:backfill --skip-analysis 2.0.0 2.18.0     # enkel fase 1, zonder LLM
//   pnpm run flux:catalog:backfill --max 7 2.0.0 2.18.0             # fase 2 voor hoogstens 7 versies
//   FLUX_REPO=~/pad/naar/flux-web-components pnpm run flux:catalog:backfill 2.0.0 2.18.0
//
// De releases zijn de commits 'chore(release): X.Y.Z' op de hoofdlijn van develop-v<major>; patches op een zijtak
// horen er niet bij. Het script werkt van oud naar nieuw, zodat de vorige versie er telkens al staat, in twee fasen:
//   1. de bronnen van elke release die ze nog niet heeft (SOURCE_STEPS), en daarna changelog:build --all;
//   2. de analyse van elke release zonder volledige analyse (ANALYSIS_STEPS), met --max voor hoogstens zoveel
//      versies in deze run. Is het bereik daarna volledig geanalyseerd, dan vult het de versie aan die in de catalogus
//      op <tot> volgt en al een analyse had, want die kreeg nieuwe diffs. Tot slot changelog:build --all en --check.
// Stopt het, bv. op een limiet van het abonnement of een netwerkfout, draai dan hetzelfde commando opnieuw: wat klaar
// is, slaat het over. Voor één nieuwe release is er catalog:update.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareVersions } from '../../../server/src/catalog.mjs';
import { buildReleaseFiles } from '../../../server/src/changelog.mjs';
import { COMMITS_SCHEMA } from '../../../server/src/commits.mjs';
import { releaseVersions } from '../source-repo.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');
// Enkel releases, zonder prerelease: strenger dan VERSION in resources/common.mjs.
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const USAGE = 'Gebruik: pnpm run flux:catalog:backfill [--skip-analysis] [--max <aantal>] <van> <tot>';

// De scripts per fase, in deze volgorde voor elke release.
const SOURCE_STEPS = ['web-types:copy', 'packages:copy', 'changelog:copy', 'changelog:cleanup', 'changelog:commits'];
const ANALYSIS_STEPS = ['changelog:analyse'];

const args = process.argv.slice(2);
let skipAnalysis = false;
let max = Infinity;
const positional = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skip-analysis') skipAnalysis = true;
    else if (args[i] === '--max' && /^[1-9]\d*$/.test(args[i + 1] ?? '')) max = Number(args[++i]);
    else if (args[i].startsWith('--')) positional.push(null);
    else positional.push(args[i]);
}
if (positional.length !== 2 || positional.includes(null)) {
    console.error(USAGE);
    process.exit(1);
}
const [from, to] = positional.map((arg) => arg.replace(/^v/, ''));
for (const version of [from, to]) {
    if (!VERSION.test(version)) {
        console.error(`Ongeldige versie: ${version}. ${USAGE}`);
        process.exit(1);
    }
}
const major = Number(from.split('.')[0]);
if (Number(to.split('.')[0]) !== major || compareVersions(from, to) > 0) {
    console.error(`<van> en <tot> horen bij dezelfde major, en <van> is niet hoger dan <tot>: ${from} ${to}.`);
    process.exit(1);
}

// Draait één script; faalt het, dan stopt alles met het commando om te hernemen.
function run(step, ...stepArgs) {
    console.log(`== ${step} ${stepArgs.join(' ')}`);
    const result = spawnSync('pnpm', ['run', '--silent', `flux:${step}`, ...stepArgs], {
        cwd: REPO_ROOT,
        stdio: 'inherit',
    });
    if (result.status !== 0) {
        console.error(`\n[FOUT] ${step} ${stepArgs.join(' ')} faalde. Los het op en herneem met:`);
        console.error(`       pnpm run flux:catalog:backfill ${args.join(' ')}`);
        process.exit(1);
    }
}

// De bronnen van een versie staan er, met een commits.json in het huidige formaat.
function hasSources(version) {
    const dir = path.join(CATALOG_DIR, version);
    const commits = path.join(dir, 'changelog', 'commits.json');
    return (
        ['web-types', 'packages', 'changelog/changelog.md'].every((part) => fs.existsSync(path.join(dir, part))) &&
        fs.existsSync(commits) &&
        JSON.parse(fs.readFileSync(commits, 'utf-8')).schema === COMMITS_SCHEMA
    );
}

// Elke entry van een versie heeft een analyse, en de versie een samenvatting.
function analysisComplete(version) {
    try {
        const { release } = buildReleaseFiles(CATALOG_DIR, version);
        return Boolean(release.summary) && release.entries.every((entry) => entry.impactSource === 'analysis');
    } catch {
        return false;
    }
}

let versions;
try {
    versions = releaseVersions(major).filter((v) => compareVersions(v, from) >= 0 && compareVersions(v, to) <= 0);
} catch (error) {
    console.error(`[FOUT] ${error.message}`);
    process.exit(1);
}
for (const version of [from, to]) {
    if (!versions.includes(version)) {
        console.error(`${version} is geen release op develop-v${major}.`);
        console.error(`Releases in dat bereik: ${versions.join(', ')}`);
        process.exit(1);
    }
}
console.log(`${versions.length} releases op develop-v${major}: ${versions.join(', ')}\n`);

// Fase 1: de bronnen, van oud naar nieuw.
const sourced = [];
for (const version of versions) {
    if (hasSources(version)) continue;
    for (const step of SOURCE_STEPS) run(step, version);
    sourced.push(version);
}
const fetched = sourced.length > 0 ? `bronnen opgehaald voor ${sourced.join(', ')}` : 'alle bronnen stonden er al';
console.log(`\nFase 1: ${fetched}.`);
run('changelog:build', '--all');

if (skipAnalysis) {
    console.log('\nZonder analyse. Later, met Claude Code:');
    console.log(`  pnpm run flux:catalog:backfill ${from} ${to}`);
    process.exit(0);
}

// Fase 2: de analyse, van oud naar nieuw; wat klaar is, slaat het over. Met --max stopt het na zoveel versies.
const analysed = [];
const todo = versions.filter((version) => !analysisComplete(version));
for (const version of todo.slice(0, max)) {
    for (const step of ANALYSIS_STEPS) run(step, version);
    analysed.push(version);
}
const remaining = todo.slice(analysed.length);

// De versies die in de catalogus op <tot> volgen en al een analyse hadden, kregen nieuwe diffs toen <tot> erbij
// kwam: hun analyse wordt aangevuld. Een volgende versie zonder analyse hoort bij een latere reeks. Enkel als deze
// run iets toevoegde en het bereik af is; anders is het misschien al gebeurd, of nog te vroeg.
const next = fs
    .readdirSync(CATALOG_DIR)
    .filter((name) => !versions.includes(name))
    .filter((name) => {
        const file = path.join(CATALOG_DIR, name, 'changelog', 'release.json');
        return fs.existsSync(file) && JSON.parse(fs.readFileSync(file, 'utf-8')).previous === to;
    })
    .filter((name) => analysisComplete(name));
if (remaining.length === 0 && (sourced.includes(to) || analysed.length > 0)) {
    for (const version of next) for (const step of ANALYSIS_STEPS) run(step, version);
} else if (remaining.length === 0 && next.length > 0) {
    console.log(`\nNiets nieuws in deze run; ${next.join(', ')} niet opnieuw nagekeken. Gebeurde dat nog niet:`);
    for (const version of next) console.log(`  pnpm run flux:changelog:analyse ${version}`);
}

run('changelog:build', '--all');
run('changelog:build', '--check');
console.log(`\nGeanalyseerd in deze run: ${analysed.length > 0 ? analysed.join(', ') : 'niets'}.`);
if (remaining.length > 0) {
    console.log(`Nog te analyseren: ${remaining.join(', ')}. Herneem met hetzelfde commando.`);
} else {
    console.log(`Klaar: ${from} tot en met ${to} staan in de catalogus, geanalyseerd en gecontroleerd.`);
}
