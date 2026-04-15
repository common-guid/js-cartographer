import { describe, it } from "node:test";
import assert from "node:assert";
import { InterProceduralAnalyzer } from "./inter-taint.js";
import { CallGraphData } from "../callgraph/types.js";

describe("integrated inter-procedural taint tracking", () => {
  it("detects cross-file flow using call-graph", async () => {
    const files = [
      {
        path: "src/auth.js",
        code: `
          function validate(data) {
            eval(data);
          }
          export { validate };
        `
      },
      {
        path: "src/index.js",
        code: `
          import { validate } from './auth.js';
          function main() {
            const tainted = location.hash;
            validate(tainted);
          }
          main();
        `
      }
    ];

    const callGraph: CallGraphData = {
      nodes: {
        "src/auth.js:validate": { id: "src/auth.js:validate", file: "src/auth.js", name: "validate", line: 2 },
        "src/index.js:main": { id: "src/index.js:main", file: "src/index.js", name: "main", line: 3 }
      },
      edges: [
        { from: "src/index.js:main", to: "src/auth.js:validate", type: "external" }
      ]
    };

    const analyzer = new InterProceduralAnalyzer();
    // Currently, it doesn't take a call-graph or files. This is my TARGET API.
    // I'm writing this test to define what I WANT.
    const flows = await (analyzer as any).analyzeProject(files, callGraph);
    
    assert.ok(flows.some((f: any) => f.source.name === "location.hash" && f.sink.name === "eval"));
  });

  it("detects cross-file flow using namespace import", async () => {
    const files = [
      {
        path: "src/auth.js",
        code: `
          function validate(data) {
            eval(data);
          }
          export { validate };
        `
      },
      {
        path: "src/index.js",
        code: `
          import * as auth from './auth.js';
          function main() {
            const tainted = location.hash;
            auth.validate(tainted);
          }
          main();
        `
      }
    ];

    const callGraph: CallGraphData = {
      nodes: {
        "src/auth.js:validate": { id: "src/auth.js:validate", file: "src/auth.js", name: "validate", line: 2 },
        "src/index.js:main": { id: "src/index.js:main", file: "src/index.js", name: "main", line: 3 }
      },
      edges: [
        { from: "src/index.js:main", to: "src/auth.js:validate", type: "external" }
      ]
    };

    const analyzer = new InterProceduralAnalyzer();
    const flows = await analyzer.analyzeProject(files, callGraph);
    
    assert.ok(flows.some((f: any) => f.source.name === "location.hash" && f.sink.name === "eval"));
  });

  it("detects cross-file flow using CommonJS require", async () => {
    const files = [
      {
        path: "src/auth.js",
        code: `
          function validate(data) {
            eval(data);
          }
          module.exports = { validate };
        `
      },
      {
        path: "src/index.js",
        code: `
          const auth = require('./auth.js');
          function main() {
            const tainted = location.hash;
            auth.validate(tainted);
          }
          main();
        `
      }
    ];

    const callGraph: CallGraphData = {
      nodes: {
        "src/auth.js:validate": { id: "src/auth.js:validate", file: "src/auth.js", name: "validate", line: 2 },
        "src/index.js:main": { id: "src/index.js:main", file: "src/index.js", name: "main", line: 3 }
      },
      edges: [
        { from: "src/index.js:main", to: "src/auth.js:validate", type: "external" }
      ]
    };

    const analyzer = new InterProceduralAnalyzer();
    const flows = await analyzer.analyzeProject(files, callGraph);
    
    assert.ok(flows.some((f: any) => f.source.name === "location.hash" && f.sink.name === "eval"));
  });

  it("detects cross-file flow using default import", async () => {
    const files = [
      {
        path: "src/auth.js",
        code: `
          export default function validate(data) {
            eval(data);
          }
        `
      },
      {
        path: "src/index.js",
        code: `
          import validate from './auth.js';
          function main() {
            const tainted = location.hash;
            validate(tainted);
          }
          main();
        `
      }
    ];

    const callGraph: CallGraphData = {
      nodes: {
        "src/auth.js:validate": { id: "src/auth.js:validate", file: "src/auth.js", name: "validate", line: 2 },
        "src/index.js:main": { id: "src/index.js:main", file: "src/index.js", name: "main", line: 3 }
      },
      edges: [
        { from: "src/index.js:main", to: "src/auth.js:default", type: "external" }
      ]
    };

    const analyzer = new InterProceduralAnalyzer();
    const flows = await analyzer.analyzeProject(files, callGraph);
    
    // Note: We need to make sure 'src/auth.js:default' summary is available.
    // In our current summarizeFunction, it uses path.node.id.name.
    // For default export function, id.name is 'validate'.
    // So the summary ID is 'src/auth.js:validate'.
    // But the call-graph says 'src/auth.js:default'.
    
    assert.ok(flows.some((f: any) => f.source.name === "location.hash" && f.sink.name === "eval"));
  });
});
