import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { VERSION } from '../resources/common.mjs';

describe('VERSION', () => {
    test('een release of een prerelease, zonder v vooraan', () => {
        for (const version of ['2.20.0', '2.10.1', '2.21.0-develop-v2.1', '3.0.0-beta.1']) {
            assert.ok(VERSION.test(version), version);
        }
    });

    test('geen onvolledige of vreemde versie', () => {
        for (const version of ['v2.20.0', '2.20', '2.20.0.1', '2.20.0-', 'abc', '']) {
            assert.ok(!VERSION.test(version), version);
        }
    });
});
