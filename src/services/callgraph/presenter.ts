import { CallGraphData } from './types.js';

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
    return output.trimEnd() + '\n';
  }
}
