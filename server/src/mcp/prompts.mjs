// De recepten van de MCP-server (ADR-004, sectie 6): een workflow die de ontwikkelaar zelf start, als MCP-prompt. Een
// recept is Markdown met frontmatter in server/prompts/<naam>.md; het rapportsjabloon van zijn workflow staat in
// server/templates/<workflow>.md. Zo reviewt Team Flux ze zoals documentatie.
//
//   loadRecipes(promptsDir, templatesDir)  →  de recepten, met hun sjabloon; een fout in een recept faalt meteen
//   renderRecipe(recipe, args)             →  de tekst, met elke {{argument}} vervangen
//   createPrompts({ catalog })             →  prompts/list, prompts/get, de resources en het aanvullen
//
// Het renderen is enkel {{argument}} vervangen, met de standaardwaarde als het argument ontbreekt: geen andere
// templating, en deterministisch. Een recept bevat geen kennis over een versie; die haalt het model met de tools.
//
// De frontmatter is een klein deel van YAML: 'sleutel: waarde', een gevouwen tekst met 'sleutel: >', en de lijst
// 'arguments' met per argument name, description, required en default.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CatalogError } from '../catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PROMPTS_DIR = path.join(ROOT, 'prompts');
export const TEMPLATES_DIR = path.join(ROOT, 'templates');

const KEYS = ['name', 'title', 'description', 'arguments', 'template'];
const ARGUMENT_KEYS = ['name', 'description', 'required', 'default'];
const PLACEHOLDER = /\{\{([a-z][a-z0-9-]*)\}\}/g;
const NAME = /^[a-z][a-z0-9-]*$/;

const scalar = (raw) => {
    const value = raw.trim();
    if (value === 'true' || value === 'false') return value === 'true';
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) return value.slice(1, -1);
    return value;
};

// Leest de frontmatter en de tekst van een recept. 'where' komt in de foutmelding.
export function parseRecipe(text, where = 'het recept') {
    const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
    if (!match) throw new Error(`${where}: geen frontmatter tussen twee regels '---'.`);
    const lines = match[1].split('\n');
    const meta = {};
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim() || line.trim().startsWith('#')) continue;
        const top = /^([a-z]+):\s*(.*)$/.exec(line);
        if (!top) throw new Error(`${where}: regel ${i + 2} is geen 'sleutel: waarde': ${line}`);
        const [, key, rest] = top;
        if (!KEYS.includes(key)) throw new Error(`${where}: onbekende sleutel '${key}'. Gekend: ${KEYS.join(', ')}.`);
        if (rest === '>') {
            const folded = [];
            while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) folded.push(lines[++i].trim());
            meta[key] = folded.join(' ');
        } else if (key === 'arguments') {
            meta.arguments = [];
            while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) {
                const item = /^\s+(-\s+)?([a-z]+):\s*(.*)$/.exec(lines[++i]);
                if (!item) throw new Error(`${where}: regel ${i + 2} hoort niet bij 'arguments': ${lines[i]}`);
                const [, dash, field, value] = item;
                if (!ARGUMENT_KEYS.includes(field))
                    throw new Error(`${where}: onbekende sleutel '${field}' van een argument.`);
                if (dash) meta.arguments.push({});
                if (meta.arguments.length === 0) throw new Error(`${where}: een argument begint met '- name:'.`);
                meta.arguments.at(-1)[field] = scalar(value);
            }
        } else {
            meta[key] = scalar(rest);
        }
    }
    for (const key of ['name', 'title', 'description', 'template']) {
        if (typeof meta[key] !== 'string' || !meta[key]) throw new Error(`${where}: '${key}' ontbreekt.`);
    }
    if (!NAME.test(meta.name)) throw new Error(`${where}: de naam '${meta.name}' is geen kebab-case.`);
    const args = (meta.arguments ?? []).map((argument) => ({
        name: argument.name,
        description: argument.description ?? '',
        required: argument.required === true,
        ...(argument.default != null ? { default: String(argument.default) } : {}),
    }));
    for (const argument of args) {
        if (!NAME.test(argument.name ?? '')) throw new Error(`${where}: een argument zonder geldige naam.`);
        if (!argument.description) throw new Error(`${where}: argument '${argument.name}' zonder description.`);
        if (argument.required && argument.default != null) {
            throw new Error(`${where}: argument '${argument.name}' is verplicht en heeft een standaardwaarde.`);
        }
    }
    const body = match[2].replace(/^\n+/, '');
    const declared = new Set(args.map((argument) => argument.name));
    const used = new Set([...body.matchAll(PLACEHOLDER)].map((found) => found[1]));
    for (const name of used) {
        if (!declared.has(name)) throw new Error(`${where}: {{${name}}} staat in de tekst maar niet in 'arguments'.`);
    }
    for (const name of declared) {
        if (!used.has(name)) throw new Error(`${where}: argument '${name}' staat niet in de tekst.`);
    }
    return {
        name: meta.name,
        title: meta.title,
        description: meta.description,
        arguments: args,
        template: meta.template,
        body,
    };
}

// De recepten uit een map, met hun sjabloon, gesorteerd op naam.
export function loadRecipes(promptsDir = PROMPTS_DIR, templatesDir = TEMPLATES_DIR) {
    const recipes = new Map();
    const files = fs.existsSync(promptsDir) ? fs.readdirSync(promptsDir).filter((file) => file.endsWith('.md')) : [];
    for (const file of files.sort()) {
        const where = `server/prompts/${file}`;
        const recipe = parseRecipe(fs.readFileSync(path.join(promptsDir, file), 'utf-8'), where);
        if (`${recipe.name}.md` !== file)
            throw new Error(`${where}: de naam is '${recipe.name}', verwacht '${file.slice(0, -3)}'.`);
        const templateFile = path.join(templatesDir, `${recipe.template}.md`);
        if (!fs.existsSync(templateFile)) {
            throw new Error(`${where}: het sjabloon server/templates/${recipe.template}.md ontbreekt.`);
        }
        recipes.set(recipe.name, { ...recipe, templateText: fs.readFileSync(templateFile, 'utf-8') });
    }
    return recipes;
}

// De tekst van een recept met de argumenten ingevuld; een ontbrekend argument krijgt zijn standaardwaarde. Met
// 'keep' blijft een ontbrekend argument zonder standaardwaarde als {{naam}} staan, anders is het een fout.
export function renderRecipe(recipe, values = {}, { keep = false } = {}) {
    const missing = recipe.arguments.filter(
        (argument) => argument.required && !String(values[argument.name] ?? '').trim(),
    );
    if (missing.length > 0 && !keep) {
        throw new CatalogError(
            `Het recept ${recipe.name} vraagt ${missing.map((argument) => argument.name).join(', ')}.`,
        );
    }
    const known = new Set(recipe.arguments.map((argument) => argument.name));
    const extra = Object.keys(values).filter((name) => !known.has(name));
    if (extra.length > 0) {
        const allowed = recipe.arguments.map((argument) => argument.name).join(', ') || 'geen';
        throw new CatalogError(`Het recept ${recipe.name} kent ${extra.join(', ')} niet. Argumenten: ${allowed}.`);
    }
    return recipe.body.replace(PLACEHOLDER, (placeholder, name) => {
        const value = String(values[name] ?? '').trim();
        if (value) return value;
        const fallback = recipe.arguments.find((argument) => argument.name === name)?.default;
        return fallback ?? placeholder;
    });
}

const templateUri = (workflow) => `flux://templates/${workflow}`;
const promptUri = (name) => `flux://prompts/${name}`;
// Zoveel waarden geeft completion/complete hoogstens.
const MAX_COMPLETIONS = 100;
// De argumenten die een versie zijn, en dus aangevuld worden met de versies in de catalogus.
const VERSION_ARGUMENTS = new Set(['doelversie']);

export function createPrompts({ catalog, promptsDir, templatesDir } = {}) {
    const recipes = loadRecipes(promptsDir, templatesDir);

    const list = () =>
        [...recipes.values()].map(({ name, title, description, arguments: args }) => ({
            name,
            title,
            description,
            arguments: args.map(({ name: argument, description: text, required }) => ({
                name: argument,
                description: text,
                required,
            })),
        }));

    function recipeOf(name) {
        const recipe = recipes.get(name);
        if (!recipe) {
            throw new CatalogError(`Onbekend recept: ${name}. Gekend: ${[...recipes.keys()].join(', ')}.`);
        }
        return recipe;
    }

    // prompts/get: de tekst als bericht van de gebruiker, en het rapportsjabloon als embedded resource.
    function get({ name, arguments: values = {} } = {}) {
        const recipe = recipeOf(name);
        return {
            description: recipe.description,
            messages: [
                { role: 'user', content: { type: 'text', text: renderRecipe(recipe, values) } },
                {
                    role: 'user',
                    content: {
                        type: 'resource',
                        resource: {
                            uri: templateUri(recipe.template),
                            mimeType: 'text/markdown',
                            text: recipe.templateText,
                        },
                    },
                },
            ],
        };
    }

    // De recepten en de sjablonen als resource, voor een client zonder prompts. Voor het model heten de recepten
    // workflows: Storybook heeft een eigen categorie Recepten, die flux_get_guidance teruggeeft (ADR-004, 6.1).
    const resources = () => [
        ...[...recipes.values()].map((recipe) => ({
            uri: promptUri(recipe.name),
            name: `prompt-${recipe.name}`,
            title: `Workflow: ${recipe.title}`,
            description: recipe.description,
            mimeType: 'text/markdown',
        })),
        ...[...new Set([...recipes.values()].map((recipe) => recipe.template))].map((workflow) => ({
            uri: templateUri(workflow),
            name: `template-${workflow}`,
            title: `Sjabloon: ${workflow}`,
            description: `Het sjabloon van het rapport of de analyse van de workflow ${workflow}.`,
            mimeType: 'text/markdown',
        })),
    ];

    // De inhoud van flux://prompts/{name} of flux://templates/{workflow}, of null voor een andere uri.
    function read(uri) {
        const prompt = /^flux:\/\/prompts\/([^/]+)$/.exec(uri);
        if (prompt) {
            const recipe = recipeOf(decodeURIComponent(prompt[1]));
            const args = recipe.arguments.map(
                (argument) =>
                    `- \`${argument.name}\`${argument.required ? ' (verplicht)' : ''}: ${argument.description}` +
                    (argument.default ? ` Standaard: ${argument.default}.` : ''),
            );
            const header = [
                `# Workflow: ${recipe.title}`,
                '',
                recipe.description,
                '',
                ...(args.length > 0 ? ['Argumenten; vul ze in waar {{naam}} staat:', '', ...args, ''] : []),
                `Het sjabloon: ${templateUri(recipe.template)}.`,
                '',
                '---',
                '',
            ].join('\n');
            return { mimeType: 'text/markdown', text: `${header}${renderRecipe(recipe, {}, { keep: true })}` };
        }
        const template = /^flux:\/\/templates\/([^/]+)$/.exec(uri);
        if (template) {
            const workflow = decodeURIComponent(template[1]);
            const recipe = [...recipes.values()].find((item) => item.template === workflow);
            if (!recipe) throw new CatalogError(`Onbekend sjabloon: ${workflow}.`);
            return { mimeType: 'text/markdown', text: recipe.templateText };
        }
        return null;
    }

    // Vult een argument van een recept aan: een versie met de versies in de catalogus.
    function complete({ ref, argument } = {}) {
        const recipe = recipes.get(ref?.name);
        const empty = { completion: { values: [], total: 0, hasMore: false } };
        if (!recipe || !VERSION_ARGUMENTS.has(argument?.name)) return empty;
        const value = String(argument.value ?? '').toLowerCase();
        const values = ['latest', ...catalog.versions().reverse()].filter((item) => item.startsWith(value));
        return {
            completion: {
                values: values.slice(0, MAX_COMPLETIONS),
                total: values.length,
                hasMore: values.length > MAX_COMPLETIONS,
            },
        };
    }

    return { list, get, resources, read, complete, recipes };
}
