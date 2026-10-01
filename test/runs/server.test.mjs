import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { setup, workspace } from '../helpers/runs.mjs';

let context;
let ws;
before(async () => {
    context = await setup();
    ws = workspace(context);
    const { code, stdout, stderr } = await ws.run('flux:catalog:backfill', ['--skip-analysis', '1.0.0', '1.1.0']);
    if (code !== 0) throw new Error(`catalog:backfill faalde:\n${stdout}\n${stderr}`);
    const storybook = await ws.run('flux:storybook:copy', ['--all']);
    if (storybook.code !== 0) throw new Error(`storybook:copy faalde:\n${storybook.stdout}\n${storybook.stderr}`);
});
after(async () => {
    ws.remove();
    await context.close();
});

// Start de server uit een bestand in de kopie, stuurt de berichten over stdin en geeft de antwoorden.
function talk(file, messages) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [file], { cwd: ws.dir, env: { ...process.env, ...context.env } });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk) => (stdout += chunk));
        child.stderr.on('data', (chunk) => (stderr += chunk));
        child.on('error', reject);
        child.on('close', (code) => {
            if (code !== 0) reject(new Error(`${file} stopte met ${code}:\n${stderr}`));
            else
                resolve(
                    stdout
                        .trim()
                        .split('\n')
                        .map((line) => JSON.parse(line)),
                );
        });
        child.stdin.end(messages.map((message) => `${JSON.stringify(message)}\n`).join(''));
    });
}

const MESSAGES = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {} } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'flux_list_versions', arguments: {} } },
    {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
            name: 'flux_get_component',
            arguments: { version: '1.1.0', component: 'vl-knop', sections: ['api', 'docs'] },
        },
    },
    {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'flux_get_upgrade', arguments: { from: '1.0.0', to: 'latest', components: ['vl-knop'] } },
    },
    { jsonrpc: '2.0', id: 5, method: 'resources/read', params: { uri: 'flux://1.0.0/docs/afnemen-aan-de-slag' } },
];

describe('flux:server:pack', () => {
    test('bouwt dist/flux-mcp: de server, het manifest en enkel wat de server van de catalogus leest', async () => {
        const { code, stdout, stderr } = await ws.run('flux:server:pack');
        assert.equal(code, 0, stdout + stderr);
        assert.match(stdout, /2 versies, 4 pagina's in 3 bestanden/);
        const manifest = ws.json('dist/flux-mcp/package.json');
        assert.equal(manifest.private, undefined, 'het pakket is niet private');
        assert.equal(manifest.version, ws.json('server/package.json').version);
        assert.ok(ws.exists(path.posix.join('dist/flux-mcp', manifest.bin['flux-mcp'])));
        assert.ok(ws.exists('dist/flux-mcp/server/package.json'), 'de server leest er zijn versie uit');
        assert.ok(ws.exists('dist/flux-mcp/CHANGELOG.md'));
        assert.ok(ws.exists('dist/flux-mcp/catalog/flux/1.1.0/changelog/release.json'));
        assert.ok(!ws.exists('dist/flux-mcp/catalog/flux/1.1.0/changelog/changelog.md'));
        assert.ok(!ws.exists('dist/flux-mcp/catalog/flux/1.1.0/changelog/commits.json'));
        assert.ok(!ws.exists('dist/flux-mcp/catalog/flux/1.1.0/storybook/pages'));
        const index = ws.json('dist/flux-mcp/catalog/flux/1.1.0/storybook/index.json');
        assert.ok(
            index.pages.every((page) => /^\.\.\/\.\.\/storybook-pages\/[a-z0-9-]+\/[0-9a-f]{12}\.md$/.test(page.file)),
        );
        const before = ws.json('dist/flux-mcp/catalog/flux/1.0.0/storybook/index.json');
        const file = (pages, id) => pages.find((page) => page.id === id).file;
        assert.equal(file(before.pages, 'afnemen-aan-de-slag'), file(index.pages, 'afnemen-aan-de-slag'), 'één keer');
    });

    test('de server uit het pakket geeft dezelfde antwoorden als uit de repo', async () => {
        if (!ws.exists('dist/flux-mcp')) await ws.run('flux:server:pack');
        const fromRepo = await talk('server/bin/flux-mcp.mjs', MESSAGES);
        const fromPackage = await talk('dist/flux-mcp/server/bin/flux-mcp.mjs', MESSAGES);
        assert.equal(fromPackage.length, 5, 'een antwoord per verzoek, geen voor de notificatie');
        assert.deepEqual(fromPackage, fromRepo);
        assert.ok(fromPackage.slice(1, 4).every((response) => response.result && !response.result.isError));
        assert.equal(fromPackage[1].result.structuredContent.latest, '1.1.0');
        assert.match(fromPackage[2].result.content[0].text, /^# vl-knop \(Flux 1\.1\.0\)/);
        assert.match(fromPackage[4].result.contents[0].text, /^# /);
    });
});

describe('flux:server:eval', () => {
    test('per vraag de eerste tool van flux-mcp, enkel met de server; faalt bij een verkeerde keuze', async () => {
        const run = ws.copy();
        run.write(
            'vragen.json',
            JSON.stringify([
                { question: 'In welke versie zit FLUX-1?', expected: ['flux_find_changes'] },
                { question: 'Welke attributen heeft vl-knop in 1.1.0?', expected: ['flux_get_component'] },
            ]),
        );
        const { code, stdout } = await run.run('flux:server:eval', ['--questions', 'vragen.json']);
        assert.equal(code, 1, stdout);
        assert.match(stdout, /goed {2}In welke versie zit FLUX-1\?/);
        assert.match(stdout, /FOUT {2}Welke attributen heeft vl-knop in 1\.1\.0\?/);
        assert.match(stdout, /\n {7}verwacht flux_get_component, kreeg flux_list_versions/);
        assert.match(stdout, /1 van 2 vragen kozen de juiste tool \(claude-sonnet-5-5, effort medium\)/);
        const [first] = run.claudeRuns();
        const tools = first.args.indexOf('--tools');
        assert.equal(first.args[tools + 1], '', 'geen ingebouwde tools');
        assert.ok(first.args.includes('--strict-mcp-config'));
        assert.ok(first.args.includes('mcp__flux__*'));
        assert.ok(!first.cwd.startsWith(run.dir), 'in een lege map, zonder de CLAUDE.md van de repo');
        run.remove();
    });
});
