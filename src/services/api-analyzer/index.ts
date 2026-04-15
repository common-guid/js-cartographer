import fs from "node:fs/promises";
import path from "node:path";
import { findApiSinks, findSecurityFindings, SecurityFinding } from "./sink-discovery.js";
import { InterProceduralAnalyzer, TaintFlow } from "./inter-taint.js";
import { buildApiSurface } from "./surface-builder.js";
import { ApiSurface } from "./types.js";
import { CallGraphData } from "../callgraph/types.js";

export class ApiAnalyzer {
  async build(outputDir: string, callGraph: CallGraphData = { nodes: {}, edges: [] }): Promise<{ 
    apiSurface: ApiSurface; 
    securityFindings: (SecurityFinding & { file: string })[];
    taintFlows: (TaintFlow & { file: string })[];
  }> {
    const sinks: any[] = [];
    const securityFindings: (SecurityFinding & { file: string })[] = [];
    const files = await this.listFiles(outputDir);
    const fileEntries: { path: string; code: string }[] = [];

    for (const file of files) {
      if (!file.endsWith(".js")) continue;
      const code = await fs.readFile(file, "utf-8");
      const relativePath = path.relative(outputDir, file);
      
      fileEntries.push({ path: relativePath, code });

      const fileSinks = await findApiSinks(code);
      const fileSecurityFindings = await findSecurityFindings(code);
      
      // Enrich with file info
      sinks.push(...fileSinks.map(s => ({ ...s, file: relativePath })));
      securityFindings.push(...fileSecurityFindings.map(f => ({ ...f, file: relativePath })));
    }

    const interAnalyzer = new InterProceduralAnalyzer();
    const flows = await interAnalyzer.analyzeProject(fileEntries, callGraph);

    return {
      apiSurface: buildApiSurface(sinks),
      securityFindings: securityFindings,
      taintFlows: flows.map(f => ({ ...f, file: f.sink.file || "" }))
    };
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
