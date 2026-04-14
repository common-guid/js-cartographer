import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { ApiAnalyzer } from "./index.js";

describe("ApiAnalyzer", () => {
  it("builds an api surface from a directory of files", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "api-analyzer-test-"));
    try {
      await fs.writeFile(
        path.join(tmpDir, "api.js"),
        "fetch('/api/users'); axios.post('/api/posts', { title: 'test' });"
      );

      const analyzer = new ApiAnalyzer();
      const { apiSurface: surface, securityFindings } = await analyzer.build(tmpDir);

      assert.strictEqual(surface.endpoints.length, 2);
      assert.ok(surface.endpoints.find(e => e.path === "/api/users"));
      assert.ok(surface.endpoints.find(e => e.path === "/api/posts" && e.method === "POST"));
      assert.strictEqual(securityFindings.length, 2); // 2 API sinks
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
