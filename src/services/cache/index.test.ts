import test from "node:test";
import assert from "node:assert";
import { StateCache } from "./index.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

test("StateCache: correctly identifies completed files by hash", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cache-test-"));
  const cachePath = path.join(tmpDir, ".cartographer-cache.json");
  
  try {
    const cache = new StateCache(tmpDir);
    await cache.init();

    const filePath = "src/app.js";
    const content = "console.log('hello')";
    
    assert.strictEqual(await cache.isCompleted(filePath, content), false);

    await cache.markAsCompleted(filePath, content);
    assert.strictEqual(await cache.isCompleted(filePath, content), true);

    // Different content should not be completed
    assert.strictEqual(await cache.isCompleted(filePath, "different code"), false);
  } finally {
    await fs.rm(tmpDir, { recursive: true });
  }
});

test("StateCache: persists state to disk", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cache-persist-test-"));
  
  try {
    const cache1 = new StateCache(tmpDir);
    await cache1.init();
    await cache1.markAsCompleted("test.js", "code");

    // Create a new instance pointing to same dir
    const cache2 = new StateCache(tmpDir);
    await cache2.init();
    assert.strictEqual(await cache2.isCompleted("test.js", "code"), true);
  } finally {
    await fs.rm(tmpDir, { recursive: true });
  }
});
