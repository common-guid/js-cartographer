import { SourceMapConsumer, RawSourceMap } from "source-map";

export class SourcemapService {
  private consumer: SourceMapConsumer | null = null;
  private rawSourceMap: RawSourceMap;

  constructor(rawSourceMap: any) {
    this.rawSourceMap = rawSourceMap as RawSourceMap;
  }

  /**
   * Initializes the SourceMapConsumer.
   * This MUST be called before any other methods.
   */
  async init() {
    this.consumer = await new SourceMapConsumer(this.rawSourceMap);
  }

  /**
   * Destroys the SourceMapConsumer to release memory.
   */
  destroy() {
    if (this.consumer) {
      this.consumer.destroy();
      this.consumer = null;
    }
  }

  /**
   * Returns the original name for a given line and column in the generated code.
   * Returns null if no mapping is found or no name is associated with the mapping.
   */
  async getOriginalName(line: number, column: number): Promise<string | null> {
    if (!this.consumer) {
      throw new Error("SourcemapService not initialized. Call init() first.");
    }

    const pos = this.consumer.originalPositionFor({
      line: line + 1, // source-map uses 1-based lines
      column: column, // source-map uses 0-based columns
    });

    return pos.name || null;
  }
}
