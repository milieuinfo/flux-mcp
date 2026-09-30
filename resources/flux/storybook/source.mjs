// Een checkout van één release van de bronrepo, voor de scripts rond de documentatie uit Storybook: storybook:copy
// leest er de MDX en de stories uit, storybook:analyse laat Claude er de stories en de code lezen.
//
// FLUX_REPO kiest de bron, zoals bij de andere scripts: standaard GitHub, of een lokale clone. Een lokale clone
// kopieert git met hardlinks; van GitHub halen we enkel de tag, zonder blobs, en de checkout haalt de bestanden op.
// De checkout komt in een tijdelijke map; je eigen clone wordt nooit gewijzigd.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FLUX_REPO, FLUX_REPO_REMOTE } from '../../common.mjs';

// Wat de documentatie gebruikt: Storybook, de packages en de stories, de helpers, de versie van Storybook, en de
// aliassen van de imports (tsconfig.base.json), bv. naar de voorbeeldcomponenten in libs/integrations.
const PATHS = ['apps/storybook', 'libs', 'resources', 'package.json', 'tsconfig.base.json'];

// Geeft { dir, repo, remove }. 'repo' leest bestanden relatief tegenover de root van de bronrepo: read(pad) geeft
// de tekst of null, list(map) alle bestanden eronder. 'remove' ruimt de checkout op; anders gebeurt dat bij het
// stoppen van het script.
export function checkoutRelease(version) {
    const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-storybook-'));
    const remove = () => fs.rmSync(workdir, { recursive: true, force: true });
    process.on('exit', remove);
    const dir = path.join(workdir, 'flux-web-components');
    console.log(`Ophalen van ${FLUX_REPO} (v${version})`);
    const clone = ['clone', '--quiet', '--no-checkout', '--branch', `v${version}`];
    if (FLUX_REPO_REMOTE) clone.push('--depth', '1', '--filter=blob:none');
    execFileSync('git', [...clone, FLUX_REPO, dir], { stdio: ['ignore', 'ignore', 'inherit'] });
    // Enkel de paden die in deze tag bestaan: ls-tree toont ze, een onbestaand pad laat checkout falen.
    const lsTree = ['-C', dir, 'ls-tree', '--name-only', 'HEAD', '--', ...PATHS];
    const paths = execFileSync('git', lsTree, { encoding: 'utf-8' }).split('\n').filter(Boolean);
    const checkout = ['-C', dir, 'checkout', '--quiet', 'HEAD', '--', ...paths];
    execFileSync('git', checkout, { stdio: ['ignore', 'ignore', 'inherit'] });
    const repo = {
        read(file) {
            const full = path.join(dir, file);
            return fs.existsSync(full) && fs.statSync(full).isFile() ? fs.readFileSync(full, 'utf-8') : null;
        },
        list(sub) {
            const found = [];
            const walk = (relative) => {
                const full = path.join(dir, relative);
                if (!fs.existsSync(full)) return;
                for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
                    const child = `${relative}/${entry.name}`;
                    if (entry.isDirectory()) walk(child);
                    else found.push(child);
                }
            };
            walk(sub);
            return found.sort();
        },
    };
    return { dir, repo, remove };
}
