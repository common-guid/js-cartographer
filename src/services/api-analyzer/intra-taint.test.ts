import { describe, it } from "node:test";
import assert from "node:assert";
import { findIntraProceduralFlows } from "./intra-taint.js";

describe("intra-procedural taint tracking", () => {
  it("detects a direct source-to-sink flow", async () => {
    const code = `
      const tainted = location.hash;
      eval(tainted);
    `;
    const flows = await findIntraProceduralFlows(code);
    assert.strictEqual(flows.length, 1);
    assert.strictEqual(flows[0].source.name, "location.hash");
    assert.strictEqual(flows[0].sink.name, "eval");
  });

  it("detects flow through assignment", async () => {
    const code = `
      const val = location.hash;
      const other = val;
      eval(other);
    `;
    const flows = await findIntraProceduralFlows(code);
    assert.strictEqual(flows.length, 1);
    assert.strictEqual(flows[0].source.name, "location.hash");
    assert.strictEqual(flows[0].sink.name, "eval");
  });

  it("detects flow through string concatenation", async () => {
    const code = `
      const val = location.hash;
      const combined = "prefix" + val;
      eval(combined);
    `;
    const flows = await findIntraProceduralFlows(code);
    assert.strictEqual(flows.length, 1);
    assert.strictEqual(flows[0].source.name, "location.hash");
    assert.strictEqual(flows[0].sink.name, "eval");
  });

  it("detects flow through template literals", async () => {
    const code = `
      const val = location.hash;
      const template = \`data: \${val}\`;
      eval(template);
    `;
    const flows = await findIntraProceduralFlows(code);
    assert.strictEqual(flows.length, 1);
    assert.strictEqual(flows[0].source.name, "location.hash");
    assert.strictEqual(flows[0].sink.name, "eval");
  });

  it("handles reassignments correctly", async () => {
    const code = `
      let x = "safe";
      if (condition) {
        x = location.hash;
      }
      eval(x);
    `;
    const flows = await findIntraProceduralFlows(code);
    // x could be tainted
    assert.strictEqual(flows.length, 1);
    assert.strictEqual(flows[0].source.name, "location.hash");
    assert.strictEqual(flows[0].sink.name, "eval");
  });
});
