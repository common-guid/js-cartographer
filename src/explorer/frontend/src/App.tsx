import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Header from './components/Header';
import GraphPane from './components/GraphPane';
import CodePane from './components/CodePane';
import { useExplorerStore } from './store/explorer-store';

export default function App() {
  const fetchGraphs = useExplorerStore((s) => s.fetchGraphs);
  const loading = useExplorerStore((s) => s.loading);
  const error = useExplorerStore((s) => s.error);

  useEffect(() => {
    fetchGraphs();
  }, [fetchGraphs]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-explorer-bg">
        <div className="text-center">
          <div className="animate-pulse text-explorer-accent text-xl mb-2">Loading explorer...</div>
          <div className="text-explorer-text-dim text-sm">Fetching graph data</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-explorer-bg">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-xl mb-2">Failed to load</div>
          <div className="text-explorer-text-dim text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-explorer-bg">
      <Header />
      <div className="flex-1 flex min-h-0">
        {/* Left Pane: The Map */}
        <div className="w-1/2 border-r border-explorer-border">
          <ReactFlowProvider>
            <GraphPane />
          </ReactFlowProvider>
        </div>

        {/* Right Pane: The Territory */}
        <div className="w-1/2">
          <CodePane />
        </div>
      </div>
    </div>
  );
}
