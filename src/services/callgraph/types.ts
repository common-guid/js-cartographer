export interface FunctionNode {
  id: string;          // Unique ID (e.g., "src/auth.js:validateUser")
  file: string;        // "src/auth.js"
  name: string;        // "validateUser"
  line: number;        // Line number where defined
}

export interface CallEdge {
  from: string;        // ID of the caller function
  to: string;          // ID of the callee function
  type: 'internal' | 'external'; // internal = same file, external = import
}

export interface CallGraphData {
  nodes: Record<string, FunctionNode>; // Registry of all functions
  edges: CallEdge[];                   // List of all calls
}
