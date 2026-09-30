// De documentatie uit Storybook per versie: opbouwen uit de bronrepo, laden uit de catalogus, een analyse
// controleren en een pagina samenvoegen voor de server. Zie docs/beslissingen/ADR-003-storybook-per-versie.md.
//
// storybook:copy bouwt met buildStorybook per versie catalog/flux/<versie>/storybook/:
//   - index.json: de pagina's met hun id, titel, soort, bronnen, elementen, status, stories en inputHash;
//   - pages/<id>.md: de tekst van elke pagina als Markdown, zonder versienummer.
// De analyse door een LLM staat één keer per inhoud in catalog/flux/storybook-analysis/<id>/<inputHash>.json.
//
// Deze module leest geen git en geen netwerk: buildStorybook krijgt index.json van de site en een 'repo' die de
// bestanden van de tag leest. Zo is ze te testen met fragmenten.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
    arrowFunction,
    attributeSource,
    attributeValue,
    declarationOf,
    dedent,
    evaluate,
    initializerOf,
    MdxError,
    parseExports,
    parseImports,
    parseLiteral,
    parseMdx,
    renderNodes,
    statementEnd,
    tidyMarkdown,
    valueToMarkdown,
} from './mdx.mjs';
import { storybookBase } from './storybook-url.mjs';
import { loadWebTypes } from './web-types.mjs';

export const STORYBOOK_SCHEMA = 1;
export const ANALYSIS_SCHEMA = 1;
export const ANALYSIS_DIR = 'storybook-analysis';
const APP = 'apps/storybook';
const META_DATA_DIR = `${APP}/.storybook/flux-meta-data`;
// De inhoud van een pagina zonder eigen MDX komt uit dit sjabloon; het telt niet mee in de hash.
const TEMPLATE_MARKER = '(sjabloon: flux-document.template.mdx)';

// Een bestand uit de bronrepo op de tag van een versie, zoals een afbeelding die een pagina toont.
export const sourceFileUrl = (version, file) =>
    `https://github.com/milieuinfo/flux-web-components/raw/v${version}/${file.replace(/^\//, '')}`;

// ---------------------------------------------------------------------------------------------------------------
// Id's en paden.

// De id van een pagina: de Storybook-id van de docs-pagina zonder '--documentatie'.
export const pageIdOf = (docsId) => docsId.split('--')[0];

// Het pad in de bronrepo voor een importPath uit index.json, dat relatief is tegenover apps/storybook.
export const repoPathOf = (importPath) => path.posix.normalize(path.posix.join(APP, importPath));
export function importPathOf(repoPath) {
    const relative = path.posix.relative(APP, repoPath);
    return relative.startsWith('../') ? relative : `./${relative}`;
}

// Zoals Storybook een story-id maakt uit de naam van de export: startCase en daarna sanitize (@storybook/csf).
function sanitize(text) {
    return text
        .toLowerCase()
        .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}
export function storyIdPart(exportName) {
    const words = exportName.match(/[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g) ?? [exportName];
    return sanitize(words.join(' '));
}

// De soort van een pagina volgt uit het eerste deel van haar titel.
const KINDS = [
    [/^components\b|^map$/i, 'component'],
    [/^styles$/i, 'styles'],
    [/^(introductie|design system|afnemen|opmaak)$/i, 'guide'],
    [/^richtlijnen$/i, 'guideline'],
    [/^(patronen|ontwerp)$/i, 'pattern'],
    [/^recepten$/i, 'recipe'],
    [/^planning$/i, 'planning'],
    [/^(bijdragen|beheren)$/i, 'flux-team'],
    [/^changelog$/i, 'changelog'],
];
export const PAGE_KINDS = [
    'component', 'styles', 'guide', 'guideline', 'pattern', 'recipe', 'planning', 'flux-team', 'other',
];
export function kindOf(title) {
    const first = title.split('/')[0].trim();
    return KINDS.find(([pattern]) => pattern.test(first))?.[1] ?? 'other';
}

// Zoals FluxHeader de titel van een pagina zonder eigen MDX toont.
function templateTitle(title) {
    const last = title.split('/').pop() ?? '';
    const words = last.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return title.includes('-next') ? `${words} - next` : words;
}

// ---------------------------------------------------------------------------------------------------------------
// De hash van wat de analyse leest.

// Zonder de eigen imports van het bestand en met elke reeks witruimte als één spatie: een nieuwe import of andere
// inspringing telt niet. Enkel de imports van het bestand zelf vallen weg: de ESM-regels van een MDX-bestand en de
// imports bovenaan JavaScript of TypeScript. Een import in een codeblok of een template literal is inhoud.
export function normalizeSource(text, file = '') {
    let body = String(text).replace(/\r\n/g, '\n');
    if (file.endsWith('.mdx')) {
        const imports = parseMdx(body, file).nodes.filter(
            (node) => node.type === 'esm' && /^\s*import\s/.test(node.text),
        );
        for (const node of imports.reverse()) body = body.slice(0, node.start) + body.slice(node.end);
    } else if (/\.[cm]?[jt]sx?$/.test(file)) {
        let i = 0;
        while (true) {
            const rest = /^(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*/.exec(body.slice(i))[0];
            if (!/^import[\s{*'"]/.test(body.slice(i + rest.length))) break;
            const end = statementEnd(body, i + rest.length);
            body = body.slice(0, i + rest.length) + body.slice(end);
            i += rest.length;
        }
    }
    return body.replace(/\s+/g, ' ').trim();
}

// Het contract van een element in de web-types: namen, types, defaults en deprecated, zonder beschrijvingen en
// doc-url. Een nieuwe beschrijving telt niet mee in de hash.
export function contractOf(name, element) {
    const items = (list) =>
        (list ?? [])
            .map((item) => ({
                name: item.name ?? null,
                type: item.value?.type ?? item.type ?? null,
                default: item.default ?? null,
                deprecated: item.deprecated ?? null,
            }))
            .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return {
        name,
        deprecated: element.deprecated ?? null,
        attributes: items(element.attributes),
        slots: items(element.slots),
        properties: items(element.js?.properties),
        events: items(element.js?.events),
    };
}

// De eerste 12 tekens van de SHA-256 van de bestanden (op pad gesorteerd, zonder de paden) en het contract. Een
// bestand dat de pagina als tekst toont ('shown'), zoals code in <Source>, houdt zijn imports: die zijn inhoud.
export function inputHash({ files, contracts }) {
    const content = JSON.stringify({
        files: [...files]
            .sort((a, b) => a.path.localeCompare(b.path))
            .map((file) => normalizeSource(file.text, file.shown ? '' : file.path)),
        contracts: [...contracts].sort((a, b) => a.name.localeCompare(b.name)),
    });
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

// ---------------------------------------------------------------------------------------------------------------
// Links.

// Of 'line' het codeblok sluit dat met 'fence' begon; 'marker' zijn de backticks of tildes vooraan de regel.
const closesFence = (line, marker, fence) =>
    Boolean(marker) && marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker;

// Links naar een pagina of story van deze Storybook worden relatief: /?path=/docs/<id>. Zo bevat een pagina geen
// versienummer, en is een ongewijzigde pagina in elke versie hetzelfde bestand. Dat geldt voor links in Markdown en
// voor href in HTML, bv. in de tekst van een FluxAlert.
export function normalizeLinks(markdown, version) {
    const absolute = storybookBase(version);
    const target = (link) => {
        let rest = link.startsWith(absolute) ? link.slice(absolute.length) : link;
        if (/^[a-z]+:/i.test(rest)) return link;
        const prefix = /^(?:\.{0,2}\/)*(?:(?:iframe\.html)?\?path=\/?|(?=(?:docs|story)\/))/;
        const match = new RegExp(`${prefix.source}(docs|story)\\/([A-Za-z0-9_-]+)(.*)$`).exec(rest);
        return match ? `/?path=/${match[1]}/${match[2]}${match[3]}` : link;
    };
    let fence = null;
    return markdown
        .split('\n')
        .map((line) => {
            const marker = /^[ \t]*(`{3,}|~{3,})/.exec(line)?.[1];
            if (fence) {
                if (closesFence(line, marker, fence)) fence = null;
                return line;
            }
            if (marker) {
                fence = marker;
                return line;
            }
            return line
                .replace(/\]\((\S+?)((?:\s+"[^"]*")?)\)/g, (_, link, title) => `](${target(link)}${title})`)
                .replace(/href="([^"]+)"/g, (_, link) => `href="${target(link)}"`);
        })
        .join('\n');
}

// De pagina's waarnaar een tekst verwijst.
export function linkedPages(markdown) {
    const ids = new Set();
    for (const match of markdown.matchAll(/(?:\]\(|href=")\/\?path=\/(?:docs|story)\/([A-Za-z0-9_-]+)/g)) {
        ids.add(pageIdOf(match[1]));
    }
    return [...ids];
}

// ---------------------------------------------------------------------------------------------------------------
// Opbouwen.

// Een import van de tekst van een bestand: '?raw' (Vite, Storybook 9) of '!!raw-loader!' (webpack, Storybook 7).
const isRaw = (specifier) => /\?raw$/.test(specifier) || /^!!raw-loader!/.test(specifier);

// De aliassen voor de referentiecode in libs/integrations uit tsconfig.base.json, bv. '@domg-wc/integrations/form'
// naar 'libs/integrations/src/form/index.ts'. Stories van patronen renderen die voorbeeldcomponenten, en de analyse
// leest hun code om de voorbeelden te schrijven. De packages van een afnemer (@domg-wc/components, …) horen er niet
// bij: hun API staat in de web-types.
function integrationAliases(repo) {
    const text = repo.read('tsconfig.base.json');
    if (text === null) return new Map();
    const paths = JSON.parse(text).compilerOptions?.paths ?? {};
    return new Map(
        Object.entries(paths)
            .filter(([alias, targets]) => alias.startsWith('@domg-wc/integrations/') && targets.length > 0)
            .map(([alias, targets]) => [alias, targets[0]]),
    );
}

// Het pad in de bronrepo van een import: relatief tegenover het bestand dat importeert, of een alias uit 'aliases'.
// Een loader vooraan en een query achteraan vallen weg.
function resolveImport(from, specifier, repo, aliases = new Map()) {
    const bare = specifier.replace(/^!!?[\w-]+-loader!/, '').replace(/\?.*$/, '');
    if (aliases.has(bare)) return repo.read(aliases.get(bare)) !== null ? aliases.get(bare) : null;
    if (!bare.startsWith('.')) return null;
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), bare));
    for (const candidate of ['', '.ts', '.tsx', '.js', '.mjs', '.mdx', '.md', '.json', '/index.ts']) {
        if (repo.read(base + candidate) !== null) return base + candidate;
    }
    return null;
}

// De bestanden voor de stories die een bestand importeert, recursief: de args, helpers, mocks, de bestanden die een
// pagina toont, en de voorbeeldcomponenten uit libs/integrations met hun eigen imports. Niet de code van de
// componenten zelf.
function storyFiles(file, repo, seen, aliases) {
    if (seen.has(file)) return;
    const text = repo.read(file);
    if (text === null) return;
    seen.add(file);
    for (const match of text.matchAll(/(?:import|export)\s+(?:[\s\S]*?\sfrom\s+)?['"]([^'"\n]+)['"]/g)) {
        const target = resolveImport(file, match[1], repo, aliases);
        if (!target) continue;
        const isStory = /\/stories\//.test(target) || target.startsWith(`${APP}/docs/`) || /\.stories[.-]/.test(target);
        const isIntegration = target.startsWith('libs/integrations/');
        if ((isStory || isIntegration) && !target.endsWith('.mdx')) storyFiles(target, repo, seen, aliases);
    }
}

// De metadata van de componenten: alle JSON onder .storybook/flux-meta-data, per id.
function loadMetaData(repo) {
    const data = {};
    for (const file of repo.list(META_DATA_DIR).filter((name) => name.endsWith('.json')).sort()) {
        Object.assign(data, JSON.parse(repo.read(file)));
    }
    return data;
}

// Per pagina de elementen uit de web-types: elk element linkt met zijn doc-url naar zijn pagina. Die link klopt niet
// altijd: in 2.20.0 wijst vl-text naar components-atom-text-text, dat niet bestaat. Dan zoeken we de pagina van het
// stories-bestand met de naam van het element (vl-text.stories.ts), en anders de pagina waarvan de id het meest op
// die uit de doc-url lijkt. Elke link die niet klopt, komt in 'warnings'.
function elementsByPage(webTypes, docs) {
    const pageIds = docs.map((entry) => pageIdOf(entry.id));
    const common = (a, b) => {
        let n = 0;
        while (n < a.length && a[n] === b[n]) n++;
        return n;
    };
    const closest = (candidates, target) =>
        [...candidates].sort(
            (a, b) => common(b, target) - common(a, target) || a.length - b.length || a.localeCompare(b),
        )[0];
    const byPage = new Map();
    const warnings = [];
    for (const [name, { element }] of webTypes ?? []) {
        const linked = /path=\/docs\/([a-z0-9-]+?)--/.exec(element['doc-url'] ?? '')?.[1] ?? null;
        let page = linked && pageIds.includes(linked) ? linked : null;
        if (!page) {
            const byFile = docs
                .filter((entry) => new RegExp(`/${name}\\.stories\\.[jt]sx?$`).test(entry.importPath))
                .map((entry) => pageIdOf(entry.id));
            const related = (id) => linked.startsWith(`${id}-`) || id.startsWith(`${linked}-`);
            const byId = linked ? pageIds.filter(related) : [];
            const candidates = byFile.length > 0 ? byFile : byId;
            page = candidates.length > 0 ? closest(candidates, linked ?? '') : null;
            const link = linked ? `de doc-url wijst naar ${linked}, dat niet bestaat` : 'er is geen doc-url';
            warnings.push(`web-types: ${name}: ${link}; ${page ? `gekoppeld aan ${page}` : 'geen pagina gevonden'}.`);
        }
        if (!page) continue;
        if (!byPage.has(page)) byPage.set(page, []);
        byPage.get(page).push(name);
    }
    for (const names of byPage.values()) names.sort();
    return { byPage, warnings };
}

const ASSET = /\.(png|jpe?g|gif|svg|webp)$/i;
const storyLine = (story) => `\n\n> Story: [${story.name}](/?path=/story/${story.id})\n\n`;
const ALERT_TYPES = { info: 'NOTE', warning: 'WARNING', error: 'CAUTION', success: 'TIP' };

// Zet één pagina om naar Markdown. Geeft de Markdown en de bestanden die ze las.
function convertPage(page, context) {
    const { repo, index, byPage, metaData, webTypes } = context;
    const files = new Map();
    // Leest een bestand en onthoudt het voor de bronnen en de hash. 'shown': de pagina toont de tekst zelf.
    const read = (file, { shown = false } = {}) => {
        const text = repo.read(file);
        if (text === null) throw new MdxError(`${file} ontbreekt in de bronrepo.`);
        files.set(file, { text, shown: shown || Boolean(files.get(file)?.shown) });
        return text;
    };

    // De stories van een stories-bestand, in de volgorde van index.json.
    const storiesOf = (storiesFile) => index.stories.filter((story) => story.importPath === importPathOf(storiesFile));
    // De story voor 'Module.Export' of een export die rechtstreeks geïmporteerd werd.
    const storyOf = (source, scope, file) => {
        const [module, exportName] = source.includes('.') ? source.split('.') : [null, source];
        const storiesFile = module ? scope.modules.get(module) : scope.storyExports.get(exportName)?.file;
        const name = module ? exportName : (scope.storyExports.get(exportName)?.imported ?? exportName);
        if (!storiesFile) throw new MdxError(`${file}: onbekende story {${source}}.`);
        const candidates = storiesOf(storiesFile);
        const story = candidates.find((s) => s.id.split('--')[1] === storyIdPart(name));
        if (!story) {
            throw new MdxError(`${file}: story ${source} staat niet in index.json (${importPathOf(storiesFile)}).`);
        }
        return story;
    };
    // De pagina van een stories-bestand, voor de API van een ander component.
    const pageOfStories = (storiesFile) =>
        index.docs.find((docs) => docs.importPath === importPathOf(storiesFile)) ?? null;
    const apiLine = (pageId, story) => {
        const elements = byPage.get(pageId) ?? [];
        if (elements.length > 0) return `\n\n> API: ${elements.join(', ')}\n\n`;
        const link = story ? ` Zie de argTypes in [Storybook](/?path=/story/${story.id}).` : '';
        return `\n\n> API: geen element in de web-types.${link}\n\n`;
    };

    // De Markdown van één MDX-bestand, met zijn eigen imports. 'included' voorkomt een lus van MDX die elkaar
    // importeren.
    function convertFile(file, included = new Set()) {
        if (included.has(file)) throw new MdxError(`${file} importeert zichzelf.`);
        const { esm, nodes } = parseMdx(read(file), file);
        const modules = new Map();
        const storyExports = new Map();
        const mdxComponents = new Map();
        const values = new Map();
        // Benoemde imports uit een module, zoals een constante met HTML uit een helper: pas gelezen als ze nodig zijn.
        const moduleImports = new Map();
        for (const entry of parseImports(esm)) {
            const target = resolveImport(file, entry.source, repo);
            if (!target) continue;
            if (isRaw(entry.source) || /\.md$/.test(target)) {
                if (entry.default) values.set(entry.default, read(target, { shown: true }));
            } else if (ASSET.test(target)) {
                // Een afbeelding: haar pad in de bronrepo; de server maakt er een link naar de tag van.
                if (entry.default) values.set(entry.default, `/${target}`);
            } else if (target.endsWith('.mdx')) {
                if (entry.default) mdxComponents.set(entry.default, target);
            } else if (/\.stories\.[jt]sx?$/.test(target)) {
                if (entry.namespace) modules.set(entry.namespace, target);
                if (entry.default) modules.set(entry.default, target);
                for (const { local, imported } of entry.named) storyExports.set(local, { file: target, imported });
            } else {
                for (const { local, imported } of entry.named) moduleImports.set(local, { file: target, imported });
            }
        }
        const exports = parseExports(esm);
        const evaluating = new Set();
        const scope = (name) => {
            if (values.has(name)) return values.get(name);
            if (evaluating.has(name)) return undefined;
            if (moduleImports.has(name)) {
                const { file: module, imported } = moduleImports.get(name);
                const value = moduleValue(module, imported);
                if (value !== undefined) values.set(name, value);
                return value;
            }
            if (!exports.has(name)) return undefined;
            evaluating.add(name);
            try {
                const value = ctx.evaluate(exports.get(name));
                values.set(name, value);
                return value;
            } catch {
                return undefined;
            } finally {
                evaluating.delete(name);
            }
        };
        const ctx = {
            file,
            scope,
            evaluate: (source) => evaluate(source, scope, file),
            component: (node, rctx) =>
                component(node, rctx, { file, modules, storyExports, mdxComponents, moduleImports, included }),
        };
        return renderNodes(nodes, ctx);
    }

    // De waarde van een constante in een module (JavaScript of TypeScript), met de constanten en imports van die
    // module. Een pijlfunctie met een expressie als body wordt { params, body, scope }, zodat evaluate een aanroep
    // kan uitrekenen. Wat niet letterlijk te bepalen is, geeft undefined.
    const moduleValues = new Map();
    function moduleValue(module, name) {
        const key = `${module}#${name}`;
        if (moduleValues.has(key)) return moduleValues.get(key);
        moduleValues.set(key, undefined);
        const text = read(module);
        const source = initializerOf(text, name);
        let value;
        if (source !== null) {
            const scope = moduleScope(module, text);
            const fn = arrowFunction(source);
            try {
                value = fn ? { ...fn, scope } : evaluate(source, scope, module);
            } catch {
                value = undefined;
            }
        }
        moduleValues.set(key, value);
        return value;
    }
    function moduleScope(module, text) {
        const imports = parseImports(text.match(/^import\s[\s\S]*?from\s+['"][^'"\n]+['"];?/gm) ?? []);
        return (name) => {
            for (const entry of imports) {
                const target = resolveImport(module, entry.source, repo);
                if (!target) continue;
                if (entry.default === name && (isRaw(entry.source) || /\.md$/.test(target))) {
                    return read(target, { shown: true });
                }
                const named = entry.named.find((item) => item.local === name);
                if (named) return moduleValue(target, named.imported);
            }
            return moduleValue(module, name);
        };
    }

    function component(node, ctx, scope) {
        const { file } = scope;
        const of = attributeSource(node, 'of');
        const value = (name) => attributeValue(node, name, ctx);
        const children = () => renderNodes(node.children, ctx);
        switch (node.name) {
            case 'Meta':
            case 'FluxComponentMetaData':
            case 'FluxMetaData':
            case 'VluxMetaData':
            case 'FluxComponentEvolution':
            case 'FluxComponentCondition':
                // De status staat in index.json.
                return '';
            case 'Controls':
                return apiLine(page.id, page.stories[0]);
            case 'Canvas':
            case 'DocsStory':
            case 'Story': {
                if (of && of.includes('.')) return storyLine(storyOf(of, scope, file));
                if (of && scope.storyExports.has(of)) return storyLine(storyOf(of, scope, file));
                const id = value('id');
                if (typeof id === 'string') {
                    const story = index.stories.find((s) => s.id === id);
                    if (!story) throw new MdxError(`${file}: story ${id} staat niet in index.json.`);
                    return storyLine(story);
                }
                if (node.children.length > 0) return children();
                if (!page.stories[0]) {
                    throw new MdxError(`${file}: <${node.name}> zonder story, en de pagina heeft er geen.`);
                }
                return storyLine(page.stories[0]);
            }
            case 'Primary':
            case 'FluxCanvasIframe':
                return page.stories[0] ? storyLine(page.stories[0]) : '';
            case 'Stories': {
                const title = value('title');
                const stories = value('includePrimary') === 'false' ? page.stories.slice(1) : page.stories;
                if (stories.length === 0) return '';
                return `${typeof title === 'string' ? `\n\n## ${title}\n\n` : ''}${stories.map(storyLine).join('')}`;
            }
            case 'ArgTypes':
            case 'ArgsTable': {
                if (!of) return apiLine(page.id, page.stories[0]);
                const [module] = of.split('.');
                const storiesFile = scope.modules.get(module) ?? scope.storyExports.get(of)?.file;
                const story = of.includes('.') || scope.storyExports.has(of) ? storyOf(of, scope, file) : null;
                const docs = storiesFile ? pageOfStories(storiesFile) : null;
                return apiLine(docs ? pageIdOf(docs.id) : page.id, story);
            }
            case 'Source': {
                let code;
                try {
                    code = value('code');
                } catch (error) {
                    // De code van een story (Stories.X.toString()), of van een functie die niet letterlijk uit te
                    // rekenen is: toon de declaratie in de bron. Uitvoeren doen we niets.
                    const source = attributeSource(node, 'code') ?? '';
                    const story = /^([\w$]+)\.([\w$]+)\.toString\(\)$/.exec(source);
                    const call = /^([\w$]+)\s*\(/.exec(source);
                    const origin = story
                        ? scope.modules.has(story[1]) && { file: scope.modules.get(story[1]), name: story[2] }
                        : call && scope.moduleImports.has(call[1]) && {
                              file: scope.moduleImports.get(call[1]).file,
                              name: scope.moduleImports.get(call[1]).imported,
                          };
                    const declaration = origin && declarationOf(read(origin.file), origin.name);
                    if (!declaration) throw error;
                    code = `// {${source}} uit ${origin.file}:\n${declaration}`;
                }
                const text = typeof code === 'object' && code?.nodes ? children() : dedent(valueToMarkdown(code, ctx));
                if (!text.trim()) throw new MdxError(`${file}: <Source> zonder code.`);
                const language = value('language');
                const fence = text.includes('```') ? '````' : '```';
                return `\n\n${fence}${typeof language === 'string' ? language : ''}\n${text}\n${fence}\n\n`;
            }
            case 'Markdown':
                return `\n\n${dedent(children())}\n\n`;
            case 'FluxAlert': {
                const title = value('title');
                const type = value('type');
                const message = value('message');
                const text = dedent(node.children.length > 0 ? children() : valueToMarkdown(message, ctx));
                const lines = [
                    `[!${ALERT_TYPES[typeof type === 'string' ? type : 'error'] ?? 'NOTE'}]`,
                    `**${typeof title === 'string' ? title : 'Opgelet'}**`,
                    ...text.split('\n'),
                ];
                return `\n\n${lines.map((line) => (line ? `> ${line}` : '>')).join('\n')}\n\n`;
            }
            case 'FluxWcagPrincipe':
            case 'FluxWcagRichtlijn': {
                const level = value('level');
                const heading = `# ${level} ${value('title')}`;
                const text = valueToMarkdown(value('text'), ctx).trim();
                const references = [
                    '**Referenties:**',
                    '',
                    `- [${level} - WCAG - Nederlandse Beschrijving](${value('refDescription')})`,
                    `- [${level} - WCAG - Quick Reference](${value('refQuick')})`,
                ].join('\n');
                const after = node.name === 'FluxWcagPrincipe' ? '\n\n## Richtlijnen met hun succescriteria' : '';
                return `\n\n${heading}\n\n${text}\n\n${references}${after}\n\n${children()}`;
            }
            case 'FluxWcagSuccesscriterium': {
                const level = value('level');
                const text = valueToMarkdown(value('text'), ctx).trim();
                const references = [
                    '**Referenties:**',
                    '',
                    `- [${level} - WCAG - Nederlandse Beschrijving](${value('refDescription')})`,
                    `- [${level} - WCAG - Quick Reference](${value('refQuick')})`,
                ].join('\n');
                return `\n\n### ${level} ${value('title')}\n\n${text}\n\n${references}\n\n${children()}`;
            }
            case 'FluxWcagExamplesTitle':
                return '\n\n**Voorbeelden:**\n\n';
            case 'FluxWcagExample':
                return `\n\nvb. ${value('exampleNumber')}: [${value('title')}](${value('link')})\n\n${children()}\n\n`;
            case 'FluxWcagBronsBase':
                return '\n\n## Brons[basis]\n\n';
            case 'FluxWcagBronsPlus':
                return '\n\n## Brons[plus]\n\n';
            case 'FluxWcagSilverBase':
                return '\n\n## Zilver[basis]\n\n';
            case 'FluxWcagSilverPlus':
                return '\n\n## Zilver[plus]\n\n';
            case 'ColorPalette': {
                const items = node.children.filter((child) => child.type === 'element' && child.name === 'ColorItem');
                const rows = items.map((item) => {
                    const get = (name) => attributeValue(item, name, ctx);
                    const colorsSource = attributeSource(item, 'colors');
                    const colors = colorsSource ? parseLiteral(colorsSource) : {};
                    const list = Array.isArray(colors)
                        ? colors.join(', ')
                        : Object.entries(colors).map(([name, color]) => `${name}: ${color}`).join(', ');
                    const cell = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
                    return `| ${cell(get('title'))} | ${cell(get('subtitle'))} | ${cell(list)} |`;
                });
                return `\n\n| Kleur | Beschrijving | Waarden |\n| --- | --- | --- |\n${rows.join('\n')}\n\n`;
            }
            case 'FluxComponentOverview': {
                // Deze pagina toont de metadata zelf: die telt dan mee in de bronnen en de hash.
                for (const metaFile of repo.list(META_DATA_DIR).filter((name) => name.endsWith('.json'))) {
                    read(metaFile, { shown: true });
                }
                const rows = Object.entries(metaData)
                    .filter(([, data]) => data?.condition)
                    .map(([id, data]) => {
                        const c = data.condition;
                        const tests = [].concat(c.tests ?? []).join(', ');
                        // Zoals Storybook: een link enkel als de metadata 'docs' heeft, anders de naam als tekst. De
                        // kaart (map-actions, …) heeft zo rijen zonder eigen pagina.
                        const name = data.name ?? id;
                        const link = data.docs ? `[${name}](/?path=/docs/${data.docs})` : name;
                        const cells = [c.generation, c.base, c.css, c.documentation, c.wcag ?? c.wcagLevel, tests];
                        return `| ${[link, ...cells.map((value) => value ?? '')].join(' | ')} |`;
                    });
                const header = [
                    '| Component | Generatie | Basis | CSS | Documentatie | WCAG | Testen |',
                    '| --- | --- | --- | --- | --- | --- | --- |',
                ].join('\n');
                return `\n\n${header}\n${rows.join('\n')}\n\n`;
            }
            default: {
                const included = scope.mdxComponents.get(node.name);
                if (!included) return undefined;
                return `\n\n${convertFile(included, new Set([...scope.included, file]))}\n\n`;
            }
        }
    }

    let markdown;
    if (page.mdx) {
        markdown = convertFile(page.mdx);
    } else {
        // Een pagina zonder eigen MDX: het sjabloon met de titel, de beschrijving, de API en alle stories.
        const elements = byPage.get(page.id) ?? [];
        const description = elements.map((name) => webTypes?.get(name)?.element.description).find(Boolean);
        const [primary, ...rest] = page.stories;
        markdown = [
            `# ${templateTitle(page.title)}`,
            description ?? '',
            '## Voorbeeld',
            primary ? storyLine(primary) : '',
            '## Configuratie',
            apiLine(page.id, primary),
            rest.length > 0 ? `## Varianten\n\n${rest.map(storyLine).join('')}` : '',
        ].join('\n\n');
    }
    return { markdown, files };
}

// Bouwt de Storybook-documentatie van een versie.
//   index      index.json van de Storybook van die versie;
//   repo       { read(pad) → tekst of null, list(map) → paden } voor de bronrepo op de tag;
//   webTypes   loadWebTypes voor die versie;
//   version    de versie.
// Geeft { index, pages: [{ id, markdown }], warnings }. Een blok of expressie die niet om te zetten is, laat het
// falen: er mag niets ongemerkt verdwijnen.
export function buildStorybook({ index: storybookIndex, repo, webTypes, version }) {
    const entries = Object.values(storybookIndex.entries ?? storybookIndex.stories ?? {});
    const index = {
        docs: entries.filter((entry) => entry.type === 'docs'),
        stories: entries.filter((entry) => entry.type === 'story'),
    };
    const { byPage, warnings: linkWarnings } = elementsByPage(webTypes, index.docs);
    const metaData = loadMetaData(repo);
    const packageJson = JSON.parse(repo.read('package.json') ?? '{}');
    const storybookVersion =
        packageJson.devDependencies?.storybook ?? packageJson.dependencies?.storybook ?? null;
    const aliases = integrationAliases(repo);
    const context = { repo, index, byPage, metaData, webTypes };
    const warnings = [...linkWarnings];
    const pages = [];
    const summaries = [];
    const skipped = [];
    const errors = [];
    const seen = new Set();

    for (const docs of index.docs) {
        const id = pageIdOf(docs.id);
        if (seen.has(id)) {
            warnings.push(`${docs.id}: een tweede docs-pagina voor ${id}, overgeslagen.`);
            continue;
        }
        seen.add(id);
        const kind = kindOf(docs.title);
        if (kind === 'changelog') {
            skipped.push({ id, title: docs.title, reason: 'de changelog staat in changelog/' });
            continue;
        }
        if (kind === 'other') warnings.push(`${id}: onbekende soort voor de titel '${docs.title}'.`);

        const sourceFile = repoPathOf(docs.importPath);
        let mdxFile = null;
        let stories;
        let storiesFiles;
        if (sourceFile.endsWith('.mdx')) {
            mdxFile = sourceFile;
            stories = index.stories.filter((story) => story.title === docs.title);
            storiesFiles = [...new Set(stories.map((story) => repoPathOf(story.importPath)))];
        } else {
            stories = index.stories.filter((story) => story.importPath === docs.importPath);
            storiesFiles = [sourceFile];
            // De eigen pagina van een stories-bestand: parameters.docs.page, geïmporteerd uit een MDX-bestand. Ook in
            // de korte vorm 'docs: { page }', zoals vl-accessibility-styles.stories.ts vanaf 2.5.0.
            const text = repo.read(sourceFile) ?? '';
            const docsPage = /docs\s*:\s*\{[^}]*?\bpage\b\s*(?::\s*([\w$]+))?\s*[,}]/.exec(text);
            const pageName = docsPage ? (docsPage[1] ?? 'page') : undefined;
            if (pageName) {
                const specifier = new RegExp(`import\\s+${pageName}\\s+from\\s+['"]([^'"]+)['"]`).exec(text)?.[1];
                mdxFile = specifier ? resolveImport(sourceFile, specifier, repo) : null;
                if (!mdxFile) errors.push(`${sourceFile}: de docs-pagina ${pageName} is niet te vinden.`);
            }
        }
        const page = {
            id,
            title: docs.title,
            kind,
            mdx: mdxFile,
            stories: stories.map((story) => ({ id: story.id, name: story.name })),
        };
        try {
            const { markdown, files } = convertPage(page, context);
            const storySources = new Set();
            for (const file of storiesFiles) storyFiles(file, repo, storySources, aliases);
            for (const file of storySources) {
                if (!files.has(file)) files.set(file, { text: repo.read(file), shown: false });
            }
            const elements = byPage.get(id) ?? [];
            const hashFiles = [...files].map(([file, { text, shown }]) => ({ path: file, text, shown }));
            // Het contract van de eigen elementen van de pagina, en van de andere elementen die haar stories en hun
            // voorbeeldcomponenten gebruiken enkel de namen van de attributen. De voorbeelden komen uit die stories en
            // zetten ook attributen op andere elementen, bv. vl-share-button in de stories van vl-share-buttons; de
            // controle toetst die namen aan de web-types van elke versie met dezelfde hash. Een element dat niet in de
            // web-types staat, telt als ontbrekend. De MDX en getoonde code tellen hier niet mee: daar komt geen
            // voorbeeld uit.
            const used = new Set(elements);
            for (const { path: file, text, shown } of hashFiles) {
                if (shown || !file || file.endsWith('.mdx')) continue;
                for (const match of text.matchAll(/<(vl-[a-z0-9-]+)/g)) used.add(match[1]);
            }
            const contracts = [...used].map((name) => {
                if (!webTypes.has(name)) return { name, missing: true };
                const contract = contractOf(name, webTypes.get(name).element);
                if (elements.includes(name)) return contract;
                return { name, attributes: contract.attributes.map((item) => item.name) };
            });
            if (!mdxFile) hashFiles.push({ path: '', text: TEMPLATE_MARKER });
            const normalized = tidyMarkdown(normalizeLinks(markdown, version));
            const { name, docs: _docs, ...status } = metaData[id] ?? {};
            pages.push({ id, markdown: normalized });
            summaries.push({
                id,
                title: docs.title,
                kind,
                file: `pages/${id}.md`,
                sources: [...files.keys()].sort(),
                elements,
                status: Object.keys(status).length > 0 ? status : null,
                stories: page.stories,
                links: linkedPages(normalized).filter((link) => link !== id),
                inputHash: inputHash({ files: hashFiles, contracts }),
            });
        } catch (error) {
            if (!(error instanceof MdxError)) throw error;
            errors.push(error.message);
        }
    }

    const known = new Set([...summaries.map((page) => page.id), ...skipped.map((page) => page.id)]);
    for (const page of summaries) {
        const broken = page.links.filter((link) => !known.has(link));
        if (broken.length > 0) warnings.push(`${page.id}: links naar onbekende pagina's: ${broken.join(', ')}.`);
    }
    return {
        errors,
        warnings,
        pages,
        index: {
            schema: STORYBOOK_SCHEMA,
            version,
            storybook: storybookVersion,
            url: storybookBase(version),
            pages: summaries,
            skipped,
        },
    };
}

// De bestanden van buildStorybook, zoals ze in catalog/flux/<versie>/storybook/ komen.
export function storybookFiles(built) {
    return [
        { path: 'index.json', content: `${JSON.stringify(built.index, null, 4)}\n` },
        ...built.pages.map((page) => ({ path: `pages/${page.id}.md`, content: page.markdown })),
    ];
}

// ---------------------------------------------------------------------------------------------------------------
// Laden.

// De Storybook van een versie uit de catalogus, of null als ze er niet is.
export function loadStorybook(catalogDir, version) {
    const dir = path.join(catalogDir, version, 'storybook');
    const file = path.join(dir, 'index.json');
    if (!fs.existsSync(file)) return null;
    const index = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (index.schema !== STORYBOOK_SCHEMA) {
        throw new Error(
            `${version}/storybook/index.json heeft schema ${index.schema}, verwacht ${STORYBOOK_SCHEMA}. ` +
                `Draai opnieuw: pnpm run flux:storybook:copy ${version}`,
        );
    }
    return {
        ...index,
        markdown: (page) => fs.readFileSync(path.join(dir, page.file), 'utf-8'),
    };
}

export const analysisPath = (catalogDir, pageId, hash) => path.join(catalogDir, ANALYSIS_DIR, pageId, `${hash}.json`);

// De analyse van een pagina voor haar inputHash, of null.
export function loadAnalysis(catalogDir, page) {
    const file = analysisPath(catalogDir, page.id, page.inputHash);
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : null;
}

// Verwijdert de analyses van pagina's, en een map die daardoor leeg wordt. Voor een reeks die faalde of onderbroken
// werd: haar analyses zijn niet (volledig) gereviewd, en storybook:analyse zou ze bij het hernemen als klaar
// overslaan. Geeft de verwijderde bestanden terug, relatief tegenover de catalogus.
export function discardAnalyses(catalogDir, pages) {
    const removed = [];
    for (const page of pages) {
        const file = analysisPath(catalogDir, page.id, page.inputHash);
        if (!fs.existsSync(file)) continue;
        fs.rmSync(file);
        removed.push(path.relative(catalogDir, file));
        const dir = path.dirname(file);
        if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
    }
    return removed;
}

// ---------------------------------------------------------------------------------------------------------------
// De analyse controleren.

export const NOTE_TYPES = ['not-in-web-types', 'mismatch'];
const ANALYSIS_KEYS = ['schema', 'page', 'inputHash', 'analysedFor', 'summary', 'keywords', 'examples', 'notes'];
const EXAMPLE_KEYS = ['html', 'js'];
const NOTE_KEYS = ['type', 'element', 'name', 'text', 'source'];
// Attributen die op elk HTML-element mogen.
const GLOBAL_ATTRIBUTES = new Set([
    'id', 'class', 'style', 'slot', 'title', 'lang', 'dir', 'hidden', 'tabindex', 'role', 'part', 'is', 'name',
    'autofocus', 'inert', 'draggable', 'translate', 'spellcheck', 'contenteditable', 'accesskey', 'popover',
]);

const isGlobal = (attribute) => GLOBAL_ATTRIBUTES.has(attribute) || /^(aria|data)-|^on/.test(attribute);

// De vl-elementen en hun attributen in HTML.
export function elementsInHtml(html) {
    const result = [];
    const attribute = String.raw`\s+([^\s=>/]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?`;
    const tag = new RegExp(String.raw`<(vl-[a-z0-9-]+)((?:${attribute})*)\s*\/?>`, 'g');
    for (const match of String(html).matchAll(tag)) {
        const attributes = [...match[2].matchAll(new RegExp(attribute, 'g'))].map((m) => m[1]);
        result.push({ element: match[1], attributes });
    }
    return result;
}

// Wat niet klopt aan een analyse, voor een pagina van een versie. Een lege lijst betekent dat ze klopt.
export function validateAnalysis(analysis, page, webTypes) {
    const problems = [];
    const where = `${ANALYSIS_DIR}/${page.id}/${page.inputHash}.json`;
    const problem = (message) => problems.push(`${where}: ${message}`);
    if (!analysis || typeof analysis !== 'object') return [`${where}: geen JSON-object.`];
    for (const key of Object.keys(analysis)) if (!ANALYSIS_KEYS.includes(key)) problem(`onbekende sleutel '${key}'.`);
    if (analysis.schema !== ANALYSIS_SCHEMA) problem(`schema is ${analysis.schema}, verwacht ${ANALYSIS_SCHEMA}.`);
    if (analysis.page !== page.id) problem(`page is '${analysis.page}', verwacht '${page.id}'.`);
    if (analysis.inputHash !== page.inputHash) {
        problem(`inputHash is '${analysis.inputHash}', verwacht '${page.inputHash}'.`);
    }
    if (typeof analysis.summary !== 'string' || !analysis.summary.trim()) problem('summary ontbreekt.');
    if (!Array.isArray(analysis.keywords) || analysis.keywords.some((k) => typeof k !== 'string' || !k.trim())) {
        problem('keywords is geen lijst van termen.');
    }
    const notes = Array.isArray(analysis.notes) ? analysis.notes : [];
    if (!Array.isArray(analysis.notes)) problem('notes is geen lijst.');
    for (const note of notes) {
        for (const key of Object.keys(note ?? {})) {
            if (!NOTE_KEYS.includes(key)) problem(`onbekende sleutel '${key}' in een note.`);
        }
        if (!NOTE_TYPES.includes(note?.type)) problem(`note met een onbekend type '${note?.type}'.`);
        if (typeof note?.text !== 'string' || !note.text.trim()) problem('note zonder text.');
    }
    const examples = analysis.examples;
    if (!examples || typeof examples !== 'object' || Array.isArray(examples)) {
        problem('examples is geen object.');
        return problems;
    }
    const storyIds = new Set(page.stories.map((story) => story.id));
    for (const story of page.stories) if (!(story.id in examples)) problem(`geen voorbeeld voor story ${story.id}.`);
    const allowed = (element, name) =>
        notes.some(
            (note) =>
                note.type === 'not-in-web-types' && note.element === element && (note.name ?? null) === (name ?? null),
        );
    for (const [storyId, example] of Object.entries(examples)) {
        if (!storyIds.has(storyId)) problem(`voorbeeld voor ${storyId}, maar die story hoort niet bij de pagina.`);
        for (const key of Object.keys(example ?? {})) {
            if (!EXAMPLE_KEYS.includes(key)) problem(`${storyId}: onbekende sleutel '${key}'.`);
        }
        const html = typeof example?.html === 'string' ? example.html : '';
        const js = typeof example?.js === 'string' ? example.js : '';
        if (!html.trim() && !js.trim()) problem(`${storyId}: een voorbeeld zonder html en js.`);
        for (const { element, attributes } of elementsInHtml(html)) {
            const known = webTypes?.get(element)?.element;
            if (!known) {
                if (!allowed(element, null)) {
                    problem(`${storyId}: <${element}> staat niet in de web-types van deze versie.`);
                }
                continue;
            }
            const names = new Set((known.attributes ?? []).map((a) => a.name));
            for (const attribute of attributes) {
                if (/^[?.@]/.test(attribute)) {
                    problem(`${storyId}: '${attribute}' op <${element}> is lit-syntax; schrijf gewone HTML.`);
                } else if (!names.has(attribute) && !isGlobal(attribute) && !allowed(element, attribute)) {
                    problem(`${storyId}: attribuut '${attribute}' staat niet in de web-types van <${element}>.`);
                }
            }
        }
    }
    return problems;
}

// De versies met een Storybook in de catalogus, oplopend.
export function storybookVersions(catalogDir) {
    const parts = (version) => version.split(/[.-]/).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
    return (fs.existsSync(catalogDir) ? fs.readdirSync(catalogDir) : [])
        .filter((name) => /^\d+\.\d+\.\d+/.test(name))
        .filter((name) => fs.existsSync(path.join(catalogDir, name, 'storybook', 'index.json')))
        .sort((a, b) => {
            const [pa, pb] = [parts(a), parts(b)];
            for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
            return a.localeCompare(b);
        });
}

// Controleert de Storybook van de gevraagde versies (standaard alle) en de analyses die ze gebruiken. Geeft:
//   errors    wat niet klopt: een ontbrekende of overbodige pagina, of een analyse die validateAnalysis afkeurt;
//   missing   per versie de pagina's zonder analyse voor hun inhoud;
//   orphans   analyses die geen enkele versie gebruikt (enkel als alle versies gecontroleerd worden).
export function checkStorybook(catalogDir, versions = storybookVersions(catalogDir)) {
    const errors = [];
    const missing = new Map();
    const used = new Set();
    for (const version of storybookVersions(catalogDir)) {
        const storybook = loadStorybook(catalogDir, version);
        for (const page of storybook.pages) used.add(`${page.id}/${page.inputHash}.json`);
        if (!versions.includes(version)) continue;
        const pagesDir = path.join(catalogDir, version, 'storybook', 'pages');
        const expected = new Set(storybook.pages.map((page) => path.basename(page.file)));
        for (const name of fs.existsSync(pagesDir) ? fs.readdirSync(pagesDir) : []) {
            if (!expected.has(name)) errors.push(`${version}/storybook/pages/${name} hoort bij geen pagina.`);
        }
        const webTypes = loadWebTypes(catalogDir, version);
        const without = [];
        for (const page of storybook.pages) {
            if (!fs.existsSync(path.join(catalogDir, version, 'storybook', page.file))) {
                errors.push(`${version}/storybook/${page.file} ontbreekt.`);
            }
            let analysis;
            try {
                analysis = loadAnalysis(catalogDir, page);
            } catch (error) {
                errors.push(`${ANALYSIS_DIR}/${page.id}/${page.inputHash}.json: geen geldige JSON (${error.message}).`);
                continue;
            }
            if (!analysis) {
                without.push(page.id);
                continue;
            }
            for (const problem of validateAnalysis(analysis, page, webTypes)) errors.push(`${version}: ${problem}`);
        }
        if (without.length > 0) missing.set(version, without);
    }
    const orphans = [];
    const analysisDir = path.join(catalogDir, ANALYSIS_DIR);
    for (const pageId of fs.existsSync(analysisDir) ? fs.readdirSync(analysisDir) : []) {
        const dir = path.join(analysisDir, pageId);
        if (!fs.statSync(dir).isDirectory()) {
            errors.push(`${ANALYSIS_DIR}/${pageId} hoort er niet: verwacht <pagina>/<inputHash>.json.`);
            continue;
        }
        for (const name of fs.readdirSync(dir)) {
            if (!/^[0-9a-f]{12}\.json$/.test(name)) {
                errors.push(`${ANALYSIS_DIR}/${pageId}/${name} hoort er niet: verwacht <inputHash>.json.`);
            } else if (!used.has(`${pageId}/${name}`)) {
                orphans.push(`${ANALYSIS_DIR}/${pageId}/${name}`);
            }
        }
    }
    const complete = versions.length === storybookVersions(catalogDir).length;
    return { errors, missing, orphans: complete ? orphans : [] };
}

// ---------------------------------------------------------------------------------------------------------------
// Samenvoegen voor de server.

const cell = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').replace(/<br\s*\/?>/g, ' ');

// De API van een element uit de web-types, als Markdown-tabellen.
export function apiMarkdown(name, element, notes = []) {
    const out = [`**API van \`${name}\`**`];
    if (element.deprecated) out.push(`Deprecated: ${element.deprecated === true ? 'ja' : element.deprecated}`);
    const table = (title, items, columns) => {
        if (!items?.length) return;
        out.push(`*${title}*`);
        const row = (cells) => `| ${cells.join(' | ')} |`;
        const rows = items.map((item) => row(columns.map(([, get]) => cell(get(item)))));
        out.push([row(columns.map(([heading]) => heading)), row(columns.map(() => '---')), ...rows].join('\n'));
    };
    const deprecated = (item) => {
        if (!item.deprecated) return '';
        return item.deprecated === true ? 'deprecated' : `deprecated: ${item.deprecated}`;
    };
    const describe = (item) => [item.description, deprecated(item)].filter(Boolean).join(' — ');
    table('Attributen', element.attributes, [
        ['Naam', (a) => `\`${a.name}\``],
        ['Type', (a) => a.value?.type ?? a.type ?? ''],
        ['Default', (a) => (a.default === undefined || a.default === '' ? '' : `\`${a.default}\``)],
        ['Beschrijving', describe],
    ]);
    table('Properties', element.js?.properties, [
        ['Naam', (p) => `\`${p.name}\``],
        ['Type', (p) => p.type ?? ''],
        ['Beschrijving', describe],
    ]);
    table('Slots', element.slots, [
        ['Naam', (s) => (s.name ? `\`${s.name}\`` : '(standaard)')],
        ['Beschrijving', describe],
    ]);
    table('Events', element.js?.events, [
        ['Naam', (e) => `\`${e.name}\``],
        ['Type', (e) => e.type ?? ''],
        ['Beschrijving', describe],
    ]);
    const missing = notes.filter((note) => note.type === 'not-in-web-types' && note.element === name);
    if (missing.length > 0) {
        const lines = missing.map((note) => `- ${note.name ? `\`${note.name}\`: ` : ''}${note.text}`);
        out.push(`*Niet in de web-types:*\n\n${lines.join('\n')}`);
    }
    return out.join('\n\n');
}

// Een pagina zoals de server ze toont: de regels '> Story:' krijgen hun voorbeeld, '> API:' de API uit de
// web-types, en de links worden absoluut. Bovenaan komen de versie, de link en de status.
export function renderPage({ version, page, markdown, analysis, webTypes }) {
    const base = storybookBase(version);
    const examples = analysis?.examples ?? {};
    const notes = analysis?.notes ?? [];
    let fence = null;
    const lines = [];
    for (const line of markdown.split('\n')) {
        const marker = /^[ \t]*(`{3,}|~{3,})/.exec(line)?.[1];
        if (fence) {
            if (closesFence(line, marker, fence)) fence = null;
            lines.push(line);
            continue;
        }
        if (marker) {
            fence = marker;
            lines.push(line);
            continue;
        }
        const story = /^> Story: \[(.*)\]\(\/\?path=\/story\/([A-Za-z0-9_-]+)\)$/.exec(line);
        const api = /^> API: (vl-[a-z0-9-]+(?:, vl-[a-z0-9-]+)*)$/.exec(line);
        if (story) {
            const [, name, id] = story;
            const example = examples[id];
            lines.push(`**${name}** ([Storybook](${base}?path=/story/${id}))`);
            if (example?.html) lines.push('', '```html', example.html.trimEnd(), '```');
            if (example?.js) lines.push('', '```js', example.js.trimEnd(), '```');
        } else if (api) {
            const parts = api[1].split(', ').map((name) => {
                const element = webTypes?.get(name)?.element;
                return element ? apiMarkdown(name, element, notes) : `**API van \`${name}\`**: niet in de web-types.`;
            });
            lines.push(parts.join('\n\n'));
        } else {
            // Links naar Storybook gaan naar die versie, een pad in de bronrepo (een afbeelding) naar de tag.
            lines.push(
                line
                    .replace(/(\]\(|href=")\/\?path=/g, (_, before) => `${before}${base}?path=`)
                    .replace(/\]\(\/(?!\?)([^)\s]+)/g, (_, file) => `](${sourceFileUrl(version, file)}`),
            );
        }
    }
    const status = page.status?.condition ?? page.status;
    const labels = { generation: 'generatie', base: 'basis', css: 'css', documentation: 'documentatie', wcag: 'wcag' };
    const statusText = status
        ? Object.entries(labels)
              .filter(([key]) => status[key])
              .map(([key, label]) => `${label}: ${status[key]}`)
              .join(' · ')
        : '';
    const header = [
        `Flux ${version} · [Storybook](${base}?path=/docs/${page.id}--documentatie)`,
        ...(page.elements.length > 0 ? [`Elementen: ${page.elements.map((name) => `\`${name}\``).join(', ')}`] : []),
        ...(statusText ? [`Status: ${statusText}`] : []),
    ].join('  \n');
    const body = lines.join('\n');
    const heading = /^# .*$/m.exec(body);
    if (!heading) return `${header}\n\n${body}`;
    const at = heading.index + heading[0].length;
    return `${body.slice(0, at)}\n\n${header}${body.slice(at)}`;
}
