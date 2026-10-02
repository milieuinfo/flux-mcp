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
//      bij zijn checkpoint; het script hervat dan de sessie met "akkoord". Een recept zonder checkpoint, zoals
//      valideren, heeft "confirm": false en loopt in één run;
//   3. controleert zelf: de versies in package.json, de build en de e2e-testen, flux_check_markup op de HTML, de
//      gekende verschillen, het rapport in .flux/rapporten/, en voor valideren de afwijkingen in dat rapport en dat
//      de code ongewijzigd bleef ('unchanged': true, of een lijst van bestanden die niet mogen wijzigen). Voor review
//      komt er een pull request bij ('pr'), staat het rapport in het antwoord ('answer'), en moet elke afwijking in
//      de diff staan ('deviations.diffOnly'). Een recept dat van een ticket vertrekt, krijgt een nagemaakte Jira
//      ('jira', jira-stub.mjs).
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
import {
    answerReportOf,
    changedLinesOf,
    deviationProblems,
    fileProblems,
    leftoverProblems,
    modifiedProblems,
    packageProblems,
    reportProblems,
} from './recipe-check.mjs';

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
// Bestanden die het recept als invoer krijgt, bv. een afwijkingenrapport voor verbeteren: { doel in de toepassing:
// bron in server/test/fixtures/ }. Ze gaan mee in de eerste commit.
for (const [target, source] of Object.entries(config.add ?? {})) {
    fs.mkdirSync(path.dirname(path.join(app, target)), { recursive: true });
    fs.copyFileSync(path.join(FIXTURES, source), path.join(app, target));
}

// Een stap in de toepassing; faalt met de uitvoer als 'required'.
function run(label, command, commandArgs, { required = true } = {}) {
    console.log(`== ${label}: ${command} ${commandArgs.join(' ')}`);
    const result = spawnSync(command, commandArgs, { cwd: app, env: { ...process.env, ...env }, encoding: 'utf-8' });
    if (result.status !== 0 && required) {
        throw new Error(`${label} faalde:\n${`${result.stdout}\n${result.stderr}`.trim().slice(-3000)}`);
    }
    return result.status === 0;
}

// Een commit in de toepassing, met een vaste auteur.
const AUTHOR = ['-c', 'user.name=flux-mcp', '-c', 'user.email=flux-mcp@example.invalid'];
const commit = (message) => run('git', 'git', [...AUTHOR, 'commit', '--quiet', '-m', message]);

// Een pull request voor review: { branch, patch, message }, de patch in server/test/fixtures/. Ze komt als commit op
// een branch boven op main.
const patch = config.pr ? fs.readFileSync(path.join(FIXTURES, config.pr.patch), 'utf-8') : null;

let problems = [];
try {
    run('git', 'git', ['init', '--quiet', '--initial-branch', 'main']);
    run('git', 'git', ['add', '-A']);
    commit('De toepassing voor het recept');
    if (config.pr) {
        run('git', 'git', ['checkout', '--quiet', '-b', config.pr.branch]);
        run('git', 'git', ['apply', path.join(FIXTURES, config.pr.patch)]);
        run('git', 'git', ['add', '-A']);
        commit(config.pr.message);
    }
    run('installeren', 'pnpm', ['install', '--frozen-lockfile']);
    run('browser', 'pnpm', ['exec', 'playwright', 'install', 'chromium']);
    run('e2e vooraf', 'pnpm', ['run', 'test:e2e']);

    const mcp = path.join(dir, 'mcp.json');
    const server = path.join(REPO_ROOT, 'server', 'bin', 'flux-mcp.mjs');
    const servers = { flux: { command: 'node', args: [server] } };
    // Een recept dat van een ticket vertrekt, zoals uitbreiden, krijgt een nagemaakte Jira met de tickets uit
    // server/test/fixtures/; de commentaren komen in jira.log.
    const jiraLog = path.join(dir, 'jira.log');
    if (config.jira) {
        const stub = path.join(REPO_ROOT, 'resources', 'flux', 'server', 'jira-stub.mjs');
        servers.jira = { command: 'node', args: [stub, path.join(FIXTURES, config.jira), jiraLog] };
    }
    fs.writeFileSync(mcp, JSON.stringify({ mcpServers: servers }));
    const claude = {
        cwd: app,
        model: options.model,
        effort: options.effort,
        env,
        allowed: [
            'mcp__flux__*',
            ...(config.jira ? ['mcp__jira__*'] : []),
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
    const checkpoint = config.confirm !== false;
    const first = await runClaude({
        ...claude,
        label: checkpoint ? `${config.recipe}: tot het checkpoint` : config.recipe,
        prompt: command,
        persist: checkpoint,
    });
    console.log(`\n${first.result}\n`);
    let answer = first.result;
    if (checkpoint) {
        const second = await runClaude({
            ...claude,
            label: `${config.recipe}: na het checkpoint`,
            prompt: CONFIRM,
            resume: first.session_id,
        });
        console.log(`\n${second.result}\n`);
        answer = second.result;
    }

    console.log('== controle');
    const manifest = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf-8'));
    problems.push(...packageProblems(manifest, config.packages ?? {}));
    if (!run('installeren', 'pnpm', ['install'], { required: false })) problems.push('pnpm install faalt.');
    if (!run('build', 'pnpm', ['run', 'build'], { required: false })) problems.push('De build faalt.');
    if (!run('e2e', 'pnpm', ['run', 'test:e2e'], { required: false })) problems.push('De e2e-testen zijn niet groen.');
    // Een recept dat code wijzigt, laat geen error van flux_check_markup achter. Een recept dat niets wijzigt, zoals
    // valideren en review, meldt ze net: de errors in de toepassing zijn dan zijn invoer.
    const version = config.packages?.['@domg-wc/components'];
    if (version && config.unchanged !== true) {
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
    if (config.unchanged) {
        const paths = Array.isArray(config.unchanged) ? config.unchanged : null;
        problems.push(...modifiedProblems(status.stdout, paths));
    }
    // Het rapport: een bestand in .flux/rapporten/, of met 'answer' het laatste blok ~~~markdown in het antwoord,
    // zoals bij review, dat geen bestand mag schrijven.
    const reports = path.join(app, '.flux', 'rapporten');
    const found = fs.existsSync(reports) ? fs.readdirSync(reports).filter((file) => file.endsWith('.md')) : [];
    let report = null;
    if (config.answer) {
        if (found.length > 0) problems.push(`Het recept schreef ${found.join(', ')}, maar mag geen bestand schrijven.`);
        report = answerReportOf(answer);
        if (!report) problems.push('Het antwoord heeft geen rapport tussen ~~~markdown en ~~~.');
    } else {
        const own = found.filter((file) => file.endsWith(`-${config.recipe}.md`));
        if (own.length !== 1) {
            const expected = `.flux/rapporten/<datum>-${config.recipe}.md`;
            problems.push(`Verwacht één rapport ${expected}, gevonden: ${own.length}.`);
        } else {
            report = fs.readFileSync(path.join(reports, own[0]), 'utf-8');
        }
    }
    if (report) {
        const template = fs.readFileSync(path.join(REPO_ROOT, 'server', 'templates', `${config.recipe}.md`), 'utf-8');
        problems.push(
            ...reportProblems(report, { template, ...config.report }).map((problem) => `rapport: ${problem}`),
        );
        if (config.deviations) {
            const changed = config.deviations.diffOnly ? changedLinesOf(patch) : null;
            problems.push(
                ...deviationProblems(report, { ...config.deviations, changed }).map(
                    (problem) => `afwijkingen: ${problem}`,
                ),
            );
        }
    }
    if (config.jira && fs.existsSync(jiraLog)) {
        const comments = fs.readFileSync(jiraLog, 'utf-8').trim().split('\n').map((line) => JSON.parse(line));
        console.log(`\nCommentaar in Jira: ${comments.map(({ key }) => key).join(', ')}`);
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
