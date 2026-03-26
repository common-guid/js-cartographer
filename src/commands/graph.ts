import fs from 'node:fs/promises';
import path from 'node:path';
import { cli } from '../cli.js';
import { GraphPresenter } from '../services/callgraph/presenter.js';
import { CallGraphData } from '../services/callgraph/types.js';

export const graph = cli()
  .name('graph')
  .description('Visualize the call graph of a deobfuscated project')
  .argument('<directory>', 'The output directory of a deobfuscated project')
  .option('-e, --entry <id>', 'Specific function ID to trace (e.g., "src/main.js:init")')
  .option('-d, --depth <number>', 'Maximum depth to trace')
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
      const maxDepth = options.depth ? parseInt(options.depth, 10) : Infinity;

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
      process.exit(1);
    }
  });
