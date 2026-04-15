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
import { SourcemapService } from "./services/sourcemap/index.js";
import { InputTask } from "./services/discovery/index.js";
import { StateCache } from "./services/cache/index.js";

export const DEFAULT_FILE_CONCURRENCY = 3;

export async function unminify(
  tasks: InputTask[],
  outputDir: string,
  plugins: ((code: string, sourcemapService?: SourcemapService) => Promise<string>)[] = [],
  sanitizer?: WakaruSanitizer,
  fileConcurrency: number = DEFAULT_FILE_CONCURRENCY
) {
  const allExtractedFiles: { path: string; sourcemapService?: SourcemapService }[] = [];
  const stateCache = new StateCache(outputDir);
  await stateCache.init();

  console.log(`[Batch] Processing ${tasks.length} input chunks...`);

  for (const task of tasks) {
    ensureFileExists(task.jsPath);
    const bundledCode = await fs.readFile(task.jsPath, "utf-8");
    const extractedFiles = await webcrack(bundledCode, outputDir);

    let sourcemapService: SourcemapService | undefined;
    if (task.mapPath) {
      ensureFileExists(task.mapPath);
      const rawSourcemap = JSON.parse(await fs.readFile(task.mapPath, "utf-8"));
      sourcemapService = new SourcemapService(rawSourcemap);
      await sourcemapService.init();
      console.log(`[Sourcemap] Truth Injection enabled for ${path.basename(task.jsPath)} using ${path.basename(task.mapPath)}`);
    }

    allExtractedFiles.push(...extractedFiles.map(f => ({ ...f, sourcemapService })));
  }

  try {
    // Build Module Graph (Phase 4)
    // We build the graph after unbundling all chunks to ensure cross-chunk references are captured if possible
    const graphBuilder = new GraphBuilder();
    const graph = await graphBuilder.build(outputDir);
    const graphPath = path.join(outputDir, "module-graph.json");
    await fs.writeFile(graphPath, JSON.stringify(graph, null, 2));
    console.log(`[Graph] Dependency map saved to ${graphPath}`);

    const totalFiles = allExtractedFiles.length;
    const effectiveConcurrency = Math.max(
      1,
      Math.min(fileConcurrency, totalFiles)
    );

    if (totalFiles > 1) {
      console.log(
        `Processing ${totalFiles} total modules with concurrency ${effectiveConcurrency}...`
      );
    }

    const limit = pLimit(effectiveConcurrency);

    async function processFile(file: { path: string; sourcemapService?: SourcemapService }, index: number) {
      try {
        console.log(`Processing file ${index + 1}/${totalFiles}`);

        let code = await fs.readFile(file.path, "utf-8");

        if (code.trim().length === 0) {
          verbose.log(`Skipping empty file ${file.path}`);
          return;
        }

        // Check cache
        if (await stateCache.isCompleted(file.path, code)) {
          console.log(`[Cache] Skipping already processed file ${file.path}`);
          return;
        }

        // Pre-processing: run sanitizer before the LLM plugin chain
        if (sanitizer) {
          const sanitized = await sanitizer.transform(code, file.path);
          code = sanitized.code;
        }

        const formattedCode = await plugins.reduce(
          (p, next) => p.then((c) => next(c, file.sourcemapService)),
          Promise.resolve(code)
        );

        verbose.log("Input: ", code);
        verbose.log("Output: ", formattedCode);

        await fs.writeFile(file.path, formattedCode);
        await stateCache.markAsCompleted(file.path, code);
      } catch (error) {
        console.error(`[Error] Failed to process ${file.path}:`, error);
        // We don't rethrow here because we want Promise.all to continue with other files
      }
    }

    await Promise.all(
      allExtractedFiles.map((file, i) => limit(() => processFile(file, i)))
    );
  } finally {
    // Clean up all sourcemap services
    const services = new Set(allExtractedFiles.map(f => f.sourcemapService).filter(Boolean));
    for (const service of services) {
      service?.destroy();
    }
  }

  // Build Semantic Call Graph (Phase 5)
  console.log("[Phase 5] Building Call Graph...");
  const callGraphBuilder = new CallGraphBuilder();
  const callGraph = await callGraphBuilder.build(outputDir);

  const callGraphPath = path.join(outputDir, "call-graph.json");
  await fs.writeFile(callGraphPath, JSON.stringify(callGraph, null, 2));
  console.log(`[CallGraph] Graph data saved to ${callGraphPath}`);

  // Build API Surface & Security Findings
  console.log("[Phase 6] Reconstructing API Surface & Security Findings...");
  const apiAnalyzer = new ApiAnalyzer();
  const { apiSurface, securityFindings, taintFlows } = await apiAnalyzer.build(outputDir, callGraph);
  
  const apiSurfacePath = path.join(outputDir, "api-surface.json");
  await fs.writeFile(apiSurfacePath, JSON.stringify(apiSurface, null, 2));
  console.log(`[API] API surface data saved to ${apiSurfacePath}`);

  const securityFindingsPath = path.join(outputDir, "security-findings.json");
  await fs.writeFile(securityFindingsPath, JSON.stringify(securityFindings, null, 2));
  console.log(`[Security] ${securityFindings.length} findings saved to ${securityFindingsPath}`);

  const taintFlowsPath = path.join(outputDir, "taint-flows.json");
  await fs.writeFile(taintFlowsPath, JSON.stringify(taintFlows, null, 2));
  console.log(`[Security] ${taintFlows.length} taint flows discovered and saved to ${taintFlowsPath}`);

  if (process.env.VERBOSE) {
    if (securityFindings.length > 0) {
      console.log("[Security] Findings Summary:");
      for (const finding of securityFindings) {
        console.log(`- ${finding.type.toUpperCase()}: ${finding.name} in ${finding.file}:${finding.loc?.line}`);
      }
    }
    if (taintFlows.length > 0) {
      console.log("[Security] Taint Flows Summary:");
      for (const flow of taintFlows) {
        console.log(`- FLOW: ${flow.source.name} -> ${flow.sink.name} in ${flow.file}:${flow.sink.loc?.line}`);
      }
    }
  }

  console.log(`Done! You can find your unminified code in ${outputDir}`);
}
