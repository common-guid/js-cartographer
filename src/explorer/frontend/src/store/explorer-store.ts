import { create } from 'zustand';
import type { CallGraphData, ModuleGraph, FunctionNode } from '../lib/types';

export type GraphView = 'call-graph' | 'module-graph';

interface NavigationEntry {
  file: string;
  line?: number;
  nodeId?: string;
}

interface ExplorerState {
  // Data
  callGraph: CallGraphData | null;
  moduleGraph: ModuleGraph | null;
  loading: boolean;
  error: string | null;

  // View
  graphView: GraphView;
  setGraphView: (view: GraphView) => void;

  // Selection
  selectedNodeId: string | null;
  selectedFile: string | null;
  selectedLine: number | null;
  fileContent: string | null;
  fileLoading: boolean;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Navigation history
  history: NavigationEntry[];
  historyIndex: number;

  // Actions
  fetchGraphs: () => Promise<void>;
  selectNode: (nodeId: string) => void;
  selectFile: (file: string, line?: number) => void;
  fetchFile: (filePath: string) => Promise<void>;
  navigateBack: () => void;
  navigateForward: () => void;
  highlightNodeByName: (name: string) => void;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  // Data
  callGraph: null,
  moduleGraph: null,
  loading: true,
  error: null,

  // View
  graphView: 'call-graph',
  setGraphView: (view) => set({ graphView: view }),

  // Selection
  selectedNodeId: null,
  selectedFile: null,
  selectedLine: null,
  fileContent: null,
  fileLoading: false,

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Navigation
  history: [],
  historyIndex: -1,

  // Actions
  fetchGraphs: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/graphs');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch graphs');
      }
      const data = await res.json();
      set({ callGraph: data.callGraph, moduleGraph: data.moduleGraph, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  selectNode: (nodeId: string) => {
    const { callGraph } = get();
    if (!callGraph) return;

    const node: FunctionNode | undefined = callGraph.nodes[nodeId];
    if (node) {
      const entry: NavigationEntry = { file: node.file, line: node.line, nodeId };
      const { history, historyIndex } = get();
      const newHistory = [...history.slice(0, historyIndex + 1), entry];

      set({
        selectedNodeId: nodeId,
        selectedFile: node.file,
        selectedLine: node.line,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });

      get().fetchFile(node.file);
    }
  },

  selectFile: (file: string, line?: number) => {
    const entry: NavigationEntry = { file, line };
    const { history, historyIndex } = get();
    const newHistory = [...history.slice(0, historyIndex + 1), entry];

    set({
      selectedFile: file,
      selectedLine: line ?? null,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().fetchFile(file);
  },

  fetchFile: async (filePath: string) => {
    set({ fileLoading: true });
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch file');
      }
      const data = await res.json();
      set({ fileContent: data.content, fileLoading: false });
    } catch (error: any) {
      set({ fileContent: `// Error loading file: ${error.message}`, fileLoading: false });
    }
  },

  navigateBack: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    set({
      historyIndex: newIndex,
      selectedFile: entry.file,
      selectedLine: entry.line ?? null,
      selectedNodeId: entry.nodeId ?? null,
    });
    get().fetchFile(entry.file);
  },

  navigateForward: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    set({
      historyIndex: newIndex,
      selectedFile: entry.file,
      selectedLine: entry.line ?? null,
      selectedNodeId: entry.nodeId ?? null,
    });
    get().fetchFile(entry.file);
  },

  highlightNodeByName: (name: string) => {
    const { callGraph } = get();
    if (!callGraph) return;

    // Find node by function name
    const node = Object.values(callGraph.nodes).find((n) => n.name === name);
    if (node) {
      set({ selectedNodeId: node.id });
    }
  },
}));
