import fs from "fs/promises";
import path from "node:path";
import { ensureFileExists } from "./file-utils.js";
import { webcrack } from "./plugins/webcrack.js";
import { verbose } from "./verbose.js";
import type { WakaruSanitizer } from "./services/sanitizer/index.js";
import { GraphBuilder } from "./services/graph/index.js";
import { CallGraphBuilder } from "./services/callgraph/index.js";
import { ApiAnalyzer } from "./services/api-analyzer/index.js";
import { pLimit } from "./concurrency.js";

export const DEFAULT_FILE_CONCURRENCY = 3;

export async function unminify(
  filename: string,
  outputDir: string,
  plugins: ((code: string) => Promise<string>)[] = [],
  sanitizer?: WakaruSanitizer,
  fileConcurrency: number = DEFAULT_FILE_CONCURRENCY
) {
  ensureFileExists(filename);
  const bundledCode = await fs.readFile(filename, "utf-8");
  const extractedFiles = await webcrack(bundledCode, outputDir);

  // Build Module Graph (Phase 4)
  const graphBuilder = new GraphBuilder();
  const graph = await graphBuilder.build(outputDir);
  const graphPath = path.join(outputDir, "module-graph.json");
  await fs.writeFile(graphPath, JSON.stringify(graph, null, 2));
  console.log(`[Graph] Dependency map saved to ${graphPath}`);

  const totalFiles = extractedFiles.length;
  const effectiveConcurrency = Math.max(
    1,
    Math.min(fileConcurrency, totalFiles)
  );

  if (totalFiles > 1) {
    console.log(
      `Processing ${totalFiles} files with concurrency ${effectiveConcurrency}...`
    );
  }

  const limit = pLimit(effectiveConcurrency);

  async function processFile(file: { path: string }, index: number) {
    try {
      console.log(`Processing file ${index + 1}/${totalFiles}`);

      let code = await fs.readFile(file.path, "utf-8");

      if (code.trim().length === 0) {
        verbose.log(`Skipping empty file ${file.path}`);
        return;
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
    } catch (error) {
      console.error(`[Error] Failed to process ${file.path}:`, error);
      // We don't rethrow here because we want Promise.all to continue with other files
    }
  }

  await Promise.all(
    extractedFiles.map((file, i) => limit(() => processFile(file, i)))
  );

  // Build Semantic Call Graph (Phase 5)
  console.log("[Phase 5] Building Call Graph...");
  const callGraphBuilder = new CallGraphBuilder();
  const callGraph = await callGraphBuilder.build(outputDir);

  const callGraphPath = path.join(outputDir, "call-graph.json");
  await fs.writeFile(callGraphPath, JSON.stringify(callGraph, null, 2));
  console.log(`[CallGraph] Graph data saved to ${callGraphPath}`);

  // Build API Surface (api-reconstruction track)
  console.log("[API] Reconstructing API Surface...");
  const apiAnalyzer = new ApiAnalyzer();
  const apiSurface = await apiAnalyzer.build(outputDir);
  const apiSurfacePath = path.join(outputDir, "api-surface.json");
  await fs.writeFile(apiSurfacePath, JSON.stringify(apiSurface, null, 2));
  console.log(`[API] API surface data saved to ${apiSurfacePath}`);

  console.log(`Done! You can find your unminified code in ${outputDir}`);
}
