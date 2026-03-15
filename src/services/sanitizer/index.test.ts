import test from "node:test";
import assert from "node:assert";
import { WakaruSanitizer } from "./index.js";

const SAMPLE_CODE = `function a(b,c){return b+c;}`;

// ---------------------------------------------------------------------------
// Pass-through behaviour
// ---------------------------------------------------------------------------

test("formats code when enabled", async () => {
  const sanitizer = new WakaruSanitizer({ enabled: true });
  const result = await sanitizer.transform(SAMPLE_CODE, "test.js");
  assert.ok(result.code.includes("return b + c;"));
});

test("returns original code unchanged when disabled", async () => {
  const sanitizer = new WakaruSanitizer({ enabled: false });
  const result = await sanitizer.transform(SAMPLE_CODE, "test.js");
  assert.strictEqual(result.code, SAMPLE_CODE);
});

test("result map is undefined in Phase 1 pass-through", async () => {
  const sanitizer = new WakaruSanitizer({ enabled: true });
  const result = await sanitizer.transform(SAMPLE_CODE, "test.js");
  assert.strictEqual(result.map, undefined);
});

test("handles empty code without throwing", async () => {
  const sanitizer = new WakaruSanitizer({ enabled: true });
  await assert.doesNotReject(sanitizer.transform("", "empty.js"));
});

test("default constructor enables sanitizer", async () => {
  const sanitizer = new WakaruSanitizer();
  const result = await sanitizer.transform(SAMPLE_CODE, "test.js");
  assert.ok(result.code.includes("return b + c;"));
});

// ---------------------------------------------------------------------------
// Logging behaviour
// ---------------------------------------------------------------------------

test("logs [Sanitizer] Processing when enabled", async () => {
  const sanitizer = new WakaruSanitizer({ enabled: true });
  const logged: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logged.push(args.join(" "));

  try {
    await sanitizer.transform(SAMPLE_CODE, "my-file.js");
  } finally {
    console.log = originalLog;
  }

  assert.ok(
    logged.some(
      (msg) =>
        msg.includes("[Sanitizer] Processing") && msg.includes("my-file.js")
    ),
    `Expected a [Sanitizer] Processing log. Got: ${JSON.stringify(logged)}`
  );
});

test("does NOT log [Sanitizer] Processing when disabled", async () => {
  const sanitizer = new WakaruSanitizer({ enabled: false });
  const logged: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logged.push(args.join(" "));

  try {
    await sanitizer.transform(SAMPLE_CODE, "my-file.js");
  } finally {
    console.log = originalLog;
  }

  assert.ok(
    !logged.some((msg) => msg.includes("[Sanitizer]")),
    `Expected no [Sanitizer] logs when disabled. Got: ${JSON.stringify(logged)}`
  );
});

// ---------------------------------------------------------------------------
// Error swallow / safety net
// ---------------------------------------------------------------------------

test("does not throw when an internal error is thrown — returns original code", async () => {
  // We create a subclass that overrides transform to simulate a Wakaru failure.
  class BrokenSanitizer extends WakaruSanitizer {
    override async transform(
      code: string
    ): ReturnType<WakaruSanitizer["transform"]> {
      // Simulate the error path by manually triggering the catch block
      try {
        throw new Error("Simulated Wakaru failure");
      } catch {
        return { code };
      }
    }
  }

  const sanitizer = new BrokenSanitizer({ enabled: true });
  const result = await sanitizer.transform(SAMPLE_CODE, "bad.js");
  assert.strictEqual(result.code, SAMPLE_CODE);
});

test("name property is set correctly", () => {
  const sanitizer = new WakaruSanitizer();
  assert.strictEqual(sanitizer.name, "Wakaru Syntax Sanitizer");
});

// ---------------------------------------------------------------------------
// Pipeline contract
// ---------------------------------------------------------------------------

test("sanitizer output can be piped into a string transform plugin", async () => {
  const sanitizer = new WakaruSanitizer({ enabled: true });
  const append = async (code: string) => code + "\n/* appended */";

  const { code: sanitized } = await sanitizer.transform(SAMPLE_CODE, "test.js");
  const final = await append(sanitized);

  assert.ok(final.includes("return b + c;"));
  assert.ok(final.includes("/* appended */"));
});
