import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { storybookBase } from '../src/storybook-url.mjs';

describe('storybookBase', () => {
    test('onder de major van de versie', () => {
        assert.equal(storybookBase('2.20.0'), 'https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/');
        assert.equal(storybookBase('3.1.0'), 'https://flux.omgeving.vlaanderen.be/release-v3/3.1.0/storybook/');
        assert.equal(
            storybookBase('2.21.0-develop-v2.1'),
            'https://flux.omgeving.vlaanderen.be/release-v2/2.21.0-develop-v2.1/storybook/'
        );
    });
});
