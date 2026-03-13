### **Phase 4: Module Intelligence**

**Objective:** Scan the code (post-unpacking) to build a dependency graph that links files together based on `import` and `require` statements.
**Key Artifact:** A `module-graph.json` file representing the project structure.

---

#### **Step 4.1: Define the Graph Data Structure**

We need a standard way to store file relationships.

**Action:**
Create `src/services/graph/types.ts`.

```typescript
// src/services/graph/types.ts

export interface FileNode {
  id: string;          // Relative path (e.g., "src/utils.js")
  imports: string[];   // List of file paths this file imports
  exports: string[];   // List of named exports (e.g., "login", "validate")
}

export interface ModuleGraph {
  files: Record<string, FileNode>;
  entryPoint?: string; // The main file (if detected)
}

```

---

#### **Step 4.2: Implement the Graph Builder**

We need a service that scans a directory, parses every JS file, and extracts its dependencies. Since we already depend on Babel, we will use it here for accurate parsing.

**Action:**
Create `src/services/graph/index.ts`.

```typescript
// src/services/graph/index.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { ModuleGraph } from './types';

// Helper to recursively find all .js files
async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return files.flat().filter(f => f.endsWith('.js') || f.endsWith('.ts'));
}

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

      try {
        const ast = parse(code, { 
          sourceType: 'module', 
          plugins: ['jsx', 'typescript'] 
        });

        traverse(ast, {
          // 1. Capture Imports (ESM + CommonJS)
          ImportDeclaration(path) {
            imports.push(path.node.source.value);
          },
          CallExpression(path) {
             // Handle require('...')
             if (path.node.callee.type === 'Identifier' && 
                 path.node.callee.name === 'require' &&
                 path.node.arguments[0]?.type === 'StringLiteral') {
                 imports.push(path.node.arguments[0].value);
             }
          },
          // 2. Capture Exports
          ExportNamedDeclaration(path) {
            if (path.node.declaration && path.node.declaration.type === 'FunctionDeclaration') {
                exports.push(path.node.declaration.id?.name || 'anonymous');
            }
            // Add other export types (VariableDeclaration) as needed
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

```

---

#### **Step 4.3: Integrate into CLI Pipeline**

We need to insert this step *after* `webcrack` finishes unpacking but *before* Humanify starts renaming individual files.

**Action:**
Update `src/cli.ts`.

```typescript
// Imports
import { GraphBuilder } from './services/graph';

// ... inside your main action ...

// 1. EXISTING: Run Webcrack
// const webcrackResult = await webcrack(input); 
// await webcrackResult.save(outputDir);

// 2. NEW: Build Module Graph (Phase 4)
// Only run this if we are working with a directory (either unpacked or provided)
const graphBuilder = new GraphBuilder();
const graph = await graphBuilder.build(outputDir);

// Save the graph to disk for debugging/user reference
const graphPath = path.join(outputDir, 'module-graph.json');
await fs.writeFile(graphPath, JSON.stringify(graph, null, 2));
console.log(`[Graph] Dependency map saved to ${graphPath}`);

// 3. EXISTING: Process Files with Sanitizer & LLM
// Loop through 'outputDir' and process files...
// (Future Phase 5 will use 'graph' here to help context)

```

---

#### **Step 4.4: Handling "Webcrack" Artifacts**

Since `webcrack` unpacks bundles, it might generate files with names like `1.js`, `2.js`.

* **The Problem:** The LLM hates numbers.
* **The Fix:** We rely on the Sanitizer (Phase 2) to clean the *content*, but Phase 4 gives us the *map*.
* **Refinement:** If `webcrack` produced a `bundle.json` or mapping file, we should arguably read that. However, the **GraphBuilder** implemented above is more robust because it reads the *actual files on disk*, which is the source of truth regardless of how they were unpacked.

---

#### **Step 4.5: Verification**

To verify Phase 4:

1. **Create Test Bundle:** A folder `test-project` with two files:
* `main.js`: `import { add } from './utils'; console.log(add(1, 2));`
* `utils.js`: `export function add(a, b) { return a + b; }`


2. **Run Tool:**
```bash
node dist/cli.js test-project --output dist-test

```


3. **Check Output:**
* Look for `dist-test/module-graph.json`.
* **Content Check:**
```json
{
  "files": {
    "main.js": { "imports": ["./utils"], "exports": [] },
    "utils.js": { "imports": [], "exports": ["add"] }
  }
}

```
