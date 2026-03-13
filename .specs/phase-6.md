### **Phase 6: CLI Experience & Visualization**
**Objective:** Create the `humanify graph` sub-command to allow users to query, filter, and visualize the semantic call graph.
**Key Features:** Entry-point filtering, depth limiting, zero-dependency ASCII tree output, and Mermaid export.

---

#### **Step 6.1: Create the Graph Presenter Service**

We need a service that reads the `call-graph.json` generated in Phase 5 and converts it into either an ASCII tree or a Mermaid diagram.

**Action:**
Create `{{PATH_TO_SRC}}/services/callgraph/presenter.ts`.

```typescript
// {{PATH_TO_SRC}}/services/callgraph/presenter.ts
import { CallGraphData } from './types';

export class GraphPresenter {
  constructor(private data: CallGraphData) {}

  /**
   * Generates a Mermaid.js flowchart string.
   */
  toMermaid(entryId?: string, maxDepth: number = Infinity): string {
    let output = 'graph TD\n';
    const visited = new Set<string>();
    const edgesToRender = new Set<string>();

    // Helper to traverse and collect edges
    const traverse = (currentId: string, currentDepth: number) => {
      if (currentDepth >= maxDepth || visited.has(currentId)) return;
      visited.add(currentId);

      const outgoing = this.data.edges.filter(e => e.from === currentId);
      for (const edge of outgoing) {
        const edgeKey = `${edge.from}-->${edge.to}`;
        if (!edgesToRender.has(edgeKey)) {
          // Format: A["file.js:fnA"] --> B["other.js:fnB"]
          const fromNode = this.data.nodes[edge.from];
          const toNode = this.data.nodes[edge.to];
          
          if (fromNode && toNode) {
            output += `    id_${edge.from.replace(/[^a-zA-Z0-9]/g, '_')}["${fromNode.id}"] --> id_${edge.to.replace(/[^a-zA-Z0-9]/g, '_')}["${toNode.id}"]\n`;
            edgesToRender.add(edgeKey);
          }
        }
        traverse(edge.to, currentDepth + 1);
      }
    };

    if (entryId) {
      if (!this.data.nodes[entryId]) throw new Error(`Entry point ${entryId} not found.`);
      traverse(entryId, 0);
    } else {
      // If no entry, render everything (can be massive)
      Object.keys(this.data.nodes).forEach(id => traverse(id, 0));
    }

    return output;
  }

  /**
   * Generates a terminal-friendly ASCII tree.
   */
  toAsciiTree(entryId: string, maxDepth: number = Infinity): string {
    if (!this.data.nodes[entryId]) throw new Error(`Entry point ${entryId} not found.`);
    
    let output = '';
    const visited = new Set<string>();

    const buildTree = (currentId: string, currentDepth: number, prefix: string, isLast: boolean) => {
      if (currentDepth > maxDepth) return;

      const node = this.data.nodes[currentId];
      if (!node) return;

      // Cycle detection
      if (visited.has(currentId)) {
        output += `${prefix}${isLast ? '└── ' : '├── '}[CYCLE] ${currentId}\n`;
        return;
      }
      visited.add(currentId);

      // Print current node
      const connector = currentDepth === 0 ? '' : (isLast ? '└── ' : '├── ');
      output += `${prefix}${connector}${currentId}\n`;

      // Get children (outgoing calls)
      const outgoing = this.data.edges.filter(e => e.from === currentId);
      const childPrefix = currentDepth === 0 ? '' : prefix + (isLast ? '    ' : '│   ');

      for (let i = 0; i < outgoing.length; i++) {
        buildTree(outgoing[i].to, currentDepth + 1, childPrefix, i === outgoing.length - 1);
      }

      visited.delete(currentId); // Allow other branches to reach this node
    };

    buildTree(entryId, 0, '', true);
    return output;
  }
}

```

---

#### **Step 6.2: Register the CLI Sub-command**

We add the new `graph` command to your existing Commander setup. This ensures it runs independently of the heavy deobfuscation pipeline.

**Action:**
Update `{{PATH_TO_MAIN_PROCESS_FILE}}` (likely `src/cli.ts` or `src/index.ts`).

```typescript
// {{PATH_TO_MAIN_PROCESS_FILE}}
import fs from 'node:fs/promises';
import path from 'node:path';
import { program } from 'commander';
import { GraphPresenter } from './services/callgraph/presenter';
import { CallGraphData } from './services/callgraph/types';

// ... existing humanify main command ...

// --- NEW SUB-COMMAND ---
program
  .command('graph <directory>')
  .description('Visualize the call graph of a deobfuscated project')
  .option('-e, --entry <id>', 'Specific function ID to trace (e.g., "src/main.js:init")')
  .option('-d, --depth <number>', 'Maximum depth to trace', parseInt)
  .option('-f, --format <type>', 'Output format: "tree" (default) or "mermaid"', 'tree')
  .action(async (directory, options) => {
    try {
      const graphPath = path.join(directory, 'call-graph.json');
      
      // 1. Verify data exists
      let rawData: string;
      try {
        rawData = await fs.readFile(graphPath, 'utf-8');
      } catch (e) {
        console.error(`❌ Error: Could not find ${graphPath}.`);
        console.error(`Did you run 'humanify ${directory}' first to generate the graph?`);
        process.exit(1);
      }

      const graphData: CallGraphData = JSON.parse(rawData);
      const presenter = new GraphPresenter(graphData);
      const maxDepth = options.depth || Infinity;

      // 2. Route based on format
      if (options.format === 'mermaid') {
        const output = presenter.toMermaid(options.entry, maxDepth);
        const outPath = path.join(directory, 'call-graph.mermaid');
        await fs.writeFile(outPath, output);
        console.log(`✅ Mermaid graph saved to ${outPath}`);
        
      } else {
        // Default ASCII Tree output
        if (!options.entry) {
          console.error(`❌ Error: '--entry' is required for ASCII tree format.`);
          console.error(`Use '--format mermaid' to export the entire un-filtered graph.`);
          process.exit(1);
        }
        
        console.log(`\nCall Graph for: ${options.entry}\n`);
        const output = presenter.toAsciiTree(options.entry, maxDepth);
        console.log(output);
      }

    } catch (error: any) {
      console.error(`❌ Error generating graph: ${error.message}`);
    }
  });

program.parse(process.argv);

```

---

#### **Step 6.3: E2E Verification**

To confirm the entire integration is complete:

1. **Deobfuscate a test project:**
Ensure you have a test directory (`test-out`) that has already run through Phases 1-5, meaning `test-out/call-graph.json` exists. Assume it has a function `main.js:init`.
2. **Test ASCII Tree:**
```bash
node {{PATH_TO_DIST}}/cli.js graph ./test-out --entry "main.js:init"

```

*Expected Terminal Output:*
```text
Call Graph for: main.js:init

main.js:init
├── utils.js:setupConfig
│   └── utils.js:parseEnv
└── network.js:connect

```

3. **Test Depth Limit:**
```bash
node {{PATH_TO_DIST}}/cli.js graph ./test-out --entry "main.js:init" --depth 1

```

*Expected Terminal Output:*
```text
Call Graph for: main.js:init

main.js:init
├── utils.js:setupConfig
└── network.js:connect

```

4. **Test Mermaid Export:**
```bash
node {{PATH_TO_DIST}}/cli.js graph ./test-out --format mermaid

```

*Expected:* A success message and a new file `test-out/call-graph.mermaid` containing valid `graph TD` syntax.
