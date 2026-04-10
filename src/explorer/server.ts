import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ExplorerServerOptions {
  directory: string;
  port: number;
  host: string;
}

/**
 * Validates that a requested file path is safely within the project directory.
 * Prevents directory traversal attacks.
 */
function isPathSafe(projectDir: string, requestedPath: string): boolean {
  const resolved = path.resolve(projectDir, requestedPath);
  const normalizedProject = path.resolve(projectDir);
  return resolved.startsWith(normalizedProject + path.sep) || resolved === normalizedProject;
}

export function createExplorerServer(options: ExplorerServerOptions) {
  const { directory, port, host } = options;
  const projectDir = path.resolve(directory);
  const app = express();

  // --- API Routes ---

  // GET /api/graphs - Return call-graph.json and module-graph.json
  app.get('/api/graphs', async (_req, res) => {
    try {
      const callGraphPath = path.join(projectDir, 'call-graph.json');
      const moduleGraphPath = path.join(projectDir, 'module-graph.json');
      const apiSurfacePath = path.join(projectDir, 'api-surface.json');

      let callGraph = null;
      let moduleGraph = null;
      let apiSurface = null;

      try {
        const raw = await fs.readFile(callGraphPath, 'utf-8');
        callGraph = JSON.parse(raw);
      } catch {
        // call-graph.json may not exist
      }

      try {
        const raw = await fs.readFile(moduleGraphPath, 'utf-8');
        moduleGraph = JSON.parse(raw);
      } catch {
        // module-graph.json may not exist
      }

      try {
        const raw = await fs.readFile(apiSurfacePath, 'utf-8');
        apiSurface = JSON.parse(raw);
      } catch {
        // api-surface.json may not exist
      }

      if (!callGraph && !moduleGraph && !apiSurface) {
        res.status(404).json({
          error: 'No graph data found. Expected call-graph.json, module-graph.json, or api-surface.json in the project directory.',
        });
        return;
      }

      res.json({ callGraph, moduleGraph, apiSurface });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/file?path=<relative-path> - Return file contents
  app.get('/api/file', async (req, res) => {
    const filePath = req.query.path as string;

    if (!filePath) {
      res.status(400).json({ error: 'Missing "path" query parameter.' });
      return;
    }

    if (!isPathSafe(projectDir, filePath)) {
      res.status(403).json({ error: 'Access denied: path traversal detected.' });
      return;
    }

    try {
      const absolutePath = path.resolve(projectDir, filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      res.json({ path: filePath, content });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: `File not found: ${filePath}` });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // GET /api/files - List all files in the project directory
  app.get('/api/files', async (_req, res) => {
    try {
      const files = await listFiles(projectDir, projectDir);
      res.json({ files });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Static Frontend ---
  const frontendDist = path.join(__dirname, 'frontend', 'dist');
  app.use(express.static(frontendDist));

  // SPA fallback: serve index.html for any non-API routes
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  // --- Start ---
  return new Promise<void>((resolve) => {
    app.listen(port, host, () => {
      resolve();
    });
  });
}

/**
 * Recursively list all files in a directory (relative paths).
 */
async function listFiles(dir: string, root: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (['node_modules', '.git'].includes(entry.name)) continue;
      const subFiles = await listFiles(fullPath, root);
      files.push(...subFiles);
    } else {
      files.push(path.relative(root, fullPath));
    }
  }

  return files;
}
