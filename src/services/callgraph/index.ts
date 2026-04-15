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
        const resolvedPath = self.resolvePath(relativePath, source);

        pathNode.node.specifiers.forEach((spec) => {
          if (
            spec.type === "ImportSpecifier" &&
            spec.imported.type === "Identifier"
          ) {
            fileImports[spec.local.name] = `${resolvedPath}:${spec.imported.name}`;
          } else if (spec.type === "ImportDefaultSpecifier") {
            fileImports[spec.local.name] = `${resolvedPath}:default`;
          } else if (spec.type === "ImportNamespaceSpecifier") {
            fileImports[spec.local.name] = resolvedPath;
          }
        });
      },

      // Handle CommonJS require
      VariableDeclarator(pathNode) {
        if (
          pathNode.node.init?.type === "CallExpression" &&
          pathNode.node.init.callee.type === "Identifier" &&
          pathNode.node.init.callee.name === "require" &&
          pathNode.node.init.arguments[0]?.type === "StringLiteral" &&
          pathNode.node.id.type === "Identifier"
        ) {
          const source = pathNode.node.init.arguments[0].value;
          const resolvedPath = self.resolvePath(relativePath, source);
          fileImports[pathNode.node.id.name] = resolvedPath;
        }
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
        const parentFunc = pathNode.getFunctionParent();
        const callerName =
          parentFunc?.node?.id?.type === "Identifier"
            ? parentFunc.node.id.name
            : "root";
        const callerId = `${relativePath}:${callerName}`;

        if (callee.type === "Identifier") {
          const calledName = callee.name;

          if (fileImports[calledName]) {
            self.graph.edges.push({
              from: callerId,
              to: fileImports[calledName],
              type: "external"
            });
          } else {
            self.graph.edges.push({
              from: callerId,
              to: `${relativePath}:${calledName}`,
              type: "internal"
            });
          }
        } else if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.property.type === "Identifier"
        ) {
          const objectName = callee.object.name;
          const propertyName = callee.property.name;

          if (fileImports[objectName]) {
            const target = fileImports[objectName].includes(":")
              ? fileImports[objectName]
              : `${fileImports[objectName]}:${propertyName}`;

            self.graph.edges.push({
              from: callerId,
              to: target,
              type: "external"
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
