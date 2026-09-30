// Wat de tests van de runs delen: de nagemaakte flux-web-components, een lokale site met Storybook en de registry, een
// nagemaakte claude op het PATH, en per test een kopie van deze repo waarin de scripts draaien zoals met pnpm run.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createWorkspace } from '../../resources/workspace.mjs';
import { createFluxRepo, startSite } from './flux-repo.mjs';

const CLAUDE = path.join(import.meta.dirname, 'claude.mjs');

// De bron voor alle runs van een testbestand. Geeft { env, close }: env wijst de scripts naar de nagemaakte repo, de
// lokale site en de nagemaakte claude.
export async function setup() {
    const repo = createFluxRepo();
    const site = await startSite();
    const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-claude-'));
    fs.writeFileSync(path.join(bin, 'claude'), `#!/bin/sh\nexec node '${CLAUDE}' "$@"\n`, { mode: 0o755 });
    const env = {
        FLUX_REPO: repo.dir,
        FLUX_STORYBOOK_URL: site.url,
        FLUX_REGISTRY: site.registry,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    };
    const close = async () => {
        await site.close();
        repo.remove();
        fs.rmSync(bin, { recursive: true, force: true });
    };
    return { env, site, close };
}

// Een kopie van de repo met een lege catalogus. run(script, args, env) draait 'pnpm run --silent <script>' in de
// kopie en geeft { code, stdout, stderr }; copy() geeft een nieuwe kopie van deze kopie, bv. na een voorbereiding die
// meerdere tests delen.
export function workspace(context, dir = createWorkspace({ prefix: 'flux-mcp-run-' })) {
    // Het echte pad: op macOS is de tijdelijke map een link, en de scripts zien het pad erachter.
    dir = fs.realpathSync(dir);
    const log = path.join(dir, 'claude.log');
    const file = (relative) => path.join(dir, relative);
    return {
        dir,
        run(script, args = [], env = {}) {
            return new Promise((resolve, reject) => {
                const child = spawn('pnpm', ['run', '--silent', script, ...args], {
                    cwd: dir,
                    env: { ...process.env, ...context.env, FLUX_TEST_CLAUDE_LOG: log, ...env },
                });
                let stdout = '';
                let stderr = '';
                child.stdout.on('data', (chunk) => (stdout += chunk));
                child.stderr.on('data', (chunk) => (stderr += chunk));
                child.on('error', reject);
                child.on('close', (code) => resolve({ code, stdout, stderr }));
            });
        },
        exists: (relative) => fs.existsSync(file(relative)),
        read: (relative) => fs.readFileSync(file(relative), 'utf-8'),
        json: (relative) => JSON.parse(fs.readFileSync(file(relative), 'utf-8')),
        list: (relative) => (fs.existsSync(file(relative)) ? fs.readdirSync(file(relative)).sort() : []),
        write(relative, content) {
            fs.mkdirSync(path.dirname(file(relative)), { recursive: true });
            fs.writeFileSync(file(relative), content);
        },
        // De runs van de nagemaakte claude, in volgorde.
        claudeRuns() {
            if (!fs.existsSync(log)) return [];
            return fs.readFileSync(log, 'utf-8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
        },
        copy() {
            const target = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-mcp-run-'));
            fs.cpSync(dir, target, { recursive: true });
            fs.rmSync(path.join(target, 'claude.log'), { force: true });
            return workspace(context, target);
        },
        remove: () => fs.rmSync(dir, { recursive: true, force: true }),
    };
}

// De bronnen van een versie, zoals catalog:update ze ophaalt, zonder de Storybook.
export const sources = (version) => [
    ['flux:web-types:copy', version],
    ['flux:packages:copy', version],
    ['flux:changelog:copy', version],
    ['flux:changelog:cleanup', version],
    ['flux:changelog:commits', version],
];

// Draait de scripts na elkaar en faalt bij het eerste dat faalt, met zijn uitvoer.
export async function runAll(ws, steps) {
    for (const [script, ...args] of steps) {
        const result = await ws.run(script, args);
        if (result.code !== 0) {
            const output = `${result.stdout}\n${result.stderr}`;
            throw new Error(`${script} ${args.join(' ')} faalde (exit ${result.code}):\n${output}`);
        }
    }
}
