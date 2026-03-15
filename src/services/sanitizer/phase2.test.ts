import test from "node:test";
import assert from "node:assert";
import { WakaruSanitizer } from "./index.js";

test("WakaruSanitizer successfully applies rules and formats code", async () => {
  const sanitizer = new WakaruSanitizer();

  // A generator simulating transpiled async/await and a yoda condition
  const inputCode = `function *t(){ if(null==x) yield 1; }`;

  const result = await sanitizer.transform(inputCode, "test-phase2.js");

  assert.ok(
    result.code.includes("if (x == null)"),
    "Yoda condition should be flipped and properly formatted."
  );
});
