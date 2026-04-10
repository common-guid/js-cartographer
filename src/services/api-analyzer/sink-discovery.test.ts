import { describe, it } from "node:test";
import assert from "node:assert";
import { findApiSinks } from "./sink-discovery.js";

describe("sink-discovery", () => {
  it("finds basic fetch calls", async () => {
    const code = "fetch('/api/users');";
    const sinks = await findApiSinks(code);
    assert.strictEqual(sinks.length, 1);
    assert.strictEqual(sinks[0].url, "/api/users");
    assert.strictEqual(sinks[0].method, "GET"); // Default for fetch
  });

  it("finds fetch calls with options", async () => {
    const code = "fetch('/api/users', { method: 'POST' });";
    const sinks = await findApiSinks(code);
    assert.strictEqual(sinks.length, 1);
    assert.strictEqual(sinks[0].url, "/api/users");
    assert.strictEqual(sinks[0].method, "POST");
  });

  it("finds axios calls (direct)", async () => {
    const code = "axios.get('/api/data');";
    const sinks = await findApiSinks(code);
    assert.strictEqual(sinks.length, 1);
    assert.strictEqual(sinks[0].url, "/api/data");
    assert.strictEqual(sinks[0].method, "GET");
  });

  it("finds axios calls (config)", async () => {
    const code = "axios({ method: 'put', url: '/api/update' });";
    const sinks = await findApiSinks(code);
    assert.strictEqual(sinks.length, 1);
    assert.strictEqual(sinks[0].url, "/api/update");
    assert.strictEqual(sinks[0].method, "PUT");
  });

  it("resolves string concatenation", async () => {
    const code = "fetch('/api/' + 'users');";
    const sinks = await findApiSinks(code);
    assert.strictEqual(sinks.length, 1);
    assert.strictEqual(sinks[0].url, "/api/users");
  });

  it("resolves template literals", async () => {
    const code = "const path = 'users'; fetch(`/api/${'users'}`);";
    const sinks = await findApiSinks(code);
    assert.strictEqual(sinks.length, 1);
    assert.strictEqual(sinks[0].url, "/api/users");
  });
});
