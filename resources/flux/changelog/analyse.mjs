// Laat Claude Code de analyse van een Flux-release schrijven en daarna controleren, zonder tussenkomst van een mens.
//
//   pnpm run flux:changelog:analyse 2.20.0
//   FLUX_REPO=~/pad/naar/flux-web-components pnpm run flux:changelog:analyse 2.20.0
//
// Twee stappen, elk een headless run van Claude Code (claude -p) in deze repo:
//   1. de analyse, met prompts/changelog-analyse.md: schrijft catalog/flux/<versie>/changelog-analysis/, of vult een
//      bestaande analyse aan;
//   2. de review, met prompts/changelog-review.md: controleert de analyse tegen de feiten, verbetert wat niet klopt
//      en rapporteert dat in een vast JSON-formaat.
// Daarna bouwt het script de versie opnieuw en controleert het dat elke entry een analyse heeft. Het faalt als de
// review iets niet kon oplossen, of als de analyse niet bij de tickets past.
//
// De clone van de bronrepo is uitgecheckt op de tag, zodat Claude de code van die versie met Read, Grep en Glob
// leest (--add-dir); git grep laat Claude Code niet toe via Bash. Claude Code mag verder enkel schrijven in de
// analyse van die versie, changelog:build draaien en de bronrepo lezen met git show, ls-tree en log. Al de rest
// wordt geweigerd; het script toont wat er geweigerd werd.
//
// De runs lopen op het abonnement waarmee Claude Code aangemeld is (claude auth login), niet op een API-sleutel:
// het script haalt ANTHROPIC_API_KEY en ANTHROPIC_AUTH_TOKEN uit de omgeving van claude, en stopt als een run toch
// een sleutel gebruikt. Het verbruik telt zo mee in de limieten van het abonnement, zonder kosten per token.
//
// Instellingen via de omgeving:
//   FLUX_CLAUDE_MODEL   het model, standaard opus;
//   FLUX_CLAUDE_EFFORT  de effort, standaard xhigh: grondiger dan high;
//   FLUX_CLAUDE_BUDGET  optioneel een maximum per stap, in dollar aan API-tarief; standaard geen.
// Voorwaarde: Claude Code is geïnstalleerd en aangemeld; 'claude auth status' toont "authMethod": "claude.ai".
//
// Een LLM is niet deterministisch: twee runs geven niet dezelfde tekst. Wat in git komt, is wat de review goedkeurde.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReleaseFiles, parseChangelog, writeReleaseFiles } from '../../../server/src/changelog.mjs';
import { cloneRelease } from '../source-repo.mjs';
import { VERSION } from '../../common.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_DIR = path.join(REPO_ROOT, 'catalog', 'flux');
const MODEL = process.env.FLUX_CLAUDE_MODEL || 'opus';
const EFFORT = process.env.FLUX_CLAUDE_EFFORT || 'xhigh';
const BUDGET = process.env.FLUX_CLAUDE_BUDGET || null;
// Zonder deze variabelen gebruikt claude de aanmelding van het abonnement.
const { ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, ...CLAUDE_ENV } = process.env;

// Wat de review teruggeeft; de sleutels zijn Engels, de teksten Nederlands.
const REVIEW_SCHEMA = {
    type: 'object',
    properties: {
        status: { type: 'string', enum: ['ok', 'fixed', 'unresolved'] },
        corrections: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    file: { type: 'string' },
                    entry: { type: 'string' },
                    change: { type: 'string' },
                    reason: { type: 'string' },
                },
                required: ['file', 'entry', 'change', 'reason'],
            },
        },
        unresolved: {
            type: 'array',
            items: {
                type: 'object',
                properties: { file: { type: 'string' }, entry: { type: 'string' }, problem: { type: 'string' } },
                required: ['file', 'entry', 'problem'],
            },
        },
    },
    required: ['status', 'corrections', 'unresolved'],
};

if (process.argv.length !== 3) {
    console.error('Geef een versie op: pnpm run flux:changelog:analyse <versie>');
    process.exit(1);
}
const version = process.argv[2].replace(/^v/, '');
if (!VERSION.test(version)) {
    console.error(`Ongeldige versie: ${process.argv[2]}`);
    process.exit(1);
}

const changelogDir = path.join(CATALOG_DIR, version, 'changelog');
if (!fs.existsSync(path.join(changelogDir, 'release.json'))) {
    console.error(`Geen gebouwde changelog voor ${version}. Haal de release eerst op:`);
    console.error(`pnpm run flux:catalog:update ${version}`);
    process.exit(1);
}
if (spawnSync('claude', ['--version'], { encoding: 'utf-8' }).status !== 0) {
    console.error("Claude Code ontbreekt of werkt niet. Installeer het, meld je aan, en test met 'claude --version'.");
    process.exit(1);
}

const { previous } = parseChangelog(fs.readFileSync(path.join(changelogDir, 'changelog.md'), 'utf-8'));
const { source, git } = cloneRelease({ version, previous });
git('checkout', '--quiet', `v${version}`);

// Een prompt uit prompts/, zonder front matter, met de argumenten ingevuld.
function prompt(name) {
    const text = fs.readFileSync(path.join(REPO_ROOT, 'prompts', `${name}.md`), 'utf-8');
    return text
        .replace(/^---\n[\s\S]*?\n---\n/, '')
        .replaceAll('{{version}}', version)
        .replaceAll('{{repo}}', source);
}

const analysisDir = `catalog/flux/${version}/changelog-analysis`;
const ALLOWED = [
    'Read',
    'Grep',
    'Glob',
    // Absolute paden ('//' in een regel): een relatief pad leest Claude Code tegenover de huidige map van de shell,
    // en na een 'cd' in Bash klopt de regel dan niet meer.
    `Edit(/${path.join(REPO_ROOT, analysisDir)}/**)`,
    `Write(/${path.join(REPO_ROOT, analysisDir)}/**)`,
    ...['show', 'ls-tree', 'log'].map((command) => `Bash(git -C ${source} ${command} *)`),
    'Bash(pnpm run flux:changelog:build *)',
];

// Kort wat Claude doet, zodat een lange run niet stil lijkt.
function progress(tool) {
    const input = tool.input ?? {};
    const detail = input.command ?? input.file_path ?? input.pattern ?? '';
    const shown = String(detail).replace(REPO_ROOT + '/', '').replace(source, '<bron>');
    console.log(`  · ${tool.name} ${shown.length > 100 ? `${shown.slice(0, 100)}…` : shown}`);
}

// Eén headless run van Claude Code. Geeft het resultaat terug zoals claude het meldt.
function claude(step, text, extra = []) {
    console.log(`== ${step} ${version} (claude -p, ${MODEL}, effort ${EFFORT}${BUDGET ? `, max $${BUDGET}` : ''})`);
    const args = [
        '-p',
        '--model', MODEL,
        '--effort', EFFORT,
        '--output-format', 'stream-json',
        '--verbose',
        '--no-session-persistence',
        // Expliciet manual: anders neemt claude de defaultMode uit de instellingen over. In 'auto' keurt een
        // classifier dan zelf acties goed die niet in --allowedTools staan, zoals 'node -e'.
        '--permission-mode', 'manual',
        '--permission-prompts', 'none',
        ...(BUDGET ? ['--max-budget-usd', BUDGET] : []),
        '--add-dir', source,
        '--tools', 'Read', 'Grep', 'Glob', 'Edit', 'Write', 'Bash',
        '--allowedTools', ...ALLOWED,
        ...extra,
    ];
    const started = Date.now();
    return new Promise((resolve, reject) => {
        const child = spawn('claude', args, { cwd: REPO_ROOT, env: CLAUDE_ENV, stdio: ['pipe', 'pipe', 'inherit'] });
        let buffer = '';
        let result = null;
        child.stdout.on('data', (chunk) => {
            buffer += chunk;
            let newline;
            while ((newline = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, newline).trim();
                buffer = buffer.slice(newline + 1);
                if (!line) continue;
                let event;
                try {
                    event = JSON.parse(line);
                } catch {
                    continue;
                }
                // Een sleutel uit bv. een apiKeyHelper in de instellingen: stop, voor er iets verbruikt wordt.
                if (event.type === 'system' && event.subtype === 'init' && event.apiKeySource !== 'none') {
                    child.kill();
                    return reject(
                        new Error(
                            `claude gebruikt een API-sleutel (${event.apiKeySource}) in plaats van het abonnement. ` +
                                "Verwijder die bron, en meld aan met 'claude auth login'.",
                        ),
                    );
                }
                if (event.type === 'result') result = event;
                for (const part of event.type === 'assistant' ? event.message.content : []) {
                    if (part.type === 'tool_use' && part.name !== 'StructuredOutput') progress(part);
                }
            }
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (!result) return reject(new Error(`claude stopte zonder resultaat (exit ${code}).`));
            console.log(`  ${result.num_turns} beurten, ${Math.round((Date.now() - started) / 60000)} min`);
            // Het verbruik per model, om in te schatten wat een reeks versies vraagt van het abonnement. De
            // lijstprijs is wat het via de API zou kosten; met een abonnement wordt ze niet aangerekend.
            const k = (n) => `${Math.round(n / 1000)}k`;
            for (const [model, u] of Object.entries(result.modelUsage ?? {})) {
                console.log(
                    `  tokens ${model}: ${k(u.inputTokens)} in, ${k(u.cacheReadInputTokens)} uit de cache, ` +
                        `${k(u.cacheCreationInputTokens)} naar de cache, ${k(u.outputTokens)} uit ` +
                        `(lijstprijs $${u.costUSD.toFixed(2)})`,
                );
            }
            for (const denial of result.permission_denials ?? []) {
                const input = denial.tool_input?.command ?? denial.tool_input?.file_path ?? '';
                console.log(`  geweigerd: ${denial.tool_name} ${String(input).replace(source, '<bron>')}`);
            }
            if (result.is_error) {
                const detail = result.result ? `: ${result.result}` : '';
                return reject(new Error(`claude faalde: ${result.subtype}${detail}`));
            }
            resolve(result);
        });
        child.stdin.end(text);
    });
}

try {
    const analysis = await claude('analyse', prompt('changelog-analyse'));
    console.log(`\n${analysis.result.trim()}\n`);

    const review = await claude('review', prompt('changelog-review'), ['--json-schema', JSON.stringify(REVIEW_SCHEMA)]);
    const verdict = review.structured_output;
    if (!verdict) throw new Error('De review gaf geen resultaat in het afgesproken formaat.');
    console.log(`\nReview: ${verdict.status}`);
    for (const c of verdict.corrections) console.log(`  verbeterd: ${c.file} ${c.entry}: ${c.change} (${c.reason})`);
    for (const u of verdict.unresolved) console.log(`  NIET OPGELOST: ${u.file} ${u.entry}: ${u.problem}`);

    // Wat de server zal tonen, opnieuw gebouwd: elke entry heeft een analyse, en de versie een samenvatting.
    const built = buildReleaseFiles(CATALOG_DIR, version);
    writeReleaseFiles(CATALOG_DIR, version, built.files);
    const missing = built.release.entries.filter((entry) => entry.impactSource !== 'analysis').map((entry) => entry.id);
    if (missing.length > 0) throw new Error(`Nog niet geanalyseerd: ${missing.join(', ')}.`);
    if (!built.release.summary) throw new Error(`Geen summary in ${analysisDir}/release.json.`);
    if (verdict.status === 'unresolved') throw new Error('De review kon niet alles oplossen; zie hierboven.');
    console.log(`\nKlaar: ${analysisDir}/ is geschreven en gecontroleerd.`);
} catch (error) {
    console.error(`\n[FOUT] ${error.message}`);
    console.error(`Draai opnieuw: pnpm run flux:changelog:analyse ${version}`);
    process.exit(1);
}
