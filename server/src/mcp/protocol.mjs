// JSON-RPC 2.0 over stdio, zoals MCP het voor een lokale server vraagt: één bericht per regel op stdin en stdout,
// logs op stderr (ADR-004, sectie 8). Zonder dependencies.
//
//   serve({ input, output, handle })   leest berichten tot de invoer sluit, en schrijft de antwoorden
//   dispatch(message, methods, log)    het antwoord op één bericht, of null voor een notificatie
//
// 'methods' koppelt een methode aan een functie die de params krijgt en het resultaat teruggeeft; een RpcError wordt
// een fout in het antwoord. De server stuurt zelf geen verzoeken, dus antwoorden van de client negeert hij.
// JSON-RPC-batches bestaan sinds de revisie 2025-06-18 van MCP niet meer.

export const ERRORS = {
    PARSE: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL: -32603,
    // MCP: een resource die niet bestaat.
    RESOURCE_NOT_FOUND: -32002,
};

export class RpcError extends Error {
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.data = data;
    }
}

const failure = (id, code, message, data) => ({
    jsonrpc: '2.0',
    id,
    error: { code, message, ...(data === undefined ? {} : { data }) },
});

const isId = (id) => typeof id === 'string' || Number.isInteger(id);

export async function dispatch(message, methods, log = () => {}) {
    if (!message || typeof message !== 'object' || Array.isArray(message) || message.jsonrpc !== '2.0') {
        const reason = Array.isArray(message) ? 'Batches worden niet ondersteund.' : 'Geen JSON-RPC 2.0-bericht.';
        return failure(null, ERRORS.INVALID_REQUEST, reason);
    }
    const isRequest = 'id' in message;
    if (typeof message.method !== 'string') {
        // Een antwoord van de client; de server vroeg niets.
        if (isRequest && ('result' in message || 'error' in message)) return null;
        return failure(isId(message.id) ? message.id : null, ERRORS.INVALID_REQUEST, 'Een bericht zonder methode.');
    }
    if (isRequest && !isId(message.id)) return failure(null, ERRORS.INVALID_REQUEST, 'Een ongeldige id.');
    const method = Object.hasOwn(methods, message.method) ? methods[message.method] : null;
    if (!isRequest) {
        // Een notificatie krijgt nooit een antwoord, ook geen fout.
        if (method) {
            try {
                await method(message.params ?? {});
            } catch (error) {
                log(`Fout bij de notificatie ${message.method}: ${error.stack ?? error}`);
            }
        }
        return null;
    }
    if (!method) return failure(message.id, ERRORS.METHOD_NOT_FOUND, `Onbekende methode: ${message.method}.`);
    try {
        return { jsonrpc: '2.0', id: message.id, result: await method(message.params ?? {}) };
    } catch (error) {
        if (error instanceof RpcError) return failure(message.id, error.code, error.message, error.data);
        log(`Fout bij ${message.method}: ${error.stack ?? error}`);
        return failure(
            message.id,
            ERRORS.INTERNAL,
            'Interne fout in flux-mcp; de details staan in de log van de server.',
        );
    }
}

export function serve({ input = process.stdin, output = process.stdout, handle }) {
    const send = (message) => output.write(`${JSON.stringify(message)}\n`);
    let buffer = '';
    // Na elkaar, zodat de antwoorden in de volgorde van de vragen komen.
    let queue = Promise.resolve();
    const receive = async (line) => {
        let message;
        try {
            message = JSON.parse(line);
        } catch {
            send(failure(null, ERRORS.PARSE, 'Geen geldige JSON.'));
            return;
        }
        const response = await handle(message);
        if (response) send(response);
    };
    input.setEncoding('utf-8');
    input.on('data', (chunk) => {
        buffer += chunk;
        for (let end = buffer.indexOf('\n'); end >= 0; end = buffer.indexOf('\n')) {
            const line = buffer.slice(0, end).replace(/\r$/, '');
            buffer = buffer.slice(end + 1);
            if (line.trim()) queue = queue.then(() => receive(line));
        }
    });
    return new Promise((resolve) => {
        input.on('end', () => {
            if (buffer.trim()) queue = queue.then(() => receive(buffer));
            queue.then(resolve);
        });
    });
}
