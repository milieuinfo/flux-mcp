// Een nagemaakte Claude Code voor de tests van changelog:analyse en storybook:analyse. De tests zetten ze op het PATH
// als 'claude' (zie runs.mjs). Ze doet wat een run van 'claude -p' naar buiten toont:
//   - 'claude --version' slaagt;
//   - een analyse schrijft een geldige analyse, in de map die een Write-regel in --allowedTools toelaat;
//   - een review (met --json-schema) geeft een structured_output in het afgesproken formaat;
//   - een run met --mcp-config, zoals flux:server:eval, roept een tool van flux-mcp aan: flux_find_changes voor een
//     vraag met een ticket, flux_check_markup voor een vraag met markup, en anders flux_list_versions;
//   - de uitvoer is stream-json: een init met apiKeySource, en een result.
// Elke run komt als één JSON-regel in FLUX_TEST_CLAUDE_LOG: de argumenten, de eerste regels van de prompt, de map, en
// of er een API-sleutel in de omgeving stond. FLUX_TEST_CLAUDE kiest een foutgeval:
//   api-key     de run meldt een API-sleutel in plaats van het abonnement;
//   unresolved  de review kon niet alles oplossen;
//   no-result   de run stopt zonder resultaat.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
if (args.includes('--version')) {
    console.log('0.0.0 (nagemaakt voor de tests)');
    process.exit(0);
}

const mode = process.env.FLUX_TEST_CLAUDE ?? 'ok';
const prompt = fs.readFileSync(0, 'utf-8');
const review = args.includes('--json-schema');
const allowed = [];
for (let i = args.indexOf('--allowedTools') + 1; i > 0 && i < args.length && !args[i].startsWith('--'); i++) {
    allowed.push(args[i]);
}
if (process.env.FLUX_TEST_CLAUDE_LOG) {
    const entry = {
        args,
        prompt: prompt.split('\n').slice(0, 3),
        apiKey: Boolean(process.env.ANTHROPIC_API_KEY),
        review,
        cwd: process.cwd(),
    };
    fs.appendFileSync(process.env.FLUX_TEST_CLAUDE_LOG, `${JSON.stringify(entry)}\n`);
}

const emit = (event) => process.stdout.write(`${JSON.stringify(event)}\n`);
emit({ type: 'system', subtype: 'init', apiKeySource: mode === 'api-key' ? 'ANTHROPIC_API_KEY' : 'none' });
if (mode === 'api-key') {
    // Een echte run stopt het script hier; tot dan wacht de nagemaakte run.
    setTimeout(() => process.exit(0), 5000);
} else if (mode === 'no-result') {
    process.exit(1);
} else if (args.includes('--mcp-config')) {
    const tool = /FLUX-\d+/.test(prompt)
        ? 'flux_find_changes'
        : /<vl-/.test(prompt)
          ? 'flux_check_markup'
          : 'flux_list_versions';
    emit({ type: 'assistant', message: { content: [{ type: 'tool_use', name: `mcp__flux__${tool}`, input: {} }] } });
    const result = 'Nagemaakt antwoord.';
    emit({ type: 'result', subtype: 'success', is_error: false, num_turns: 2, result, modelUsage: {} });
} else {
    const written = review ? [] : analyse();
    for (const file of written) {
        const tool = { type: 'tool_use', name: 'Write', input: { file_path: file } };
        emit({ type: 'assistant', message: { content: [tool] } });
    }
    const status = review && mode === 'unresolved' ? 'unresolved' : 'ok';
    const problem = { page: 'x', file: 'x', entry: 'x', problem: 'Nagemaakt probleem.' };
    const unresolved = status === 'unresolved' ? [problem] : [];
    emit({
        type: 'result',
        subtype: 'success',
        is_error: false,
        num_turns: written.length + 1,
        result: review ? `Review: ${status}.` : `Geschreven: ${written.length} bestanden.`,
        modelUsage: {},
        ...(review ? { structured_output: { status, corrections: [], unresolved } } : {}),
    });
}

// De mappen die een Write-regel toelaat: 'Write(//<absoluut pad>/**)'.
function writable(pattern) {
    return allowed
        .map((rule) => /^Write\(\/(\/.+)\/\*\*\)$/.exec(rule)?.[1])
        .filter((dir) => dir && pattern.test(dir));
}

// Schrijft de analyse die de prompt vraagt, en geeft de geschreven bestanden.
function analyse() {
    const written = [];
    const write = (file, value) => {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
        written.push(file);
    };
    // changelog:analyse: per ticket een analyse van elke entry, en een samenvatting van de versie.
    for (const dir of writable(/\/changelog-analysis$/)) {
        const release = JSON.parse(fs.readFileSync(path.join(dir, '..', 'changelog', 'release.json'), 'utf-8'));
        for (const ticket of release.tickets) {
            const entries = Object.fromEntries(
                ticket.entries.map((id) => [id, { impact: 'none', explanation: `Nagemaakt voor ${id}.` }]),
            );
            write(path.join(dir, ticket.file), { entries });
        }
        write(path.join(dir, 'release.json'), { summary: `Nagemaakte samenvatting van ${release.version}.` });
    }
    // storybook:analyse: de pagina's van de reeks staan als JSON in de prompt, met het bestand dat elk moet krijgen.
    const pages = /```json\n(\[[\s\S]*?\])\n```/.exec(prompt);
    if (pages && writable(/\/storybook-analysis\//).length > 0) {
        for (const page of JSON.parse(pages[1])) {
            const version = /catalog\/flux\/([^/]+)\/storybook\//.exec(page.markdown)[1];
            const example = { html: '<vl-knop>Klik</vl-knop>' };
            const examples = Object.fromEntries(page.stories.map((story) => [story.id, example]));
            write(path.resolve(page.write), {
                schema: 1,
                page: page.id,
                inputHash: page.inputHash,
                analysedFor: version,
                summary: `Nagemaakte samenvatting van ${page.title}.`,
                keywords: ['nagemaakt'],
                examples,
                notes: [],
            });
        }
    }
    return written;
}
