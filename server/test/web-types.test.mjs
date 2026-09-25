import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';
import { diffWebTypes, loadWebTypes } from '../src/web-types.mjs';

const CATALOG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../catalog/flux');

const types = (elements) => new Map(elements.map(([name, category, element]) => [name, { category, element: { name, ...element } }]));

describe('loadWebTypes', () => {
    test('elementen met hun soort uit de bestandsnaam', () => {
        const webTypes = loadWebTypes(CATALOG_DIR, '2.20.0');
        assert.equal(webTypes.get('vl-alert').category, 'block');
        assert.equal(webTypes.get('vl-button').category, 'atom');
        assert.equal(webTypes.get('vl-upload').category, 'form');
    });

    test('null als de versie geen web-types heeft', () => {
        assert.equal(loadWebTypes(CATALOG_DIR, '0.0.1'), null);
    });
});

describe('diffWebTypes op de catalogus: 2.19.0 → 2.20.0', () => {
    const before = loadWebTypes(CATALOG_DIR, '2.19.0');
    const after = loadWebTypes(CATALOG_DIR, '2.20.0');
    const diff = diffWebTypes(before, after, { mentioned: new Set(['vl-alert']) });
    const changed = (name) => diff.changed.find((item) => item.element === name);

    test('banner op vl-alert, vermeld in de changelog', () => {
        assert.equal(changed('vl-alert').inChangelog, true);
        assert.deepEqual(
            changed('vl-alert').attributes.added.map((a) => a.name),
            ['banner'],
        );
    });

    test('blur-validation als gewijzigde beschrijving, niet vermeld in de changelog', () => {
        const checkbox = changed('vl-checkbox');
        assert.equal(checkbox.inChangelog, false);
        assert.equal(checkbox.attributes.changed[0].name, 'blur-validation');
        assert.match(checkbox.attributes.changed[0].description, /Valideert het veld/);
    });

    test('doc-url telt niet mee: enkel de echt gewijzigde elementen', () => {
        assert.deepEqual(
            diff.changed.map((item) => item.element),
            [
                'vl-alert',
                'vl-cascader-item',
                'vl-checkbox',
                'vl-datepicker',
                'vl-input-field',
                'vl-input-field-masked',
                'vl-radio-group',
                'vl-select',
                'vl-select-location',
                'vl-select-rich',
                'vl-textarea',
                'vl-textarea-rich',
                'vl-upload',
            ],
        );
        assert.deepEqual(diff.added, []);
        assert.deepEqual(diff.removed, []);
    });
});

describe('diffWebTypes', () => {
    test('onderdelen zonder naam matchen op hun beschrijving', () => {
        const slots = [{ description: 'Slot voor de titel.' }, { description: 'Slot voor de header.' }];
        const before = types([['vl-wizard', 'block', { slots }]]);
        const after = types([['vl-wizard', 'block', { slots: [...slots, { description: 'Slot voor de footer.' }] }]]);
        const diff = diffWebTypes(before, after);
        assert.deepEqual(diff.changed[0].slots.added, [{ description: 'Slot voor de footer.' }]);
        assert.deepEqual(diff.changed[0].slots.removed, []);
    });

    test('type en default met oud en nieuw; events en properties uit js', () => {
        const before = types([
            [
                'vl-x',
                'block',
                {
                    attributes: [{ name: 'size', value: { kind: 'plain', type: "'s' | 'm'" }, default: 's' }],
                    js: { events: [{ name: 'vl-x-open' }], properties: [{ name: 'items', type: 'Item[]' }] },
                },
            ],
        ]);
        const after = types([
            [
                'vl-x',
                'block',
                {
                    attributes: [{ name: 'size', value: { kind: 'plain', type: "'s' | 'm' | 'l'" }, default: 'm' }],
                    js: { events: [], properties: [{ name: 'items', type: 'Item[]' }, { name: 'itemTemplate', type: 'Function' }] },
                    deprecated: 'Gebruik vl-y.',
                },
            ],
        ]);
        const [change] = diffWebTypes(before, after).changed;
        assert.deepEqual(change.attributes.changed, [
            { name: 'size', type: { before: "'s' | 'm'", after: "'s' | 'm' | 'l'" }, default: { before: 's', after: 'm' } },
        ]);
        assert.deepEqual(change.events.removed, [{ name: 'vl-x-open' }]);
        assert.deepEqual(change.properties.added, [{ name: 'itemTemplate', type: 'Function' }]);
        assert.deepEqual(change.deprecated, { before: null, after: 'Gebruik vl-y.' });
    });

    test('nieuwe en verdwenen elementen', () => {
        const before = types([['vl-oud', 'block', { description: 'Oud' }]]);
        const after = types([['vl-nieuw', 'form', { description: 'Nieuw', 'doc-url': 'https://storybook/nieuw' }]]);
        const diff = diffWebTypes(before, after, { mentioned: new Set(['vl-nieuw']) });
        assert.deepEqual(diff.added, [
            { element: 'vl-nieuw', category: 'form', inChangelog: true, description: 'Nieuw', docUrl: 'https://storybook/nieuw' },
        ]);
        assert.deepEqual(
            diff.removed.map((item) => [item.element, item.inChangelog]),
            [['vl-oud', false]],
        );
    });
});
