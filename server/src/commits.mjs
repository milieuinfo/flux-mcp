// Wat de commits achter een changelog-entry vertellen, los van git en netwerk: in welk soort bestanden de
// wijziging zit, welke Storybook-pagina's ze raakt en welke documentatie erbij kwam.
//
// changelog-commits haalt de commits op en schrijft het resultaat naar
// catalog/flux/<versie>/changelog/commits.json; changelog-build neemt het op in changelog.json. Een afnemer gaat
// niet zelf uitzoeken wat een commit wijzigde: dat vertelt de server hem.

// De packages die afnemers installeren: @domg-wc/common, components, map en styles. libs/integrations is
// referentiecode om over te nemen, geen package.
const PUBLISHED = /^libs\/(common|components|map|styles)\/src\//;
const TESTS = /\.(cy|spec|test)\.[cm]?[jt]sx?$|(^|\/)(__tests__|test)\/|^apps\/[^/]+-e2e\//;
const STYLES = /\.(css|scss)$|\.(flux-)?css\.ts$|^libs\/styles\//;
const STORYBOOK_APP = 'apps/storybook';
const TRAILER = /^(Co-Authored-By|Signed-off-by|Reviewed-by|Refs):/i;

// In deze volgorde verschijnen de soorten; 'code' en 'styles' komen in de packages van een afnemer terecht.
export const AREAS = ['code', 'styles', 'docs', 'storybook', 'examples', 'tests', 'tooling'];
export const PUBLISHED_AREAS = ['code', 'styles'];

// Toegevoegde documentatie tot zoveel regels komt volledig mee; bij meer enkel de titels, met de link naar de pagina.
export const MAX_ADDED_LINES = 100;

// De soort van een gewijzigd bestand in de repo van flux-web-components.
export function areaOf(file) {
    if (TESTS.test(file)) return 'tests';
    if (file.endsWith('.mdx') || /^apps\/storybook\/(docs|resources)\//.test(file)) return 'docs';
    if (/\/stories\//.test(file) || file.startsWith(`${STORYBOOK_APP}/`)) return 'storybook';
    if (PUBLISHED.test(file)) return STYLES.test(file) ? 'styles' : 'code';
    if (/^libs\/integrations\//.test(file) || /^apps\/(playground|consumer|integrator)/.test(file)) return 'examples';
    return 'tooling';
}

// De commit message zonder onderwerp en trailers, met de harde regeleinden binnen een alinea weggewerkt. Een
// lijstitem begint een nieuwe regel; een ingesprongen vervolgregel hoort bij het item erboven.
export function bodyOf(message) {
    const lines = message.replace(/\r\n/g, '\n').split('\n').slice(1);
    while (lines.length > 0 && (lines.at(-1).trim() === '' || TRAILER.test(lines.at(-1).trim()))) lines.pop();
    return lines
        .join('\n')
        .trim()
        .split(/\n\s*\n/)
        .map((paragraph) => {
            const out = [];
            for (const line of paragraph.split('\n')) {
                if (out.length === 0 || /^\s*([-*•]|\d+\.)\s/.test(line)) out.push(line.trimEnd());
                else out[out.length - 1] += ` ${line.trim()}`;
            }
            return out.join('\n');
        })
        .join('\n\n')
        .trim();
}

// De documentatie die een diff toevoegt (of wijzigt), zonder imports en JSX-blokken zoals <Canvas />. Delen die
// niet aan elkaar sluiten, worden gescheiden door '[…]'.
export function addedDocumentation(diff) {
    const hunks = [];
    let current = null;
    for (const line of diff.split('\n')) {
        if (line.startsWith('@@')) {
            current = [];
            hunks.push(current);
        } else if (current && line.startsWith('+') && !line.startsWith('+++')) {
            const text = line.slice(1);
            if (/^\s*import\s/.test(text) || /^\s*<\/?[A-Z][\w.]*(\s[^>]*)?\/?>\s*$/.test(text)) continue;
            current.push(text.trimEnd());
        }
    }
    const parts = hunks
        .map((lines) => {
            while (lines.length > 0 && lines[0].trim() === '') lines.shift();
            while (lines.length > 0 && lines.at(-1).trim() === '') lines.pop();
            return lines;
        })
        .filter((lines) => lines.length > 0);
    const total = parts.reduce((sum, lines) => sum + lines.length, 0);
    if (total === 0) return null;
    if (total > MAX_ADDED_LINES) {
        const headings = parts.flat().filter((line) => /^#{1,6}\s/.test(line));
        return [...headings, `(${total} regels toegevoegd of gewijzigd; lees de pagina zelf)`].join('\n');
    }
    return parts.map((lines) => lines.join('\n')).join('\n\n[…]\n\n');
}

// Het pad zoals Storybook het in index.json noemt: relatief tegenover apps/storybook.
function importPathOf(file) {
    const relative = file.startsWith(`${STORYBOOK_APP}/`) ? `./${file.slice(STORYBOOK_APP.length + 1)}` : `../../${file}`;
    // De documentatie van een component (X.stories-doc.mdx) en de beschrijving van de args (X.stories-arg.ts)
    // verschijnen op de docs-pagina van X.stories.ts.
    return relative.replace(/\.stories-(doc|arg)\.(mdx|ts)$/, '.stories.ts');
}

// De Storybook-pagina waarop een gewijzigd bestand verschijnt, of null. 'index' is index.json van de Storybook
// van die versie.
export function storybookPageOf(file, index) {
    if (!/\.(mdx|stories(-(doc|arg))?\.(ts|tsx|mdx))$/.test(file)) return null;
    const importPath = importPathOf(file);
    const entries = Object.values(index.entries ?? {});
    const matching = entries.filter((entry) => entry.importPath === importPath);
    const docs = matching.find((entry) => entry.type === 'docs');
    if (docs) return docs;
    // Stories bij een losse MDX-pagina hangen onder de docs-pagina met dezelfde titel.
    const title = matching[0]?.title;
    return title ? (entries.find((entry) => entry.type === 'docs' && entry.title === title) ?? null) : null;
}

export const storybookUrl = (version, id) =>
    `https://flux.omgeving.vlaanderen.be/release-v${version.split('.')[0]}/${version}/storybook/?path=/docs/${id}`;

// De feiten van één commit. 'files' zijn { path, status } uit git ('A', 'M', 'D', …), 'diffs' per .mdx-bestand de
// diff, 'index' is index.json van de Storybook van 'version'.
export function commitFacts({ sha, message, files, diffs, index, version }) {
    const areas = Object.fromEntries(AREAS.map((area) => [area, 0]));
    const publishedFiles = [];
    const pages = new Map();
    for (const { path, status } of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
        const area = areaOf(path);
        areas[area]++;
        if (PUBLISHED_AREAS.includes(area)) publishedFiles.push(path);
        if (status === 'D') continue;
        const page = storybookPageOf(path, index);
        if (!page) continue;
        if (!pages.has(page.id)) pages.set(page.id, { id: page.id, title: page.title, url: storybookUrl(version, page.id), added: [] });
        const added = path.endsWith('.mdx') && diffs[path] ? addedDocumentation(diffs[path]) : null;
        if (added) pages.get(page.id).added.push(added);
    }
    return {
        sha,
        body: bodyOf(message) || null,
        published: publishedFiles.length > 0,
        areas: Object.fromEntries(Object.entries(areas).filter(([, count]) => count > 0)),
        publishedFiles,
        storybook: [...pages.values()]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(({ added, ...page }) => ({ ...page, added: added.length > 0 ? added.join('\n\n[…]\n\n') : null })),
    };
}
