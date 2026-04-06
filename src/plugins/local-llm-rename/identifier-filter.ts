/**
 * Identifier filter — determines whether a binding identifier should be
 * sent to the LLM for renaming, or skipped because it is already meaningful.
 *
 * Three layers of rules (evaluated in order):
 * 1. Static skip-list  — well-known globals, Node.js builtins, webpack internals
 * 2. Obfuscation patterns — always rename single-char names and hex-prefixed names
 * 3. Heuristic rules  — skip names that look already-descriptive (vowels, length, camelCase)
 */

// ---------------------------------------------------------------------------
// 1. Static skip-lists
// ---------------------------------------------------------------------------

/** ECMAScript built-in globals that should never be renamed. */
const JS_BUILTINS = new Set([
  // Values
  "undefined",
  "NaN",
  "Infinity",
  "globalThis",
  // Functions
  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  // Constructors & namespaces
  "Object",
  "Function",
  "Boolean",
  "Symbol",
  "Error",
  "AggregateError",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
  "Number",
  "BigInt",
  "Math",
  "Date",
  "String",
  "RegExp",
  "Array",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "WeakRef",
  "FinalizationRegistry",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DataView",
  "Atomics",
  "JSON",
  "Promise",
  "Proxy",
  "Reflect",
  "Intl",
  // Common DOM / Web APIs
  "console",
  "setTimeout",
  "setInterval",
  "clearTimeout",
  "clearInterval",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "fetch",
  "URL",
  "URLSearchParams",
  "Headers",
  "Request",
  "Response",
  "AbortController",
  "AbortSignal",
  "Event",
  "EventTarget",
  "TextEncoder",
  "TextDecoder",
  "ReadableStream",
  "WritableStream",
  "TransformStream",
  "Blob",
  "File",
  "FormData",
  "document",
  "window",
  "navigator",
  "location",
  "history",
  "localStorage",
  "sessionStorage",
  "performance",
  "crypto",
  "alert",
  "confirm",
  "prompt",
]);

/** Node.js globals & CommonJS identifiers. */
const NODE_GLOBALS = new Set([
  "module",
  "exports",
  "require",
  "global",
  "process",
  "Buffer",
  "queueMicrotask",
  "__dirname",
  "__filename",
  "setImmediate",
  "clearImmediate",
]);

/** Webpack runtime identifiers that are part of the loader boilerplate. */
const WEBPACK_INTERNALS = new Set([
  "__webpack_require__",
  "__webpack_modules__",
  "__webpack_exports__",
  "__webpack_module_cache__",
  "__unused_webpack_module",
  "__unused_webpack_exports",
  "__webpack_public_path__",
]);

/** JS reserved words & keywords that cannot be valid user-defined names. */
const RESERVED_WORDS = new Set([
  "arguments",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

// ---------------------------------------------------------------------------
// 2. Pattern detectors
// ---------------------------------------------------------------------------

/** Matches hex-obfuscated names like `_0x3a2f`, `_0xabc123`. */
const HEX_PREFIX_RE = /^_0x[0-9a-fA-F]+$/;

/** A name is "single-character" if it is exactly 1 char (a–z, A–Z, _, $). */
function isSingleChar(name: string): boolean {
  return name.length === 1;
}

// ---------------------------------------------------------------------------
// 3. Heuristic helpers
// ---------------------------------------------------------------------------

const VOWELS = /[aeiouAEIOU]/;

/**
 * A name is considered "already descriptive" when ALL of the following hold:
 *   - length > 2
 *   - contains at least one vowel (natural language signal)
 *   - does NOT start with `$` (common minifier prefix)
 *   - does NOT match the hex-obfuscation pattern
 *
 * Additional strong signal: camelCase names with 6+ characters are almost
 * certainly already meaningful (e.g. `fetchData`, `handleClick`).
 */
function looksDescriptive(name: string): boolean {
  if (name.length <= 2) return false;
  if (name.startsWith("$")) return false;
  if (HEX_PREFIX_RE.test(name)) return false;
  if (!VOWELS.test(name)) return false;

  // Strong signal: long camelCase names are virtually never obfuscated
  if (name.length >= 6 && /^[a-z][a-zA-Z0-9]+$/.test(name)) return true;

  // Moderate signal: 3–5 char names with a vowel (e.g. "map", "item", "data")
  // are likely descriptive but less certain. We still skip them — the
  // --rename-all flag is the escape hatch for edge cases.
  return true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the identifier should be sent to the LLM for renaming.
 * Returns `false` if it should be kept as-is (already meaningful).
 */
export function shouldRename(name: string): boolean {
  // Never rename reserved words / keywords
  if (RESERVED_WORDS.has(name)) return false;

  // Never rename well-known globals
  if (JS_BUILTINS.has(name)) return false;
  if (NODE_GLOBALS.has(name)) return false;
  if (WEBPACK_INTERNALS.has(name)) return false;

  // Always rename obvious obfuscation patterns
  if (isSingleChar(name)) return true;
  if (HEX_PREFIX_RE.test(name)) return true;

  // Apply heuristic: skip names that look already descriptive
  if (looksDescriptive(name)) return false;

  // Default: rename anything else (2-char names without vowels, etc.)
  return true;
}
