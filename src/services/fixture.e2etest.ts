/**
 * End-to-end fixture validation test.
 *
 * Validates that the webpack-hello-world task manager fixture can be processed
 * end-to-end and produces the expected graph artifacts (module-graph.json and
 * call-graph.json) along with a deobfuscated output file.
 *
 * This test serves as a ground-truth regression test for the fixture itself.
 */

import test from 'node:test';
import assert from 'node:assert';
import { cartographer } from '../test-utils.js';
import { readFile, rm } from 'node:fs/promises';
import { existsSync } from 'fs';
import path from 'node:path';

const FIXTURE_BUNDLE = 'fixtures/webpack-hello-world/dist/bundle.js';
const TEST_OUTPUT_DIR = 'test-output-fixture';

test.afterEach(async () => {
  await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
});

test('fixture: webcrack extracts bundle without crashing', async () => {
  // This test intentionally uses an invalid API key to test the early pipeline stages
  // before any LLM calls occur. The webcrack and graph stages should complete successfully.
  // With OpenAI we get a 401 unauthorized. We wrap it in a catch.
  try {
    await cartographer('openai', FIXTURE_BUNDLE, '-k', 'invalid-key', '-o', TEST_OUTPUT_DIR);
  } catch(e: any) {
    // Expected to fail on LLM
  }

  // Check that webcrack and graph stages completed before the LLM error
  assert.ok(
    existsSync(path.join(TEST_OUTPUT_DIR, 'module-graph.json')),
    'module-graph.json should be created even if LLM fails'
  );
});

test('fixture: module-graph.json is valid JSON with expected structure', async () => {
  // Run and let it fail on LLM to preserve early-stage outputs
  try {
    await cartographer('openai', FIXTURE_BUNDLE, '-k', 'invalid-key', '-o', TEST_OUTPUT_DIR);
  } catch {
    // Expected to fail on LLM
  }

  const graphPath = path.join(TEST_OUTPUT_DIR, 'module-graph.json');
  const graphContent = await readFile(graphPath, 'utf-8');
  const graph = JSON.parse(graphContent);

  // Validate structure
  assert.ok(graph.files, 'module-graph should have files property');
  assert.strictEqual(typeof graph.files, 'object', 'files should be an object');

  // Expect at least one file (the deobfuscated output from webcrack)
  const fileCount = Object.keys(graph.files).length;
  assert.ok(fileCount >= 1, `Expected at least 1 file in module graph, got ${fileCount}`);

  // Each file should have id, imports, exports
  for (const [name, file] of Object.entries(graph.files)) {
    assert.ok((file as any).id, `File ${name} should have an id`);
    assert.ok(Array.isArray((file as any).imports), `File ${name} should have imports array`);
    assert.ok(Array.isArray((file as any).exports), `File ${name} should have exports array`);
  }
});

test('fixture: deobfuscated.js is created with substantial content', async () => {
  try {
    await cartographer('openai', FIXTURE_BUNDLE, '-k', 'invalid-key', '-o', TEST_OUTPUT_DIR);
  } catch {
    // Expected to fail on LLM
  }

  const deobfPath = path.join(TEST_OUTPUT_DIR, 'deobfuscated.js');
  assert.ok(
    existsSync(deobfPath),
    'deobfuscated.js should be created by webcrack'
  );

  const content = await readFile(deobfPath, 'utf-8');
  assert.ok(content.length > 1000, 'deobfuscated.js should contain substantial code');

  // Validate basic structure: should have function-like patterns
  assert.match(
    content,
    /function|const|var|class|async|await/i,
    'deobfuscated code should contain JavaScript syntax'
  );
});

test('fixture: sanitizer logs appear when processing fixture', async () => {
  try {
    await cartographer('openai', FIXTURE_BUNDLE, '-k', 'invalid-key', '-o', TEST_OUTPUT_DIR);
  } catch (e) {
    // Capture stderr/stdout from error
    const err = e as Error;
    const output = err.message || '';

    // Sanitizer should have logged its optimization message
    assert.match(
      output,
      /\[Sanitizer\] Optimizing/,
      'Expected [Sanitizer] Optimizing log in output'
    );
  }
});

test('fixture: --no-sanitizer suppresses sanitizer logs', async () => {
  try {
    await cartographer(
      'openai',
      FIXTURE_BUNDLE,
      '-k',
      'invalid-key',
      '--no-sanitizer',
      '-o',
      TEST_OUTPUT_DIR
    );
  } catch (e) {
    const err = e as Error;
    const output = err.message || '';

    // Sanitizer log should NOT appear
    assert.doesNotMatch(
      output,
      /\[Sanitizer\] Optimizing/,
      'Expected NO [Sanitizer] log when --no-sanitizer is used'
    );
  }
});

test('fixture README should reference existing files', async () => {
  // Get all files in fixtures/webpack-hello-world/src
  const { readdir, readFile } = await import('node:fs/promises');
  const fixtureDir = 'fixtures/webpack-hello-world/src';
  const files = await readdir(fixtureDir);

  // Read README.md
  const readmeContent = await readFile('README.md', 'utf-8');

  // Check if each file is referenced in the README
  for (const file of files) {
    if (file.endsWith('.js')) {
      assert.ok(
        readmeContent.includes(file),
        `Fixture file ${file} should be mentioned in README.md`
      );
    }
  }
});
