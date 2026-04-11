import { describe, it } from "node:test";
import assert from "node:assert";
import { enrichEndpointWithLlm } from "./llm-metadata-enricher.js";
import { ApiEndpoint } from "./types.js";

describe("llm-metadata-enricher", () => {
  it("enriches endpoint with descriptions", async () => {
    const endpoint: ApiEndpoint = {
      path: "/api/users",
      method: "GET",
      queryParams: [{ name: "id", type: "number" }]
    };
    const code = "/** Get user by ID */ function getUser(id) { return fetch('/api/users?id=' + id); }";
    
    const enriched = await enrichEndpointWithLlm(endpoint, code, async () => ({
      description: "Retrieves a user by their unique ID.",
      parameterDescriptions: { id: "The unique identifier of the user." }
    }));

    assert.strictEqual(enriched.description, "Retrieves a user by their unique ID.");
    // @ts-ignore
    assert.strictEqual(enriched.queryParams[0].description, "The unique identifier of the user.");
  });
});
