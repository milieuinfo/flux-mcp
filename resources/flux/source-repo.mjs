// De bronrepo van Flux Web Components, voor de scripts die er meer uit lezen dan één bestand:
//   - cloneRelease: een clone van één release, voor wie de commits leest (changelog:commits) of de diff en de code
//     laat lezen (changelog:analyse);
//
// FLUX_REPO kiest de bron, zoals bij de andere scripts: standaard GitHub, of een lokale clone. Een clone komt in een
// tijdelijke map die verdwijnt wanneer het script stopt; je eigen clone wordt nooit gewijzigd.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FLUX_REPO, FLUX_REPO_REMOTE } from '../common.mjs';

// Enkel de commits van deze release, zonder blobs: git haalt enkel de bestanden op die gelezen worden. Met
// --deepen=1 is ook de ouder van de oudste commit er, zodat haar diff klopt. Een lokale clone kopieert git
// gewoon; filters werken daar niet, maar de tags zijn er wel.
//
// Geeft terug:
//   source:      de map van de clone;
//   git:         git uitvoeren in die clone;
//   releaseShas: alle commits van de release, oudste eerst, zonder merges: bereikbaar vanuit deze tag en niet
//                vanuit de vorige. Een clone met --shallow-exclude bevat net die commits, dus lezen we ze vóór
//                --deepen.
export function cloneRelease({ version, previous }) {
    const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-source-'));
    process.on('exit', () => fs.rmSync(workdir, { recursive: true, force: true }));
    const source = path.join(workdir, 'flux-web-components');
    const git = (...args) =>
        execFileSync('git', ['-C', source, ...args], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });

    console.log(`Ophalen van ${FLUX_REPO} (v${version})`);
    const clone = ['clone', '--quiet', '--no-checkout', '--branch', `v${version}`];
    if (FLUX_REPO_REMOTE) clone.push('--filter=blob:none', ...(previous ? [`--shallow-exclude=v${previous}`] : []));
    execFileSync('git', [...clone, FLUX_REPO, source], { stdio: ['ignore', 'ignore', 'inherit'] });

    const inRelease = (...args) => git('rev-list', '--no-merges', '--reverse', ...args).split('\n').filter(Boolean);
    let releaseShas = [];
    if (previous) releaseShas = FLUX_REPO_REMOTE ? inRelease('HEAD') : inRelease(`v${version}`, `^v${previous}`);
    if (FLUX_REPO_REMOTE && previous) git('fetch', '--quiet', '--deepen=1');
    return { source, git, releaseShas };
}
