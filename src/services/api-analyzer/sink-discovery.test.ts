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

  it("identifies common base URLs", async () => {
    const code = "fetch('https://api.example.com/v1/users'); fetch('https://api.example.com/v1/posts');";
    const sinks = await findApiSinks(code);
    assert.strictEqual(sinks.length, 2);
    // This is more about a separate utility or post-processing
    const { inferBaseUrl } = await import("./sink-discovery.js");
    const baseUrl = inferBaseUrl(sinks);
    assert.strictEqual(baseUrl, "https://api.example.com/v1");
  });

  it("extracts query parameters", async () => {
    const code = "fetch('/api/users?debug=true&admin=1');";
    const sinks = await findApiSinks(code);
    assert.strictEqual(sinks.length, 1);
    const { extractQueryParams } = await import("./sink-discovery.js");
    const params = extractQueryParams(sinks[0].url);
    assert.deepStrictEqual(params, { debug: "true", admin: "1" });
  });

  it("finds conditional parameters", async () => {
    const code = `
      let url = '/api/users';
      if (isAdmin) {
        url = '/api/users?admin=true';
      }
      fetch(url);
    `;
    const sinks = await findApiSinks(code);
    assert.strictEqual(sinks.length, 1);
    assert.ok(sinks[0].possibleUrls?.includes('/api/users'));
    assert.ok(sinks[0].possibleUrls?.includes('/api/users?admin=true'));
  });

  it("extracts request body schema", async () => {
    const code = "fetch('/api/users', { method: 'POST', body: JSON.stringify({ name: 'John', age: 30 }) });";
    const sinks = await findApiSinks(code);
    assert.strictEqual(sinks.length, 1);
    assert.deepStrictEqual(sinks[0].body, { name: "string", age: "number" });
  });

  describe("DOM sources and sinks", () => {
    it("finds eval sinks", async () => {
      const code = "eval(userInput);";
      const { findSecurityFindings } = await import("./sink-discovery.js");
      const findings = await findSecurityFindings(code);
      const evalSink = findings.find(f => f.name === "eval" && f.type === "sink");
      assert.ok(evalSink);
      assert.strictEqual(evalSink.loc?.line, 1);
    });

    it("finds document.write sinks", async () => {
      const code = "document.write(userInput);";
      const { findSecurityFindings } = await import("./sink-discovery.js");
      const findings = await findSecurityFindings(code);
      const writeSink = findings.find(f => f.name === "document.write" && f.type === "sink");
      assert.ok(writeSink);
    });

    it("finds innerHTML sinks", async () => {
      const code = "element.innerHTML = userInput;";
      const { findSecurityFindings } = await import("./sink-discovery.js");
      const findings = await findSecurityFindings(code);
      const htmlSink = findings.find(f => f.name === "innerHTML" && f.type === "sink");
      assert.ok(htmlSink);
    });

    it("finds setTimeout with string argument as sink", async () => {
      const code = "setTimeout('alert(1)', 1000);";
      const { findSecurityFindings } = await import("./sink-discovery.js");
      const findings = await findSecurityFindings(code);
      const timeoutSink = findings.find(f => f.name === "setTimeout" && f.type === "sink");
      assert.ok(timeoutSink);
    });

    it("does not find setTimeout with function argument as sink", async () => {
      const code = "setTimeout(() => alert(1), 1000);";
      const { findSecurityFindings } = await import("./sink-discovery.js");
      const findings = await findSecurityFindings(code);
      const timeoutSink = findings.find(f => f.name === "setTimeout" && f.type === "sink");
      assert.strictEqual(timeoutSink, undefined);
    });

    it("finds location.hash source", async () => {
      const code = "const data = location.hash;";
      const { findSecurityFindings } = await import("./sink-discovery.js");
      const findings = await findSecurityFindings(code);
      const hashSource = findings.find(f => f.name === "location.hash" && f.type === "source");
      assert.ok(hashSource);
    });

    it("finds localStorage source", async () => {
      const code = "const val = localStorage.getItem('prefs');";
      const { findSecurityFindings } = await import("./sink-discovery.js");
      const findings = await findSecurityFindings(code);
      const storageSource = findings.find(f => f.name === "localStorage" && f.type === "source");
      assert.ok(storageSource);
    });
  });
});
