import { useExplorerStore } from '../store/explorer-store';

export default function ApiSurfaceView() {
  const apiSurface = useExplorerStore((s) => s.apiSurface);
  const selectFile = useExplorerStore((s) => s.selectFile);
  const searchQuery = useExplorerStore((s) => s.searchQuery);

  if (!apiSurface || !apiSurface.endpoints) {
    return (
      <div className="flex items-center justify-center h-full text-explorer-text-dim text-sm italic">
        No API surface data found.
      </div>
    );
  }

  const filteredEndpoints = apiSurface.endpoints.filter((e: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.path.toLowerCase().includes(q) || e.method.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q));
  });

  return (
    <div className="h-full flex flex-col bg-explorer-bg overflow-hidden">
      <div className="p-4 border-b border-explorer-border flex justify-between items-center bg-explorer-surface">
        <div>
          <h2 className="text-explorer-text font-semibold text-sm">API Surface</h2>
          {apiSurface.baseUrl && (
            <div className="text-explorer-accent text-xs font-mono truncate max-w-xs" title={apiSurface.baseUrl}>
              Base: {apiSurface.baseUrl}
            </div>
          )}
        </div>
        <div className="text-explorer-text-dim text-xs">
          {filteredEndpoints.length} endpoints
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {filteredEndpoints.map((endpoint: any, i: number) => (
          <div 
            key={`${endpoint.method}-${endpoint.path}-${i}`}
            className="group bg-explorer-surface border border-explorer-border rounded-lg p-3 hover:border-explorer-accent transition-colors"
          >
            <div className="flex items-start gap-3 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getMethodColor(endpoint.method)}`}>
                {endpoint.method}
              </span>
              <span className="text-explorer-text font-mono text-sm break-all">
                {endpoint.path}
              </span>
            </div>

            {endpoint.description && (
              <p className="text-explorer-text-dim text-xs mb-3 italic">
                {endpoint.description}
              </p>
            )}

            {endpoint.queryParams && endpoint.queryParams.length > 0 && (
              <div className="mb-3">
                <h4 className="text-explorer-text-dim text-[10px] font-bold uppercase mb-1">Query Parameters</h4>
                <div className="grid grid-cols-1 gap-1">
                  {endpoint.queryParams.map((p: any) => (
                    <div key={p.name} className="flex items-center gap-2 text-xs">
                      <span className="text-explorer-accent font-mono">{p.name}</span>
                      <span className="text-explorer-text-dim opacity-50">:</span>
                      <span className="text-blue-400 opacity-80">{p.type}</span>
                      {p.description && <span className="text-explorer-text-dim ml-1 truncate">({p.description})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {endpoint.requestBody && Object.keys(endpoint.requestBody).length > 0 && (
              <div className="mb-3">
                <h4 className="text-explorer-text-dim text-[10px] font-bold uppercase mb-1">Request Body</h4>
                <div className="grid grid-cols-1 gap-1">
                  {Object.entries(endpoint.requestBody).map(([name, type]: [string, any]) => (
                    <div key={name} className="flex items-center gap-2 text-xs">
                      <span className="text-orange-400 font-mono">{name}</span>
                      <span className="text-explorer-text-dim opacity-50">:</span>
                      <span className="text-blue-400 opacity-80">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {endpoint.sourceLocations && endpoint.sourceLocations.length > 0 && (
              <div className="mt-3 pt-2 border-t border-explorer-border/50">
                <h4 className="text-explorer-text-dim text-[10px] font-bold uppercase mb-1">Calls</h4>
                <div className="flex flex-wrap gap-1">
                  {endpoint.sourceLocations.map((loc: any, j: number) => (
                    <button
                      key={j}
                      onClick={() => selectFile(loc.file, loc.line)}
                      className="text-[10px] bg-explorer-bg border border-explorer-border px-1.5 py-0.5 rounded text-explorer-accent hover:bg-explorer-border transition-colors truncate max-w-[150px]"
                      title={`${loc.file}:${loc.line}`}
                    >
                      {loc.file.split('/').pop()}:{loc.line}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getMethodColor(method: string) {
  const m = method.toUpperCase();
  if (m === 'GET') return 'bg-green-900/30 text-green-400 border border-green-800/50';
  if (m === 'POST') return 'bg-blue-900/30 text-blue-400 border border-blue-800/50';
  if (m === 'PUT') return 'bg-orange-900/30 text-orange-400 border border-orange-800/50';
  if (m === 'DELETE') return 'bg-red-900/30 text-red-400 border border-red-800/50';
  return 'bg-gray-800 text-gray-400 border border-gray-700';
}
