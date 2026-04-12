import test from "node:test";
import assert from "node:assert";
import { DiscoveryService } from "./index.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

test("DiscoveryService: scanDirectory finds all .js files", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "discovery-test-"));
  try {
    await fs.writeFile(path.join(tmpDir, "file1.js"), "");
    await fs.writeFile(path.join(tmpDir, "file2.js"), "");
    await fs.writeFile(path.join(tmpDir, "notes.txt"), "");
    await fs.mkdir(path.join(tmpDir, "subdir"));
    await fs.writeFile(path.join(tmpDir, "subdir", "file3.js"), "");

    const service = new DiscoveryService();
    const files = await service.scanDirectory(tmpDir);

    assert.strictEqual(files.length, 3);
    assert.ok(files.some(f => f.endsWith("file1.js")));
    assert.ok(files.some(f => f.endsWith("file2.js")));
    assert.ok(files.some(f => f.endsWith("file3.js")));
  } finally {
    await fs.rm(tmpDir, { recursive: true });
  }
});

test("DiscoveryService: matchSourcemaps pairs JS with Maps", async () => {
  const jsDir = await fs.mkdtemp(path.join(os.tmpdir(), "js-test-"));
  const mapDir = await fs.mkdtemp(path.join(os.tmpdir(), "map-test-"));
  
  try {
    const jsPath = path.join(jsDir, "chunk.js");
    const mapPath = path.join(mapDir, "chunk.js.map");
    
    // 1. Matching via comment
    await fs.writeFile(jsPath, "console.log(1);\n//# sourceMappingURL=custom.map");
    await fs.writeFile(path.join(mapDir, "custom.map"), "{}");
    
    const service = new DiscoveryService();
    const pairs = await service.matchSourcemaps([jsPath], mapDir);
    
    assert.strictEqual(pairs.length, 1);
    assert.strictEqual(pairs[0].jsPath, jsPath);
    assert.strictEqual(pairs[0].mapPath, path.join(mapDir, "custom.map"));

    // 2. Matching via filename fallback
    const jsPath2 = path.join(jsDir, "fallback.js");
    await fs.writeFile(jsPath2, "console.log(2);");
    await fs.writeFile(path.join(mapDir, "fallback.js.map"), "{}");
    
    const pairs2 = await service.matchSourcemaps([jsPath2], mapDir);
    assert.strictEqual(pairs2[0].mapPath, path.join(mapDir, "fallback.js.map"));

    // 3. No match
    const jsPath3 = path.join(jsDir, "none.js");
    await fs.writeFile(jsPath3, "console.log(3);");
    const pairs3 = await service.matchSourcemaps([jsPath3], mapDir);
    assert.strictEqual(pairs3[0].mapPath, undefined);

  } finally {
    await Promise.all([
      fs.rm(jsDir, { recursive: true }),
      fs.rm(mapDir, { recursive: true })
    ]);
  }
});
