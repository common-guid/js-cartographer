import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import crypto from "node:crypto";

export class StateCache {
  private cachePath: string;
  private state: Record<string, string> = {};

  constructor(outputDir: string) {
    this.cachePath = path.join(outputDir, ".cartographer-cache.json");
  }

  /**
   * Initializes the cache by reading from disk if it exists.
   */
  async init(): Promise<void> {
    if (existsSync(this.cachePath)) {
      try {
        const content = await fs.readFile(this.cachePath, "utf-8");
        this.state = JSON.parse(content);
      } catch (e) {
        console.warn(`[Cache] Failed to read cache at ${this.cachePath}. Starting fresh.`);
        this.state = {};
      }
    }
  }

  /**
   * Checks if a file has already been successfully processed with the given content.
   */
  async isCompleted(filePath: string, content: string): Promise<boolean> {
    const hash = this.hashContent(content);
    return this.state[filePath] === hash;
  }

  private savePromise: Promise<void> | null = null;
  private needsSave = false;

  /**
   * Marks a file as successfully completed.
   */
  async markAsCompleted(filePath: string, content: string): Promise<void> {
    const hash = this.hashContent(content);
    this.state[filePath] = hash;
    await this.queueSave();
  }

  private async queueSave(): Promise<void> {
    if (this.savePromise) {
      this.needsSave = true;
      return this.savePromise;
    }

    this.savePromise = this.save().finally(() => {
      this.savePromise = null;
      if (this.needsSave) {
        this.needsSave = false;
        this.queueSave();
      }
    });

    return this.savePromise;
  }

  private hashContent(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  private async save(): Promise<void> {
    try {
      // Ensure directory exists (though unminify usually handles this)
      await fs.mkdir(path.dirname(this.cachePath), { recursive: true });
      await fs.writeFile(this.cachePath, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error(`[Cache] Failed to save cache at ${this.cachePath}:`, e);
    }
  }
}
