import test from "node:test";
import assert from "node:assert";
import { SourcemapService } from "./index.js";

test("SourcemapService: identifies original names for a given position", async () => {
  // Mock a simple sourcemap
  const rawSourceMap = {
    version: 3,
    file: "bundle.js",
    sources: ["app.js"],
    names: ["myFunction", "myVariable"],
    mappings: "AAAA,IAAMA,EAAa,CAAnB,SAASC,GAAe",
    // AAAA: line 0, col 0 -> app.js, line 0, col 0
    // IAAMA: line 0, col 4 -> app.js, line 0, col 4, name 0 (myFunction)
    // EAAa: line 0, col 6 -> app.js, line 0, col 6
    // ... this is just a placeholder, real mappings are more complex
  };

  const service = new SourcemapService(rawSourceMap);
  await service.init();
  
  try {
    const name = await service.getOriginalName(0, 4); 
    assert.strictEqual(name, "myFunction");
  } finally {
    service.destroy();
  }
});

test("SourcemapService: returns null for unmapped positions", async () => {
  const rawSourceMap = {
    version: 3,
    file: "bundle.js",
    sources: ["app.js"],
    names: [],
    mappings: "AAAA",
  };

  const service = new SourcemapService(rawSourceMap);
  await service.init();
  try {
    const name = await service.getOriginalName(10, 10);
    assert.strictEqual(name, null);
  } finally {
    service.destroy();
  }
});
