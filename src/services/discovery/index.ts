import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

export interface InputTask {
  jsPath: string;
  mapPath?: string;
}

export class DiscoveryService {
  /**
   * Recursively finds all .js files in a directory.
   */
  async scanDirectory(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          return this.scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
          return [fullPath];
        }
        return [];
      })
    );
    return files.flat();
  }

  /**
   * Pairs JavaScript files with their corresponding sourcemaps.
   */
  async matchSourcemaps(jsFiles: string[], mapsDir: string): Promise<InputTask[]> {
    return Promise.all(
      jsFiles.map(async (jsPath) => {
        // 1. Try to parse sourceMappingURL from the end of the file
        const mapFileName = await this.extractSourceMapUrl(jsPath);
        if (mapFileName) {
          const mapPath = path.resolve(mapsDir, mapFileName);
          if (existsSync(mapPath)) {
            return { jsPath, mapPath };
          }
        }

        // 2. Fallback to filename matching (e.g., chunk.js -> chunk.js.map)
        const baseName = path.basename(jsPath);
        const fallbackMapPath = path.join(mapsDir, `${baseName}.map`);
        if (existsSync(fallbackMapPath)) {
          return { jsPath, mapPath: fallbackMapPath };
        }

        return { jsPath };
      })
    );
  }

  private async extractSourceMapUrl(jsPath: string): Promise<string | null> {
    try {
      const stats = await fs.stat(jsPath);
      const readSize = Math.min(stats.size, 2048); // Read last 2KB
      const buffer = Buffer.alloc(readSize);
      
      const file = await fs.open(jsPath, 'r');
      await file.read(buffer, 0, readSize, stats.size - readSize);
      await file.close();

      const content = buffer.toString('utf-8');
      const match = content.match(/\/\/#\s*sourceMappingURL=(.*)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    } catch (e) {
      // Ignore errors (e.g., empty files)
    }
    return null;
  }
}
