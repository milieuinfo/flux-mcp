#!/usr/bin/env node
// Het startpunt van de MCP-server van Flux: JSON-RPC over stdio, met de catalogus naast de code (ADR-004).
//
//   node server/bin/flux-mcp.mjs        uit de repo
//   npx -y <pakket>@<versie>            uit het pakket dat flux:server:pack bouwt
//
// Een client start dit als proces en praat over stdin en stdout; logs gaan naar stderr.

import { serve } from '../src/mcp/protocol.mjs';
import { createServer } from '../src/mcp/server.mjs';

let server;
try {
    server = createServer();
} catch (error) {
    process.stderr.write(`flux-mcp kan niet starten: ${error.message}\n`);
    process.exit(1);
}
await serve({ handle: server.handle });
