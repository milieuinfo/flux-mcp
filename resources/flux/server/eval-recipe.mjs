// Evalueert een recept van begin tot einde op een echte toepassing (ADR-004, sectie 9): Claude Code voert het recept
// uit met flux-mcp, en het script controleert daarna zelf het resultaat.
//
//   pnpm run flux:server:eval-recipe migreren
//   pnpm run flux:server:eval-recipe migreren --model claude-opus-5-5 --effort high --keep
//
// Per recept staat in server/test/fixtures/<recept>.json welke toepassing het krijgt (server/test/fixtures/<app>/),
// met welke argumenten, en wat er na de run moet kloppen. Het script:
//   1. kopieert de toepassing naar een tijdelijke map, met git, en installeert ze; de e2e-testen moeten er groen zijn;
//   2. start het recept als slash-commando (/mcp__flux__<recept>), zoals een ontwikkelaar het doet. Het recept stopt
//      bij zijn checkpoint; het script hervat dan de sessie met "akkoord";
//   3. controleert zelf: de versies in package.json, de build en de e2e-testen, flux_check_markup op de HTML, de
//      gekende verschillen, en het rapport in .flux/rapporten/.
//
// Het vraagt netwerk: de registry van Flux, npm en een browser voor Playwright. pnpm draait met een lege
// gebruikersconfiguratie (NPM_CONFIG_USERCONFIG), zodat een token in ~/.npmrc de installatie niet beïnvloedt: de
// packages van Flux zijn publiek. De runs lopen op het abonnement van Claude Code (claude-run.mjs) en duren lang;
// ze horen niet bij pnpm test. --keep laat de tijdelijke map staan om ze na te kijken.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDocs } from '../../../server/src/docs.mjs';
import { checkMarkup } from '../../../server/src/markup.mjs';
import { requireClaude, runClaude } from '../claude-run.mjs';
import { fileProblems, leftoverProblems, packageProblems, reportProblems } from './recipe-check.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const FIXTURES = path.join(REPO_ROOT, 'server', 'test', 'fixtures');
const USAGE = 'Gebruik: pnpm run flux:server:eval-recipe <recept> [--model <model>] [--effort <effort>] [--keep]';
const CONFIRM = 'Akkoord: voer het plan uit, verifieer het en schrijf het rapport.';

const args = process.argv.slice(2);
const options = { model: 'claude-opus-5-5', effort: 'high', keep: false };
const positional = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--keep') options.keep = true;
    else if (['--model', '--effort'].includes(args[i]) && args[i + 1]) options[args[i].slice(2)] = args[++i];
    else if (!args[i].startsWith('--')) positional.push(args[i]);
    else {
        console.error(USAGE);
        process.exit(1);
    }
}
const configFile = path.join(FIXTURES, `${positional[0]}.json`);
if (positional.length !== 1 || !fs.existsSync(configFile)) {
    const known = fs
        .readdirSync(FIXTURES)
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.slice(0, -5));
    console.error(`${USAGE}\nRecepten met een evaluatie: ${known.join(', ') || 'geen'}.`);
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
try {
    requireClaude();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

// Het echte pad: op macOS is de tijdelijke map een link, en de rechten van Claude Code gelden voor het pad erachter.
const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'flux-mcp-recept-')));
const app = path.join(dir, 'app');
const env = { NPM_CONFIG_USERCONFIG: path.join(dir, 'npmrc') };
fs.writeFileSync(env.NPM_CONFIG_USERCONFIG, '');
fs.cpSync(path.join(FIXTURES, config.app), app, { recursive: true });

// Een stap in de toepassing; faalt met de uitvoer als 'required'.
function run(label, command, commandArgs, { required = true } = {}) {
    console.log(`== ${label}: ${command} ${commandArgs.join(' ')}`);
    const result = spawnSync(command, commandArgs, { cwd: app, env: { ...process.env, ...env }, encoding: 'utf-8' });
    if (result.status !== 0 && required) {
        throw new Error(`${label} faalde:\n${`${result.stdout}\n${result.stderr}`.trim().slice(-3000)}`);
    }
    return result.status === 0;
}

let problems = [];
try {
    run('git', 'git', ['init', '--quiet']);
    run('git', 'git', ['add', '-A']);
    run('git', 'git', [
        '-c',
        'user.name=flux-mcp',
        '-c',
        'user.email=flux-mcp@example.invalid',
        'commit',
        '--quiet',
        '-m',
        'De toepassing voor de migratie',
    ]);
    run('installeren', 'pnpm', ['install', '--frozen-lockfile']);
    run('browser', 'pnpm', ['exec', 'playwright', 'install', 'chromium']);
    run('e2e vooraf', 'pnpm', ['run', 'test:e2e']);

    const mcp = path.join(dir, 'mcp.json');
    const server = path.join(REPO_ROOT, 'server', 'bin', 'flux-mcp.mjs');
    fs.writeFileSync(mcp, JSON.stringify({ mcpServers: { flux: { command: 'node', args: [server] } } }));
    const claude = {
        cwd: app,
        model: options.model,
        effort: options.effort,
        env,
        allowed: [
            'mcp__flux__*',
            'Read',
            'Grep',
            'Glob',
            `Edit(/${app}/**)`,
            `Write(/${app}/**)`,
            'Bash(pnpm:*)',
            'Bash(git status:*)',
            'Bash(git diff:*)',
            'Bash(ls:*)',
            'Bash(mkdir:*)',
            'Bash(date:*)',
        ],
        extra: ['--mcp-config', mcp, '--strict-mcp-config'],
    };
    const command = `/mcp__flux__${config.recipe} ${config.arguments.join(' ')}`.trim();
    const first = await runClaude({
        ...claude,
        label: `${config.recipe}: tot het checkpoint`,
        prompt: command,
        persist: true,
    });
    console.log(`\n${first.result}\n`);
    const second = await runClaude({
        ...claude,
        label: `${config.recipe}: na het checkpoint`,
        prompt: CONFIRM,
        resume: first.session_id,
    });
    console.log(`\n${second.result}\n`);

    console.log('== controle');
    const manifest = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf-8'));
    problems.push(...packageProblems(manifest, config.packages ?? {}));
    if (!run('installeren', 'pnpm', ['install'], { required: false })) problems.push('pnpm install faalt.');
    if (!run('build', 'pnpm', ['run', 'build'], { required: false })) problems.push('De build faalt.');
    if (!run('e2e', 'pnpm', ['run', 'test:e2e'], { required: false })) problems.push('De e2e-testen zijn niet groen.');
    const version = config.packages?.['@domg-wc/components'];
    if (version) {
        const context = createDocs().markupContextOf(version);
        for (const file of fs.readdirSync(app).filter((name) => name.endsWith('.html'))) {
            const html = fs.readFileSync(path.join(app, file), 'utf-8');
            for (const finding of checkMarkup(html, { syntax: 'html', ...context })) {
                if (finding.severity === 'error') problems.push(`${file}:${finding.line}: ${finding.message}`);
            }
        }
    }
    problems.push(...fileProblems(app, config.files ?? []));
    const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], {
        cwd: app,
        encoding: 'utf-8',
    });
    problems.push(...leftoverProblems(status.stdout));
    const reports = path.join(app, '.flux', 'rapporten');
    const found = fs.existsSync(reports)
        ? fs.readdirSync(reports).filter((file) => file.endsWith(`-${config.recipe}.md`))
        : [];
    if (found.length !== 1) {
        problems.push(`Verwacht één rapport .flux/rapporten/<datum>-${config.recipe}.md, gevonden: ${found.length}.`);
    } else {
        const template = fs.readFileSync(path.join(REPO_ROOT, 'server', 'templates', `${config.recipe}.md`), 'utf-8');
        const report = fs.readFileSync(path.join(reports, found[0]), 'utf-8');
        problems.push(
            ...reportProblems(report, { template, ...config.report }).map((problem) => `rapport: ${problem}`),
        );
    }
    const diff = spawnSync('git', ['diff', '--stat', 'HEAD'], { cwd: app, encoding: 'utf-8' }).stdout.trim();
    console.log(`\nGewijzigd tegenover de toepassing:\n${diff}`);
} catch (error) {
    problems = [error.message];
} finally {
    if (options.keep) console.log(`\nDe toepassing na de run: ${app}`);
    else fs.rmSync(dir, { recursive: true, force: true });
}

if (problems.length > 0) {
    console.log(`\nHet recept ${config.recipe} slaagt niet (${options.model}, effort ${options.effort}):`);
    for (const problem of problems) console.log(`  - ${problem}`);
    process.exit(1);
}
console.log(`\nHet recept ${config.recipe} slaagt (${options.model}, effort ${options.effort}).`);
