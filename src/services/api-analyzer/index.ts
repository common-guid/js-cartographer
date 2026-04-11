import fs from "node:fs/promises";
import path from "node:path";
import { findApiSinks } from "./sink-discovery.js";
import { buildApiSurface } from "./surface-builder.js";
import { ApiSurface } from "./types.js";

export class ApiAnalyzer {
  async build(outputDir: string): Promise<ApiSurface> {
    const sinks: any[] = [];
    const files = await this.listFiles(outputDir);

    for (const file of files) {
      if (!file.endsWith(".js")) continue;
      const code = await fs.readFile(file, "utf-8");
      const fileSinks = await findApiSinks(code);
      
      // Enrich sinks with file info
      const relativePath = path.relative(outputDir, file);
      sinks.push(...fileSinks.map(s => ({ ...s, file: relativePath })));
    }

    return buildApiSurface(sinks);
  }

  private async listFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.listFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}
