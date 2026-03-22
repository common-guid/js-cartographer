import test from 'node:test';
import assert from 'node:assert';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CallGraphBuilder } from './index.js';

test('Call graph from a known two-file fixture has expected nodes and edges', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'callgraph-fixture-'));
  try {
    await writeFile(join(dir, 'main.js'), `
      import { fnB } from './lib.js';
      function fnA() {
        fnB();
      }
      fnA();
    `);
    await writeFile(join(dir, 'lib.js'), `
      export function fnB() {
        console.log('hi');
      }
    `);

    const graph = await new CallGraphBuilder().build(dir);

    assert.ok(graph.nodes['main.js:fnA'], 'Node main.js:fnA missing');
    assert.ok(graph.nodes['lib.js:fnB'], 'Node lib.js:fnB missing');

    const edge1 = graph.edges.find(e => e.from === 'main.js:fnA' && e.to === 'lib.js:fnB');
    assert.ok(edge1, 'External edge from main.js:fnA to lib.js:fnB missing');
    assert.strictEqual(edge1.type, 'external');

    const edge2 = graph.edges.find(e => e.from === 'main.js:root' && e.to === 'main.js:fnA');
    assert.ok(edge2, 'Internal edge from main.js:root to main.js:fnA missing');
    assert.strictEqual(edge2.type, 'internal');

  } finally {
    await rm(dir, { recursive: true });
  }
});
