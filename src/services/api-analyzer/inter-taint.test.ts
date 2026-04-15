import { describe, it } from "node:test";
import assert from "node:assert";
import { InterProceduralAnalyzer } from "./inter-taint.js";
import { CallGraphData } from "../callgraph/types.js";

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

  describe("integrated cross-file flows", () => {
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
      const flows = await analyzer.analyzeProject(files, callGraph);
      
      assert.ok(flows.some(f => f.source.name === "location.hash" && f.sink.name === "eval"));
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
      
      assert.ok(flows.some(f => f.source.name === "location.hash" && f.sink.name === "eval"));
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
      
      assert.ok(flows.some(f => f.source.name === "location.hash" && f.sink.name === "eval"));
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
      
      assert.ok(flows.some(f => f.source.name === "location.hash" && f.sink.name === "eval"));
    });

    it("reconstructs the full taint path", async () => {
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
      const flows = await analyzer.analyzeProject(files, callGraph);
      
      const flow = flows.find((f: any) => f.source.name === "location.hash" && f.sink.name === "eval");
      assert.ok(flow, "Flow not found");
      assert.ok(flow.path && flow.path.length >= 2, "Path should be reconstructed");
      assert.ok(flow.path.some((p: any) => p.file === "src/index.js" && p.name === "validate"), "Path should include the call to validate");
    });
  });
});
