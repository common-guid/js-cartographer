import assert from "assert";
import test from "node:test";
import { shouldRename } from "./identifier-filter.js";

// -------------------------------------------------------------------------
// Static skip-lists
// -------------------------------------------------------------------------

test("should NOT rename JS built-in globals", () => {
  const builtins = [
    "console",
    "Promise",
    "Array",
    "Object",
    "Math",
    "JSON",
    "Error",
    "Map",
    "Set",
    "undefined",
    "NaN",
    "Infinity",
    "parseInt",
    "fetch",
    "document",
    "window",
  ];
  for (const name of builtins) {
    assert.strictEqual(
      shouldRename(name),
      false,
      `Expected shouldRename('${name}') to be false`
    );
  }
});

test("should NOT rename Node.js globals", () => {
  const nodeGlobals = [
    "module",
    "exports",
    "require",
    "process",
    "Buffer",
    "__dirname",
    "__filename",
    "global",
  ];
  for (const name of nodeGlobals) {
    assert.strictEqual(
      shouldRename(name),
      false,
      `Expected shouldRename('${name}') to be false`
    );
  }
});

test("should NOT rename webpack internals", () => {
  const webpackNames = [
    "__webpack_require__",
    "__webpack_modules__",
    "__webpack_exports__",
    "__webpack_module_cache__",
    "__unused_webpack_module",
  ];
  for (const name of webpackNames) {
    assert.strictEqual(
      shouldRename(name),
      false,
      `Expected shouldRename('${name}') to be false`
    );
  }
});

test("should NOT rename reserved words / keywords", () => {
  const reserved = ["arguments", "yield", "await", "static", "void", "this"];
  for (const name of reserved) {
    assert.strictEqual(
      shouldRename(name),
      false,
      `Expected shouldRename('${name}') to be false`
    );
  }
});

// -------------------------------------------------------------------------
// Always-rename patterns
// -------------------------------------------------------------------------

test("should ALWAYS rename single-character identifiers", () => {
  const singles = ["a", "b", "c", "n", "t", "x", "i", "e", "_", "$"];
  for (const name of singles) {
    assert.strictEqual(
      shouldRename(name),
      true,
      `Expected shouldRename('${name}') to be true`
    );
  }
});

test("should ALWAYS rename hex-obfuscated identifiers", () => {
  const hexNames = ["_0x3a2f", "_0xabc123", "_0xDEAD", "_0x0"];
  for (const name of hexNames) {
    assert.strictEqual(
      shouldRename(name),
      true,
      `Expected shouldRename('${name}') to be true`
    );
  }
});

// -------------------------------------------------------------------------
// Heuristic rules
// -------------------------------------------------------------------------

test("should NOT rename long camelCase names (6+ chars with vowel)", () => {
  const descriptive = [
    "fetchData",
    "handleClick",
    "processItems",
    "getUserName",
    "createWidget",
    "initializeApp",
  ];
  for (const name of descriptive) {
    assert.strictEqual(
      shouldRename(name),
      false,
      `Expected shouldRename('${name}') to be false`
    );
  }
});

test("should NOT rename shorter descriptive names (3-5 chars with vowel)", () => {
  const descriptive = ["map", "item", "data", "node", "user", "file"];
  for (const name of descriptive) {
    assert.strictEqual(
      shouldRename(name),
      false,
      `Expected shouldRename('${name}') to be false`
    );
  }
});

test("should rename 2-char names without vowels", () => {
  const twoChar = ["fn", "cb", "vl", "xs", "zz"];
  for (const name of twoChar) {
    assert.strictEqual(
      shouldRename(name),
      true,
      `Expected shouldRename('${name}') to be true`
    );
  }
});

test("should rename names starting with $ (minifier convention)", () => {
  const dollarNames = ["$abc", "$data", "$handler"];
  for (const name of dollarNames) {
    assert.strictEqual(
      shouldRename(name),
      true,
      `Expected shouldRename('${name}') to be true`
    );
  }
});

test("should rename short consonant-only names", () => {
  const consonantOnly = ["cfg", "str", "btn", "ctx", "fmt"];
  for (const name of consonantOnly) {
    assert.strictEqual(
      shouldRename(name),
      true,
      `Expected shouldRename('${name}') to be true`
    );
  }
});

test("should NOT rename names that are _0x-like but not matching the full pattern", () => {
  // "_0xNotHex" has vowels and doesn't match the strict hex pattern
  // It should be treated as a descriptive name by the heuristic
  assert.strictEqual(shouldRename("_0xNotHex"), false);
});
