import { describe, it } from "node:test";
import assert from "node:assert";
import { resolveUrlWithLlm } from "./llm-route-resolver.js";

describe("llm-route-resolver", () => {
  it("resolves complex URL construction", async () => {
    const code = "const base = '/api'; const path = 'users'; const id = 123; const url = [base, path, id].join('/'); fetch(url);";
    // For testing, we'll need a mock or a way to inject the resolution logic
    // Since we don't want real LLM calls in unit tests usually.
    const resolved = await resolveUrlWithLlm(code, "[base, path, id].join('/')", async () => "/api/users/123");
    assert.strictEqual(resolved, "/api/users/123");
  });
});
