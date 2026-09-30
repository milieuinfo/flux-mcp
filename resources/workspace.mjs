// Een kopie van deze repo in een tijdelijke map, om de scripts te draaien zonder de catalogus in de repo te raken. De
// scripts leiden hun root af uit hun eigen plaats: in de kopie lezen en schrijven ze dus de catalogus van de kopie.
// flux:catalog:check draait er de scripts opnieuw in, de tests van de runs (test/runs/) draaien er elk script in.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Wat een script nodig heeft: package.json voor pnpm run, de scripts, de server en de prompts.
const PARTS = ['package.json', 'resources', 'server', 'prompts'];

// Maakt de kopie en geeft haar map. 'catalog' zijn de delen van de catalogus die mee moeten, bv. ['flux'];
// standaard een lege catalog/flux.
export function createWorkspace({ prefix = 'flux-mcp-', catalog = [] } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    for (const part of PARTS) fs.cpSync(path.join(REPO_ROOT, part), path.join(dir, part), { recursive: true });
    for (const part of catalog) {
        fs.cpSync(path.join(REPO_ROOT, 'catalog', part), path.join(dir, 'catalog', part), { recursive: true });
    }
    fs.mkdirSync(path.join(dir, 'catalog', 'flux'), { recursive: true });
    return dir;
}
