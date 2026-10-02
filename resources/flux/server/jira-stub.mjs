// Een nagemaakte Jira, als MCP-server over stdio, voor de evaluatie van een recept dat van een ticket vertrekt, zoals
// uitbreiden (flux:server:eval-recipe). Een project koppelt zijn eigen Jira aan zijn client; het recept noemt die tool
// niet bij naam, en het model vindt ze hier zoals het ze daar zou vinden.
//
//   node resources/flux/server/jira-stub.mjs <tickets.json> <commentaar.log>
//
// tickets.json is { "<key>": { summary, issuetype, status, description } }. Twee tools: jira_get_issue geeft een
// ticket, jira_add_comment schrijft een commentaar als JSON-regel naar het log, zodat de evaluatie het kan nalezen.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dispatch, ERRORS, RpcError, serve } from '../../../server/src/mcp/protocol.mjs';

const TOOLS = [
    {
        name: 'jira_get_issue',
        title: 'Een Jira-ticket lezen',
        description:
            'Geeft een ticket uit Jira: de titel, het type, de status en de beschrijving met de acceptatiecriteria.',
        inputSchema: {
            type: 'object',
            properties: { key: { type: 'string', description: 'De key van het ticket, bv. CONT-12.' } },
            required: ['key'],
        },
    },
    {
        name: 'jira_add_comment',
        title: 'Een commentaar op een Jira-ticket plaatsen',
        description: 'Plaatst een commentaar op een ticket in Jira, bv. de analyse van het ticket.',
        inputSchema: {
            type: 'object',
            properties: {
                key: { type: 'string', description: 'De key van het ticket, bv. CONT-12.' },
                body: { type: 'string', description: 'De tekst van het commentaar, in Markdown.' },
            },
            required: ['key', 'body'],
        },
    },
];

const text = (value, isError = false) => ({
    content: [{ type: 'text', text: value }],
    ...(isError ? { isError } : {}),
});

// De methodes van de server, voor de tickets en het log; de tests roepen ze rechtstreeks aan.
export function createJira({ tickets, log }) {
    const calls = {
        jira_get_issue({ key }) {
            const issue = tickets[key];
            if (!issue) {
                return text(`Het ticket ${key} bestaat niet. Gekend: ${Object.keys(tickets).join(', ')}.`, true);
            }
            return text(JSON.stringify({ key, ...issue }, null, 2));
        },
        jira_add_comment({ key, body }) {
            if (!tickets[key]) return text(`Het ticket ${key} bestaat niet.`, true);
            fs.appendFileSync(log, `${JSON.stringify({ key, body })}\n`);
            return text(`Het commentaar staat op ${key}.`);
        },
    };
    return {
        initialize: (params) => ({
            protocolVersion: params.protocolVersion ?? '2025-11-25',
            capabilities: { tools: {} },
            serverInfo: { name: 'jira', title: 'Jira (nagemaakt)', version: '0.0.0' },
        }),
        'notifications/initialized': () => {},
        ping: () => ({}),
        'tools/list': () => ({ tools: TOOLS }),
        'tools/call': ({ name, arguments: args = {} }) => {
            if (!Object.hasOwn(calls, name)) throw new RpcError(ERRORS.INVALID_PARAMS, `Onbekende tool: ${name}.`);
            return calls[name](args);
        },
    };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    const [ticketsFile, log] = process.argv.slice(2);
    if (!ticketsFile || !log) {
        console.error('Gebruik: node resources/flux/server/jira-stub.mjs <tickets.json> <commentaar.log>');
        process.exit(1);
    }
    const methods = createJira({ tickets: JSON.parse(fs.readFileSync(ticketsFile, 'utf-8')), log });
    await serve({ handle: (message) => dispatch(message, methods, (line) => console.error(line)) });
}
