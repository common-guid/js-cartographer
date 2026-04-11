import test from "node:test";
import assert from "node:assert";
import { visitAllIdentifiers } from "../../plugins/local-llm-rename/visit-all-identifiers.js";
import { SourcemapService } from "./index.js";

test("visitAllIdentifiers with Truth Injection (Sourcemap)", async () => {
  const code = "function a(b) { console.log(b); }";
  
  // Mock sourcemap mapping 'a' to 'myFunction'
  // 'a' is at line 1, col 9 (0-indexed line 0, col 9)
  const rawSourceMap = {
    version: 3,
    file: "bundle.js",
    sources: ["src.js"],
    names: ["myFunction"],
    mappings: "AAAA,SAASA,EAAE,CAAC,EAAE,CAAE,OAAO,CAAC,GAAG,CAAC,CAAC,CAAC,CAAE", 
    // This mapping is hand-waived for now, we'll manually mock the service result
  };

  const service = new SourcemapService(rawSourceMap);
  await service.init();
  
  // Monkey-patch the service to return what we want for this test
  // since generating a valid VLQ mapping by hand is hard.
  service.getOriginalName = async (line, col) => {
    if (line === 0 && col === 9) return "myFunction";
    return null;
  };

  let visitorCalledForA = false;
  let visitorCalledForB = false;

  const result = await visitAllIdentifiers(
    code,
    async (name, context) => {
      if (name === "a") visitorCalledForA = true;
      if (name === "b") visitorCalledForB = true;
      return name === "b" ? "myVariable" : name;
    },
    1000,
    undefined,
    true, // renameAll
    service
  );

  assert.strictEqual(visitorCalledForA, false, "Visitor should NOT be called for 'a' (Truth Injection)");
  assert.strictEqual(visitorCalledForB, true, "Visitor SHOULD be called for 'b'");
  assert.ok(result.includes("function myFunction(myVariable)"), "Result should have Truth-Injected name");
  
  service.destroy();
});
