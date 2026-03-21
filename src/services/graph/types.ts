export interface FileNode {
  id: string;          // Relative path (e.g., "src/utils.js")
  imports: string[];   // List of file paths this file imports
  exports: string[];   // List of named exports (e.g., "login", "validate")
}

export interface ModuleGraph {
  files: Record<string, FileNode>;
  entryPoint?: string; // The main file (if detected)
}
