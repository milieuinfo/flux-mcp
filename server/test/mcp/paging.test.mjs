import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { CatalogError } from '../../src/catalog.mjs';
import { paginate, splitText } from '../../src/mcp/paging.mjs';

describe('splitText', () => {
    test('splitst op lege regels, zonder iets te verliezen', () => {
        const text = '# Titel\n\nEen alinea.\n\n\nNog een.\n';
        const chunks = splitText(text);
        assert.equal(chunks.join(''), text);
        assert.deepEqual(chunks, ['# Titel\n\n', 'Een alinea.\n\n', '\nNog een.\n']);
    });

    test('splitst niet in een codeblok', () => {
        const text = 'Voor.\n\n```html\n<a>\n\n<b>\n```\n\nNa.\n';
        const chunks = splitText(text);
        assert.equal(chunks.join(''), text);
        assert.deepEqual(chunks, ['Voor.\n\n', '```html\n<a>\n\n<b>\n```\n\n', 'Na.\n']);
    });

    test('een langere fence sluit pas met een even lange', () => {
        const text = '````md\n```\n\n```\n````\n\nNa.\n';
        assert.deepEqual(splitText(text), ['````md\n```\n\n```\n````\n\n', 'Na.\n']);
    });
});

describe('paginate', () => {
    const result = {
        version: '2.20.0',
        items: Array.from({ length: 30 }, (_, index) => ({ index, text: 'x'.repeat(50) })),
        markdown: Array.from({ length: 10 }, (_, index) => `Alinea ${index} ${'y'.repeat(80)}\n\n`).join(''),
        sources: [],
    };
    const options = {
        tool: 'flux_test',
        args: { version: '2.20.0' },
        sections: [['items'], { path: ['markdown'], text: true }],
    };

    test('past alles in één deel, dan blijft het antwoord zoals het is', () => {
        assert.equal(paginate(result, options), result);
    });

    test('anders delen onder de grens, met part, parts en nextCursor', () => {
        const budget = 1200;
        const parts = [];
        let cursor = null;
        do {
            const part = paginate(result, { ...options, budget, cursor });
            assert.ok(JSON.stringify(part).length <= budget, `deel ${part.part} is ${JSON.stringify(part).length}`);
            parts.push(part);
            cursor = part.nextCursor ?? null;
        } while (cursor);
        assert.ok(parts.length > 2);
        assert.ok(parts.every((part) => part.parts === parts.length && part.version === '2.20.0'));
        assert.deepEqual(
            parts.map((part) => part.part),
            parts.map((_, index) => index + 1),
        );
        assert.equal(parts.at(-1).nextCursor, undefined);
        assert.deepEqual(
            parts.flatMap((part) => part.items),
            result.items,
        );
        assert.equal(parts.map((part) => part.markdown).join(''), result.markdown);
    });

    test('een cursor met andere argumenten, van een andere tool of onleesbaar, is een fout', () => {
        const budget = 1200;
        const { nextCursor } = paginate(result, { ...options, budget });
        const other = { ...options, budget, cursor: nextCursor };
        assert.throws(() => paginate(result, { ...other, args: { version: '2.19.0' } }), /andere vraag/);
        assert.throws(() => paginate(result, { ...other, tool: 'flux_ander' }), /andere vraag/);
        assert.throws(() => paginate(result, { ...other, cursor: '%%%' }), CatalogError);
        assert.equal(
            paginate(result, { ...other, args: { cursor: 'x', version: '2.20.0' } }).part,
            2,
            'cursor telt niet',
        );
    });
});
