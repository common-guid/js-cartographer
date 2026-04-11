import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createExplorerServer } from './server.js';

const PORT = 3456;
const HOST = '127.0.0.1';
const BASE = `http://${HOST}:${PORT}`;

function get(path: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode!, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode!, body: data });
        }
      });
    }).on('error', reject);
  });
}

describe('Explorer Server', () => {
  before(async () => {
    await createExplorerServer({
      directory: 'fixture-analysis',
      port: PORT,
      host: HOST,
    });
  });

  describe('GET /api/graphs', () => {
    it('should return call graph and module graph data', async () => {
      const { status, body } = await get('/api/graphs');
      assert.strictEqual(status, 200);
      assert.ok(body.callGraph, 'callGraph should be present');
      assert.ok(body.moduleGraph, 'moduleGraph should be present');
    });

    it('should contain the expected number of call graph nodes', async () => {
      const { body } = await get('/api/graphs');
      const nodeCount = Object.keys(body.callGraph.nodes).length;
      assert.ok(nodeCount > 0, `Expected nodes, got ${nodeCount}`);
      assert.strictEqual(nodeCount, 38, 'Should have 38 call graph nodes');
    });

    it('should contain edges with valid from/to references', async () => {
      const { body } = await get('/api/graphs');
      assert.ok(body.callGraph.edges.length > 0, 'Should have edges');
      for (const edge of body.callGraph.edges.slice(0, 5)) {
        assert.ok(edge.from, 'Edge should have "from"');
        assert.ok(edge.to, 'Edge should have "to"');
        assert.ok(['internal', 'external'].includes(edge.type), `Invalid edge type: ${edge.type}`);
      }
    });
  });

  describe('GET /api/files', () => {
    it('should list project files', async () => {
      const { status, body } = await get('/api/files');
      assert.strictEqual(status, 200);
      assert.ok(Array.isArray(body.files));
      assert.ok(body.files.includes('deobfuscated.js'));
      assert.ok(body.files.includes('call-graph.json'));
      assert.ok(body.files.includes('module-graph.json'));
    });
  });

  describe('GET /api/file', () => {
    it('should return file contents for a valid path', async () => {
      const { status, body } = await get('/api/file?path=deobfuscated.js');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.path, 'deobfuscated.js');
      assert.ok(body.content.length > 0, 'Content should not be empty');
    });

    it('should return 400 when path is missing', async () => {
      const { status, body } = await get('/api/file');
      assert.strictEqual(status, 400);
      assert.ok(body.error.includes('Missing'));
    });

    it('should return 404 for non-existent files', async () => {
      const { status, body } = await get('/api/file?path=nonexistent.js');
      assert.strictEqual(status, 404);
      assert.ok(body.error.includes('not found'));
    });

    it('should block path traversal attempts', async () => {
      const { status, body } = await get('/api/file?path=../../etc/passwd');
      assert.strictEqual(status, 403);
      assert.ok(body.error.includes('traversal'));
    });

    it('should block path traversal with encoded characters', async () => {
      const { status } = await get('/api/file?path=%2e%2e%2f%2e%2e%2fetc%2fpasswd');
      assert.strictEqual(status, 403);
    });
  });
});
