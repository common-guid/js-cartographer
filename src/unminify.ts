import fs from "fs/promises";
import path from "node:path";
import { ensureFileExists } from "./file-utils.js";
import { webcrack } from "./plugins/webcrack.js";
import { verbose } from "./verbose.js";
import type { WakaruSanitizer } from "./services/sanitizer/index.js";
import { GraphBuilder } from "./services/graph/index.js";

export async function unminify(
  filename: string,
  outputDir: string,
  plugins: ((code: string) => Promise<string>)[] = [],
  sanitizer?: WakaruSanitizer
) {
  ensureFileExists(filename);
  const bundledCode = await fs.readFile(filename, "utf-8");
  const extractedFiles = await webcrack(bundledCode, outputDir);

  // Build Module Graph (Phase 4)
  const graphBuilder = new GraphBuilder();
  const graph = await graphBuilder.build(outputDir);
  const graphPath = path.join(outputDir, 'module-graph.json');
  await fs.writeFile(graphPath, JSON.stringify(graph, null, 2));
  console.log(`[Graph] Dependency map saved to ${graphPath}`);

  for (let i = 0; i < extractedFiles.length; i++) {
    console.log(`Processing file ${i + 1}/${extractedFiles.length}`);

    const file = extractedFiles[i];
    let code = await fs.readFile(file.path, "utf-8");

    if (code.trim().length === 0) {
      verbose.log(`Skipping empty file ${file.path}`);
      continue;
    }

    // Pre-processing: run sanitizer before the LLM plugin chain
    if (sanitizer) {
      const sanitized = await sanitizer.transform(code, file.path);
      code = sanitized.code;
    }

    const formattedCode = await plugins.reduce(
      (p, next) => p.then(next),
      Promise.resolve(code)
    );

    verbose.log("Input: ", code);
    verbose.log("Output: ", formattedCode);

    await fs.writeFile(file.path, formattedCode);
  }

  console.log(`Done! You can find your unminified code in ${outputDir}`);
}
