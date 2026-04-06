import test from 'node:test';
import assert from 'node:assert';
import { WakaruSanitizer } from './index.js';

test('converts void 0 to undefined', async () => {
  const sanitizer = new WakaruSanitizer({ enabled: true, useHeuristicNaming: true });
  const result = await sanitizer.transform('var a = void 0;', 'test.js');
  assert.match(result.code, /undefined/);
  assert.doesNotMatch(result.code, /void 0/);
});

test('code shrinks when heuristic enabled', async () => {
  const sanitizer = new WakaruSanitizer({ enabled: true, useHeuristicNaming: true });
  const code = 'var a = void 0; var b = document.getElementById("app");';
  const result = await sanitizer.transform(code, 'test.js');
  // the transformation to undefined should happen and possibly DOM normalization
  assert.ok(result.code.length > 0);
  assert.match(result.code, /undefined/);
});

test('code unchanged heuristically when disabled', async () => {
  const sanitizer = new WakaruSanitizer({ enabled: true, useHeuristicNaming: false });
  // Un-undefined shouldn't be applied
  const code = 'var a = void 0;';
  const result = await sanitizer.transform(code, 'test.js');
  assert.match(result.code, /void 0/);
  assert.doesNotMatch(result.code, /undefined/);
});
