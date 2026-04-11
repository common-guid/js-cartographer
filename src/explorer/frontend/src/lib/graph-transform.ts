import type { Node, Edge } from '@xyflow/react';
import type { CallGraphData, ModuleGraph } from './types';

/**
 * Transform a CallGraphData object into React Flow nodes and edges.
 */
export function callGraphToFlow(data: CallGraphData): { nodes: Node[]; edges: Edge[] } {
  const nodeEntries = Object.values(data.nodes);

  // Group nodes by file for layout
  const fileGroups = new Map<string, typeof nodeEntries>();
  for (const node of nodeEntries) {
    const group = fileGroups.get(node.file) || [];
    group.push(node);
    fileGroups.set(node.file, group);
  }

  const nodes: Node[] = [];
  let groupX = 0;

  for (const [file, group] of fileGroups) {
    // Sort functions by line number within each file
    group.sort((a, b) => a.line - b.line);

    for (let i = 0; i < group.length; i++) {
      const fn = group[i];
      nodes.push({
        id: fn.id,
        type: 'default',
        position: { x: groupX, y: i * 80 },
        data: {
          label: fn.name,
          file: fn.file,
          line: fn.line,
          fullId: fn.id,
        },
        style: {
          background: '#238636',
          color: '#ffffff',
          border: '1px solid #2ea043',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '12px',
          fontFamily: 'monospace',
          minWidth: '120px',
          textAlign: 'center' as const,
        },
      });
    }
    groupX += 250;
  }

  // De-duplicate edges
  const edgeSet = new Set<string>();
  const edges: Edge[] = [];

  for (const edge of data.edges) {
    const edgeKey = `${edge.from}->${edge.to}`;
    if (edgeSet.has(edgeKey)) continue;
    edgeSet.add(edgeKey);

    // Only create edge if both source and target nodes exist
    if (data.nodes[edge.from] && data.nodes[edge.to]) {
      edges.push({
        id: edgeKey,
        source: edge.from,
        target: edge.to,
        animated: edge.type === 'external',
        style: {
          stroke: edge.type === 'external' ? '#58a6ff' : '#484f58',
          strokeWidth: 1.5,
        },
        markerEnd: { type: 'arrowclosed' as any, color: edge.type === 'external' ? '#58a6ff' : '#484f58' },
      });
    }
  }

  return { nodes, edges };
}

/**
 * Transform a ModuleGraph object into React Flow nodes and edges.
 */
export function moduleGraphToFlow(data: ModuleGraph): { nodes: Node[]; edges: Edge[] } {
  const fileEntries = Object.values(data.files);
  const nodes: Node[] = fileEntries.map((file, i) => ({
    id: file.id,
    type: 'default',
    position: { x: (i % 4) * 250, y: Math.floor(i / 4) * 120 },
    data: {
      label: file.id,
      exports: file.exports,
      isEntry: file.id === data.entryPoint,
    },
    style: {
      background: file.id === data.entryPoint ? '#58a6ff' : '#161b22',
      color: '#c9d1d9',
      border: `1px solid ${file.id === data.entryPoint ? '#1f6feb' : '#30363d'}`,
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '12px',
      fontFamily: 'monospace',
      minWidth: '140px',
      textAlign: 'center' as const,
    },
  }));

  const edges: Edge[] = [];
  for (const file of fileEntries) {
    for (const imp of file.imports) {
      if (data.files[imp]) {
        edges.push({
          id: `${file.id}->${imp}`,
          source: file.id,
          target: imp,
          style: { stroke: '#58a6ff', strokeWidth: 1.5 },
          markerEnd: { type: 'arrowclosed' as any, color: '#58a6ff' },
        });
      }
    }
  }

  return { nodes, edges };
}
