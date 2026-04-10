## Phase 1: Foundation & Dependency Integration | 2026-03-13
Installed `@wakaru/unminify` and `@wakaru/unpacker`; created `src/services/sanitizer/` with `WakaruSanitizer` (pass-through with try/catch safety net, `createRequire`-based Wakaru loader documented for Phase 2); wired sanitizer as a pre-plugin step in `unminify.ts`; added `--no-sanitizer` to all 4 command files; wrote 10 unit tests and 9 E2E non-regression tests — all pass (33/33 unit, 12/13 E2E with 1 pre-existing local-model failure).

## Pre-execution setup & testing infrastructure | 2026-03-13
Installed project dependencies, pinned `@babel/parser` and `@babel/traverse` as explicit direct dependencies (required by Phases 4/5), verified clean build and 23/23 unit tests passing, created `.env.example` documenting all environment variables, and created `testing/TESTING_GUIDE.md` as the source-of-truth reference for all test writing in the project.

## webpack-hello-world test fixture | 2026-03-12
Created `fixtures/webpack-hello-world/` — a self-contained webpack 5 + Babel (IE11 target) application with 4 source files (`math.js`, `greeting.js`, `api.js`, `app.js`) that serves as a ground truth for validating JS Cartographer's deobfuscation pipeline. The pre-built `dist/bundle.js` is committed so it can be used immediately as a test input.
## Phase 3: Static Analysis & Cost Optimization | March 16 2026
Implemented Wakaru's heuristic renaming and static analysis as the third phase of the deobfuscation pipeline. Added strict rules for LLM prompts to skip pre-analyzed code blocks and logs metric size reductions.

## Phase 4: Module Intelligence | 2024-10-26
Implemented a `GraphBuilder` service that uses `@babel/parser` and `@babel/traverse` to scan unbundled files and generate a `module-graph.json` mapping out all internal dependencies (imports/requires) and named exports. The service runs immediately after the Webcrack phase in `unminify.ts`.

## Phase 5: The Call Graph Implementation | 2024-10-26
Implemented `CallGraphBuilder` service that uses `@babel/parser` and `@babel/traverse` to scan renamed files and generate a semantic `call-graph.json` connecting defined functions to their usage sites. Integrated into the main CLI pipeline in `src/unminify.ts` to run as the final step. Created required test cases and generated test reports.

## Phase 6: CLI Experience & Visualization | 2024-10-26
Implemented `GraphPresenter` to generate depth-limited ASCII trees and Mermaid charts from the `call-graph.json` data. Exposed the functionality via the new `cartographer graph` sub-command. Added comprehensive unit and E2E tests, and updated the README documentation.

## Performance: Intelligent Identifier Filtering | 2026-04-06
Added a pre-filter (`src/plugins/local-llm-rename/identifier-filter.ts`) that skips already-meaningful identifiers before sending them to the LLM, reducing unnecessary API calls by an estimated 40–60%. The filter uses three layers: static skip-lists (JS builtins, Node globals, webpack internals, reserved words), obfuscation-pattern detection (single-char and `_0x` hex names), and heuristic rules (vowel presence, camelCase length). A `--rename-all` CLI flag on all 4 commands restores the original send-everything behaviour. Added 12 unit tests for the filter and 4 integration tests for `visitAllIdentifiers` — all 72 tests pass.

## Performance: Parallel File Processing | 2026-04-06
Refactored `unminify.ts` to process webcrack-extracted files concurrently using a custom `pLimit` concurrency limiter (`src/concurrency.ts`), replacing the sequential `for` loop with `Promise.all` capped at a configurable concurrency limit. Added a `withRetry` helper with exponential backoff for resilience against transient API failures. Added `--file-concurrency <n>` CLI option (default: 3) to all 4 commands. Also added multi-file progress tracking in `progress.ts`. For multi-module bundles this provides up to 3–5× speedup; single-file bundles are unaffected. Wrote 9 unit tests for `pLimit`/`withRetry` and 5 integration tests for parallel file processing — all 86 tests pass.

## Interactive Web-based Explorer | 2026-04-08
Implemented a full-stack interactive web explorer launched via `cartographer explore <directory>`. Backend: Express.js server (`src/explorer/server.ts`) bound to `127.0.0.1` serving three API endpoints (`/api/graphs`, `/api/file`, `/api/files`) with path-traversal protection, plus static frontend assets. Frontend (`src/explorer/frontend/`): React + Vite + Tailwind CSS SPA with a dual-pane layout — left pane renders call-graph and module-graph as interactive React Flow diagrams (zoom, pan, node selection, search filtering), right pane displays source code in Monaco Editor with line-jump navigation. Zustand manages global state including bidirectional sync (graph→code via node click, code→graph via word-at-cursor), search/filter, and back/forward navigation history. Wrote 8 integration tests for all server API endpoints — all pass.

## Framework-Aware Context & Heuristics | 2026-04-09
Added a `FrameworkDetector` service (`src/services/heuristics/framework-detector.ts`) that runs a single Babel AST pass per file to detect React (`import/require('react')`, `React.createElement`) and Express (`import/require('express')`). Created a `framework-rules.ts` prompt map (`src/plugins/prompts/framework-rules.ts`) with idiomatic naming SOPs for each framework. Updated all four LLM providers (OpenAI, OpenRouter, Gemini, Local) to call the detector once per file and conditionally append the matching rules to their system prompts — zero behaviour change when no framework is detected. Wrote 19 unit tests covering all detection paths and the prompt-builder helper — all 103 unit tests pass.

## Documentation: Framework-Heuristics Explanation | 2026-04-09
Added comprehensive explanation of framework-aware context detection to README.md under a new "Framework-Aware Context & Heuristics" subsection in "How It Works". Documented the five key aspects: deterministic detection (React/Express patterns), zero-cost operation, prompt augmentation with SOPs, idiomatic output quality, and pluggability for new frameworks. Updated the Features section with a concise bullet point highlighting the technique. Removed the now-completed framework-aware renaming hints from the Roadmap.
