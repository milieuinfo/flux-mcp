// Haalt per changelog-entry de feiten uit de commit: de uitleg in de commit message, in welk soort bestanden de
// wijziging zit, en welke Storybook-pagina's ze raakt, met de documentatie die erbij kwam. Daarnaast de commits
// tussen de vorige en deze tag die de packages raken maar niet in de changelog staan ('unlisted').
//
//   pnpm run flux:changelog:commits 2.20.0    # catalog/flux/2.20.0/changelog/commits.json
//
// De versie is verplicht; 2.20.0 en v2.20.0 mogen allebei. Het script leest de commits uit changelog.md (draai dus
// eerst changelog:copy en changelog:cleanup) en haalt ze op uit de bronrepo, zoals de andere scripts: met
// FLUX_REPO kies je een lokale clone. De Storybook-pagina's komen uit index.json van de Storybook van die release.
// changelog:build neemt het resultaat op in de ticketbestanden in changelog/tickets/.
//
// Het script is deterministisch voor een gereleasede versie: geen tijdstempel, vaste volgorde. Een nieuwe run
// vervangt commits.json.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelog } from '../../../server/src/changelog.mjs';
import { COMMITS_SCHEMA, commitFacts, unlistedCommit } from '../../../server/src/commits.mjs';
import { storybookBase } from '../../../server/src/storybook-url.mjs';
import { cloneRelease } from '../source-repo.mjs';
import { VERSION } from '../../common.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');

if (process.argv.length !== 3) {
    console.error('Geef een versie op: pnpm run flux:changelog:commits <versie>');
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
    console.error(`pnpm run flux:changelog:copy ${version} en flux:changelog:cleanup ${version}`);
    process.exit(1);
}
const release = parseChangelog(fs.readFileSync(changelogFile, 'utf-8'));
const shas = [...new Set(release.entries.flatMap((entry) => entry.commits.map((commit) => commit.sha)))];

const { git, releaseShas } = cloneRelease({ version, previous: release.previous });

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

const index = await fetch(`${storybookBase(version)}index.json`).then((response) => {
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

const unlisted = [];
for (const sha of releaseShas.filter((candidate) => !shas.includes(candidate))) {
    const files = show(sha, ['--name-only'])
        .split('\n')
        .filter(Boolean)
        .map((file) => ({ path: file }));
    const commit = unlistedCommit({ sha, message: git('log', '-1', '--format=%B', sha), files });
    if (commit) unlisted.push(commit);
}

const target = path.join(CATALOG_DIR, version, 'changelog', 'commits.json');
const content = { schema: COMMITS_SCHEMA, version, previous: release.previous, commits, unlisted };
fs.writeFileSync(target, `${JSON.stringify(content, null, 2)}\n`);
console.log(`Geschreven: ${path.relative(REPO_ROOT, target)}, ${shas.length} commits uit de changelog.`);
if (release.previous) {
    const others = releaseShas.length - releaseShas.filter((sha) => shas.includes(sha)).length;
    console.log(
        `  ${releaseShas.length} commits sinds v${release.previous}; ${others} niet in de changelog, ` +
            `waarvan ${unlisted.length} de packages raken`,
    );
    for (const commit of unlisted) console.log(`    ${commit.sha.slice(0, 7)} ${commit.subject}`);
}
for (const entry of release.entries) {
    for (const { sha } of entry.commits) {
        const facts = commits[sha];
        const areas = Object.entries(facts.areas).map(([area, count]) => `${area} ${count}`).join(', ');
        const published = facts.published ? 'raakt de packages' : 'raakt de packages niet';
        const body = facts.body ? '' : '; geen uitleg in de commit';
        console.log(`  ${entry.id} ${published}; ${areas}; ${facts.storybook.length} Storybook-pagina's${body}`);
    }
}
