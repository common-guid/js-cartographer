import { describe, it } from "node:test";
import assert from "node:assert";
import { buildApiSurface } from "./surface-builder.js";
import { ApiSink } from "./sink-discovery.js";

describe("surface-builder", () => {
  it("builds surface from basic sinks", () => {
    const sinks: ApiSink[] = [
      { url: "/api/users", method: "GET" },
      { url: "/api/posts", method: "POST", body: { title: "string" } }
    ];
    const surface = buildApiSurface(sinks);
    assert.strictEqual(surface.endpoints.length, 2);
    assert.strictEqual(surface.endpoints[0].path, "/api/users");
    assert.strictEqual(surface.endpoints[1].requestBody?.title, "string");
  });

  it("extracts query params into endpoint structure", () => {
    const sinks: ApiSink[] = [
      { url: "/api/users?debug=true", method: "GET" }
    ];
    const surface = buildApiSurface(sinks);
    assert.strictEqual(surface.endpoints[0].queryParams?.length, 1);
    assert.strictEqual(surface.endpoints[0].queryParams![0].name, "debug");
  });
});
