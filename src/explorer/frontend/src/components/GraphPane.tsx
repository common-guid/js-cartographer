import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useExplorerStore } from '../store/explorer-store';
import { callGraphToFlow, moduleGraphToFlow } from '../lib/graph-transform';
import ApiSurfaceView from './ApiSurfaceView';

export default function GraphPane() {
  const callGraph = useExplorerStore((s) => s.callGraph);
  const moduleGraph = useExplorerStore((s) => s.moduleGraph);
  const apiSurface = useExplorerStore((s) => s.apiSurface);
  const graphView = useExplorerStore((s) => s.graphView);
  const selectedNodeId = useExplorerStore((s) => s.selectedNodeId);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const selectFile = useExplorerStore((s) => s.selectFile);
  const searchQuery = useExplorerStore((s) => s.searchQuery);

  const { flowNodes, flowEdges } = useMemo(() => {
    if (graphView === 'call-graph' && callGraph) {
      const result = callGraphToFlow(callGraph);
      return { flowNodes: result.nodes, flowEdges: result.edges };
    }
    if (graphView === 'module-graph' && moduleGraph) {
      const result = moduleGraphToFlow(moduleGraph);
      return { flowNodes: result.nodes, flowEdges: result.edges };
    }
    return { flowNodes: [], flowEdges: [] };
  }, [callGraph, moduleGraph, graphView]);

  // Apply search filter
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return flowNodes;
    const q = searchQuery.toLowerCase();
    return flowNodes.map((node) => {
      const label = String(node.data?.label || '');
      const matches = label.toLowerCase().includes(q);
      return {
        ...node,
        style: {
          ...node.style,
          opacity: matches ? 1 : 0.2,
        },
      };
    });
  }, [flowNodes, searchQuery]);

  // Highlight selected node
  const styledNodes = useMemo(() => {
    return filteredNodes.map((node) => {
      if (node.id === selectedNodeId) {
        return {
          ...node,
          style: {
            ...node.style,
            background: '#58a6ff',
            border: '2px solid #1f6feb',
            boxShadow: '0 0 12px rgba(88, 166, 255, 0.4)',
          },
        };
      }
      return node;
    });
  }, [filteredNodes, selectedNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(styledNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(styledNodes);
    setEdges(flowEdges);
  }, [styledNodes, flowEdges, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (graphView === 'call-graph') {
        selectNode(node.id);
      } else {
        // Module graph: select file
        selectFile(node.id);
      }
    },
    [graphView, selectNode, selectFile],
  );

  if (!callGraph && !moduleGraph && !apiSurface) {
    return (
      <div className="flex items-center justify-center h-full text-explorer-text-dim">
        No data available.
      </div>
    );
  }

  if (graphView === 'api-surface') {
    return <ApiSurfaceView />;
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Controls position="bottom-left" />
        <MiniMap
          nodeColor={(node) => (node.id === selectedNodeId ? '#58a6ff' : '#238636')}
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{ background: '#161b22' }}
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#21262d" />
      </ReactFlow>
    </div>
  );
}
