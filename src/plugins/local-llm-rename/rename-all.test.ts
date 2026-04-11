/**
 * Integration tests for --rename-all flag behavior.
 *
 * Tests that:
 * 1. By default (renameAll=false), descriptive identifiers are skipped
 * 2. With renameAll=true, all identifiers are sent to the LLM
 * 3. The filter is properly bypassed when renameAll is enabled
 */

import test from 'node:test';
import assert from 'node:assert';
import { visitAllIdentifiers } from './visit-all-identifiers.js';

test('visitAllIdentifiers: skips descriptive names by default (renameAll=false)', async () => {
  const code = `
    const fetchUserData = function(x) {
      const a = x + 1;
      return a;
    };
  `.trim();

  const renamedIdentifiers: string[] = [];

  await visitAllIdentifiers(
    code,
    async (name) => {
      renamedIdentifiers.push(name);
      return name + '_renamed';
    },
    200,
    undefined,
    false // renameAll=false (filter enabled)
  );

  // 'fetchUserData' is descriptive (long camelCase with vowels) - should be skipped
  // 'a' and 'x' are single-char - should both be sent to LLM
  const sent = renamedIdentifiers.sort();
  assert.ok(
    sent.includes('a'),
    'Single-char name a should be sent with filter enabled'
  );
  assert.ok(
    sent.includes('x'),
    'Single-char name x should be sent with filter enabled'
  );
  assert.ok(
    !sent.includes('fetchUserData'),
    'Descriptive name fetchUserData should be skipped with filter enabled'
  );
});

test('visitAllIdentifiers: sends all names when renameAll=true', async () => {
  const code = `
    const fetchUserData = function(id) {
      const a = id + 1;
      return a;
    };
  `.trim();

  const renamedIdentifiers: string[] = [];

  await visitAllIdentifiers(
    code,
    async (name) => {
      renamedIdentifiers.push(name);
      return name + '_renamed';
    },
    200,
    undefined,
    true // renameAll=true (filter disabled)
  );

  // Both 'fetchUserData' and 'a' should be sent to LLM when renameAll=true
  assert.ok(
    renamedIdentifiers.includes('fetchUserData'),
    'renameAll=true should send descriptive names'
  );
  assert.ok(
    renamedIdentifiers.includes('a'),
    'renameAll=true should send single-char names'
  );
});

test('visitAllIdentifiers: respects filter for webpack internals with filter enabled', async () => {
  const code = `
    const __webpack_require__ = function() {
      const a = 1;
    };
  `.trim();

  const renamedIdentifiers: string[] = [];

  await visitAllIdentifiers(
    code,
    async (name) => {
      renamedIdentifiers.push(name);
      return name + '_renamed';
    },
    200,
    undefined,
    false // filter enabled
  );

  // __webpack_require__ is a webpack internal - should be skipped
  // a is single-char - should be sent
  assert.ok(
    !renamedIdentifiers.includes('__webpack_require__'),
    'Webpack internals should be skipped even with renameAll=false'
  );
  assert.ok(
    renamedIdentifiers.includes('a'),
    'Single-char names should still be sent'
  );
});

test('visitAllIdentifiers: sends webpack internals with renameAll=true', async () => {
  const code = `
    const __webpack_require__ = function() {
      const a = 1;
    };
  `.trim();

  const renamedIdentifiers: string[] = [];

  await visitAllIdentifiers(
    code,
    async (name) => {
      renamedIdentifiers.push(name);
      return name + '_renamed';
    },
    200,
    undefined,
    true // renameAll=true
  );

  // With renameAll=true, even webpack internals should be sent
  assert.ok(
    renamedIdentifiers.includes('__webpack_require__'),
    'renameAll=true should send webpack internals'
  );
});
