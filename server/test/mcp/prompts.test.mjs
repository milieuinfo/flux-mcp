import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createCatalog } from '../../src/catalog.mjs';
import { createDocs } from '../../src/docs.mjs';
import { loadRecipes, parseRecipe, renderRecipe } from '../../src/mcp/prompts.mjs';
import { createTools } from '../../src/mcp/tools.mjs';

// Controle 5 uit ADR-004 (sectie 9): de recepten in server/prompts noemen enkel tools en sjablonen die er zijn, en
// gebruiken enkel de argumenten die ze declareren. De frontmatter controleert parseRecipe al bij het laden.
const recipes = loadRecipes();
const catalog = createCatalog();
const tools = new Set(
    createTools({ catalog, docs: createDocs(undefined, { catalog }), catalogVersion: 'x' }).tools.map(
        (tool) => tool.name,
    ),
);

describe('de recepten in server/prompts', () => {
    test('migreren, design-naar-code, valideren, verbeteren, review en uitbreiden', () => {
        assert.deepEqual(
            [...recipes.keys()],
            ['design-naar-code', 'migreren', 'review', 'uitbreiden', 'valideren', 'verbeteren'],
        );
    });

    for (const recipe of recipes.values()) {
        test(`${recipe.name}: enkel tools die er zijn, en het eigen sjabloon`, () => {
            const named = [...new Set(recipe.body.match(/flux_[a-z_]+/g) ?? [])];
            assert.ok(named.length > 0);
            for (const name of named) assert.ok(tools.has(name), `${recipe.name} noemt ${name}`);
            const templates = [...new Set(recipe.body.match(/flux:\/\/templates\/[a-z-]+/g) ?? [])];
            assert.deepEqual(templates, [`flux://templates/${recipe.template}`]);
            assert.match(recipe.templateText, new RegExp(`^---\\nworkflow: ${recipe.template}\\n`));
        });

        test(`${recipe.name}: het stramien van ADR-004 (6.3), met checkpoint, verificatie en rapport`, () => {
            for (const step of ['Voorwaarden', 'Checkpoint', 'Verificatie', 'Rapport', 'Proces']) {
                assert.match(recipe.body, new RegExp(`^## \\d+\\. ${step}$`, 'm'), `${recipe.name} mist ${step}`);
            }
            // review schrijft geen bestand in de branch die het beoordeelt, maar geeft het rapport in zijn antwoord
            // (ADR-004, 6.4); de andere recepten schrijven het naar .flux/rapporten/.
            if (recipe.name === 'review') {
                assert.match(recipe.body, /`~~~markdown`/);
                assert.doesNotMatch(recipe.body, /\.flux\/rapporten\//);
            } else {
                assert.match(recipe.body, new RegExp(`\\.flux/rapporten/<datum>-${recipe.name}\\.md`));
            }
            assert.match(recipe.description, /Aanbevolen: /, 'een aanbevolen model en effort');
        });
    }
});

describe('parseRecipe', () => {
    const recipe = (front, body = 'Doe {{doel}}.\n') => `---\n${front}\n---\n${body}`;
    const valid = [
        'name: voorbeeld',
        'title: Een voorbeeld',
        'description: >',
        '  Een lange',
        '  beschrijving.',
        'arguments:',
        '  - name: doel',
        '    description: Het doel.',
        '    required: false',
        '    default: iets',
        'template: voorbeeld',
    ].join('\n');

    test('de frontmatter, met een gevouwen tekst en de argumenten', () => {
        const parsed = parseRecipe(recipe(valid));
        assert.equal(parsed.description, 'Een lange beschrijving.');
        assert.deepEqual(parsed.arguments, [
            { name: 'doel', description: 'Het doel.', required: false, default: 'iets' },
        ]);
        assert.equal(renderRecipe(parsed), 'Doe iets.\n');
        assert.equal(renderRecipe(parsed, { doel: 'dat' }), 'Doe dat.\n');
    });

    test('een argument dat niet gebruikt wordt, of een placeholder zonder argument, is een fout', () => {
        assert.throws(() => parseRecipe(recipe(valid, 'Doe niets.\n')), /argument 'doel' staat niet in de tekst/);
        assert.throws(
            () => parseRecipe(recipe(valid, 'Doe {{doel}} en {{ander}}.\n')),
            /\{\{ander\}\} staat in de tekst/,
        );
        assert.throws(
            () => parseRecipe(recipe(valid.replace('template: voorbeeld', 'sjabloon: x'))),
            /onbekende sleutel 'sjabloon'/,
        );
        assert.throws(() => parseRecipe('Geen frontmatter.'), /geen frontmatter/);
    });
});
