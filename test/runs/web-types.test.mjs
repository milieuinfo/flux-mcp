import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { setup, workspace } from '../helpers/runs.mjs';

let context;
before(async () => (context = await setup()));
after(() => context.close());

describe('flux:web-types:copy', () => {
    test('kopieert de web-types van de tag plat, met de versie ingevuld', async () => {
        const ws = workspace(context);
        const { code, stdout } = await ws.run('flux:web-types:copy', ['v1.1.0']);
        assert.equal(code, 0);
        assert.match(stdout, /1 web-types/);
        assert.deepEqual(ws.list('catalog/flux/1.1.0/web-types'), ['atom.web-types.json']);
        const knop = ws.json('catalog/flux/1.1.0/web-types/atom.web-types.json').contributions.html.elements[0];
        const storybook = 'https://flux.omgeving.vlaanderen.be/release-v1/1.1.0/storybook/';
        assert.equal(knop['doc-url'], `${storybook}?path=/docs/components-atom-knop--documentatie`);
        assert.deepEqual(knop.attributes.map((attribute) => attribute.name), ['ghost', 'size']);
        ws.remove();
    });

    test('vervangt enkel web-types/ en laat de rest van de versiemap staan', async () => {
        const ws = workspace(context);
        ws.write('catalog/flux/1.0.0/web-types/oud.web-types.json', '{}');
        ws.write('catalog/flux/1.0.0/changelog/changelog.md', '# 1.0.0\n');
        assert.equal((await ws.run('flux:web-types:copy', ['1.0.0'])).code, 0);
        assert.deepEqual(ws.list('catalog/flux/1.0.0/web-types'), ['atom.web-types.json']);
        assert.equal(ws.read('catalog/flux/1.0.0/changelog/changelog.md'), '# 1.0.0\n');
        ws.remove();
    });

    test('een ongeldige versie of een onbekende tag faalt, en de catalogus blijft ongemoeid', async () => {
        const ws = workspace(context);
        const invalid = await ws.run('flux:web-types:copy', ['1.1']);
        assert.equal(invalid.code, 1);
        assert.match(invalid.stderr, /Ongeldige versie: 1\.1/);
        assert.notEqual((await ws.run('flux:web-types:copy', ['9.9.9'])).code, 0);
        assert.deepEqual(ws.list('catalog/flux'), []);
        ws.remove();
    });
});
