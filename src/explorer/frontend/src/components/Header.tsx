import { useExplorerStore, type GraphView } from '../store/explorer-store';

export default function Header() {
  const graphView = useExplorerStore((s) => s.graphView);
  const setGraphView = useExplorerStore((s) => s.setGraphView);
  const searchQuery = useExplorerStore((s) => s.searchQuery);
  const setSearchQuery = useExplorerStore((s) => s.setSearchQuery);
  const navigateBack = useExplorerStore((s) => s.navigateBack);
  const navigateForward = useExplorerStore((s) => s.navigateForward);
  const historyIndex = useExplorerStore((s) => s.historyIndex);
  const history = useExplorerStore((s) => s.history);
  const callGraph = useExplorerStore((s) => s.callGraph);
  const moduleGraph = useExplorerStore((s) => s.moduleGraph);

  const nodeCount = callGraph ? Object.keys(callGraph.nodes).length : 0;
  const edgeCount = callGraph ? callGraph.edges.length : 0;

  const views: { key: GraphView; label: string; available: boolean }[] = [
    { key: 'call-graph', label: 'Call Graph', available: !!callGraph },
    { key: 'module-graph', label: 'Modules', available: !!moduleGraph },
  ];

  return (
    <header className="flex items-center gap-4 px-4 py-2 bg-explorer-surface border-b border-explorer-border">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <span className="text-lg font-bold text-explorer-accent">JS Cartographer</span>
        <span className="text-xs text-explorer-text-dim">Explorer</span>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={navigateBack}
          disabled={historyIndex <= 0}
          className="p-1.5 rounded hover:bg-explorer-border disabled:opacity-30 disabled:cursor-not-allowed"
          title="Go back"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={navigateForward}
          disabled={historyIndex >= history.length - 1}
          className="p-1.5 rounded hover:bg-explorer-border disabled:opacity-30 disabled:cursor-not-allowed"
          title="Go forward"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex items-center bg-explorer-bg rounded-md border border-explorer-border">
        {views.map((view) => (
          <button
            key={view.key}
            onClick={() => setGraphView(view.key)}
            disabled={!view.available}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              graphView === view.key
                ? 'bg-explorer-accent-dim text-white'
                : 'text-explorer-text-dim hover:text-explorer-text'
            } ${!view.available ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <input
          type="text"
          placeholder="Search functions or files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-explorer-bg border border-explorer-border rounded-md text-explorer-text placeholder-explorer-text-dim focus:outline-none focus:border-explorer-accent"
        />
      </div>

      {/* Stats */}
      <div className="text-xs text-explorer-text-dim ml-auto">
        {nodeCount > 0 && (
          <span>{nodeCount} nodes &middot; {edgeCount} edges</span>
        )}
      </div>
    </header>
  );
}
