import { useExplorerStore } from '../store/explorer-store';
import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function SecurityView() {
  const securityFindings = useExplorerStore((s) => s.securityFindings);
  const taintFlows = useExplorerStore((s) => s.taintFlows);
  const selectFile = useExplorerStore((s) => s.selectFile);
  const selectedFlowIndex = useExplorerStore((s) => s.selectedFlowIndex);
  const selectFlow = useExplorerStore((s) => s.selectFlow);
  const searchQuery = useExplorerStore((s) => s.searchQuery);

  const filteredFlows = useMemo(() => {
    if (!taintFlows) return [];
    if (!searchQuery) return taintFlows;
    const q = searchQuery.toLowerCase();
    return taintFlows.filter(f => 
      f.source.name.toLowerCase().includes(q) || 
      f.sink.name.toLowerCase().includes(q) ||
      (f.analysis?.explanation && f.analysis.explanation.toLowerCase().includes(q))
    );
  }, [taintFlows, searchQuery]);

  const selectedFlow = selectedFlowIndex !== null && taintFlows ? taintFlows[selectedFlowIndex] : null;

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!selectedFlow) return { flowNodes: [], flowEdges: [] };

    const nodes: any[] = [];
    const edges: any[] = [];

    // Source Node
    nodes.push({
      id: 'source',
      data: { label: `SOURCE: ${selectedFlow.source.name}\n${selectedFlow.source.file}:${selectedFlow.source.loc?.line}` },
      position: { x: 0, y: 0 },
      style: { background: '#238636', color: '#fff', fontSize: '10px', width: 150 },
    });

    // Intermediate nodes
    selectedFlow.path.forEach((step, i) => {
      const id = `step-${i}`;
      nodes.push({
        id,
        data: { label: `${step.name}\n${step.file}:${step.line}` },
        position: { x: 0, y: (i + 1) * 80 },
        style: { background: '#30363d', color: '#c9d1d9', fontSize: '10px', width: 150 },
      });

      edges.push({
        id: `edge-${i}`,
        source: i === 0 ? 'source' : `step-${i - 1}`,
        target: id,
        animated: true,
        style: { stroke: '#58a6ff' },
      });
    });

    // Sink Node
    const sinkId = 'sink';
    nodes.push({
      id: sinkId,
      data: { label: `SINK: ${selectedFlow.sink.name}\n${selectedFlow.sink.file}:${selectedFlow.sink.loc?.line}` },
      position: { x: 0, y: (selectedFlow.path.length + 1) * 80 },
      style: { background: '#da3633', color: '#fff', fontSize: '10px', width: 150 },
    });

    edges.push({
      id: 'edge-sink',
      source: selectedFlow.path.length === 0 ? 'source' : `step-${selectedFlow.path.length - 1}`,
      target: sinkId,
      animated: true,
      style: { stroke: '#f85149' },
    });

    return { flowNodes: nodes, flowEdges: edges };
  }, [selectedFlow]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const handleExport = () => {
    const report = {
      securityFindings,
      taintFlows
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'security-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!securityFindings && !taintFlows) {
    return (
      <div className="flex items-center justify-center h-full text-explorer-text-dim text-sm italic">
        No security analysis data found.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-explorer-bg overflow-hidden">
      <div className="p-4 border-b border-explorer-border flex justify-between items-center bg-explorer-surface">
        <div className="flex-1 min-w-0">
          <h2 className="text-explorer-text font-semibold text-sm">Security Analysis</h2>
          <div className="text-explorer-text-dim text-[10px] font-mono">
            {taintFlows?.length || 0} flows discovered
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1 bg-explorer-accent-dim text-white text-[10px] font-bold uppercase rounded hover:bg-explorer-accent transition-colors"
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Flow List */}
        <div className="w-1/3 border-r border-explorer-border overflow-y-auto custom-scrollbar bg-explorer-bg">
          {filteredFlows.map((flow, i) => (
            <button
              key={i}
              onClick={() => selectFlow(taintFlows!.indexOf(flow))}
              className={`w-full text-left p-3 border-b border-explorer-border transition-colors group ${
                selectedFlowIndex === taintFlows!.indexOf(flow) ? 'bg-explorer-accent-dim/20' : 'hover:bg-explorer-surface'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-red-400">Taint Flow</span>
                {flow.analysis && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    flow.analysis.riskScore >= 7 ? 'bg-red-900/30 text-red-400' : 
                    flow.analysis.riskScore >= 4 ? 'bg-orange-900/30 text-orange-400' : 'bg-green-900/30 text-green-400'
                  }`}>
                    Risk: {flow.analysis.riskScore}/10
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-explorer-text truncate">
                {flow.source.name} → {flow.sink.name}
              </div>
              <div className="text-[10px] text-explorer-text-dim truncate mt-1">
                {flow.sink.file}:{flow.sink.loc?.line}
              </div>
            </button>
          ))}
        </div>

        {/* Flow Visualization */}
        <div className="flex-1 relative bg-explorer-surface">
          {selectedFlow ? (
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  fitView
                  fitViewOptions={{ padding: 0.5 }}
                  proOptions={{ hideAttribution: true }}
                >
                  <Controls position="bottom-right" />
                  <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#21262d" />
                </ReactFlow>
              </div>
              
              {/* Flow Analysis Panel */}
              {selectedFlow.analysis && (
                <div className="h-1/3 border-t border-explorer-border bg-explorer-bg overflow-y-auto p-4 custom-scrollbar">
                  <h3 className="text-explorer-text font-bold text-xs uppercase mb-2">Analysis</h3>
                  <p className="text-explorer-text text-xs mb-3 leading-relaxed">
                    {selectedFlow.analysis.explanation}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-explorer-accent uppercase mb-1">Implications</h4>
                      <p className="text-explorer-text-dim text-[10px] italic">{selectedFlow.analysis.implications}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-orange-400 uppercase mb-1">Bypass Vectors</h4>
                      <ul className="list-disc list-inside text-explorer-text-dim text-[10px]">
                        {selectedFlow.analysis.bypassSuggestions.map((s, j) => (
                          <li key={j}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-explorer-text-dim text-sm italic">
              Select a flow to visualize
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
