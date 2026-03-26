import test from 'node:test';
import assert from 'node:assert';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { humanify } from '../test-utils.js';
import { CallGraphData } from '../services/callgraph/types.js';

test('humanify graph --entry X outputs ASCII tree', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'graph-e2e-'));
  try {
    const data: CallGraphData = {
      nodes: {
        'src/main.js:init': { id: 'src/main.js:init', file: 'src/main.js', name: 'init', line: 1 },
        'src/utils.js:helper': { id: 'src/utils.js:helper', file: 'src/utils.js', name: 'helper', line: 2 }
      },
      edges: [
        { from: 'src/main.js:init', to: 'src/utils.js:helper', type: 'internal' }
      ]
    };
    await writeFile(join(dir, 'call-graph.json'), JSON.stringify(data));

    const result = await humanify('graph', dir, '--entry', 'src/main.js:init');
    assert.match(result.stdout, /src\/main\.js:init/);
    assert.match(result.stdout, /└── src\/utils\.js:helper/);
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('humanify graph --format mermaid writes call-graph.mermaid', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'graph-e2e-'));
  try {
    const data: CallGraphData = {
      nodes: {
        'src/main.js:init': { id: 'src/main.js:init', file: 'src/main.js', name: 'init', line: 1 },
      },
      edges: []
    };
    await writeFile(join(dir, 'call-graph.json'), JSON.stringify(data));

    const result = await humanify('graph', dir, '--format', 'mermaid');
    assert.match(result.stdout, /Mermaid graph saved/);

    const mermaidContent = await readFile(join(dir, 'call-graph.mermaid'), 'utf-8');
    assert.ok(mermaidContent.startsWith('graph TD\n'));
  } finally {
    await rm(dir, { recursive: true });
  }
});
