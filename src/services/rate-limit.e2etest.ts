import test from "node:test";
import assert from "node:assert";
import { KeyManager } from "./key-manager/index.js";
import { withRetry } from "../concurrency.js";

test("Rate-Limit Integration: rotates key on 429", async () => {
  const keys = ["key1", "key2"];
  const keyManager = new KeyManager(keys);
  
  let currentKey = keyManager.getNextKey();
  let callCount = 0;

  // Mock function that fails once with 429 then succeeds
  const mockApiCall = async () => {
    callCount++;
    if (callCount === 1) {
      const err: any = new Error("Rate Limit");
      err.status = 429;
      throw err;
    }
    return `Success with ${currentKey}`;
  };

  const result = await withRetry(
    async () => {
      return await mockApiCall();
    },
    {
      onRetry: (err) => {
        if (err.status === 429) {
          keyManager.markKeyAsFailed(currentKey);
          currentKey = keyManager.getNextKey();
        }
      }
    }
  );

  assert.strictEqual(callCount, 2);
  assert.strictEqual(currentKey, "key2");
  assert.strictEqual(result, "Success with key2");
  assert.strictEqual(keyManager.availableCount, 1);
});
