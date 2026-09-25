// Haalt per changelog-entry de feiten uit de commit: de uitleg in de commit message, in welk soort bestanden de
// wijziging zit, en welke Storybook-pagina's ze raakt, met de documentatie die erbij kwam.
//
//   pnpm run flux:web-components:changelog-commits 2.20.0    # catalog/flux/2.20.0/changelog/commits.json
//
// De versie is verplicht; 2.20.0 en v2.20.0 mogen allebei. Het script leest de commits uit changelog.md (draai dus
// eerst changelog-copy en changelog-cleanup) en haalt ze op uit de bronrepo, zoals de andere scripts: met
// FLUX_REPO kies je een lokale clone. De Storybook-pagina's komen uit index.json van de Storybook van die release.
// changelog-build neemt het resultaat op in de ticketbestanden in changelog/tickets/.
//
// Het script is deterministisch voor een gereleasede versie: geen tijdstempel, vaste volgorde. Een nieuwe run
// vervangt commits.json.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelog } from '../../../server/src/changelog.mjs';
import { commitFacts } from '../../../server/src/commits.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');
const FLUX_REPO = process.env.FLUX_REPO || 'https://github.com/milieuinfo/flux-web-components.git';
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/;
const STORYBOOK = (version) => `https://flux.omgeving.vlaanderen.be/release-v${version.split('.')[0]}/${version}/storybook`;

if (process.argv.length !== 3) {
    console.error('Geef een versie op: pnpm run flux:web-components:changelog-commits <versie>');
    process.exit(1);
}
const version = process.argv[2].replace(/^v/, '');
if (!VERSION.test(version)) {
    console.error(`Ongeldige versie: ${process.argv[2]}`);
    process.exit(1);
}

const changelogFile = path.join(CATALOG_DIR, version, 'changelog', 'changelog.md');
if (!fs.existsSync(changelogFile)) {
    console.error(`Geen changelog.md in catalog/flux/${version}/changelog. Haal ze eerst op:`);
    console.error(`pnpm run flux:web-components:changelog-copy ${version} en flux:web-components:changelog-cleanup ${version}`);
    process.exit(1);
}
const release = parseChangelog(fs.readFileSync(changelogFile, 'utf-8'));
const shas = [...new Set(release.entries.flatMap((entry) => entry.commits.map((commit) => commit.sha)))];

// Enkel de commits van deze release, zonder blobs: git haalt enkel de bestanden op die het script leest. Met
// --deepen=1 is ook de ouder van de oudste commit er, zodat haar diff klopt. Een lokale clone kopieert git
// gewoon; filters werken daar niet.
const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-commits-'));
process.on('exit', () => fs.rmSync(workdir, { recursive: true, force: true }));
const source = path.join(workdir, 'flux-web-components');
const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
const remote = /^[a-z+]+:\/\//.test(FLUX_REPO) || /^[^/]+@[^:]+:/.test(FLUX_REPO);

console.log(`Ophalen van ${FLUX_REPO} (v${version})`);
const clone = ['clone', '--quiet', '--no-checkout', '--branch', `v${version}`];
if (remote) clone.push('--filter=blob:none', ...(release.previous ? [`--shallow-exclude=v${release.previous}`] : []));
execFileSync('git', [...clone, FLUX_REPO, source], { stdio: ['ignore', 'ignore', 'inherit'] });
if (remote && release.previous) git('fetch', '--quiet', '--deepen=1');

const missing = shas.filter((sha) => {
    try {
        git('cat-file', '-e', `${sha}^{commit}`);
        return false;
    } catch {
        return true;
    }
});
if (missing.length > 0) {
    console.error(`Deze commits staan niet in de geschiedenis van v${version}: ${missing.join(', ')}`);
    process.exit(1);
}

const index = await fetch(`${STORYBOOK(version)}/index.json`).then((response) => {
    if (!response.ok) throw new Error(`Geen index.json voor Storybook ${version}: HTTP ${response.status}`);
    return response.json();
});

const show = (sha, args, paths = []) =>
    git('show', '--format=', '--no-renames', '--diff-merges=first-parent', ...args, sha, '--', ...paths);
const commits = {};
for (const sha of shas) {
    const files = show(sha, ['--name-status'])
        .split('\n')
        .filter(Boolean)
        .map((line) => {
            const [status, file] = line.split('\t');
            return { status: status[0], path: file };
        });
    const diffs = {};
    for (const { status, path: file } of files) {
        if (file.endsWith('.mdx') && status !== 'D') diffs[file] = show(sha, ['--unified=0'], [file]);
    }
    commits[sha] = commitFacts({ sha, message: git('log', '-1', '--format=%B', sha), files, diffs, index, version });
}

const target = path.join(CATALOG_DIR, version, 'changelog', 'commits.json');
fs.writeFileSync(target, `${JSON.stringify({ schema: 1, version, previous: release.previous, commits }, null, 2)}\n`);
console.log(`Geschreven: ${path.relative(REPO_ROOT, target)}, ${shas.length} commits.`);
for (const entry of release.entries) {
    for (const { sha } of entry.commits) {
        const facts = commits[sha];
        const areas = Object.entries(facts.areas).map(([area, count]) => `${area} ${count}`).join(', ');
        const published = facts.published ? 'raakt de packages' : 'raakt de packages niet';
        console.log(`  ${entry.id} ${published}; ${areas}; ${facts.storybook.length} Storybook-pagina's${facts.body ? '' : '; geen uitleg in de commit'}`);
    }
}
