import test from 'node:test';
import assert from 'node:assert';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unminify } from './unminify.js';

test('unminify: resume preserves unminified files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'unminify-resume-'));
  const jsPath = join(dir, 'bundle.js');
  // Simple webpack bundle that extracts to index.js
  const bundleCode = '(function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n(0)})([function(e,t,n){console.log("hello")}]);';
  await writeFile(jsPath, bundleCode);

  try {
    // 1. First run: unminify the bundle
    // We'll use a mock plugin that appends a suffix to identify unminified content
    const mockPlugin = async (code: string) => code + '\n// UNMINIFIED';
    await unminify([{ jsPath }], dir, [mockPlugin]);
    
    const firstRunContent = await readFile(join(dir, 'index.js'), 'utf-8');
    assert.ok(firstRunContent.includes('// UNMINIFIED'), 'First run should unminify the file');

    // 2. Second run: simulate resume
    // In the old behavior, webcrack would overwrite index.js with minified code,
    // and then unminify would skip it because it's in the cache, leaving it minified.
    await unminify([{ jsPath }], dir, [mockPlugin]);
    
    const secondRunContent = await readFile(join(dir, 'index.js'), 'utf-8');
    assert.strictEqual(secondRunContent, firstRunContent, 'Second run should preserve unminified file');
    assert.ok(secondRunContent.includes('// UNMINIFIED'), 'File should still be unminified');

  } finally {
    await rm(dir, { recursive: true });
  }
});
