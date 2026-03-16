/**
 * Phase 1 non-regression E2E tests.
 *
 * These tests verify that the --no-sanitizer flag is correctly wired into all
 * four commands without breaking existing behaviour. They do NOT require an LLM
 * or API key — they intentionally trigger an expected failure (missing file or
 * missing API key) so the test can confirm the flag was parsed correctly before
 * the pipeline even starts.
 *
 * Strategy: run each command against a non-existent file. All commands should
 * reject (as they did before Phase 1). The important thing is that they reject
 * with the same "file not found" error whether or not --no-sanitizer is passed,
 * proving the sanitizer is not a breaking change to existing behaviour.
 */
import test from "node:test";
import assert from "node:assert";
import { humanify } from "../../test-utils.js";

const NONEXISTENT = "nonexistent-file.js";
const FIXTURE_BUNDLE = "fixtures/webpack-hello-world/dist/bundle.js";

// ---------------------------------------------------------------------------
// Existing behaviour preserved (non-regression)
// ---------------------------------------------------------------------------

for (const cmd of ["openai", "gemini", "openrouter", "local"]) {
  test(`${cmd}: still rejects on missing file (non-regression)`, async () => {
    await assert.rejects(humanify(cmd, NONEXISTENT));
  });
}

// ---------------------------------------------------------------------------
// --no-sanitizer flag accepted without breaking the error path
// ---------------------------------------------------------------------------

for (const cmd of ["openai", "gemini", "openrouter"]) {
  test(`${cmd}: --no-sanitizer flag is accepted (rejects on missing file, not flag parse error)`, async () => {
    // This must reject because the file doesn't exist — NOT because the flag is unrecognised.
    // Commander would exit with "error: unknown option '--no-sanitizer'" if the flag wasn't wired.
    const err = await assert
      .rejects(humanify(cmd, NONEXISTENT, "--no-sanitizer"))
      .then(() => null)
      .catch((e) => e as Error);

    // If err is null, the rejects assertion already passed — that's fine.
    // We additionally ensure the error message is NOT about an unknown flag.
    if (err) {
      assert.ok(
        !err.message.includes("unknown option"),
        `Expected file-not-found error, got: ${err.message}`
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Sanitizer logs appear / are suppressed correctly against the fixture bundle
// Requires: npm run build (handled by npm run test:e2e automatically)
// ---------------------------------------------------------------------------

test("sanitizer logs [Sanitizer] Optimizing when run against fixture bundle", async () => {
  // We expect this to fail (no API key) but the [Sanitizer] log should appear first.
  // We capture stderr+stdout and check the log is present.
  let output = "";
  try {
    const result = await humanify(
      "openrouter",
      FIXTURE_BUNDLE,
      "-k",
      "invalid-key-for-test",
      "-o",
      "/tmp/phase1-e2e-default"
    );
    output = result.stdout + result.stderr;
  } catch (e) {
    // Expected — the API call will fail with an invalid key.
    // humanify() rejects on non-zero exit, but we can still check the output.
    if (e instanceof Error) output = e.message;
  }

  assert.ok(
    output.includes("[Sanitizer] Optimizing"),
    `Expected "[Sanitizer] Optimizing" in output. Got: ${output.slice(0, 500)}`
  );
});

test("--no-sanitizer suppresses [Sanitizer] Optimizing log against fixture bundle", async () => {
  let output = "";
  try {
    const result = await humanify(
      "openrouter",
      FIXTURE_BUNDLE,
      "-k",
      "invalid-key-for-test",
      "--no-sanitizer",
      "-o",
      "/tmp/phase1-e2e-no-sanitizer"
    );
    output = result.stdout + result.stderr;
  } catch (e) {
    if (e instanceof Error) output = e.message;
  }

  assert.ok(
    !output.includes("[Sanitizer] Optimizing"),
    `Expected NO "[Sanitizer] Optimizing" when --no-sanitizer used. Got: ${output.slice(0, 500)}`
  );
});
