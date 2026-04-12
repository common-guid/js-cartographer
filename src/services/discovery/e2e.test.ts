import test from "node:test";
import assert from "node:assert";
import { DiscoveryService } from "./index.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

test("DiscoveryService E2E: matches real fixture bundle with map", async () => {
  const jsDir = path.resolve("fixtures/webpack-hello-world/dist");
  const service = new DiscoveryService();
  
  const jsFiles = await service.scanDirectory(jsDir);
  const tasks = await service.matchSourcemaps(jsFiles, jsDir);
  
  const bundleTask = tasks.find(t => t.jsPath.endsWith("bundle.js"));
  assert.ok(bundleTask, "Should find bundle.js");
  assert.ok(bundleTask?.mapPath?.endsWith("bundle.js.map"), "Should match with bundle.js.map");
});

test("DiscoveryService E2E: handles directory with multiple chunks", async () => {
  // Create a mock chunks directory
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "chunks-test-"));
  const mapsDir = await fs.mkdtemp(path.join(os.tmpdir(), "maps-test-"));
  
  try {
    await fs.writeFile(path.join(tmpDir, "chunk1.js"), "console.log(1); //# sourceMappingURL=c1.map");
    await fs.writeFile(path.join(tmpDir, "chunk2.js"), "console.log(2);");
    
    await fs.writeFile(path.join(mapsDir, "c1.map"), "{}");
    await fs.writeFile(path.join(mapsDir, "chunk2.js.map"), "{}");
    
    const service = new DiscoveryService();
    const jsFiles = await service.scanDirectory(tmpDir);
    const tasks = await service.matchSourcemaps(jsFiles, mapsDir);
    
    assert.strictEqual(tasks.length, 2);
    
    const t1 = tasks.find(t => t.jsPath.endsWith("chunk1.js"));
    const t2 = tasks.find(t => t.jsPath.endsWith("chunk2.js"));
    
    assert.strictEqual(t1?.mapPath, path.join(mapsDir, "c1.map"));
    assert.strictEqual(t2?.mapPath, path.join(mapsDir, "chunk2.js.map"));
  } finally {
    await Promise.all([
      fs.rm(tmpDir, { recursive: true }),
      fs.rm(mapsDir, { recursive: true })
    ]);
  }
});
