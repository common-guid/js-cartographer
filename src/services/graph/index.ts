import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import { ModuleGraph } from './types.js';
import { getFiles } from './file-utils.js';

// The ESM import of @babel/traverse can be tricky depending on the environment
// We handle both default import and namespace import
const traverse = (typeof _traverse === 'function' ? _traverse : (_traverse as any).default) as typeof _traverse;

export class GraphBuilder {
  async build(directory: string): Promise<ModuleGraph> {
    console.log(`[Graph] Scanning dependencies in ${directory}...`);

    const graph: ModuleGraph = { files: {} };
    const filePaths = await getFiles(directory);

    for (const filePath of filePaths) {
      const code = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(directory, filePath);

      const imports: string[] = [];
      const exports: string[] = [];

      // Pre-initialize empty file structure so unparseable files still appear in the map
      graph.files[relativePath] = { id: relativePath, imports, exports };

      try {
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });

        traverse(ast, {
          // 1. Capture Imports (ESM + CommonJS)
          ImportDeclaration(p) {
            imports.push(p.node.source.value);
          },
          CallExpression(p) {
            // Handle require('...')
            if (
              p.node.callee.type === 'Identifier' &&
              p.node.callee.name === 'require' &&
              p.node.arguments[0]?.type === 'StringLiteral'
            ) {
              imports.push(p.node.arguments[0].value);
            }
          },
          // 2. Capture Exports
          ExportNamedDeclaration(p) {
            if (p.node.declaration && p.node.declaration.type === 'FunctionDeclaration') {
              exports.push(p.node.declaration.id?.name || 'anonymous');
            } else if (p.node.declaration && p.node.declaration.type === 'VariableDeclaration') {
              for (const decl of p.node.declaration.declarations) {
                if (decl.id.type === 'Identifier') {
                  exports.push(decl.id.name);
                }
              }
            } else if (p.node.specifiers) {
               for (const specifier of p.node.specifiers) {
                  if (specifier.exported.type === 'Identifier') {
                      exports.push(specifier.exported.name);
                  }
               }
            }
          },
          ExportDefaultDeclaration(p) {
            exports.push('default');
          }
        });

        graph.files[relativePath] = { id: relativePath, imports, exports };
      } catch (error) {
        console.warn(`[Graph] Failed to parse ${relativePath} for graph. Skipping.`);
      }
    }

    return graph;
  }
}
