import { describe, it } from "node:test";
import assert from "node:assert";
import { detectFrameworks } from "./framework-detector.js";

describe("framework-detector (routing)", () => {
  it("detects react-router (ESM)", async () => {
    const code = "import { BrowserRouter } from 'react-router-dom';";
    const frameworks = await detectFrameworks(code);
    assert.ok(frameworks.includes("react-router" as any));
  });

  it("detects react-router (CJS)", async () => {
    const code = "const { BrowserRouter } = require('react-router-dom');";
    const frameworks = await detectFrameworks(code);
    assert.ok(frameworks.includes("react-router" as any));
  });

  it("detects vue-router (ESM)", async () => {
    const code = "import { createRouter } from 'vue-router';";
    const frameworks = await detectFrameworks(code);
    assert.ok(frameworks.includes("vue-router" as any));
  });

  it("detects vue-router (CJS)", async () => {
    const code = "const { createRouter } = require('vue-router');";
    const frameworks = await detectFrameworks(code);
    assert.ok(frameworks.includes("vue-router" as any));
  });
});
