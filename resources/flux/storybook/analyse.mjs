// Laat Claude Code de analyse van de Storybook-pagina's van een Flux-release schrijven en controleren, voor de
// pagina's waarvan de inhoud nog geen analyse heeft. Zie docs/beslissingen/ADR-003-storybook-per-versie.md.
//
//   pnpm run flux:storybook:analyse 2.20.0
//   pnpm run flux:storybook:analyse --dry-run 2.20.0   # toont wat geanalyseerd zou worden
//   pnpm run flux:storybook:analyse --max 10 2.20.0    # hoogstens 10 pagina's in deze run
//   FLUX_REPO=~/pad/naar/flux-web-components pnpm run flux:storybook:analyse 2.20.0
//
// Een analyse hoort bij de inhoud van een pagina: catalog/flux/storybook-analysis/<pagina>/<inputHash>.json. Heeft
// een pagina dezelfde inhoud als in een andere versie, dan bestaat haar analyse al, en slaat het script ze over. Zo
// wordt per release enkel geanalyseerd wat nieuw is of wijzigde. Een gewijzigde pagina krijgt de analyse van de
// dichtstbijzijnde andere versie mee, en Claude werkt die bij in plaats van opnieuw te beginnen.
//
// Per reeks pagina's twee headless runs van Claude Code, zoals changelog:analyse:
//   1. de analyse, met prompts/storybook-analyse.md;
//   2. de review, met prompts/storybook-review.md, die de analyse tegen de bron controleert, verbetert wat niet
//      klopt en dat in een vast JSON-formaat meldt.
// Daarna toetst het script elke analyse aan de web-types (validateAnalysis). Het faalt als de review iets niet kon
// oplossen of als een analyse niet klopt. Wat klaar is, blijft staan: draai hetzelfde commando opnieuw om verder te
// gaan. De analyses van de reeks die faalde of onderbroken werd (Ctrl+C, SIGTERM), zijn niet (volledig) gereviewd;
// die verwijdert het, zodat het hernemen ze opnieuw maakt.
//
// Claude mag lezen, enkel de analyses van de pagina's in de reeks schrijven, en storybook:check draaien. De checkout
// van de bronrepo leest het met Read, Grep en Glob (--add-dir).
//
// Het LLM-werk rond Storybook draait altijd op Opus 5.5 (claude-opus-5-5) met effort xhigh: een agent neemt de
// voorbeelden letterlijk over, dus ze moeten zo goed mogelijk kloppen. Het vaste model-id zorgt dat een nieuwere Opus
// de keuze niet stilletjes verandert. Instellingen via de omgeving: FLUX_CLAUDE_BUDGET (zie claude-run.mjs) en
// FLUX_STORYBOOK_BATCH: hoeveel pagina's per reeks, standaard 5.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    ANALYSIS_DIR,
    analysisPath,
    discardAnalyses,
    loadAnalysis,
    loadStorybook,
    storybookVersions,
    validateAnalysis,
} from '../../../server/src/storybook.mjs';
import { loadWebTypes } from '../../../server/src/web-types.mjs';
import { requireClaude, runClaude, stopRunning } from '../claude-run.mjs';
import { checkoutRelease } from './source.mjs';
import { VERSION } from '../../common.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');
const USAGE = 'Gebruik: pnpm run flux:storybook:analyse [--dry-run] [--max <aantal>] <versie>';
// Het model en de effort voor de analyse en de review van Storybook; bewust niet via de omgeving te wijzigen.
const MODEL = 'claude-opus-5-5';
const EFFORT = 'xhigh';
const BATCH_PAGES = Number(process.env.FLUX_STORYBOOK_BATCH) || 5;
// Een reeks met veel stories wordt korter, zodat een run niet te groot wordt.
const BATCH_STORIES = 40;

// Wat de review teruggeeft; de sleutels zijn Engels, de teksten Nederlands.
const REVIEW_SCHEMA = {
    type: 'object',
    properties: {
        status: { type: 'string', enum: ['ok', 'fixed', 'unresolved'] },
        corrections: {
            type: 'array',
            items: {
                type: 'object',
                properties: { page: { type: 'string' }, change: { type: 'string' }, reason: { type: 'string' } },
                required: ['page', 'change', 'reason'],
            },
        },
        unresolved: {
            type: 'array',
            items: {
                type: 'object',
                properties: { page: { type: 'string' }, problem: { type: 'string' } },
                required: ['page', 'problem'],
            },
        },
    },
    required: ['status', 'corrections', 'unresolved'],
};

const args = process.argv.slice(2);
let dryRun = false;
let max = Infinity;
const positional = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') dryRun = true;
    else if (args[i] === '--max' && /^[1-9]\d*$/.test(args[i + 1] ?? '')) max = Number(args[++i]);
    else if (args[i].startsWith('--')) positional.push(null);
    else positional.push(args[i]);
}
if (positional.length !== 1 || positional.includes(null)) {
    console.error(USAGE);
    process.exit(1);
}
const version = positional[0].replace(/^v/, '');
if (!VERSION.test(version)) {
    console.error(`Ongeldige versie: ${positional[0]}. ${USAGE}`);
    process.exit(1);
}
const storybook = loadStorybook(CATALOG_DIR, version);
if (!storybook) {
    console.error(`Geen Storybook voor ${version} in de catalogus. Haal ze eerst op:`);
    console.error(`pnpm run flux:storybook:copy ${version}`);
    process.exit(1);
}
const webTypes = loadWebTypes(CATALOG_DIR, version);
const relative = (file) => path.relative(REPO_ROOT, file);

// De analyse van dezelfde pagina in de dichtstbijzijnde andere versie: eerst de oudere, dan de nieuwere.
function previousOf(page) {
    const versions = storybookVersions(CATALOG_DIR);
    const at = versions.indexOf(version);
    const order = [...versions.slice(0, at).reverse(), ...versions.slice(at + 1)];
    for (const other of order) {
        const otherPage = loadStorybook(CATALOG_DIR, other).pages.find((candidate) => candidate.id === page.id);
        if (!otherPage || !loadAnalysis(CATALOG_DIR, otherPage)) continue;
        return {
            version: other,
            analysis: relative(analysisPath(CATALOG_DIR, otherPage.id, otherPage.inputHash)),
            markdown: `catalog/flux/${other}/storybook/${otherPage.file}`,
        };
    }
    return null;
}

const todo = storybook.pages.filter((page) => !loadAnalysis(CATALOG_DIR, page));
const planned = todo.slice(0, max).map((page) => ({ page, previous: previousOf(page) }));
console.log(
    `${version}: ${storybook.pages.length - todo.length} van ${storybook.pages.length} pagina's hebben een analyse; ` +
        `${todo.length} te doen${planned.length < todo.length ? `, ${planned.length} in deze run` : ''}.`,
);
if (planned.length > 0) console.log(`Met ${MODEL}, effort ${EFFORT}:`);
for (const { page, previous } of planned) {
    const origin = previous ? `gewijzigd, vorige analyse in ${previous.version}` : 'nieuw';
    console.log(`  ${page.id} (${page.stories.length} stories, ${origin})`);
}
if (planned.length === 0 || dryRun) process.exit(0);

// De reeksen: hoogstens BATCH_PAGES pagina's en ongeveer BATCH_STORIES stories.
const batches = [];
for (const item of planned) {
    const last = batches.at(-1);
    const stories = last ? last.reduce((sum, { page }) => sum + page.stories.length, 0) : 0;
    if (!last || last.length >= BATCH_PAGES || stories + item.page.stories.length > BATCH_STORIES) batches.push([item]);
    else last.push(item);
}

// Wat een prompt over de pagina's van een reeks meekrijgt.
const describe = (batch) =>
    JSON.stringify(
        batch.map(({ page, previous }) => ({
            id: page.id,
            title: page.title,
            kind: page.kind,
            inputHash: page.inputHash,
            markdown: `catalog/flux/${version}/storybook/${page.file}`,
            sources: page.sources,
            elements: page.elements,
            stories: page.stories,
            write: relative(analysisPath(CATALOG_DIR, page.id, page.inputHash)),
            previous,
        })),
        null,
        2,
    );

// Wat niet klopt aan de analyses van een reeks: een ontbrekend bestand, ongeldige JSON, of validateAnalysis.
function problemsOf(batch) {
    const problems = [];
    for (const { page } of batch) {
        let analysis;
        try {
            analysis = loadAnalysis(CATALOG_DIR, page);
        } catch (error) {
            problems.push(`${ANALYSIS_DIR}/${page.id}/${page.inputHash}.json: geen geldige JSON (${error.message}).`);
            continue;
        }
        if (!analysis) problems.push(`${ANALYSIS_DIR}/${page.id}/${page.inputHash}.json ontbreekt.`);
        else problems.push(...validateAnalysis(analysis, page, webTypes));
    }
    return problems;
}

// De reeks die nu loopt. Faalt ze, of wordt het script onderbroken, dan zijn haar analyses niet (volledig) gereviewd:
// die verwijdert het, zodat hetzelfde commando ze opnieuw maakt in plaats van ze als klaar over te slaan.
let current = null;
function discardCurrent(reason) {
    if (!current) return;
    const removed = discardAnalyses(CATALOG_DIR, current.map(({ page }) => page));
    current = null;
    if (removed.length === 0) return;
    console.error(`\nDe analyses van deze reeks zijn ${reason}, en dus verwijderd:`);
    for (const file of removed) console.error(`  - ${file}`);
}
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
    process.once(signal, async () => {
        await stopRunning();
        discardCurrent('onderbroken');
        console.error(`\nOnderbroken. Draai opnieuw: pnpm run flux:storybook:analyse ${version}`);
        process.exit(code);
    });
}

try {
    requireClaude();
    const source = checkoutRelease(version);
    const prompt = (name, batch, problems = []) =>
        fs
            .readFileSync(path.join(REPO_ROOT, 'prompts', `${name}.md`), 'utf-8')
            .replace(/^---\n[\s\S]*?\n---\n/, '')
            .replaceAll('{{version}}', version)
            .replaceAll('{{repo}}', source.dir)
            .replaceAll('{{pages}}', describe(batch))
            .replaceAll('{{problems}}', problems.length > 0 ? problems.map((p) => `- ${p}`).join('\n') : 'Niets.');
    for (const [n, batch] of batches.entries()) {
        const label = `${version}, reeks ${n + 1} van ${batches.length}`;
        current = batch;
        const allowed = [
            'Read',
            'Grep',
            'Glob',
            // Absolute paden ('//' in een regel): een relatief pad leest Claude Code tegenover de huidige map van de
            // shell, en na een 'cd' in Bash klopt de regel dan niet meer.
            ...batch.flatMap(({ page }) => [
                `Write(/${path.join(CATALOG_DIR, ANALYSIS_DIR, page.id)}/**)`,
                `Edit(/${path.join(CATALOG_DIR, ANALYSIS_DIR, page.id)}/**)`,
            ]),
            `Bash(pnpm run flux:storybook:check ${version})`,
        ];
        const run = (step, text, extra) =>
            runClaude({
                label: `${step} ${label}`,
                prompt: text,
                cwd: REPO_ROOT,
                source: source.dir,
                allowed,
                model: MODEL,
                effort: EFFORT,
                extra,
            });

        const analysis = await run('analyse', prompt('storybook-analyse', batch));
        console.log(`\n${analysis.result.trim()}\n`);

        const review = await run('review', prompt('storybook-review', batch, problemsOf(batch)), [
            '--json-schema',
            JSON.stringify(REVIEW_SCHEMA),
        ]);
        const verdict = review.structured_output;
        if (!verdict) throw new Error('De review gaf geen resultaat in het afgesproken formaat.');
        console.log(`\nReview: ${verdict.status}`);
        for (const c of verdict.corrections) console.log(`  verbeterd: ${c.page}: ${c.change} (${c.reason})`);
        for (const u of verdict.unresolved) console.log(`  NIET OPGELOST: ${u.page}: ${u.problem}`);

        const problems = problemsOf(batch);
        if (problems.length > 0) {
            throw new Error(`De analyse klopt niet:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
        }
        if (verdict.status === 'unresolved') throw new Error('De review kon niet alles oplossen; zie hierboven.');
        current = null;
        console.log(`Klaar: ${batch.map(({ page }) => page.id).join(', ')}.\n`);
    }
    const left = storybook.pages.filter((page) => !loadAnalysis(CATALOG_DIR, page)).length;
    console.log(left === 0 ? `Klaar: elke pagina van ${version} heeft een analyse.` : `Nog ${left} pagina's te doen.`);
} catch (error) {
    console.error(`\n[FOUT] ${error.message}`);
    discardCurrent('niet volledig gereviewd');
    console.error(`Draai opnieuw: pnpm run flux:storybook:analyse ${version}`);
    process.exit(1);
}
