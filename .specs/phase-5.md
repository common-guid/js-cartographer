### **Phase 5: The Call Graph Implementation**

**Objective:** Parse the *final, renamed* code to build a semantic call graph connecting defined functions to their usage sites across files.
**Constraints:** Static exports only; Top-level functions only (no class methods); Persist output to `call-graph.json`.

---

#### **Step 5.1: Define the Data Structure**

We need a structure that represents "Symbols" (Functions) and "Edges" (Calls).

**Action:**
Create `src/services/callgraph/types.ts`.

```typescript
// src/services/callgraph/types.ts

export interface FunctionNode {
  id: string;          // Unique ID (e.g., "src/auth.js:validateUser")
  file: string;        // "src/auth.js"
  name: string;        // "validateUser"
  line: number;        // Line number where defined
}

export interface CallEdge {
  from: string;        // ID of the caller function
  to: string;          // ID of the callee function
  type: 'internal' | 'external'; // internal = same file, external = import
}

export interface CallGraphData {
  nodes: Record<string, FunctionNode>; // Registry of all functions
  edges: CallEdge[];                   // List of all calls
}

```

---

#### **Step 5.2: Implement the Analyzer Logic**

This service traverses the AST to find two things:

1. **Definitions:** `function X() { ... }` (Creates a Node)
2. **Calls:** `X()` (Creates an Edge)

**Action:**
Create `src/services/callgraph/index.ts`.

```typescript
// src/services/callgraph/index.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { CallGraphData, FunctionNode, CallEdge } from './types';

export class CallGraphBuilder {
  private graph: CallGraphData = { nodes: {}, edges: [] };
  
  // Maps "src/file.js" -> { "localName": "importedSource:exportedName" }
  private importMap: Record<string, Record<string, string>> = {};

  async build(directory: string): Promise<CallGraphData> {
    console.log(`[CallGraph] Analyzing function calls in ${directory}...`);
    
    const files = await this.getFiles(directory);

    // Pass 1: Index all Functions & Imports
    for (const file of files) {
      await this.analyzeFile(file, directory);
    }

    return this.graph;
  }

  private async analyzeFile(filePath: string, rootDir: string) {
    const code = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(rootDir, filePath);
    
    // Track imports for this file: localName -> sourceFile
    const fileImports: Record<string, string> = {}; 

    const ast = parse(code, { sourceType: 'module', plugins: ['typescript'] });

    const self = this;
    
    traverse(ast, {
      // 1. Map Imports: import { login } from './auth'
      ImportDeclaration(path) {
        const source = path.node.source.value; // "./auth"
        
        path.node.specifiers.forEach(spec => {
          if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
             // Resolve path (simplified for CLI)
             const resolvedPath = self.resolvePath(relativePath, source); 
             fileImports[spec.local.name] = `${resolvedPath}:${spec.imported.name}`;
          }
        });
      },

      // 2. Register Function Definitions
      FunctionDeclaration(path) {
        if (path.node.id) {
          const funcName = path.node.id.name;
          const id = `${relativePath}:${funcName}`;
          
          self.graph.nodes[id] = {
            id,
            file: relativePath,
            name: funcName,
            line: path.node.loc?.start.line || 0
          };
        }
      },

      // 3. Record Calls
      CallExpression(path) {
        const callee = path.node.callee;
        // Need to find which function WE are currently inside (Context)
        const parentFunc = path.getFunctionParent();
        const callerName = parentFunc?.node?.id?.name || 'root'; // 'root' = top level
        const callerId = `${relativePath}:${callerName}`;

        if (callee.type === 'Identifier') {
          const calledName = callee.name;
          
          // Case A: Is it an imported function?
          if (fileImports[calledName]) {
             // It's external! Link to the resolved ID.
             self.graph.edges.push({
               from: callerId,
               to: fileImports[calledName], 
               type: 'external'
             });
          } 
          // Case B: Is it local?
          else {
             self.graph.edges.push({
               from: callerId,
               to: `${relativePath}:${calledName}`,
               type: 'internal'
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
    if (!resolved.endsWith('.js')) resolved += '.js';
    return resolved;
  }
  
  private async getFiles(dir: string): Promise<string[]> {
     // Re-use logic from Phase 4 or import a shared utility
     // ... implementation ...
     return []; 
  }
}

```

---

#### **Step 5.3: Integrate into Pipeline**

We run this as the **final step** in the CLI.

**Action:**
Update `src/cli.ts`.

```typescript
// Imports
import { CallGraphBuilder } from './services/callgraph';

// ... after the LLM Loop finishes ...

// 4. NEW: Build Semantic Call Graph (Phase 5)
console.log('[Phase 5] Building Call Graph...');
const callGraphBuilder = new CallGraphBuilder();
const callGraph = await callGraphBuilder.build(outputDir);

// Save Artifact
const callGraphPath = path.join(outputDir, 'call-graph.json');
await fs.writeFile(callGraphPath, JSON.stringify(callGraph, null, 2));
console.log(`[CallGraph] Graph data saved to ${callGraphPath}`);

```

---

#### **Step 5.4: Verification**

To verify Phase 5:

1. **Test Project:**
* `main.js`: `import { fnB } from './lib.js'; function fnA() { fnB(); } fnA();`
* `lib.js`: `export function fnB() { console.log('hi'); }`


2. **Run Tool:**
```bash
node dist/cli.js test-project

```


3. **Check Artifact:** `dist/call-graph.json`.
4. **Expectation:**
* **Nodes:** `main.js:fnA`, `lib.js:fnB`.
* **Edge:** `from: "main.js:fnA"`, `to: "lib.js:fnB"`.
