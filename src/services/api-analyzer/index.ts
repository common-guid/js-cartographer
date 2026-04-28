import fs from "node:fs/promises";
import path from "node:path";
import { findApiSinks } from "./sink-discovery.js";
import { buildApiSurface } from "./surface-builder.js";
import { ApiSurface } from "./types.js";
import { getFiles } from "../graph/file-utils.js";

export class ApiAnalyzer {
  async build(outputDir: string): Promise<ApiSurface> {
    const sinks: any[] = [];
    const files = await getFiles(outputDir);

    for (const file of files) {
      const code = await fs.readFile(file, "utf-8");
      const fileSinks = await findApiSinks(code);
      
      // Enrich sinks with file info
      const relativePath = path.relative(outputDir, file);
      sinks.push(...fileSinks.map(s => ({ ...s, file: relativePath })));
    }

    return buildApiSurface(sinks);
  }
}
