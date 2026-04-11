/** Matches the backend CallGraphData schema */
export interface FunctionNode {
  id: string;
  file: string;
  name: string;
  line: number;
}

export interface CallEdge {
  from: string;
  to: string;
  type: 'internal' | 'external';
}

export interface CallGraphData {
  nodes: Record<string, FunctionNode>;
  edges: CallEdge[];
}

/** Matches the backend ModuleGraph schema */
export interface FileNode {
  id: string;
  imports: string[];
  exports: string[];
}

export interface ModuleGraph {
  files: Record<string, FileNode>;
  entryPoint?: string;
}

export interface ApiParameter {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  queryParams?: ApiParameter[];
  requestBody?: Record<string, string>;
  sourceLocations?: { file: string; line: number; column: number }[];
  description?: string;
}

export interface ApiSurface {
  baseUrl?: string;
  endpoints: ApiEndpoint[];
}

/** API response from /api/graphs */
export interface GraphsResponse {
  callGraph: CallGraphData | null;
  moduleGraph: ModuleGraph | null;
  apiSurface: ApiSurface | null;
}

/** API response from /api/file */
export interface FileResponse {
  path: string;
  content: string;
}

/** API response from /api/files */
export interface FilesResponse {
  files: string[];
}
