import { describe, it } from "node:test";
import assert from "node:assert";
import { InterProceduralAnalyzer } from "./inter-taint.js";

describe("inter-procedural taint tracking", () => {
  it("detects flow through a function call parameter", async () => {
    const code = `
      function sink(data) {
        eval(data);
      }
      
      function entry() {
        const tainted = location.hash;
        sink(tainted);
      }
    `;
    const analyzer = new InterProceduralAnalyzer();
    const flows = await analyzer.analyze(code);
    
    assert.ok(flows.some(f => f.source.name === "location.hash" && f.sink.name === "eval"));
  });

  it("detects flow through a return value", async () => {
    const code = `
      function source() {
        return location.hash;
      }
      
      function entry() {
        const data = source();
        eval(data);
      }
    `;
    const analyzer = new InterProceduralAnalyzer();
    const flows = await analyzer.analyze(code);
    
    assert.ok(flows.some(f => f.source.name === "location.hash" && f.sink.name === "eval"));
  });
});
