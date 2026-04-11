import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import { CallGraphData } from "./types.js";
import { getFiles } from "../graph/file-utils.js";

const traverse = (
  typeof _traverse === "function" ? _traverse : (_traverse as any).default
) as typeof _traverse;

export class CallGraphBuilder {
  private graph: CallGraphData = { nodes: {}, edges: [] };

  // Maps "src/file.js" -> { "localName": "importedSource:exportedName" }
  private importMap: Record<string, Record<string, string>> = {};

  async build(directory: string): Promise<CallGraphData> {
    console.log(`[CallGraph] Analyzing function calls in ${directory}...`);

    // Reset state for multiple build calls
    this.graph = { nodes: {}, edges: [] };
    this.importMap = {};

    const files = await getFiles(directory);

    // Pass 1: Index all Functions & Imports
    for (const file of files) {
      await this.analyzeFile(file, directory);
    }

    return this.graph;
  }

  private async analyzeFile(filePath: string, rootDir: string) {
    const code = await fs.readFile(filePath, "utf-8");
    const relativePath = path.relative(rootDir, filePath);

    // Track imports for this file: localName -> sourceFile
    const fileImports: Record<string, string> = {};

    let ast;
    try {
      ast = parse(code, {
        sourceType: "module",
        plugins: ["jsx", "typescript"]
      });
    } catch (e) {
      console.warn(`[CallGraph] Failed to parse ${relativePath}. Skipping.`);
      return;
    }

    const self = this;

    traverse(ast, {
      // 1. Map Imports: import { login } from './auth'
      ImportDeclaration(pathNode) {
        const source = pathNode.node.source.value; // "./auth"

        pathNode.node.specifiers.forEach((spec) => {
          if (
            spec.type === "ImportSpecifier" &&
            spec.imported.type === "Identifier"
          ) {
            // Resolve path (simplified for CLI)
            const resolvedPath = self.resolvePath(relativePath, source);
            fileImports[spec.local.name] =
              `${resolvedPath}:${spec.imported.name}`;
          }
        });
      },

      // 2. Register Function Definitions
      FunctionDeclaration(pathNode) {
        if (pathNode.node.id) {
          const funcName = pathNode.node.id.name;
          const id = `${relativePath}:${funcName}`;

          self.graph.nodes[id] = {
            id,
            file: relativePath,
            name: funcName,
            line: pathNode.node.loc?.start.line || 0
          };
        }
      },

      // 3. Record Calls
      CallExpression(pathNode) {
        const callee = pathNode.node.callee;
        // Need to find which function WE are currently inside (Context)
        const parentFunc = pathNode.getFunctionParent();
        const callerName =
          parentFunc?.node?.id?.type === "Identifier"
            ? parentFunc.node.id.name
            : "root";
        const callerId = `${relativePath}:${callerName}`;

        if (callee.type === "Identifier") {
          const calledName = callee.name;

          // Case A: Is it an imported function?
          if (fileImports[calledName]) {
            // It's external! Link to the resolved ID.
            self.graph.edges.push({
              from: callerId,
              to: fileImports[calledName],
              type: "external"
            });
          }
          // Case B: Is it local?
          else {
            self.graph.edges.push({
              from: callerId,
              to: `${relativePath}:${calledName}`,
              type: "internal"
            });
          }
        }
      }
    });
  }

  // Helper: naive path resolver ( ./auth -> src/auth.js )
  // In a real app, this needs to handle index.js, extensions, etc.
  private resolvePath(currentFile: string, importPath: string): string {
    const dir = path.dirname(currentFile);
    // Simple join. Real implementation should check if .js exists.
    let resolved = path.join(dir, importPath);
    if (!resolved.endsWith(".js")) resolved += ".js";
    return resolved;
  }
}
