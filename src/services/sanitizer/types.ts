export interface SanitizerConfig {
  /**
   * Master switch for the sanitizer.
   * If false, the transformer returns the original code immediately.
   * Useful for the CLI flag --no-sanitizer.
   */
  enabled: boolean;

  /**
   * Phase 3 Toggle: Enables heuristic renaming (smart-rename) and
   * constant simplification (un-undefined, un-infinity).
   * Default: true
   */
  useHeuristicNaming?: boolean;
}

export interface TransformationResult {
  code: string;
  /**
   * Preserved for Phase 4/5 (Call Graph).
   * Wakaru can return source maps; we store them here to avoid data loss.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map?: any;
}

export interface CodeTransformer {
  name: string;
  transform(code: string, filepath: string): Promise<TransformationResult>;
}
