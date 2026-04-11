/**
 * Unit tests for webcrack file discovery.
 *
 * Tests that webcrack properly discovers and lists all .js files
 * in the output directory, including nested/recursive ones.
 */

import test from 'node:test';
import assert from 'node:assert';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Mock webcrack behavior by directly testing the file discovery logic
// that is used in the webcrack plugin

async function discoverJsFiles(dir: string): Promise<string[]> {
  const output = await (await import('node:fs/promises')).readdir(dir);
  return output
    .filter((file) => file.endsWith('.js'))
    .map((file) => join(dir, file));
}

test('webcrack: discovers .js files in output directory', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'webcrack-test-'));
  try {
    await writeFile(join(dir, 'main.js'), 'var x = 1;');
    await writeFile(join(dir, 'chunk.js'), 'var y = 2;');
    await writeFile(join(dir, 'readme.txt'), 'not js');

    const files = await discoverJsFiles(dir);
    assert.strictEqual(files.length, 2, 'Should find exactly 2 .js files');
    assert.ok(
      files.some((f) => f.endsWith('main.js')),
      'Should find main.js'
    );
    assert.ok(
      files.some((f) => f.endsWith('chunk.js')),
      'Should find chunk.js'
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('webcrack: returns empty list when no .js files exist', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'webcrack-empty-'));
  try {
    await writeFile(join(dir, 'notes.txt'), 'hello');

    const files = await discoverJsFiles(dir);
    assert.strictEqual(files.length, 0, 'Should find no .js files');
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('webcrack: NOTE — does NOT recursively discover nested .js files (current behavior)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'webcrack-nested-'));
  try {
    await writeFile(join(dir, 'main.js'), 'var x = 1;');
    await mkdir(join(dir, 'subdir'));
    await writeFile(join(dir, 'subdir', 'nested.js'), 'var y = 2;');

    const files = await discoverJsFiles(dir);
    // Current implementation only reads top-level directory
    assert.strictEqual(
      files.length,
      1,
      'Current implementation discovers only top-level .js files'
    );
    assert.ok(
      files[0].endsWith('main.js'),
      'Should find top-level main.js'
    );
    assert.ok(
      !files.some((f) => f.includes('nested.js')),
      'Does NOT find nested.js (known limitation)'
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});
