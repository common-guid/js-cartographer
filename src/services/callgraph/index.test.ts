import test from 'node:test';
import assert from 'node:assert';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CallGraphBuilder } from './index.js';

test('Top-level function definition becomes a node', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'callgraph-test-'));
  try {
    await writeFile(join(dir, 'main.js'), `function foo() {}`);
    const graph = await new CallGraphBuilder().build(dir);
    assert.ok(graph.nodes['main.js:foo'], 'Expected main.js:foo node to be created');
    assert.strictEqual(graph.nodes['main.js:foo'].name, 'foo');
    assert.strictEqual(graph.nodes['main.js:foo'].file, 'main.js');
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('Internal call creates an internal edge', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'callgraph-test-'));
  try {
    await writeFile(join(dir, 'main.js'), `function a() { b(); } function b() {}`);
    const graph = await new CallGraphBuilder().build(dir);
    const edge = graph.edges.find(e => e.from === 'main.js:a' && e.to === 'main.js:b');
    assert.ok(edge, 'Expected internal edge from main.js:a to main.js:b');
    assert.strictEqual(edge.type, 'internal');
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('Cross-file call creates an external edge', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'callgraph-test-'));
  try {
    await writeFile(join(dir, 'main.js'), `import { b } from './lib'; function a() { b(); }`);
    await writeFile(join(dir, 'lib.js'), `export function b() {}`);
    const graph = await new CallGraphBuilder().build(dir);
    const edge = graph.edges.find(e => e.from === 'main.js:a' && e.to === 'lib.js:b');
    assert.ok(edge, 'Expected external edge from main.js:a to lib.js:b');
    assert.strictEqual(edge.type, 'external');
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('Top-level call attributed to root', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'callgraph-test-'));
  try {
    await writeFile(join(dir, 'main.js'), `function initApp() {} initApp();`);
    const graph = await new CallGraphBuilder().build(dir);
    const edge = graph.edges.find(e => e.from === 'main.js:root' && e.to === 'main.js:initApp');
    assert.ok(edge, 'Expected call from root to main.js:initApp');
    assert.strictEqual(edge.type, 'internal');
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('Unknown callee is still recorded', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'callgraph-test-'));
  try {
    await writeFile(join(dir, 'main.js'), `function foo() { unknownFunc(); }`);
    const graph = await new CallGraphBuilder().build(dir);
    const edge = graph.edges.find(e => e.from === 'main.js:foo' && e.to === 'main.js:unknownFunc');
    assert.ok(edge, 'Expected edge from main.js:foo to main.js:unknownFunc even if unknownFunc is unresolved');
    assert.strictEqual(edge.type, 'internal');
  } finally {
    await rm(dir, { recursive: true });
  }
});
