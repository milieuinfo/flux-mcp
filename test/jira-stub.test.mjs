// De nagemaakte Jira voor de evaluatie van frontend-uitbreiden (resources/flux/server/jira-stub.mjs): de methodes,
// en het script over stdio, met het ticket uit server/test/fixtures/frontend-uitbreiden/.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createJira } from '../resources/flux/server/jira-stub.mjs';
import { dispatch } from '../server/src/mcp/protocol.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TICKETS = path.join(ROOT, 'server', 'test', 'fixtures', 'frontend-uitbreiden', 'tickets.json');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-jira-'));
after(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('jira-stub', () => {
    const log = path.join(dir, 'jira.log');
    const methods = createJira({ tickets: JSON.parse(fs.readFileSync(TICKETS, 'utf-8')), log });
    let id = 0;
    const request = (method, params) => dispatch({ jsonrpc: '2.0', id: ++id, method, params }, methods);
    const call = async (name, args) => (await request('tools/call', { name, arguments: args })).result;

    test('de revisie van de client, en twee tools', async () => {
        const { result } = await request('initialize', { protocolVersion: '2025-06-18' });
        assert.equal(result.protocolVersion, '2025-06-18');
        const { result: list } = await request('tools/list', {});
        assert.deepEqual(list.tools.map((tool) => tool.name), ['jira_get_issue', 'jira_add_comment']);
    });

    test('het ticket CONT-12 van de evaluatie, en een onbekend ticket', async () => {
        const issue = JSON.parse((await call('jira_get_issue', { key: 'CONT-12' })).content[0].text);
        assert.equal(issue.key, 'CONT-12');
        assert.match(issue.description, /Acceptatiecriteria/);
        const unknown = await call('jira_get_issue', { key: 'CONT-99' });
        assert.equal(unknown.isError, true);
        assert.match(unknown.content[0].text, /Gekend: CONT-12/);
    });

    test('een commentaar komt als JSON-regel in het log', async () => {
        await call('jira_add_comment', { key: 'CONT-12', body: 'De analyse.' });
        assert.deepEqual(JSON.parse(fs.readFileSync(log, 'utf-8')), { key: 'CONT-12', body: 'De analyse.' });
        assert.equal((await request('tools/call', { name: 'jira_delete', arguments: {} })).error.code, -32602);
    });

    test('het script over stdio, zoals de evaluatie het start', () => {
        const input = [
            { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } },
            { jsonrpc: '2.0', method: 'notifications/initialized' },
            {
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/call',
                params: { name: 'jira_get_issue', arguments: { key: 'CONT-12' } },
            },
        ]
            .map((message) => JSON.stringify(message))
            .join('\n');
        const script = path.join(ROOT, 'resources', 'flux', 'server', 'jira-stub.mjs');
        const args = [script, TICKETS, path.join(dir, 'stdio.log')];
        const output = execFileSync('node', args, { input, encoding: 'utf-8' });
        const [initialized, issue] = output.trim().split('\n').map((line) => JSON.parse(line));
        assert.equal(initialized.result.serverInfo.name, 'jira');
        assert.match(issue.result.content[0].text, /Telefoonnummer bij een containeraanvraag/);
    });
});
