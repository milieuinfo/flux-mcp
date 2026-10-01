import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { describe, test } from 'node:test';
import { dispatch, ERRORS, RpcError, serve } from '../../src/mcp/protocol.mjs';

const methods = {
    echo: (params) => params,
    fail: () => {
        throw new RpcError(ERRORS.INVALID_PARAMS, 'Fout in de vraag.');
    },
    crash: () => {
        throw new Error('stuk');
    },
    'notifications/seen': () => {},
};

describe('dispatch', () => {
    test('een verzoek krijgt zijn resultaat, met dezelfde id', async () => {
        assert.deepEqual(await dispatch({ jsonrpc: '2.0', id: 7, method: 'echo', params: { a: 1 } }, methods), {
            jsonrpc: '2.0',
            id: 7,
            result: { a: 1 },
        });
    });

    test('een notificatie krijgt geen antwoord, ook niet als de methode onbekend is', async () => {
        assert.equal(await dispatch({ jsonrpc: '2.0', method: 'notifications/seen' }, methods), null);
        assert.equal(await dispatch({ jsonrpc: '2.0', method: 'notifications/onbekend' }, methods), null);
    });

    test('fouten: onbekende methode, RpcError, interne fout, ongeldig bericht, batch', async () => {
        const logged = [];
        const log = (text) => logged.push(text);
        const error = async (message) => (await dispatch(message, methods, log)).error;
        assert.equal((await error({ jsonrpc: '2.0', id: 1, method: 'onbekend' })).code, ERRORS.METHOD_NOT_FOUND);
        assert.deepEqual(await error({ jsonrpc: '2.0', id: 1, method: 'fail' }), {
            code: ERRORS.INVALID_PARAMS,
            message: 'Fout in de vraag.',
        });
        assert.equal((await error({ jsonrpc: '2.0', id: 1, method: 'crash' })).code, ERRORS.INTERNAL);
        assert.match(logged[0], /stuk/);
        assert.equal((await error({ id: 1, method: 'echo' })).code, ERRORS.INVALID_REQUEST);
        assert.equal((await error([{ jsonrpc: '2.0', id: 1, method: 'echo' }])).code, ERRORS.INVALID_REQUEST);
    });

    test('een antwoord van de client negeert de server', async () => {
        assert.equal(await dispatch({ jsonrpc: '2.0', id: 1, result: {} }, methods), null);
    });
});

describe('serve', () => {
    test('één bericht per regel, ook over chunks heen, en de antwoorden in volgorde', async () => {
        const input = new PassThrough();
        const output = new PassThrough();
        let written = '';
        output.on('data', (chunk) => (written += chunk));
        const done = serve({ input, output, handle: (message) => dispatch(message, methods) });
        input.write('{"jsonrpc":"2.0","id":1,"method":"echo","params":{"n":1}}\n{"jsonrpc":"2.0","id":2,');
        input.write('"method":"echo","params":{"n":2}}\r\n\nniet json\n');
        input.end('{"jsonrpc":"2.0","method":"notifications/seen"}');
        await done;
        const lines = written
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line));
        assert.deepEqual(lines, [
            { jsonrpc: '2.0', id: 1, result: { n: 1 } },
            { jsonrpc: '2.0', id: 2, result: { n: 2 } },
            { jsonrpc: '2.0', id: null, error: { code: ERRORS.PARSE, message: 'Geen geldige JSON.' } },
        ]);
    });
});
