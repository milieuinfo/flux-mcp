// De antwoorden van de tools als Markdown, voor 'content' (ADR-004, sectie 4). Elke functie krijgt het antwoord zoals
// het in structuredContent staat, ook als dat één deel van een groter antwoord is, en toont enkel wat erin staat:
// beide vormen komen zo uit dezelfde gegevens. Markdown leest een model compacter dan JSON, en de pagina's uit
// Storybook zijn al Markdown.
//
//   render(tool, result)            de tekst voor een tool
//   renderChangelog(release, ...)   de changelog van één versie, voor de resource flux://{version}/changelog
//   renderDocsIndex(...)            de index van de pagina's, voor de resource flux://{version}/docs

const IMPACT_TITLES = {
    action: 'Actie nodig (action)',
    'opt-in': 'Nieuwe mogelijkheden (opt-in)',
    automatic: 'Automatisch mee (automatic)',
    none: 'Geen impact op een project (none)',
};
const KIND_TITLES = {
    component: 'Componenten',
    guide: 'Gidsen',
    guideline: 'Richtlijnen',
    pattern: 'Patronen',
    recipe: 'Recepten',
    styles: 'Styles',
    planning: 'Planning',
    'flux-team': 'Het werk van het Flux-team',
    other: 'Andere',
};
const PARTS = { attributes: 'attributen', slots: 'slots', properties: 'properties', events: 'events' };

const code = (text) => `\`${String(text).replaceAll('`', 'ˋ')}\``;
const join = (blocks) => `${blocks.filter((block) => block != null && block !== '').join('\n\n')}\n`;
const fence = (language, text) => {
    const ticks = '`'.repeat(Math.max(3, ...[...String(text).matchAll(/`+/g)].map((match) => match[0].length + 1)));
    return `${ticks}${language}\n${String(text).replace(/\n$/, '')}\n${ticks}`;
};
const plural = (count, one, more) => `${count} ${count === 1 ? one : more}`;

function warnings(result) {
    return (result.warnings ?? []).map((warning) => `> **Let op:** ${warning}`).join('\n');
}

// De bronnen en, bij een antwoord in delen, waar je het volgende deel vraagt.
function footer(result) {
    const lines = [];
    if (result.sources?.length > 0) {
        const llm = result.sources.some((item) => item.kind.endsWith('-analysis'));
        const items = result.sources.map((item) => `${code(item.path)} (${item.kind})`).join(', ');
        lines.push(`Bronnen in de catalogus van flux-mcp ${result.catalog}: ${items}.`);
        if (llm) lines.push('Tekst uit een bron *-analysis schreef een LLM, gecontroleerd door een tweede run.');
    }
    if (result.parts) {
        const next = result.nextCursor
            ? ` Vraag het volgende deel met dezelfde argumenten en cursor ${code(result.nextCursor)}.`
            : ' Dit is het laatste deel.';
        lines.push(`**Deel ${result.part} van ${result.parts}.**${next}`);
    }
    return lines.join('\n\n');
}

// Een entry van de changelog. Zonder uitleg of voorbeeld één regel in een lijst, anders een eigen blok.
function entryLine(entry, { version = true, bold = true } = {}) {
    const parts = [
        version ? (bold ? `**${entry.version}**` : entry.version) : null,
        entry.ticket,
        code(entry.id),
        entry.type,
        entry.components?.length ? entry.components.join(', ') : null,
    ].filter(Boolean);
    return `${parts.join(' · ')} — ${entry.summary ?? entry.text}`;
}

function entryBlock(entry, options) {
    const lines = [];
    const detailed = entry.explanation || entry.example;
    lines.push(detailed ? `**${entryLine(entry, { ...options, bold: false })}**` : `- ${entryLine(entry, options)}`);
    if (!detailed) {
        if (entry.action) lines[0] += `\n  - **Actie:** ${entry.action}`;
        return lines[0];
    }
    if (entry.action) lines.push(`**Actie:** ${entry.action}`);
    if (entry.explanation) lines.push(`**Uitleg:** ${entry.explanation}`);
    if (entry.example) lines.push(`**Voorbeeld:**\n\n${entry.example}`);
    return lines.join('\n\n');
}

function entries(list, options) {
    const blocks = [];
    let bullets = [];
    for (const entry of list) {
        const block = entryBlock(entry, options);
        if (block.startsWith('- ')) {
            bullets.push(block);
            continue;
        }
        if (bullets.length > 0) blocks.push(bullets.join('\n'));
        bullets = [];
        blocks.push(block);
    }
    if (bullets.length > 0) blocks.push(bullets.join('\n'));
    return blocks.join('\n\n');
}

// Eén onderdeel van een diff van de web-types: 'banner' (type …, default …).
function item(part) {
    const facts = [
        part.type != null && typeof part.type !== 'object' ? `type ${code(part.type)}` : null,
        part.default != null && typeof part.default !== 'object' ? `default ${code(part.default)}` : null,
        part.deprecated && typeof part.deprecated !== 'object' ? 'deprecated' : null,
    ].filter(Boolean);
    const changes = ['type', 'default', 'deprecated']
        .filter((field) => part[field] && typeof part[field] === 'object' && 'before' in part[field])
        .map((field) => `${field} ${code(part[field].before)} → ${code(part[field].after)}`);
    const all = [...facts, ...changes];
    const name = part.name != null ? code(part.name) : '(zonder naam)';
    const description = part.description ? ` — ${part.description}` : '';
    return `${name}${all.length > 0 ? ` (${all.join(', ')})` : ''}${description}`;
}

// Een element uit een diff van de web-types.
function elementChange(change, kind) {
    const mark = change.inChangelog === false ? ' _(geen changelog-entry)_' : '';
    if (kind === 'added')
        return `- **${change.element}** nieuw${mark}${change.description ? `: ${change.description}` : ''}`;
    if (kind === 'removed') return `- **${change.element}** verdwenen${mark}`;
    const lines = [`- **${change.element}** gewijzigd${mark}`];
    if (change.description) lines.push(`  - beschrijving: ${change.description}`);
    if (change.deprecated) {
        lines.push(`  - deprecated: ${code(change.deprecated.before)} → ${code(change.deprecated.after)}`);
    }
    for (const [key, label] of Object.entries(PARTS)) {
        const part = change[key];
        if (!part) continue;
        if (Array.isArray(part)) {
            for (const entry of part) lines.push(`  - ${label}, beschrijving: ${item(entry)}`);
            continue;
        }
        for (const entry of part.added ?? []) lines.push(`  - ${label} erbij: ${item(entry)}`);
        for (const entry of part.removed ?? []) lines.push(`  - ${label} weg: ${item(entry)}`);
        for (const entry of part.changed ?? []) lines.push(`  - ${label} gewijzigd: ${item(entry)}`);
    }
    return lines.join('\n');
}

function dependencies(diff) {
    const lines = [];
    for (const name of diff.added ?? []) lines.push(`- package ${code(name)} erbij`);
    for (const name of diff.removed ?? []) lines.push(`- package ${code(name)} weg`);
    for (const change of diff.changed ?? []) {
        for (const [field, parts] of Object.entries(change)) {
            if (field === 'package') continue;
            const where = `${change.package} (${field})`;
            for (const dep of parts.added) lines.push(`- ${where}: ${code(dep.name)} ${dep.version} erbij`);
            for (const dep of parts.removed) lines.push(`- ${where}: ${code(dep.name)} ${dep.version} weg`);
            for (const dep of parts.changed) lines.push(`- ${where}: ${code(dep.name)} ${dep.before} → ${dep.after}`);
        }
    }
    return lines.length > 0 ? lines.join('\n') : 'Geen wijzigingen aan de dependencies.';
}

// ---------------------------------------------------------------------------------------------------------------

function listVersions(result) {
    const { coverage } = result;
    const gaps =
        coverage.gaps.length > 0
            ? `, met gaten: ${coverage.gaps.map((gap) => gap.version).join(', ')}`
            : ', zonder gaten';
    const rows = result.versions.map((version) => {
        const impact = ['action', 'opt-in', 'automatic', 'none'].map((key) => version.impact[key] ?? 0);
        return (
            `| ${version.version} | ${version.date ?? ''} | ${version.previous ?? ''} | ${impact.join(' | ')} | ` +
            `${version.changelogAnalysis} | ${version.pages} (${version.pagesAnalysed}) |`
        );
    });
    const summaries = result.versions
        .filter((version) => version.summary)
        .map((version) => `### ${version.version}\n\n${version.summary}`);
    return join([
        '# Flux-versies in de catalogus',
        warnings(result),
        `${code('latest')} is **${result.latest}**: de nieuwste versie in deze catalogus, niet per se de nieuwste ` +
            `release van Flux. De catalogus gaat van ${coverage.oldest} tot en met ${coverage.newest}${gaps}. Niet ` +
            `in de catalogus: v${coverage.notIncluded.majors.join(', v')}, en de patches op een zijtak ` +
            `${coverage.notIncluded.sideBranchPatches.join(', ')}; een vraag naar zo'n patch krijgt het antwoord van ` +
            'haar minor.',
        [
            '| Versie | Datum | Vorige | action | opt-in | automatic | none | Analyse changelog | ' +
                "Pagina's (met analyse) |",
            '|---|---|---|---|---|---|---|---|---|',
            ...rows,
        ].join('\n'),
        summaries.length > 0 ? `## Samenvatting per versie\n\n${summaries.join('\n\n')}` : null,
        footer(result),
    ]);
}

function searchDocs(result) {
    const items = result.results.map((hit, index) => {
        const elements = hit.elements.map((element) => `${element.name} (${element.status})`).join(', ');
        const facts = [code(hit.id), hit.kind, hit.status && hit.status !== 'stable' ? hit.status : null];
        const shown = elements ? ` — ${elements}` : '';
        const lines = [
            `${index + 1}. **${hit.title}** — ${facts.filter(Boolean).join(', ')}${shown}`,
            hit.summary ? `   ${hit.summary}` : null,
            hit.passage ? `   > ${hit.passage}` : null,
            `   ${hit.url}`,
        ];
        return lines.filter(Boolean).join('\n');
    });
    const hidden =
        result.hiddenFluxTeam > 0
            ? ` ${plural(result.hiddenFluxTeam, 'pagina', "pagina's")} van het Flux-team verborgen (includeFluxTeam).`
            : '';
    return join([
        `# Zoekresultaten voor "${result.query}" in Flux ${result.version}`,
        warnings(result),
        items.length > 0 ? items.join('\n') : 'Niets gevonden. Probeer andere woorden, of een synoniem.',
        `${result.results.length} van ${result.total} ${result.total === 1 ? 'resultaat' : 'resultaten'}.${hidden}`,
        footer(result),
    ]);
}

function apiTable(title, rows, columns) {
    if (!rows?.length) return null;
    const describe = rows.some((row) => row.description);
    const header = [...columns.map(([label]) => label), ...(describe ? ['Beschrijving'] : [])];
    const cell = (value) =>
        value == null || value === '' ? '' : String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
    const lines = rows.map((row) => {
        const cells = columns.map(([, key]) => cell(key === 'name' ? code(row.name || '(standaard)') : row[key]));
        if (describe) cells.push(cell(row.description));
        return `| ${cells.join(' | ')} |`;
    });
    const rule = `|${header.map(() => '---').join('|')}|`;
    return [`### ${title}`, '', `| ${header.join(' | ')} |`, rule, ...lines].join('\n');
}

// Een opmerking uit de analyse van Storybook, bv. over een attribuut dat niet in de web-types staat.
function note({ type, name, element, text }) {
    return `- ${type}${name ? ` ${code(name)}` : ''}${element ? ` op ${element}` : ''}: ${text}`;
}

function getComponent(result) {
    const facts = [
        `Status: **${result.status}**`,
        `soort: ${result.category}`,
        result.page ? `pagina: ${code(result.page)} (${result.url})` : 'geen pagina in Storybook',
        result.metadata?.condition?.generation ? `generatie: ${result.metadata.condition.generation}` : null,
    ].filter(Boolean);
    const api = result.api
        ? [
              apiTable('Attributen', result.api.attributes, [
                  ['Naam', 'name'],
                  ['Type', 'type'],
                  ['Default', 'default'],
                  ['Deprecated', 'deprecated'],
              ]),
              apiTable('Properties', result.api.properties, [
                  ['Naam', 'name'],
                  ['Type', 'type'],
                  ['Default', 'default'],
                  ['Deprecated', 'deprecated'],
              ]),
              apiTable('Slots', result.api.slots, [['Naam', 'name']]),
              apiTable('Events', result.api.events, [
                  ['Naam', 'name'],
                  ['Type', 'type'],
              ]),
              result.api.notes?.length
                  ? `### Opmerkingen uit de analyse\n\n${result.api.notes.map(note).join('\n')}`
                  : null,
          ].filter(Boolean)
        : [];
    // Wat de web-types voor dit element niet geven; enkel in een antwoord uit één deel, anders kan het in een ander
    // deel staan.
    const absent =
        result.api && !result.parts
            ? Object.entries({ attributes: 'attributen', properties: 'properties', slots: 'slots', events: 'events' })
                  .filter(([key]) => result.api[key].length === 0)
                  .map(([, label]) => label)
            : [];
    if (absent.length > 0) api.unshift(`De web-types geven voor ${result.element} geen ${absent.join(', ')}.`);
    const examples = (result.examples ?? []).map((example) => {
        const parts = [`### ${example.name}\n\n${example.url}`];
        if (example.html) parts.push(fence('html', example.html));
        if (example.js) parts.push(fence('js', example.js));
        if (!example.html && !example.js) parts.push('_Geen voorbeeld: de pagina heeft nog geen analyse._');
        return parts.join('\n\n');
    });
    const history = (result.history ?? []).map((item) => {
        const lines = [`### ${item.version}`];
        if (item.entries.length > 0) lines.push(entries(item.entries, { version: false }));
        if (item.api) {
            const changes = ['added', 'removed', 'changed']
                .filter((kind) => item.api[kind])
                .map((kind) => elementChange(item.api[kind], kind));
            if (changes.length > 0) lines.push(`API:\n${changes.join('\n')}`);
        }
        return lines.join('\n\n');
    });
    const related = [
        result.related?.elements?.length
            ? `Elementen op dezelfde pagina: ${result.related.elements.join(', ')}.`
            : null,
        result.related?.pages?.length
            ? `Pagina's waarnaar ze verwijst: ${result.related.pages.map(code).join(', ')}.`
            : null,
    ].filter(Boolean);
    return join([
        `# ${result.element} (Flux ${result.version})`,
        warnings(result),
        `${facts.join(' · ')}.`,
        result.deprecated ? `**Deprecated:** ${result.deprecated === true ? 'ja' : result.deprecated}` : null,
        result.description,
        result.summary ? `Samenvatting: ${result.summary}` : null,
        api.length > 0 ? `## API\n\n${api.join('\n\n')}` : null,
        examples.length > 0 ? `## Voorbeelden\n\n${examples.join('\n\n')}` : null,
        result.docs ? `## Documentatie\n\n${result.docs.trim()}` : null,
        history.length > 0 ? `## Historiek\n\n${history.join('\n\n')}` : null,
        related.length > 0 ? `## Verwant\n\n${related.join('\n')}` : null,
        footer(result),
    ]);
}

function getGuidance(result) {
    if (result.markdown != null) {
        return join([warnings(result), result.markdown.trim(), footer(result)]);
    }
    const groups = new Map();
    for (const page of result.pages) {
        if (!groups.has(page.kind)) groups.set(page.kind, []);
        groups.get(page.kind).push(`- ${code(page.id)} — ${page.title}${page.summary ? `: ${page.summary}` : ''}`);
    }
    const hidden =
        result.hiddenFluxTeam > 0
            ? ` ${plural(result.hiddenFluxTeam, 'pagina', "pagina's")} over het werk van het Flux-team verborgen ` +
              "(kind: 'flux-team')."
            : '';
    return join([
        `# Gidsen, richtlijnen, patronen en recepten in Flux ${result.version}`,
        warnings(result),
        ...[...groups].map(([kind, lines]) => `## ${KIND_TITLES[kind] ?? kind}\n\n${lines.join('\n')}`),
        `${result.pages.length} van ${result.total} pagina's.${hidden} Haal een pagina op met id.`,
        footer(result),
    ]);
}

function getUpgrade(result) {
    const { resolved } = result;
    const chain = resolved.complete
        ? 'de keten is volledig'
        : `de keten is onvolledig: de catalogus mist ${resolved.missing?.version}`;
    const sections = [];
    for (const [impact, list] of Object.entries(result.changes)) {
        const general = result.general?.[impact] ?? [];
        if (list.length === 0 && general.length === 0) continue;
        const blocks = [`## ${IMPACT_TITLES[impact]}`];
        if (list.length > 0) blocks.push(entries(list));
        if (general.length > 0) blocks.push(`### Algemeen, voor elk project\n\n${entries(general)}`);
        sections.push(blocks.join('\n\n'));
    }
    const delta = result.apiDelta;
    if (delta) {
        const lines = [
            ...(delta.added ?? []).map((change) => elementChange(change, 'added')),
            ...(delta.removed ?? []).map((change) => elementChange(change, 'removed')),
            ...(delta.changed ?? []).map((change) => elementChange(change, 'changed')),
            ...(delta.descriptions ?? []).map((change) => elementChange(change, 'changed')),
        ];
        const title = `## API-wijzigingen in de web-types, netto van ${resolved.base} naar ${resolved.to}`;
        if (lines.length > 0) {
            sections.push(`${title}\n\n${lines.join('\n')}`);
        } else if (!result.parts) {
            const scope = result.components.length > 0 ? ' voor deze componenten' : '';
            sections.push(`${title}\n\nGeen${scope}: het contract in ${resolved.to} is dat van ${resolved.base}.`);
        }
    } else if (result.apiDeltaUnavailable) {
        sections.push(`## API-wijzigingen in de web-types\n\nNiet beschikbaar: ${result.apiDeltaUnavailable}`);
    }
    if (result.unexplained?.length > 0) {
        const labels = { added: 'nieuw', removed: 'verdwenen', changed: 'gewijzigd' };
        sections.push(
            '## Gewijzigd zonder changelog-entry\n\n' +
                result.unexplained.map((change) => `- ${change.element}: ${labels[change.change]}`).join('\n'),
        );
    }
    if (result.docs?.length > 0) {
        const labels = { added: 'nieuw', changed: 'gewijzigd', removed: 'verdwenen' };
        sections.push(
            '## Documentatie\n\n' +
                result.docs
                    .map((page) => `- ${labels[page.change]}: ${code(page.id)} — ${page.title} (${page.kind})`)
                    .join('\n'),
        );
    } else if (result.docsUnavailable) {
        sections.push(`## Documentatie\n\nNiet beschikbaar: ${result.docsUnavailable}`);
    } else if (!result.parts) {
        sections.push('## Documentatie\n\nGeen pagina kwam erbij, wijzigde of verdween.');
    }
    if (result.dependencies) {
        sections.push(`## Dependencies, netto van ${result.dependencies.base}\n\n${dependencies(result.dependencies)}`);
    } else if (result.dependenciesUnavailable) {
        sections.push(`## Dependencies\n\nNiet beschikbaar: ${result.dependenciesUnavailable}`);
    }
    if (result.unlistedCommits?.length > 0) {
        const commit = ({ version, sha, subject, url }) =>
            `- **${version}** ${code(sha.slice(0, 7))} ${subject} (${url})`;
        const list = result.unlistedCommits.map(commit).join('\n');
        sections.push(`## Commits die de packages raken zonder changelog-entry\n\n${list}`);
    }
    if (result.summaries?.length > 0) {
        const summary = (item) => `### ${item.version}\n\n${item.summary ?? '_Geen samenvatting._'}`;
        sections.push(`## Samenvatting per versie\n\n${result.summaries.map(summary).join('\n\n')}`);
    }
    const hidden = [
        result.hiddenNoImpact > 0
            ? `${plural(result.hiddenNoImpact, 'entry', 'entries')} zonder impact (impact 'none')`
            : null,
        result.hiddenDescriptions > 0
            ? `${plural(result.hiddenDescriptions, 'element', 'elementen')} waarvan enkel een beschrijving wijzigde ` +
              "(detail 'full')"
            : null,
    ].filter(Boolean);
    return join([
        `# Upgrade van Flux ${resolved.from} naar ${resolved.to}`,
        warnings(result),
        `Versies: ${resolved.versions.join(', ') || 'geen'}; ${chain}.` +
            (resolved.crossesMajor ? ' De upgrade gaat over een major heen.' : '') +
            (result.components.length > 0 ? ` Componenten: ${result.components.join(', ')}.` : ''),
        ...sections,
        sections.length === 0 ? 'Geen wijzigingen in dit deel.' : null,
        hidden.length > 0 ? `Verborgen: ${hidden.join('; ')}.` : null,
        footer(result),
    ]);
}

function findChanges(result) {
    const items = result.results.map((entry) => {
        const facts = [entry.ticket, code(entry.id), entry.type, entry.impact, entry.components.join(', ')];
        const lines = [`- **${entry.version}** · ${facts.filter(Boolean).join(' · ')} — ${entry.summary}`];
        if (entry.explanation) lines.push(`  - Uitleg: ${entry.explanation}`);
        if (entry.action) lines.push(`  - Actie: ${entry.action}`);
        return lines.join('\n');
    });
    const coverage = `De catalogus gaat van ${result.coverage.oldest} tot en met ${result.coverage.newest}.`;
    const hidden =
        result.hiddenNoImpact > 0
            ? ` ${plural(result.hiddenNoImpact, 'entry', 'entries')} zonder impact verborgen.`
            : '';
    return join([
        `# Wijzigingen voor "${result.query}"`,
        warnings(result),
        items.length > 0 ? items.join('\n') : 'Niets gevonden.',
        `${result.results.length} van ${result.total}.${hidden} ${coverage}`,
        footer(result),
    ]);
}

const RENDERERS = {
    flux_list_versions: listVersions,
    flux_search_docs: searchDocs,
    flux_get_component: getComponent,
    flux_get_guidance: getGuidance,
    flux_get_upgrade: getUpgrade,
    flux_find_changes: findChanges,
};

export function render(tool, result) {
    return RENDERERS[tool](result);
}

// ---------------------------------------------------------------------------------------------------------------
// Resources.

// De changelog van één versie, met de analyse: per impact de entries met hun actie, uitleg en voorbeeld.
export function renderChangelog(release, { warning = null } = {}) {
    const sections = ['action', 'opt-in', 'automatic', 'none']
        .map((impact) => [impact, release.entries.filter((entry) => entry.impact === impact)])
        .filter(([, list]) => list.length > 0)
        .map(
            ([impact, list]) =>
                `## ${IMPACT_TITLES[impact]}\n\n${entries(
                    list.map((entry) => ({ ...entry, version: release.version })),
                    { version: false },
                )}`,
        );
    const diff = release.webTypesDiff;
    const api = diff
        ? [
              ...diff.added.map((change) => elementChange(change, 'added')),
              ...diff.removed.map((change) => elementChange(change, 'removed')),
              ...diff.changed.map((change) => elementChange(withoutDescription(change), 'changed')),
          ]
        : [];
    return join([
        `# Flux ${release.version}${release.date ? ` (${release.date})` : ''}`,
        warning ? `> **Let op:** ${warning}` : null,
        release.previous ? `Vorige versie: ${release.previous}.` : null,
        release.summary,
        ...sections,
        api.length > 0
            ? `## API-wijzigingen in de web-types, tegenover ${release.previous}\n\n${api.join('\n')}`
            : null,
        release.dependenciesDiff
            ? `## Dependencies, tegenover ${release.previous}\n\n${dependencies(release.dependenciesDiff)}`
            : null,
    ]);
}

const withoutDescription = ({ description, ...rest }) => rest;

// De index van de pagina's van een versie, per soort.
export function renderDocsIndex(version, pages, { warning = null } = {}) {
    const groups = new Map();
    for (const page of pages) {
        if (!groups.has(page.kind)) groups.set(page.kind, []);
        groups.get(page.kind).push(`- ${code(page.id)} — ${page.title}${page.summary ? `: ${page.summary}` : ''}`);
    }
    return join([
        `# De documentatie van Flux ${version}`,
        warning ? `> **Let op:** ${warning}` : null,
        `Elke pagina staat als flux://${version}/docs/{id}.`,
        ...[...groups].map(([kind, lines]) => `## ${KIND_TITLES[kind] ?? kind}\n\n${lines.join('\n')}`),
    ]);
}
