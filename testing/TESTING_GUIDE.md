# JS Cartographer — Testing Guide

This document is the **source of truth** for writing, organizing, and running all tests in
this project. Every test file added to this codebase should follow the conventions described
here. When in doubt, look at an existing test file and at this guide before writing a new one.

---

## Table of Contents

1. [Test Runner & Framework](#1-test-runner--framework)
2. [Test File Naming Conventions](#2-test-file-naming-conventions)
3. [How to Run Tests](#3-how-to-run-tests)
4. [Unit Tests (`.test.ts`)](#4-unit-tests-testts)
5. [E2E Tests (`.e2etest.ts`)](#5-e2e-tests-e2etestts)
6. [LLM Tests (`.llmtest.ts`)](#6-llm-tests-llmtestts)
7. [Cloud LLM Tests (`.openaitest.ts`, `.geminitest.ts`)](#7-cloud-llm-tests)
8. [Integration Tests for New Services](#8-integration-tests-for-new-services)
9. [The `fixtures/` Directory](#9-the-fixtures-directory)
10. [Using `webpack-hello-world` for Validation Testing](#10-using-webpack-hello-world-for-validation-testing)
11. [Test Utilities Reference](#11-test-utilities-reference)
12. [What to Test Per Phase](#12-what-to-test-per-phase)
13. [Rules & Checklist](#13-rules--checklist)

---

## 1. Test Runner & Framework

This project uses **Node.js's built-in test runner** (`node:test`) with **`tsx`** for
TypeScript execution. There is no Jest, Vitest, Mocha, or any third-party test framework.
Do not introduce one.

Key imports for every test file:

```typescript
import test from 'node:test';
import assert from 'node:assert';
```

The `assert` module is the standard Node.js assertion library. Use it for all assertions.
Do not use `expect()` — there is no such global here.

---

## 2. Test File Naming Conventions

Test files live **alongside the source files they test**, inside `src/`. There is no
separate `__tests__/` directory. The file suffix determines which `npm run test:*` command
picks it up:

| Suffix | What it tests | Run command |
|---|---|---|
| `.test.ts` | Pure unit logic, no I/O, no LLM | `npm run test:unit` |
| `.e2etest.ts` | Full CLI binary (requires a build) | `npm run test:e2e` |
| `.llmtest.ts` | Local GGUF model accuracy | `npm run test:llm` |
| `.openaitest.ts` | OpenAI API accuracy (costs money) | `npm run test:openai` |
| `.geminitest.ts` | Gemini API accuracy (costs money) | `npm run test:gemini` |

**Naming rule:** A test file for `src/services/sanitizer/index.ts` should be named
`src/services/sanitizer/index.test.ts`. For a sub-feature, use a descriptive suffix:
`src/services/sanitizer/sanitizer-passthrough.test.ts`.

---

## 3. How to Run Tests

```bash
# Run only fast unit tests (no build, no LLM required) — use this during development
npm run test:unit

# Run E2E tests (builds the binary first, then runs CLI tests)
npm run test:e2e

# Run LLM accuracy tests (requires a local model — see section 6)
npm run test:llm

# Run all tests (unit + e2e + llm)
npm run test

# Run OpenAI or Gemini tests (requires API keys in .env)
npm run test:openai
npm run test:gemini
```

**During active development:** run `npm run test:unit` continuously. It executes in under
one second and requires no external dependencies.

---

## 4. Unit Tests (`.test.ts`)

Unit tests cover a single function or class in complete isolation. They must:

- Run **without any network access**, **without any file I/O** (or mock it), and **without
  an LLM**.
- Complete in **milliseconds**. If a test takes more than ~100ms, it likely belongs in a
  different category.
- Use `assert` from `node:assert` for all assertions.

### Minimal template

```typescript
// src/services/sanitizer/index.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { WakaruSanitizer } from './index.js';

test('returns original code when disabled', async () => {
  const sanitizer = new WakaruSanitizer({ enabled: false });
  const result = await sanitizer.transform('const a = 1;', 'test.js');
  assert.strictEqual(result.code, 'const a = 1;');
});

test('does not throw when Wakaru fails on invalid code', async () => {
  const sanitizer = new WakaruSanitizer({ enabled: true });
  // Should swallow errors and return the original code
  await assert.doesNotReject(sanitizer.transform('INVALID @@@ CODE', 'bad.js'));
});
```

### Assertion style

Prefer **strict equality** over loose equality:

```typescript
// Preferred
assert.strictEqual(actual, expected);
assert.deepStrictEqual(actual, expected);

// Avoid — too loose
assert.equal(actual, expected);
```

Use `assert.doesNotReject()` / `assert.rejects()` for async error paths.

### Testing AST transformations

When testing Babel visitors or code transformation functions, assert on the **trimmed
string output** rather than the AST directly:

```typescript
test('converts void 0 to undefined', async () => {
  const result = await myTransform('var x = void 0;');
  assert.strictEqual(result.trim(), 'var x = undefined;');
});
```

### Testing pure utility functions

For functions like those in `src/services/graph/` or `src/services/callgraph/`, test them
with **inline fixture strings** — small snippets of JavaScript passed as strings — rather
than reading real files:

```typescript
test('extracts import sources from ESM code', async () => {
  const code = `import { add } from './math'; import fs from 'node:fs';`;
  const imports = extractImports(code);
  assert.deepStrictEqual(imports, ['./math', 'node:fs']);
});
```

---

## 5. E2E Tests (`.e2etest.ts`)

E2E tests run the **compiled CLI binary** (`./dist/index.mjs`) as a child process. They
verify behavior that can only be confirmed by running the full pipeline end-to-end.

**Prerequisites:** The binary must be built before running e2e tests. `npm run test:e2e`
runs `npm run build` automatically before executing test files.

### The `humanify()` test utility

Use the `humanify()` helper from `src/test-utils.ts` to spawn the CLI:

```typescript
import { humanify } from '../../test-utils.js';

const { stdout, stderr } = await humanify('openai', 'input.js', '-o', 'output/');
```

The helper:
- Spawns `./dist/index.mjs` with the provided arguments
- Collects stdout and stderr
- Rejects the promise if the process exits with a non-zero code
- Automatically appends `--seed 1` for `local` commands (deterministic output)

### E2E test template

```typescript
// src/cli.e2etest.ts
import test from 'node:test';
import assert from 'node:assert';
import { humanify } from './test-utils.js';

test('sanitizer flag is accepted without error', async () => {
  // Only tests the CLI flag is wired correctly — does not need a real LLM
  await assert.rejects(
    humanify('openai', 'nonexistent.js', '--no-sanitizer'),
    /nonexistent/
  );
});
```

### When to write an E2E test

Write an E2E test when:
- You add a new CLI flag (verify it is accepted and affects behavior)
- You integrate a new service into the pipeline (verify it doesn't crash the binary)
- You add the `graph` sub-command (Phase 6)

Do **not** write E2E tests for logic that can be unit tested. E2E tests are slow because
they require a build step.

---

## 6. LLM Tests (`.llmtest.ts`)

LLM tests verify the **accuracy of the local model** for renaming tasks. They require a
downloaded GGUF model and are intentionally non-deterministic — they use fuzzy matching
(`assertMatches`) rather than exact equality.

**Prerequisites:**
```bash
npx humanify download 2b
# or set MODEL env var to point to a custom model path
```

### The `assertMatches()` helper

```typescript
import { assertMatches } from '../../test-utils.js';

// Passes if the actual string contains ANY of the expected strings (case-insensitive)
assertMatches(result, ['increment', 'addOne', 'plusOne']);
```

Use `assertMatches` for all LLM output assertions. Never use `assert.strictEqual` for LLM
output — models are non-deterministic.

### LLM test template

```typescript
// src/plugins/local-llm-rename/my-feature.llmtest.ts
import test from 'node:test';
import { assertMatches } from '../../test-utils.js';
import { testPrompt } from '../../test/test-prompt.js';

const prompt = await testPrompt();   // Load once, reuse across tests in this file

test('renames a fetch function correctly', async () => {
  const result = await unminifyVariableName(prompt, 'a', 'api.js', `
    const a = async (id) => fetch('/users/' + id).then(r => r.json());
  `);
  assertMatches(result, ['fetchUser', 'getUser', 'loadUser']);
});
```

### Key LLM testing rules

- Always call `testPrompt()` **once at the top level** (outside `test()` blocks) and reuse
  it. Loading a model is expensive.
- Provide realistic surrounding code context — the model needs context to infer good names.
- Accept multiple plausible names in `assertMatches`. The goal is to verify the model is
  in the right semantic neighborhood, not to pin to a specific string.
- LLM tests may take 10–60 seconds each. Keep the number small and focused on the most
  important rename behaviors.

---

## 7. Cloud LLM Tests

`.openaitest.ts` and `.geminitest.ts` files test accuracy against cloud APIs. These are
expensive and should only be run in CI with real API keys, or locally when explicitly
testing cloud provider behavior.

They follow the same pattern as `.llmtest.ts` files but use a cloud client instead of
`testPrompt()`. Refer to `src/test/e2e.openaitest.ts` for the current pattern.

---

## 8. Integration Tests for New Services

The new services introduced in Phases 1–6 (`WakaruSanitizer`, `GraphBuilder`,
`CallGraphBuilder`, `GraphPresenter`) each require their own unit test files. This section
specifies what those tests must cover.

### Phase 1–3: `WakaruSanitizer`

File: `src/services/sanitizer/index.test.ts`

Required test cases:
1. **Pass-through when disabled** — `{ enabled: false }` returns original code unchanged.
2. **Pass-through on error** — if Wakaru throws, the original code is returned (no crash).
3. **Heuristic naming disabled** — `{ useHeuristicNaming: false }` skips the HEURISTIC_RULES.
4. **Structural rules applied** — a snippet with `void 0` is transformed to `undefined`.
5. **Metrics logged** — when heuristic naming runs and reduces code length, verify a
   savings message is logged (spy on `console.log`).

### Phase 4: `GraphBuilder`

File: `src/services/graph/index.test.ts`

Required test cases:
1. **Empty directory** — returns `{ files: {} }`.
2. **Single file with ESM imports** — `import { x } from './other'` is captured.
3. **Single file with CommonJS require** — `require('./other')` is captured.
4. **Named exports captured** — `export function foo()` is recorded under `exports`.
5. **Unparseable file skipped gracefully** — malformed JS does not crash the builder.
6. **Relative path keys** — `files` keys are relative to the scanned directory, not absolute.

Use temporary in-memory fixtures via `node:fs/promises` and `os.tmpdir()` rather than real
project files:

```typescript
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('captures ESM imports', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'graph-test-'));
  try {
    await writeFile(join(dir, 'main.js'), `import { add } from './math';`);
    await writeFile(join(dir, 'math.js'), `export function add(a, b) { return a + b; }`);
    const graph = await new GraphBuilder().build(dir);
    assert.deepStrictEqual(graph.files['main.js'].imports, ['./math']);
    assert.deepStrictEqual(graph.files['math.js'].exports, ['add']);
  } finally {
    await rm(dir, { recursive: true });
  }
});
```

### Phase 5: `CallGraphBuilder`

File: `src/services/callgraph/index.test.ts`

Required test cases:
1. **Top-level function definition becomes a node** — `function foo() {}` → node `file.js:foo`.
2. **Internal call creates an internal edge** — `function a() { b(); } function b() {}` → edge `{from: 'file.js:a', to: 'file.js:b', type: 'internal'}`.
3. **Cross-file call creates an external edge** — `import { b } from './lib'; function a() { b(); }` → edge with `type: 'external'`.
4. **Top-level call attributed to `root`** — `initApp()` at top level → `from: 'file.js:root'`.
5. **Unknown callee is still recorded** — calling an unresolved identifier still creates an edge (best-effort).

### Phase 6: `GraphPresenter`

File: `src/services/callgraph/presenter.test.ts`

Required test cases:
1. **ASCII tree — single node with no children** — produces just the node ID string.
2. **ASCII tree — correct connector characters** — `├──` for non-last children, `└──` for last.
3. **ASCII tree — depth limit respected** — `maxDepth: 1` shows direct children only.
4. **Cycle detection** — a graph with A→B→A does not infinite-loop; cycle is annotated `[CYCLE]`.
5. **Mermaid output starts with `graph TD`** — header is always present.
6. **Mermaid node IDs are valid identifiers** — special characters in node IDs are sanitized.
7. **Unknown entry point throws** — `toAsciiTree('nonexistent:fn')` throws a clear error.

---

## 9. The `fixtures/` Directory

```
fixtures/
├── example.min.js              — A single tiny minified function (legacy smoke test input)
└── webpack-hello-world/        — The primary validation target (see section 10)
    ├── src/                    — Original human-readable source (ground truth)
    │   ├── math.js
    │   ├── greeting.js
    │   └── api.js
    │   └── app.js
    ├── dist/
    │   └── bundle.js           — Pre-built webpack bundle (committed, ready to use)
    ├── webpack.config.js
    ├── .babelrc
    └── package.json
```

### What the fixtures directory is for

The `fixtures/` directory contains **known inputs** for the deobfuscation pipeline.
The important distinction is:

- **`src/` contains the ground truth** — the original code before bundling, with
  meaningful function names, clear structure, and documented intent.
- **`dist/bundle.js` is the test input** — what JS Cartographer actually operates on.
- The comparison between what JS Cartographer _produces_ and what `src/` _contains_ is
  how you measure the quality of the tool.

Do **not** modify `dist/bundle.js` manually. If you change the source files, rebuild:
```bash
cd fixtures/webpack-hello-world && npm install && npm run build
```

---

## 10. Using `webpack-hello-world` for Validation Testing

This is the most important section for validating the implementation phases end-to-end.

### The bundle and what it exercises

The pre-built `fixtures/webpack-hello-world/dist/bundle.js` (9.2 KiB) is a webpack 5
production bundle built with Babel targeting IE11. This means:

| Original source feature | What Babel/webpack transforms it to | Wakaru rule that restores it |
|---|---|---|
| `async function fetchUserData()` | `_asyncToGenerator` + generator `switch` state machine | `un-async-await` |
| `class GreetingFormatter {}` | Constructor function + `prototype.formatFormal = ...` | `un-es6-class` |
| Template literal `` `Good ${x}` `` | `"Good ".concat(x)` | `un-template-literals` |
| `void 0` | (already transformed) | `un-undefined` |
| Named functions: `add`, `multiply` | Single-letter: `t`, `n`, `r`, `e`, `o` | LLM rename |

### Known source: ground truth names

When JS Cartographer runs on `bundle.js`, an ideal run would recover these names:

**`math.js`:** `add`, `multiply`, `calculateCircleArea`, `clampValue`
**`greeting.js`:** `getTimeOfDay`, `formatGreeting`, `GreetingFormatter`, `formatFormal`, `getStats`
**`api.js`:** `fetchUserData`, `processUserData`, `fetchMultipleUsers`
**`app.js`:** `displayResults`, `initApp`

### Using the bundle in Phase validation tests

#### Phase 1 — Sanitizer wired without breaking output

```typescript
// src/services/sanitizer/sanitizer-fixture.e2etest.ts
import test from 'node:test';
import assert from 'node:assert';
import { humanify } from '../../test-utils.js';

const BUNDLE = 'fixtures/webpack-hello-world/dist/bundle.js';

test('pipeline processes webpack-hello-world bundle without crashing', async () => {
  // Does not use a real LLM — just verifies no exception is thrown
  // by passing --no-sanitizer to isolate the test to wiring only
  await assert.rejects(
    humanify('openai', BUNDLE, '--no-sanitizer'),
    /OPENAI_API_KEY/   // expected failure: no key set, but the sanitizer flag was accepted
  );
});
```

#### Phase 2 — Syntax restoration produces async/await

Write a unit test that feeds the bundle directly to `WakaruSanitizer` (bypassing the LLM)
and checks that the output contains `async function` and `class`:

```typescript
// src/services/sanitizer/phase2-restoration.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import { WakaruSanitizer } from './index.js';

const BUNDLE_PATH = 'fixtures/webpack-hello-world/dist/bundle.js';

test('restores async/await from bundle', async () => {
  const bundle = await readFile(BUNDLE_PATH, 'utf-8');
  const sanitizer = new WakaruSanitizer({ enabled: true, useHeuristicNaming: false });
  const result = await sanitizer.transform(bundle, 'bundle.js');

  // The bundle contains generator-transpiled async functions.
  // After un-async-await, they should become async function declarations.
  assert.match(result.code, /async\s+function/);
});

test('restores class syntax from bundle', async () => {
  const bundle = await readFile(BUNDLE_PATH, 'utf-8');
  const sanitizer = new WakaruSanitizer({ enabled: true, useHeuristicNaming: false });
  const result = await sanitizer.transform(bundle, 'bundle.js');

  assert.match(result.code, /class\s+\w+/);
});

test('output is smaller than input after heuristic pass', async () => {
  const bundle = await readFile(BUNDLE_PATH, 'utf-8');
  const sanitizer = new WakaruSanitizer({ enabled: true, useHeuristicNaming: true });
  const result = await sanitizer.transform(bundle, 'bundle.js');

  assert.ok(
    result.code.length <= bundle.length,
    `Expected output (${result.code.length}) to be no larger than input (${bundle.length})`
  );
});
```

#### Phase 4 — Module graph from unpacked bundle

After webcrack unpacks `bundle.js`, the output directory will contain individual `.js`
files. The `GraphBuilder` should produce a `module-graph.json` that reflects the original
source structure:

```typescript
// src/services/graph/phase4-fixture.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { webcrack } from '../../plugins/webcrack.js';
import { GraphBuilder } from './index.js';
import { readFile } from 'node:fs/promises';

test('graph builder produces correct structure from unpacked bundle', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'graph-fixture-'));
  try {
    const bundle = await readFile('fixtures/webpack-hello-world/dist/bundle.js', 'utf-8');
    await webcrack(bundle, outDir);

    const graph = await new GraphBuilder().build(outDir);

    // The unpacked bundle should produce multiple files with import relationships
    const fileCount = Object.keys(graph.files).length;
    assert.ok(fileCount >= 2, `Expected at least 2 files, got ${fileCount}`);

    // At least one file should have imports
    const hasImports = Object.values(graph.files).some(f => f.imports.length > 0);
    assert.ok(hasImports, 'Expected at least one file to have imports');
  } finally {
    await rm(outDir, { recursive: true });
  }
});
```

#### Phase 5 — Call graph from renamed output

After the full pipeline runs (webcrack + sanitizer + LLM rename), feed the renamed output
directory to `CallGraphBuilder` and verify the structure:

```typescript
// Validation checklist for Phase 5 — run manually or in a dedicated fixture test
// Expected nodes after successful rename recovery:
const EXPECTED_NODES = [
  'app.js:initApp',
  'app.js:displayResults',
  'greeting.js:formatGreeting',
  'greeting.js:getTimeOfDay',
  'math.js:add',
  'math.js:multiply',
  'math.js:calculateCircleArea',
  'api.js:fetchUserData',
  'api.js:processUserData',
];

// Expected cross-file edges:
const EXPECTED_EXTERNAL_EDGES = [
  { from: 'app.js:initApp', to: 'greeting.js:formatGreeting' },
  { from: 'app.js:initApp', to: 'math.js:calculateCircleArea' },
  { from: 'app.js:initApp', to: 'api.js:processUserData' },
];
```

#### Phase 6 — CLI graph command on known output

```bash
# After running the full pipeline on the bundle:
npx humanify openai fixtures/webpack-hello-world/dist/bundle.js -o /tmp/carto-out

# Verify ASCII tree output:
npx humanify graph /tmp/carto-out --entry "app.js:initApp"

# Expected (approximate — names depend on LLM quality):
# app.js:initApp
# ├── greeting.js:formatGreeting
# │   └── math.js:add
# ├── math.js:calculateCircleArea
# └── api.js:processUserData

# Verify Mermaid export:
npx humanify graph /tmp/carto-out --format mermaid
cat /tmp/carto-out/call-graph.mermaid
```

### Scoring deobfuscation quality

When running a full end-to-end validation against the bundle, score the result using this
rubric. Check each recovered output file against the matching ground truth in `src/`:

| Check | How to verify | Points |
|---|---|---|
| `async function` present | `grep -r "async function" /tmp/carto-out/` | 10 |
| `class` keyword present | `grep -r "^class " /tmp/carto-out/` | 10 |
| Function `add` recovered | `grep -r "\badd\b" /tmp/carto-out/` | 10 |
| Function `fetchUserData` recovered | `grep -r "fetchUserData\|fetchUser\|getUser" /tmp/carto-out/` | 10 |
| Function `processUserData` recovered | `grep -r "processUser\|processData" /tmp/carto-out/` | 10 |
| `module-graph.json` produced | `test -f /tmp/carto-out/module-graph.json` | 10 |
| `call-graph.json` produced | `test -f /tmp/carto-out/call-graph.json` | 10 |
| Call graph has ≥4 nodes | `jq '.nodes | length' /tmp/carto-out/call-graph.json` | 10 |
| Cross-file edge exists | `jq '.edges[] | select(.type=="external")' /tmp/carto-out/call-graph.json` | 20 |

**Perfect score: 100 points.** Use this rubric when comparing the output of different
LLM providers or measuring the impact of adding a new Wakaru rule.

---

## 11. Test Utilities Reference

All shared test utilities live in `src/test-utils.ts`.

### `assertMatches(actual: string, expected: string[]): void`

Passes if `actual` (case-insensitive) includes any string from the `expected` array. Use
this for all LLM output assertions.

```typescript
assertMatches('fetchUserById', ['fetchUser', 'getUser', 'loadUser']); // ✓ passes
assertMatches('x', ['fetchUser', 'getUser']);                         // ✗ throws
```

### `humanify(...argv: string[]): Promise<{ stdout: string; stderr: string }>`

Spawns the compiled CLI binary with the given arguments. Rejects if the process exits with
a non-zero code. Used only in `.e2etest.ts` files.

### `ensure<T>(value: T | null | undefined, message?: string): T`

Asserts a value is non-null and returns it with the proper type. Use instead of `!` casts
in test code where you want a clear error message.

---

## 12. What to Test Per Phase

This table summarizes the minimum required tests for each implementation phase:

### Phase 1 — Foundation

| Test file | Type | Key assertions |
|---|---|---|
| `src/services/sanitizer/index.test.ts` | unit | Pass-through when disabled; error swallow; logging |
| `src/services/sanitizer/types.test.ts` | unit | Interface shape (smoke test) |
| `src/cli.e2etest.ts` (extended) | e2e | `--no-sanitizer` flag accepted by each command |

### Phase 2 — Syntax Restoration

| Test file | Type | Key assertions |
|---|---|---|
| `src/services/sanitizer/rules.test.ts` | unit | `SANITIZER_RULES` is a non-empty string array |
| `src/services/sanitizer/phase2-restoration.test.ts` | unit | `async function` present after transform; `class` present; Prettier output valid |

### Phase 3 — Static Analysis

| Test file | Type | Key assertions |
|---|---|---|
| `src/services/sanitizer/phase3-heuristics.test.ts` | unit | `void 0` → `undefined`; code shrinks when heuristic enabled; code unchanged when disabled |

### Phase 4 — Module Graph

| Test file | Type | Key assertions |
|---|---|---|
| `src/services/graph/index.test.ts` | unit | ESM imports captured; CJS require captured; exports captured; error recovery; relative paths |
| `src/services/graph/phase4-fixture.test.ts` | unit | Graph structure from unpacked bundle has ≥2 files with import relationships |

### Phase 5 — Call Graph

| Test file | Type | Key assertions |
|---|---|---|
| `src/services/callgraph/index.test.ts` | unit | Node created per function; internal edge; external edge; top-level `root` caller |
| `src/services/callgraph/phase5-fixture.test.ts` | unit | Call graph from a known two-file fixture has expected nodes and edges |

### Phase 6 — Visualization

| Test file | Type | Key assertions |
|---|---|---|
| `src/services/callgraph/presenter.test.ts` | unit | ASCII tree connectors; depth limit; cycle detection; Mermaid header |
| `src/commands/graph.e2etest.ts` | e2e | `humanify graph --entry X` exits 0 and prints tree; `--format mermaid` writes a file |

---

## 13. Rules & Checklist

Before submitting any implementation work, verify:

1. **Every new source file has a corresponding `.test.ts`** with at minimum a smoke test
   (instantiation, happy path, error path).
2. **No test uses `expect()`** — only `assert` from `node:assert`.
3. **No test reads from real project files unless it is a fixture test** — use `tmpdir()`
   for temporary files.
4. **Unit tests complete in < 200ms** — if they're slow, they belong in a different category.
5. **`npm run test:unit` passes at 100%** before any commit.
6. **`npm run build` passes** before any commit.
7. **New CLI flags have at least one E2E test** that verifies the flag is accepted.
8. **LLM tests use `assertMatches`** with a list of at least 3 acceptable name variants.
9. **The webpack-hello-world bundle is used** as the Phase 2+ validation input to verify
   real-world de-transpilation quality.
10. **LOG_BOOK.md is updated** after each phase is completed (see `AGENTS.md` rule 4).
