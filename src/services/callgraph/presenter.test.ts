import test from 'node:test';
import assert from 'node:assert';
import { GraphPresenter } from './presenter.js';
import { CallGraphData } from './types.js';

test('toAsciiTree: single node with no children', () => {
  const data: CallGraphData = {
    nodes: {
      'src/main.js:init': { id: 'src/main.js:init', file: 'src/main.js', name: 'init', line: 1 }
    },
    edges: []
  };
  const presenter = new GraphPresenter(data);
  const result = presenter.toAsciiTree('src/main.js:init');
  assert.strictEqual(result, 'src/main.js:init\n');
});

test('toAsciiTree: correct connector characters', () => {
  const data: CallGraphData = {
    nodes: {
      'root:a': { id: 'root:a', file: 'root', name: 'a', line: 1 },
      'root:b': { id: 'root:b', file: 'root', name: 'b', line: 2 },
      'root:c': { id: 'root:c', file: 'root', name: 'c', line: 3 },
    },
    edges: [
      { from: 'root:a', to: 'root:b', type: 'internal' },
      { from: 'root:a', to: 'root:c', type: 'internal' },
    ]
  };
  const presenter = new GraphPresenter(data);
  const result = presenter.toAsciiTree('root:a');
  assert.strictEqual(result, 'root:a\n├── root:b\n└── root:c\n');
});

test('toAsciiTree: depth limit respected', () => {
  const data: CallGraphData = {
    nodes: {
      'root:a': { id: 'root:a', file: 'root', name: 'a', line: 1 },
      'root:b': { id: 'root:b', file: 'root', name: 'b', line: 2 },
      'root:c': { id: 'root:c', file: 'root', name: 'c', line: 3 },
    },
    edges: [
      { from: 'root:a', to: 'root:b', type: 'internal' },
      { from: 'root:b', to: 'root:c', type: 'internal' },
    ]
  };
  const presenter = new GraphPresenter(data);
  const result = presenter.toAsciiTree('root:a', 1);
  assert.strictEqual(result, 'root:a\n└── root:b\n');
});

test('toAsciiTree: cycle detection', () => {
  const data: CallGraphData = {
    nodes: {
      'root:a': { id: 'root:a', file: 'root', name: 'a', line: 1 },
      'root:b': { id: 'root:b', file: 'root', name: 'b', line: 2 },
    },
    edges: [
      { from: 'root:a', to: 'root:b', type: 'internal' },
      { from: 'root:b', to: 'root:a', type: 'internal' },
    ]
  };
  const presenter = new GraphPresenter(data);
  const result = presenter.toAsciiTree('root:a');
  assert.strictEqual(result, 'root:a\n└── root:b\n    └── [CYCLE] root:a\n');
});

test('toMermaid: starts with graph TD', () => {
  const data: CallGraphData = { nodes: {}, edges: [] };
  const presenter = new GraphPresenter(data);
  const result = presenter.toMermaid();
  assert.ok(result.startsWith('graph TD\n'));
});

test('toMermaid: sanitizes node IDs', () => {
  const data: CallGraphData = {
    nodes: {
      'src/main.js:init': { id: 'src/main.js:init', file: 'src/main.js', name: 'init', line: 1 },
      'src/utils.js:helper': { id: 'src/utils.js:helper', file: 'src/utils.js', name: 'helper', line: 2 }
    },
    edges: [
      { from: 'src/main.js:init', to: 'src/utils.js:helper', type: 'internal' }
    ]
  };
  const presenter = new GraphPresenter(data);
  const result = presenter.toMermaid();
  assert.match(result, /id_src_main_js_init\["src\/main.js:init"\] --> id_src_utils_js_helper\["src\/utils.js:helper"\]/);
});

test('toAsciiTree: throws on unknown entry point', () => {
  const data: CallGraphData = { nodes: {}, edges: [] };
  const presenter = new GraphPresenter(data);
  assert.throws(() => presenter.toAsciiTree('unknown'), /Entry point unknown not found/);
});
