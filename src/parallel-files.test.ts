import assert from "assert";
import test from "node:test";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { pLimit } from "./concurrency.js";

/**
 * These tests validate the parallel file processing pattern used in
 * unminify.ts without requiring webcrack or an LLM. They exercise the
 * pLimit-based concurrency approach directly on mock file sets.
 */

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "parallel-test-"));
}

test("parallel processing: all files get processed", async () => {
  const dir = await makeTempDir();
  const files = ["a.js", "b.js", "c.js"];
  for (const f of files) {
    await fs.writeFile(path.join(dir, f), `var x = "${f}";`);
  }

  const limit = pLimit(2);
  const plugin = async (code: string) => code.replace("var", "const");

  await Promise.all(
    files.map((f) =>
      limit(async () => {
        const filePath = path.join(dir, f);
        const code = await fs.readFile(filePath, "utf-8");
        const result = await plugin(code);
        await fs.writeFile(filePath, result);
      })
    )
  );

  for (const f of files) {
    const content = await fs.readFile(path.join(dir, f), "utf-8");
    assert.ok(
      content.startsWith("const"),
      `File ${f} should have been transformed: ${content}`
    );
  }

  await fs.rm(dir, { recursive: true });
});

test("parallel processing: concurrency is respected with file I/O", async () => {
  const dir = await makeTempDir();
  const fileCount = 6;
  for (let i = 0; i < fileCount; i++) {
    await fs.writeFile(path.join(dir, `${i}.js`), `var x = ${i};`);
  }

  let active = 0;
  let maxActive = 0;
  const limit = pLimit(2);

  await Promise.all(
    Array.from({ length: fileCount }, (_, i) =>
      limit(async () => {
        active++;
        if (active > maxActive) maxActive = active;
        const filePath = path.join(dir, `${i}.js`);
        const code = await fs.readFile(filePath, "utf-8");
        // Simulate slow plugin work
        await new Promise((r) => setTimeout(r, 30));
        await fs.writeFile(filePath, code.replace("var", "let"));
        active--;
      })
    )
  );

  assert.strictEqual(
    maxActive,
    2,
    `Max active files should be 2, was ${maxActive}`
  );

  // Verify all files were processed
  for (let i = 0; i < fileCount; i++) {
    const content = await fs.readFile(path.join(dir, `${i}.js`), "utf-8");
    assert.ok(content.startsWith("let"), `File ${i}.js not transformed: ${content}`);
  }

  await fs.rm(dir, { recursive: true });
});

test("parallel processing: empty files are skipped gracefully", async () => {
  const dir = await makeTempDir();
  await fs.writeFile(path.join(dir, "a.js"), "var x = 1;");
  await fs.writeFile(path.join(dir, "empty.js"), "");
  await fs.writeFile(path.join(dir, "b.js"), "var y = 2;");

  const limit = pLimit(3);
  const processed: string[] = [];

  await Promise.all(
    ["a.js", "empty.js", "b.js"].map((f) =>
      limit(async () => {
        const filePath = path.join(dir, f);
        const code = await fs.readFile(filePath, "utf-8");
        if (code.trim().length === 0) return; // skip empty
        processed.push(f);
        await fs.writeFile(filePath, code.replace("var", "const"));
      })
    )
  );

  assert.deepStrictEqual(processed.sort(), ["a.js", "b.js"]);
  // Empty file should remain unchanged
  const emptyContent = await fs.readFile(path.join(dir, "empty.js"), "utf-8");
  assert.strictEqual(emptyContent, "");

  await fs.rm(dir, { recursive: true });
});

test("parallel processing: fileConcurrency=1 processes sequentially", async () => {
  const dir = await makeTempDir();
  for (let i = 0; i < 3; i++) {
    await fs.writeFile(path.join(dir, `${i}.js`), `var x = ${i};`);
  }

  const order: number[] = [];
  const limit = pLimit(1);

  await Promise.all(
    [0, 1, 2].map((i) =>
      limit(async () => {
        order.push(i);
        await new Promise((r) => setTimeout(r, 10));
      })
    )
  );

  assert.deepStrictEqual(order, [0, 1, 2], "Sequential order not preserved");

  await fs.rm(dir, { recursive: true });
});

test("parallel processing: error in one file does not prevent others", async () => {
  const dir = await makeTempDir();
  await fs.writeFile(path.join(dir, "good.js"), "var x = 1;");
  await fs.writeFile(path.join(dir, "bad.js"), "var y = 2;");

  const limit = pLimit(2);
  const results = await Promise.allSettled([
    limit(async () => {
      const code = await fs.readFile(path.join(dir, "good.js"), "utf-8");
      await fs.writeFile(path.join(dir, "good.js"), code.replace("var", "const"));
    }),
    limit(async () => {
      throw new Error("simulated API failure");
    }),
  ]);

  assert.strictEqual(results[0].status, "fulfilled");
  assert.strictEqual(results[1].status, "rejected");
  // good.js should still have been processed
  const goodContent = await fs.readFile(path.join(dir, "good.js"), "utf-8");
  assert.ok(goodContent.startsWith("const"));

  await fs.rm(dir, { recursive: true });
});
