// Bouwt het npm-pakket van flux-mcp in dist/flux-mcp/ (ADR-004, sectie 8): de server en de catalogus, met dezelfde
// relatieve paden als in de repo. De code weet zo niet of ze uit de repo of uit het pakket draait.
//
//   pnpm run flux:server:pack
//
// Wat erin gaat:
//   - server/src/, server/bin/ en server/package.json, en server/prompts/ en server/templates/ als ze er zijn;
//   - package.json in de root: het manifest uit server/package.json, zonder 'private', dat enkel verhindert dat
//     iemand server/ zelf publiceert; en CHANGELOG.md uit server/;
//   - uit catalog/flux/ enkel wat de server leest: per versie web-types/, packages/, de gebouwde bestanden van
//     changelog/ (zonder changelog.md en commits.json), changelog-analysis/ en storybook/index.json, en daarnaast
//     storybook-analysis/;
//   - elke pagina van Storybook één keer, in catalog/flux/storybook-pages/<id>/<hash>.md, met als hash die van de
//     Markdown zelf. 'file' in de index.json van elke versie wijst ernaar, en loadStorybook volgt 'file'. De
//     inputHash kan hier niet dienen: die negeert witruimte, dus twee versies met dezelfde inputHash kunnen een andere
//     Markdown hebben.
//
// Publiceren doet het script niet; dat is de eerste release, na de keuze van een naam (open beslissing 8 van ADR-004):
//   pnpm publish dist/flux-mcp

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SERVER = path.join(REPO_ROOT, 'server');
const CATALOG = path.join(REPO_ROOT, 'catalog', 'flux');
const OUT = path.join(REPO_ROOT, 'dist', 'flux-mcp');
const OUT_CATALOG = path.join(OUT, 'catalog', 'flux');
const PAGES = 'storybook-pages';
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
// De bronnen van changelog/ die enkel changelog:build leest.
const CHANGELOG_SOURCES = new Set(['changelog.md', 'commits.json']);

if (process.argv.length > 2) {
    console.error('Gebruik: pnpm run flux:server:pack');
    process.exit(1);
}
if (!fs.existsSync(path.join(SERVER, 'package.json'))) {
    console.error('server/package.json ontbreekt: dat is het manifest van het pakket.');
    process.exit(1);
}
const versions = (fs.existsSync(CATALOG) ? fs.readdirSync(CATALOG) : []).filter((name) => VERSION.test(name)).sort();
if (versions.length === 0) {
    console.error('Geen versies in catalog/flux. Vul de catalogus eerst: pnpm run flux:catalog:update <versie>');
    process.exit(1);
}

const copy = (from, to, filter) =>
    fs.cpSync(from, to, {
        recursive: true,
        filter: (source) => !source.endsWith('.DS_Store') && (!filter || filter(source)),
    });

fs.rmSync(OUT, { recursive: true, force: true });
for (const part of ['src', 'bin', 'prompts', 'templates']) {
    if (fs.existsSync(path.join(SERVER, part))) copy(path.join(SERVER, part), path.join(OUT, 'server', part));
}
copy(path.join(SERVER, 'package.json'), path.join(OUT, 'server', 'package.json'));
const { private: _private, ...manifest } = JSON.parse(fs.readFileSync(path.join(SERVER, 'package.json'), 'utf-8'));
fs.writeFileSync(path.join(OUT, 'package.json'), `${JSON.stringify(manifest, null, 4)}\n`);
if (fs.existsSync(path.join(SERVER, 'CHANGELOG.md')))
    copy(path.join(SERVER, 'CHANGELOG.md'), path.join(OUT, 'CHANGELOG.md'));

let pages = 0;
const unique = new Set();
for (const version of versions) {
    const from = path.join(CATALOG, version);
    const to = path.join(OUT_CATALOG, version);
    for (const part of ['web-types', 'packages', 'changelog-analysis']) {
        if (fs.existsSync(path.join(from, part))) copy(path.join(from, part), path.join(to, part));
    }
    if (fs.existsSync(path.join(from, 'changelog'))) {
        copy(
            path.join(from, 'changelog'),
            path.join(to, 'changelog'),
            (source) => !CHANGELOG_SOURCES.has(path.basename(source)),
        );
    }
    const indexFile = path.join(from, 'storybook', 'index.json');
    if (!fs.existsSync(indexFile)) continue;
    const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
    for (const page of index.pages) {
        const markdown = fs.readFileSync(path.join(from, 'storybook', page.file));
        const hash = createHash('sha256').update(markdown).digest('hex').slice(0, 12);
        const file = path.posix.join(PAGES, page.id, `${hash}.md`);
        if (!unique.has(file)) {
            fs.mkdirSync(path.join(OUT_CATALOG, PAGES, page.id), { recursive: true });
            fs.writeFileSync(path.join(OUT_CATALOG, file), markdown);
            unique.add(file);
        }
        // Relatief tegenover catalog/flux/<versie>/storybook/.
        page.file = path.posix.join('..', '..', file);
        pages++;
    }
    fs.mkdirSync(path.join(to, 'storybook'), { recursive: true });
    fs.writeFileSync(path.join(to, 'storybook', 'index.json'), `${JSON.stringify(index, null, 4)}\n`);
}
if (fs.existsSync(path.join(CATALOG, 'storybook-analysis'))) {
    copy(path.join(CATALOG, 'storybook-analysis'), path.join(OUT_CATALOG, 'storybook-analysis'));
}

let size = 0;
let files = 0;
const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else {
            size += fs.statSync(file).size;
            files++;
        }
    }
};
walk(OUT);
console.log(`Gebouwd: dist/flux-mcp, ${manifest.name} ${manifest.version}.`);
console.log(`  ${versions.length} versies, ${pages} pagina's in ${unique.size} bestanden.`);
console.log(`  ${files} bestanden, ${(size / 1024 / 1024).toFixed(1)} MB.`);
console.log('Publiceren, bij een release: pnpm publish dist/flux-mcp');
