// De bronrepo van Flux Web Components, voor de scripts die er meer uit lezen dan één bestand:
//   - cloneRelease: een clone van één release, voor wie de commits leest (changelog:commits) of de diff en de code
//     laat lezen (changelog:analyse);
//   - releaseVersions: de releases van een major, voor catalog:backfill (zie ADR-002).
//
// FLUX_REPO kiest de bron, zoals bij de andere scripts: standaard GitHub, of een lokale clone. Een clone komt in een
// tijdelijke map die verdwijnt wanneer het script stopt; je eigen clone wordt nooit gewijzigd.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FLUX_REPO, FLUX_REPO_REMOTE } from '../common.mjs';

// De releases in de onderwerpen van de commits: 'chore(release): 2.8.1 [skip ci]' is release 2.8.1. Enkel die van
// deze major, oplopend en elk één keer.
export function releasesFromLog(subjects, major) {
    const versions = new Set();
    for (const subject of subjects) {
        const match = /^chore\(release\): (\d+)\.(\d+)\.(\d+)(?=\s|$)/.exec(subject.trim());
        if (match && Number(match[1]) === major) versions.add(`${match[1]}.${match[2]}.${match[3]}`);
    }
    const parts = (version) => version.split('.').map(Number);
    return [...versions].sort((a, b) => {
        const [pa, pb] = [parts(a), parts(b)];
        return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
    });
}

// De releases van een major zoals Flux ze maakt: de commits 'chore(release): X.Y.Z' op de hoofdlijn (first-parent)
// van develop-v<major>. Patches op een zijtak, zoals 2.17.1, staan daar niet op. Een lokale clone lezen we zoals ze
// is: haal develop-v<major> eerst op met git fetch.
export function releaseVersions(major) {
    const branch = `develop-v${major}`;
    const log = (dir, ref) =>
        execFileSync('git', ['-C', dir, 'log', ref, '--first-parent', '--format=%s'], {
            encoding: 'utf-8',
            maxBuffer: 64 * 1024 * 1024,
        }).split('\n');
    if (!FLUX_REPO_REMOTE) {
        const refs = [`origin/${branch}`, branch];
        const ref = refs.find((candidate) => {
            try {
                const args = ['-C', FLUX_REPO, 'rev-parse', '--verify', '--quiet', candidate];
                execFileSync('git', args, { stdio: 'ignore' });
                return true;
            } catch {
                return false;
            }
        });
        if (!ref) {
            throw new Error(`${FLUX_REPO} kent ${branch} niet. Haal die branch op: git fetch origin ${branch}`);
        }
        return releasesFromLog(log(FLUX_REPO, ref), major);
    }
    // Enkel de commits, zonder bestanden: meer is niet nodig voor hun onderwerp.
    const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-releases-'));
    process.on('exit', () => fs.rmSync(workdir, { recursive: true, force: true }));
    const dir = path.join(workdir, 'flux-web-components');
    const clone = ['clone', '--quiet', '--no-checkout', '--filter=tree:0', '--single-branch', '--branch', branch];
    execFileSync('git', [...clone, FLUX_REPO, dir], { stdio: ['ignore', 'ignore', 'inherit'] });
    return releasesFromLog(log(dir, 'HEAD'), major);
}

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
