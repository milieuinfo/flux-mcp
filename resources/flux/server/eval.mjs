// Toetst of een model met de beschrijvingen van de tools de juiste tool kiest (ADR-004, sectie 9): per kennisvraag een
// headless run van Claude Code met enkel deze MCP-server, en de eerste tool van flux-mcp die het model aanroept.
//
//   pnpm run flux:server:eval
//   pnpm run flux:server:eval --model claude-opus-5-5 --effort high
//   pnpm run flux:server:eval --questions <bestand.json>
//
// De vragen staan in resources/flux/server/kennisvragen.json: { question, expected }, met in 'expected' de tools die
// goed zijn als eerste keuze. Elke run heeft enkel de tools van flux-mcp (--tools ""), zodat het model niet uitwijkt
// naar Bash of Read, en draait in een lege map, zonder de CLAUDE.md van deze repo. De runs lopen op het abonnement van
// Claude Code (zie claude-run.mjs); ze horen niet bij pnpm test.
//
// Standaard Sonnet 5.5 met effort medium: een model zoals een afnemer het in zijn project gebruikt. Faalt als een
// vraag een andere tool kiest, of geen.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireClaude, runClaude } from '../claude-run.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const USAGE = 'Gebruik: pnpm run flux:server:eval [--model <model>] [--effort <effort>] [--questions <bestand>]';
const PREFIX = 'mcp__flux__';

const args = process.argv.slice(2);
const options = {
    model: 'claude-sonnet-5-5',
    effort: 'medium',
    questions: path.join(REPO_ROOT, 'resources', 'flux', 'server', 'kennisvragen.json'),
};
for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    if (!(key in options) || args[i + 1] == null) {
        console.error(USAGE);
        process.exit(1);
    }
    options[key] = key === 'questions' ? path.resolve(args[i + 1]) : args[i + 1];
}

let questions;
try {
    questions = JSON.parse(fs.readFileSync(options.questions, 'utf-8'));
} catch (error) {
    console.error(`De vragen in ${options.questions} zijn niet te lezen: ${error.message}`);
    process.exit(1);
}
try {
    requireClaude();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

// Een lege map met enkel de configuratie van de server: geen CLAUDE.md, geen projectinstellingen.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-mcp-eval-'));
const config = path.join(dir, 'mcp.json');
const server = path.join(REPO_ROOT, 'server', 'bin', 'flux-mcp.mjs');
fs.writeFileSync(config, JSON.stringify({ mcpServers: { flux: { command: 'node', args: [server] } } }));

const results = [];
try {
    for (const [index, { question, expected }] of questions.entries()) {
        const result = await runClaude({
            label: `kennisvraag ${index + 1} van ${questions.length}`,
            prompt: question,
            cwd: dir,
            model: options.model,
            effort: options.effort,
            tools: [],
            allowed: [`${PREFIX}*`],
            extra: ['--mcp-config', config, '--strict-mcp-config'],
        });
        const used = result.toolUses
            .filter((use) => use.name.startsWith(PREFIX))
            .map((use) => use.name.slice(PREFIX.length));
        const first = used[0] ?? null;
        results.push({ question, expected, first, used, ok: expected.includes(first) });
    }
} finally {
    fs.rmSync(dir, { recursive: true, force: true });
}

console.log('');
for (const { question, expected, first, used, ok } of results) {
    const shown = question.length > 90 ? `${question.slice(0, 90)}…` : question;
    console.log(`${ok ? 'goed ' : 'FOUT '} ${shown}`);
    if (!ok) console.log(`       verwacht ${expected.join(' of ')}, kreeg ${first ?? 'geen tool'}`);
    else if (used.length > 1) console.log(`       daarna ${used.slice(1).join(', ')}`);
}
const good = results.filter((result) => result.ok).length;
const run = `${options.model}, effort ${options.effort}`;
console.log(`\n${good} van ${results.length} vragen kozen de juiste tool (${run}).`);
process.exit(good === results.length ? 0 : 1);
