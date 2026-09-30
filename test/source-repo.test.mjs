import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { releasesFromLog } from '../resources/flux/source-repo.mjs';

describe('releasesFromLog', () => {
    test('de release-commits van één major, oplopend en elk één keer', () => {
        const subjects = [
            'chore(release): 2.10.0 [skip ci]',
            'feat: FLUX-809 - vl-alert - banner variant',
            'chore(release): 2.9.0 [skip ci]',
            'chore(release): 2.8.1',
            'chore(release): 1.48.2 [skip ci]',
            'chore(release): 2.9.0 [skip ci]',
            '',
        ];
        assert.deepEqual(releasesFromLog(subjects, 2), ['2.8.1', '2.9.0', '2.10.0']);
    });

    test('enkel een onderwerp dat met de release begint, met een volledige versie', () => {
        const subjects = [
            'revert: chore(release): 2.4.0',
            'chore(release): 2.4.0-beta.1',
            'chore(release): 2.4',
            'chore: FLUX-717 - figma mcp',
        ];
        assert.deepEqual(releasesFromLog(subjects, 2), []);
    });
});
