import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';
import { diffPackages, loadPackages, packageFacts } from '../src/packages.mjs';

const CATALOG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../catalog/flux');

const packages = (version, list) => new Map(list.map(([name, fields]) => [name, { name, version, ...fields }]));

describe('packageFacts', () => {
    test('enkel naam, versie en dependencies, alfabetisch, zonder tijdstempels', () => {
        const facts = packageFacts({
            name: '@domg-wc/map',
            version: '2.20.0',
            lastModified: 1789749267317,
            dist: { shasum: 'abc' },
            dependencies: { ol: '8.2.0', lit: '3.1.0' },
            peerDependencies: {},
        });
        assert.deepEqual(facts, {
            name: '@domg-wc/map',
            version: '2.20.0',
            dependencies: { lit: '3.1.0', ol: '8.2.0' },
        });
        assert.deepEqual(Object.keys(facts.dependencies), ['lit', 'ol']);
    });
});

describe('loadPackages', () => {
    test('de gepubliceerde packages van een versie', () => {
        const loaded = loadPackages(CATALOG_DIR, '2.20.0');
        assert.deepEqual(
            [...loaded.keys()],
            ['@domg-wc/common', '@domg-wc/components', '@domg-wc/map', '@domg-wc/styles'],
        );
        assert.equal(loaded.get('@domg-wc/map').dependencies['@domg-wc/components'], '2.20.0');
    });

    test('null als de versie geen packages heeft', () => {
        assert.equal(loadPackages(CATALOG_DIR, '0.0.1'), null);
    });

    test('2.19.0 → 2.20.0: geen gewijzigde dependencies', () => {
        assert.deepEqual(diffPackages(loadPackages(CATALOG_DIR, '2.19.0'), loadPackages(CATALOG_DIR, '2.20.0')), {
            added: [],
            removed: [],
            changed: [],
        });
    });
});

describe('diffPackages', () => {
    test('toegevoegd, verwijderd en gewijzigd, per soort dependency', () => {
        const before = packages('2.19.0', [
            ['@domg-wc/map', { dependencies: { ol: '8.2.0', proj4: '2.10.0' }, peerDependencies: { lit: '^3.0.0' } }],
        ]);
        const after = packages('2.20.0', [
            ['@domg-wc/map', { dependencies: { ol: '9.0.0', jsts: '2.11.0' }, peerDependencies: { lit: '^3.0.0' } }],
        ]);
        assert.deepEqual(diffPackages(before, after).changed, [
            {
                package: '@domg-wc/map',
                dependencies: {
                    added: [{ name: 'jsts', version: '2.11.0' }],
                    removed: [{ name: 'proj4', version: '2.10.0' }],
                    changed: [{ name: 'ol', before: '8.2.0', after: '9.0.0' }],
                },
            },
        ]);
    });

    test('een dependency op een package van dezelfde release telt niet', () => {
        const before = packages('2.19.0', [['@domg-wc/map', { dependencies: { '@domg-wc/common': '2.19.0' } }]]);
        const after = packages('2.20.0', [['@domg-wc/map', { dependencies: { '@domg-wc/common': '2.20.0' } }]]);
        assert.deepEqual(diffPackages(before, after).changed, []);
    });

    test('een dependency op een package van een andere release telt wel', () => {
        const before = packages('2.19.0', [['@domg-wc/map', { dependencies: { '@domg-wc/common': '2.19.0' } }]]);
        const after = packages('2.20.0', [['@domg-wc/map', { dependencies: { '@domg-wc/common': '2.19.1' } }]]);
        assert.deepEqual(diffPackages(before, after).changed, [
            {
                package: '@domg-wc/map',
                dependencies: {
                    added: [],
                    removed: [],
                    changed: [{ name: '@domg-wc/common', before: '2.19.0', after: '2.19.1' }],
                },
            },
        ]);
    });

    test('nieuwe en verdwenen packages', () => {
        const before = packages('2.19.0', [['@domg-wc/oud', {}]]);
        const after = packages('2.20.0', [['@domg-wc/nieuw', {}]]);
        assert.deepEqual(diffPackages(before, after), {
            added: ['@domg-wc/nieuw'],
            removed: ['@domg-wc/oud'],
            changed: [],
        });
    });
});
