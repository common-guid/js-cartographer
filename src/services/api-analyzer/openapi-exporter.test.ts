import { describe, it } from "node:test";
import assert from "node:assert";
import { exportToOpenApi } from "./openapi-exporter.js";
import { ApiSurface } from "./types.js";

describe("openapi-exporter", () => {
  it("exports a valid OpenAPI 3.0 JSON", () => {
    const surface: ApiSurface = {
      baseUrl: "https://api.example.com/v1",
      endpoints: [
        {
          path: "/users",
          method: "GET",
          queryParams: [{ name: "limit", type: "number" }]
        }
      ]
    };
    const openapi = exportToOpenApi(surface);
    assert.strictEqual(openapi.openapi, "3.0.0");
    assert.strictEqual(openapi.servers[0].url, "https://api.example.com/v1");
    assert.ok(openapi.paths["/users"]);
    assert.ok(openapi.paths["/users"].get);
    assert.strictEqual(openapi.paths["/users"].get.parameters[0].name, "limit");
  });
});
