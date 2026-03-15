# JS Cartographer: Wakaru Integration & Call Graph
## Project Objective
Integrate Wakaru's static analysis and syntax restoration into the Humanify CLI pipeline to reduce LLM token costs, improve naming accuracy, and generate a semantic call graph across the unbundled codebase.
## Current State
The codebase (`humanifyjs` v2.2.2) is a TypeScript CLI tool with the following pipeline:
1. `webcrack` — unbundles/unpacks the minified JS into individual files
2. `babel` plugin — AST transforms (void→undefined, Yoda flips, scientific notation expansion)
3. LLM renamer (openai / gemini / local) — renames identifiers via `visitAllIdentifiers()` in `src/plugins/local-llm-rename/visit-all-identifiers.ts`
4. `prettier` — final formatting
Key files:
* `src/unminify.ts` — core pipeline, accepts array of `(code: string) => Promise<string>` plugins
* `src/commands/openai.ts` (and gemini, openrouter, local) — CLI command definitions using `commander`
* `src/index.ts` — registers all commands; exposes `humanify` binary
* `src/babel-utils.ts` — `transformWithPlugins()` wrapping `@babel/core`
* `src/plugins/webcrack.ts` — wraps `webcrack`, returns `File[]` with `.path`
Neither `@wakaru/unminify` nor `@wakaru/unpacker` are currently installed. No `services/` directory exists yet.
## Phase 1: Foundation & Dependency Integration
**Goal:** Install Wakaru, create the `WakaruSanitizer` service architecture with safety toggles, and wire a pass-through slot into the pipeline without altering output.
* Install `@wakaru/unminify` and `@wakaru/unpacker`; run `npm list @babel/core` to verify no duplicate Babel trees (run `npm dedupe` if needed)
* Create `src/services/sanitizer/types.ts` defining `SanitizerConfig` (with `enabled` flag), `TransformationResult` (code + optional source map), and `CodeTransformer` interface
* Create `src/services/sanitizer/index.ts` implementing `WakaruSanitizer` as a pass-through with try/catch safety net
* Integrate sanitizer into `unminify.ts` — add a pre-LLM sanitization step that accepts a filepath, keeping the existing `plugins[]` pattern intact
* Add `--no-sanitizer` CLI option to each command file
* **Validation:** `npm run build` passes; default run logs `[Sanitizer] Processing...`; `--no-sanitizer` suppresses it
* Write a baseline non-regression test using existing fixtures (`src/cli.e2etest.ts` pattern)
## Phase 2: The Syntax Restoration Layer
**Goal:** Activate Wakaru's AST transformation rules to de-transpile code (async/await, JSX, classes) before the LLM sees it.
* Promote `prettier` from `devDependencies` to `dependencies` (runtime use)
* Create `src/services/sanitizer/rules.ts` with `SANITIZER_RULES` array covering structural restoration (`un-async-await`, `un-jsx`, `un-es6-class`) and readability cleanup (`un-sequence-expression`, `un-variable-merging`, `un-curly-braces`, `un-flip-comparisons`, `un-optional-chaining`, `un-nullish-coalescing`, `un-template-literals`)
* Update `WakaruSanitizer.transform()` to call `runTransformationRules()` from `@wakaru/unminify` with the rule list, then run Prettier (with nested try/catch so Prettier failure doesn't discard Wakaru output)
* Update LLM system prompt in each renamer plugin (`src/plugins/openai/openai-rename.ts`, gemini, openrouter, local) to remove "fix syntax" instructions and focus solely on naming
* **Validation:** A test file with Yoda conditions and generator patterns produces correctly formatted output before reaching the LLM
* **Phase Plan:** .specs/phase-2.md
## Phase 3: Static Analysis & Cost Optimization
**Goal:** Run Wakaru's heuristic renaming (`smart-rename`) to deterministically name well-known APIs, reducing LLM token spend.
* Update `SanitizerConfig` in `types.ts` to add `useHeuristicNaming: boolean` flag
* Split `rules.ts` into `STRUCTURAL_RULES` (Phase 2 set) and `HEURISTIC_RULES` (`un-undefined`, `un-infinity`, `un-numeric-literal`, `smart-rename`)
* Update `WakaruSanitizer` to conditionally append `HEURISTIC_RULES` and log a character-savings metric when heuristic naming is active
* Add `--no-heuristic-naming` CLI option to each command file; wire it into `SanitizerConfig`
* Update LLM system prompt with a "NAMING RULES (STRICT)" block: respect already-named variables as locked, only rename still-obfuscated identifiers
* **Validation:** A test file with `void 0` and DOM access patterns produces metric logs and correctly renamed variables pre-LLM
* **Phase Plan:** .specs/phase-3.md
## Phase 4: Module Intelligence
**Goal:** After unpacking, scan the output directory to build a project-wide dependency graph (`module-graph.json`).
* Create `src/services/graph/types.ts` defining `FileNode` (`id`, `imports[]`, `exports[]`) and `ModuleGraph` (`files` record, optional `entryPoint`)
* Create `src/services/graph/index.ts` with `GraphBuilder` class: recursively finds `.js`/`.ts` files, uses `@babel/parser` + `@babel/traverse` to extract `ImportDeclaration`, `require()` calls, and `ExportNamedDeclaration` nodes
* Integrate `GraphBuilder` into `unminify.ts` — runs immediately after `webcrack` but before per-file processing; writes `module-graph.json` to the output directory
* **Validation:** A two-file test project (`main.js` importing from `utils.js`) produces a correct `module-graph.json` with proper `imports` and `exports` arrays
* **Phase Plan:** .specs/phase-4.md
## Phase 5: The Call Graph Implementation
**Goal:** After LLM renaming completes, analyze the final code to produce a semantic call graph (`call-graph.json`).
* Create `src/services/callgraph/types.ts` defining `FunctionNode` (`id`, `file`, `name`, `line`), `CallEdge` (`from`, `to`, `type: 'internal'|'external'`), and `CallGraphData` (`nodes` record, `edges` array)
* Create `src/services/callgraph/index.ts` with `CallGraphBuilder`: two-pass analysis — Pass 1 indexes all top-level `FunctionDeclaration` nodes and import mappings; Pass 2 records `CallExpression` edges (internal vs. external via import map). Extract shared file-listing utility to `src/services/graph/file-utils.ts` to avoid duplication with Phase 4
* Integrate `CallGraphBuilder` into `unminify.ts` as the final step after all plugins complete; writes `call-graph.json` to output directory
* **Validation:** Test project `main.js:fnA` calls imported `lib.js:fnB`; `call-graph.json` contains both nodes and the correct edge with `type: 'external'`
* **Phase Plan:** .specs/phase-5.md
## Phase 6: CLI Experience & Visualization
**Goal:** Expose the call graph to users via a `humanify graph` sub-command with ASCII tree and Mermaid export.
* Create `src/services/callgraph/presenter.ts` with `GraphPresenter` class implementing:
    * `toAsciiTree(entryId, maxDepth)` — depth-limited ASCII tree with cycle detection using `├──`/`└──` connectors
    * `toMermaid(entryId?, maxDepth)` — Mermaid `graph TD` flowchart string
* Create `src/commands/graph.ts` as a new Commander command (`graph <directory>`) with options `--entry`, `--depth`, `--format` (tree|mermaid); reads `call-graph.json` from the directory, routes to the appropriate presenter output
* Register the `graph` command in `src/index.ts`
* Update `README_humanify-plus.md` documenting the new `--no-sanitizer`, `--no-heuristic-naming`, and `graph` sub-command
* **Validation:** ASCII tree output matches expected tree structure for a test project; `--depth 1` correctly limits traversal; Mermaid export writes a valid `graph TD` file
* **Phase Plan:** .specs/phase-6.md
## Cross-Cutting Concerns
* Each phase produces its own `.test.ts` unit tests (following the `src/**/*.test.ts` pattern used by `npm run test:unit`) and an E2E test where applicable
* Each completed feature is appended to `LOG_BOOK.md` per the project rules
* The existing plugin pipeline signature `(code: string) => Promise<string>` is preserved throughout; the sanitizer is wired as a pre-plugin step in `unminify.ts` rather than inserted into the plugins array, preserving backward compatibility
* The `@babel/traverse` import pattern (the hack in `visit-all-identifiers.ts`) should be reused in Phase 4/5 graph services to avoid the same pkgroll issue
