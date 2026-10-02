import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { validate } from '../../src/mcp/schema.mjs';

const schema = {
    type: 'object',
    required: ['version'],
    additionalProperties: false,
    properties: {
        version: { type: 'string', maxLength: 10 },
        detail: { type: 'string', enum: ['summary', 'full'] },
        limit: { type: 'integer', minimum: 1, maximum: 50 },
        sections: { type: 'array', maxItems: 2, items: { type: 'string', enum: ['api', 'docs'] } },
        note: { type: ['string', 'null'] },
    },
};

describe('validate', () => {
    test('een geldige waarde geeft geen problemen', () => {
        assert.deepEqual(
            validate(schema, { version: '2.20.0', detail: 'full', limit: 5, sections: ['api'], note: null }),
            [],
        );
    });

    test('elk probleem met waar het zit, in het Nederlands', () => {
        assert.deepEqual(validate(schema, { detail: 'kort', limit: 0, extra: 1 }, 'arguments'), [
            "arguments mist 'version'.",
            'arguments.detail moet een van "summary", "full" zijn, niet "kort".',
            'arguments.limit moet minstens 1 zijn.',
            "arguments kent 'extra' niet. Gekend: version, detail, limit, sections, note.",
        ]);
        assert.deepEqual(validate(schema, { version: '2.20.0', sections: ['api', 'x', 'docs'] }), [
            'de invoer.sections mag hoogstens 2 elementen hebben, niet 3.',
            'de invoer.sections[1] moet een van "api", "docs" zijn, niet "x".',
        ]);
    });

    test('type, ook een lijst van types, en geen geheel getal', () => {
        assert.deepEqual(validate(schema, null), ['de invoer moet van het type object zijn, niet null.']);
        assert.deepEqual(validate(schema, { version: '2.20.0', note: 3 }), [
            'de invoer.note moet van het type string of null zijn, niet 3.',
        ]);
        assert.deepEqual(validate(schema, { version: '2.20.0', limit: 2.5 }), [
            'de invoer.limit moet van het type integer zijn, niet 2.5.',
        ]);
    });
});
