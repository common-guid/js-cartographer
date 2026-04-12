export class KeyManager {
  private keys: string[];
  private currentIndex: number = 0;
  private failedKeys: Set<string> = new Set();

  constructor(keys: string[]) {
    this.keys = keys;
  }

  /**
   * Returns the next available API key in a round-robin fashion.
   * Throws an error if no keys are available.
   */
  getNextKey(): string {
    const availableKeys = this.keys.filter(key => !this.failedKeys.has(key));
    
    if (availableKeys.length === 0) {
      throw new Error("No available API keys. All keys have been marked as failed.");
    }

    // We need to ensure we return keys in round-robin order even as keys fail.
    // A simple way is to just use the currentIndex against the original keys list
    // and skip failed ones until we find a good one.
    
    let attempts = 0;
    while (attempts < this.keys.length) {
      const key = this.keys[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      
      if (!this.failedKeys.has(key)) {
        return key;
      }
      attempts++;
    }

    // Fallback (should be covered by the filter check above)
    throw new Error("No available API keys.");
  }

  /**
   * Marks a key as failed (e.g., after a 429 error).
   * Failed keys are removed from rotation.
   */
  markKeyAsFailed(key: string): void {
    this.failedKeys.add(key);
  }

  /**
   * Returns the number of keys currently in the rotation.
   */
  get availableCount(): number {
    return this.keys.length - this.failedKeys.size;
  }
}
