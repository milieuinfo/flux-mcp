import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { runAll, setup, sources, workspace } from '../helpers/runs.mjs';

// De analyses draaien met een nagemaakte claude (test/helpers/claude.mjs): de test kijkt naar wat het script aan
// Claude Code meegeeft, en wat het met het antwoord doet.
let context;
let base;
before(async () => {
    context = await setup();
    base = await prepared();
});
after(async () => {
    base.remove();
    await context.close();
});

// Een kopie met de bronnen van 1.0.0 en 1.1.0, gebouwd, en de Storybook van 1.1.0. Elke test krijgt er een kopie van.
async function prepared() {
    const ws = workspace(context);
    const build = [['flux:changelog:build', '--all'], ['flux:storybook:copy', '1.1.0']];
    await runAll(ws, [...sources('1.0.0'), ...sources('1.1.0'), ...build]);
    return ws;
}
const option = (args, name) => args[args.indexOf(name) + 1];
const allowedTools = (args) => {
    const start = args.indexOf('--allowedTools') + 1;
    const end = args.findIndex((arg, i) => i >= start && arg.startsWith('--'));
    return args.slice(start, end === -1 ? undefined : end);
};

// Elke test heeft een eigen kopie, dus ze lopen tegelijk.
describe('flux:changelog:analyse', { concurrency: true }, () => {

    test('een analyse en een review, met enkel de rechten die de analyse nodig heeft', async () => {
        const ws = base.copy();
        const env = { ANTHROPIC_API_KEY: 'geheim' };
        const { code, stdout, stderr } = await ws.run('flux:changelog:analyse', ['1.1.0'], env);
        assert.equal(code, 0, stdout + stderr);
        assert.match(stdout, /Review: ok/);
        const runs = ws.claudeRuns();
        assert.deepEqual(runs.map((run) => run.review), [false, true]);
        for (const { args, apiKey, cwd } of runs) {
            assert.equal(apiKey, false, 'claude krijgt geen API-sleutel');
            assert.equal(cwd, ws.dir);
            assert.equal(option(args, '--permission-mode'), 'manual');
            assert.equal(option(args, '--model'), 'opus');
            assert.equal(option(args, '--effort'), 'xhigh');
            const analysis = path.join(ws.dir, 'catalog/flux/1.1.0/changelog-analysis');
            const allowed = allowedTools(args);
            assert.ok(allowed.includes(`Write(/${analysis}/**)`), allowed.join('\n'));
            assert.ok(allowed.includes('Bash(pnpm run flux:changelog:build *)'));
            assert.ok(allowed.every((rule) => !rule.startsWith('Write') || rule.includes(analysis)));
        }
        const release = ws.json('catalog/flux/1.1.0/changelog-analysis/release.json');
        assert.match(release.summary, /1\.1\.0/);
        assert.equal((await ws.run('flux:changelog:build', ['--check'])).code, 0);
        ws.remove();
    });

    test('stopt als claude een API-sleutel gebruikt', async () => {
        const ws = base.copy();
        const { code, stderr } = await ws.run('flux:changelog:analyse', ['1.1.0'], { FLUX_TEST_CLAUDE: 'api-key' });
        assert.equal(code, 1);
        assert.match(stderr, /gebruikt een API-sleutel/);
        ws.remove();
    });

    test('faalt als de review niet alles kon oplossen', async () => {
        const ws = base.copy();
        const { code, stderr } = await ws.run('flux:changelog:analyse', ['1.1.0'], { FLUX_TEST_CLAUDE: 'unresolved' });
        assert.equal(code, 1);
        assert.match(stderr, /kon niet alles oplossen/);
        ws.remove();
    });
});

// Elke test heeft een eigen kopie, dus ze lopen tegelijk.
describe('flux:storybook:analyse', { concurrency: true }, () => {

    test('--dry-run toont wat te doen is, zonder claude', async () => {
        const ws = base.copy();
        const { code, stdout } = await ws.run('flux:storybook:analyse', ['--dry-run', '1.1.0']);
        assert.equal(code, 0);
        assert.match(stdout, /0 van 2 pagina's hebben een analyse; 2 te doen/);
        assert.deepEqual(ws.claudeRuns(), []);
        ws.remove();
    });

    test('schrijft per pagina een analyse onder haar inputHash, met Opus 5.5 op xhigh', async () => {
        const ws = base.copy();
        const { code, stdout, stderr } = await ws.run('flux:storybook:analyse', ['1.1.0']);
        assert.equal(code, 0, stdout + stderr);
        const pages = ws.json('catalog/flux/1.1.0/storybook/index.json').pages;
        for (const page of pages) {
            assert.ok(ws.exists(`catalog/flux/storybook-analysis/${page.id}/${page.inputHash}.json`), page.id);
        }
        for (const { args } of ws.claudeRuns()) {
            assert.equal(option(args, '--model'), 'claude-opus-5-5');
            assert.equal(option(args, '--effort'), 'xhigh');
            assert.equal(option(args, '--permission-mode'), 'manual');
            assert.ok(allowedTools(args).includes('Bash(pnpm run flux:storybook:check 1.1.0)'));
        }
        const check = await ws.run('flux:storybook:check', ['1.1.0']);
        assert.equal(check.code, 0, check.stdout + check.stderr);
        ws.remove();
    });

    test('een reeks die de review niet goedkeurt, verdwijnt weer', async () => {
        const ws = base.copy();
        const { code, stderr } = await ws.run('flux:storybook:analyse', ['1.1.0'], { FLUX_TEST_CLAUDE: 'unresolved' });
        assert.equal(code, 1);
        assert.match(stderr, /verwijderd/);
        assert.deepEqual(ws.list('catalog/flux/storybook-analysis/components-atom-knop'), []);
        ws.remove();
    });
});
