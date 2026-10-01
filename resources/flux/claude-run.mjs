// Eén headless run van Claude Code (claude -p) voor de scripts die een LLM laten schrijven of controleren, zoals
// storybook:analyse. Het doet hetzelfde als de run in changelog/analyse.mjs; dat script kan later ook deze module
// gebruiken.
//
// De runs lopen op het abonnement waarmee Claude Code aangemeld is (claude auth login), niet op een API-sleutel:
// ANTHROPIC_API_KEY en ANTHROPIC_AUTH_TOKEN verdwijnen uit de omgeving van claude, en een run die toch een sleutel
// gebruikt, stopt meteen.
//
// Het model en de effort kiest het script dat de run start; storybook:analyse gebruikt Opus 5.5 met effort xhigh.
// Via de omgeving kan enkel FLUX_CLAUDE_BUDGET: optioneel een maximum per run, in dollar aan API-tarief.

import { spawn, spawnSync } from 'node:child_process';

const BUDGET = process.env.FLUX_CLAUDE_BUDGET || null;
// De ingebouwde tools van een run die in de catalogus leest en schrijft.
const DEFAULT_TOOLS = ['Read', 'Grep', 'Glob', 'Edit', 'Write', 'Bash'];
// De runs die nu lopen, zodat een script ze kan stoppen voor het opruimt (stopRunning).
const running = new Set();
// Zonder deze variabelen gebruikt claude de aanmelding van het abonnement.
const { ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, ...CLAUDE_ENV } = process.env;

// Faalt met een uitleg als Claude Code ontbreekt.
export function requireClaude() {
    if (spawnSync('claude', ['--version'], { encoding: 'utf-8' }).status !== 0) {
        throw new Error(
            "Claude Code ontbreekt of werkt niet. Installeer het, meld je aan, en test met 'claude --version'.",
        );
    }
}

// Eén run. Geeft het resultaat terug zoals claude het meldt, met structured_output bij een --json-schema, en met
// 'toolUses': de tools die Claude aanriep, in volgorde, als { name, input }.
//   label    wat er in de uitvoer staat, bv. 'analyse 2.20.0 (reeks 1)';
//   model    het model, bv. 'claude-opus-5-5';
//   effort   de effort, bv. 'xhigh';
//   prompt   de tekst van de prompt;
//   cwd      de map waarin claude draait;
//   source   een map die claude mag lezen (--add-dir), bv. een checkout van de bronrepo;
//   allowed  de toegelaten tools (--allowedTools); al de rest wordt geweigerd;
//   tools    de ingebouwde tools die er zijn (--tools); [] laat enkel de tools van MCP-servers over;
//   extra    extra argumenten, bv. ['--json-schema', …].
export function runClaude({ label, prompt, cwd, source, allowed, model, effort, tools = DEFAULT_TOOLS, extra = [] }) {
    if (!model || !effort) throw new Error('runClaude heeft een model en een effort nodig.');
    console.log(`== ${label} (claude -p, ${model}, effort ${effort}${BUDGET ? `, max $${BUDGET}` : ''})`);
    const args = [
        '-p',
        '--model', model,
        '--effort', effort,
        '--output-format', 'stream-json',
        '--verbose',
        '--no-session-persistence',
        // Expliciet manual: anders neemt claude de defaultMode uit de instellingen over. In 'auto' keurt een
        // classifier dan zelf acties goed die niet in --allowedTools staan, zoals 'node -e'.
        '--permission-mode', 'manual',
        '--permission-prompts', 'none',
        ...(BUDGET ? ['--max-budget-usd', BUDGET] : []),
        ...(source ? ['--add-dir', source] : []),
        '--tools', ...(tools.length > 0 ? tools : ['']),
        '--allowedTools', ...allowed,
        ...extra,
    ];
    const shown = (text) => String(text).replace(`${cwd}/`, '').replace(source ?? '\0', '<bron>');
    const started = Date.now();
    return new Promise((resolve, reject) => {
        const child = spawn('claude', args, { cwd, env: CLAUDE_ENV, stdio: ['pipe', 'pipe', 'inherit'] });
        running.add(child);
        child.on('close', () => running.delete(child));
        let buffer = '';
        let result = null;
        const toolUses = [];
        child.stdout.on('data', (chunk) => {
            buffer += chunk;
            let newline;
            while ((newline = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, newline).trim();
                buffer = buffer.slice(newline + 1);
                if (!line) continue;
                let event;
                try {
                    event = JSON.parse(line);
                } catch {
                    continue;
                }
                // Een sleutel uit bv. een apiKeyHelper in de instellingen: stop, voor er iets verbruikt wordt.
                if (event.type === 'system' && event.subtype === 'init' && event.apiKeySource !== 'none') {
                    child.kill();
                    return reject(
                        new Error(
                            `claude gebruikt een API-sleutel (${event.apiKeySource}) in plaats van het abonnement. ` +
                                "Verwijder die bron, en meld aan met 'claude auth login'.",
                        ),
                    );
                }
                if (event.type === 'result') result = event;
                // Kort wat Claude doet, zodat een lange run niet stil lijkt.
                for (const part of event.type === 'assistant' ? event.message.content : []) {
                    if (part.type === 'tool_use') toolUses.push({ name: part.name, input: part.input ?? {} });
                    if (part.type !== 'tool_use' || part.name === 'StructuredOutput') continue;
                    const input = part.input ?? {};
                    const detail = shown(input.command ?? input.file_path ?? input.pattern ?? '');
                    console.log(`  · ${part.name} ${detail.length > 100 ? `${detail.slice(0, 100)}…` : detail}`);
                }
            }
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (!result) return reject(new Error(`claude stopte zonder resultaat (exit ${code}).`));
            console.log(`  ${result.num_turns} beurten, ${Math.round((Date.now() - started) / 60000)} min`);
            // Het verbruik per model; de lijstprijs wordt met een abonnement niet aangerekend.
            const k = (n) => `${Math.round(n / 1000)}k`;
            for (const [model, u] of Object.entries(result.modelUsage ?? {})) {
                console.log(
                    `  tokens ${model}: ${k(u.inputTokens)} in, ${k(u.cacheReadInputTokens)} uit de cache, ` +
                        `${k(u.cacheCreationInputTokens)} naar de cache, ${k(u.outputTokens)} uit ` +
                        `(lijstprijs $${u.costUSD.toFixed(2)})`,
                );
            }
            for (const denial of result.permission_denials ?? []) {
                const input = denial.tool_input?.command ?? denial.tool_input?.file_path ?? '';
                console.log(`  geweigerd: ${denial.tool_name} ${shown(input)}`);
            }
            if (result.is_error) {
                const detail = result.result ? `: ${result.result}` : '';
                return reject(new Error(`claude faalde: ${result.subtype}${detail}`));
            }
            resolve({ ...result, toolUses });
        });
        child.stdin.end(prompt);
    });
}

// Stopt de runs die nu lopen, en wacht tot ze gestopt zijn, hoogstens 'timeout' ms. Zo schrijft een run niets meer
// nadat het script heeft opgeruimd.
export function stopRunning(timeout = 5000) {
    const children = [...running];
    if (children.length === 0) return Promise.resolve();
    const closed = children.map((child) => new Promise((resolve) => child.once('close', resolve)));
    for (const child of children) child.kill('SIGTERM');
    return Promise.race([Promise.all(closed), new Promise((resolve) => setTimeout(resolve, timeout))]);
}
