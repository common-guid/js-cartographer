import test from 'node:test';
import assert from 'node:assert';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GraphBuilder } from './index.js';

test('empty directory returns empty files record', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'graph-test-'));
  try {
    const graph = await new GraphBuilder().build(dir);
    assert.deepStrictEqual(graph.files, {});
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('captures ESM imports', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'graph-test-'));
  try {
    await writeFile(join(dir, 'main.js'), `import { add } from './math';`);
    await writeFile(join(dir, 'math.js'), `export function add(a, b) { return a + b; }`);
    const graph = await new GraphBuilder().build(dir);
    assert.deepStrictEqual(graph.files['main.js'].imports, ['./math']);
    assert.deepStrictEqual(graph.files['math.js'].exports, ['add']);
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('captures CJS requires', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'graph-test-'));
  try {
    await writeFile(join(dir, 'app.js'), `const config = require('./config.js');`);
    const graph = await new GraphBuilder().build(dir);
    assert.deepStrictEqual(graph.files['app.js'].imports, ['./config.js']);
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('unparseable file skipped gracefully', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'graph-test-'));
  try {
    await writeFile(join(dir, 'bad.js'), `const x = function(( { ;`);
    const graph = await new GraphBuilder().build(dir);
    // Should gracefully skip and return empty imports/exports or exclude if we prefer
    // Our implementation creates the record before parsing so it exists with empty arrays
    assert.deepStrictEqual(graph.files['bad.js'], { id: 'bad.js', imports: [], exports: [] });
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('captures various named exports', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'graph-test-'));
  try {
    await writeFile(join(dir, 'exports.js'), `
      export function foo() {}
      export const bar = 1, baz = 2;
      const q = 3;
      export { q };
      export default function() {}
    `);
    const graph = await new GraphBuilder().build(dir);
    assert.deepStrictEqual(graph.files['exports.js'].exports.sort(), ['bar', 'baz', 'default', 'foo', 'q'].sort());
  } finally {
    await rm(dir, { recursive: true });
  }
});
