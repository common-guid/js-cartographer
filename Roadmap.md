# JS Cartographer Roadmap

The following features and improvements are planned for JS Cartographer, ordered roughly by impact and feasibility.

## Tests

Comprehensive test suite additions to improve coverage and reduce blind spots.

### Highest-priority gaps (completed)
- [x] End-to-end fixture validation against the new task manager — `src/services/fixture.e2etest.ts`
- [x] `--no-heuristic-naming` CLI contract test (all providers) — added to `src/services/sanitizer/sanitizer-flag.e2etest.ts`
- [x] `--rename-all` integration behavior test — `src/plugins/local-llm-rename/rename-all.test.ts`
- [x] `webcrack` output discovery test (recursive files) — `src/plugins/webcrack.test.ts`
- [x] Call graph import variants test (alias, default, namespace, CJS) — added to `src/services/callgraph/index.test.ts`
- [x] Sourcemap-driven truth injection — `src/services/sourcemap/index.ts`

### Additional comprehensive tests
- [ ] Call graph node types coverage (arrow functions, expressions, class methods) (TODO: functionality currently missing)
- [ ] Call graph duplicate edge suppression (TODO: functionality currently missing)
- [ ] Graph builder import normalization test (TODO: functionality currently missing)
- [x] `GraphPresenter.toMermaid` depth/entry tests
- [x] `graph` command failure-path E2E tests
- [x] `explore` command tests (`--no-open`, invalid port, startup/shutdown)
- [x] Explorer server negative-path tests (missing files, malformed JSON, large reads)
- [x] Explorer frontend transform unit tests (layout, edge dedup, dangling edges)
- [x] Explorer store state-machine tests (history, transitions, error fallback)
- [x] Sanitizer fallback tests (Prettier/Wakaru failure resilience)
- [x] Input validation unit tests for utilities (number-utils, file-utils, env, url)
- [x] Download/model management tests (unknown model, already downloaded, async completion)
- [x] Provider prompt-shape tests (OpenAI, OpenRouter, Gemini framework injection)
- [x] `unminify` pipeline ordering test (webcrack → graph → sanitizer → plugins → callgraph)
- [x] Doc/fixture consistency test (fixture README references existing files)

---

## Interactive graph explorer (TUI)
Replace the current ASCII tree output with a navigable terminal UI (e.g., using `ink` or `blessed`) that lets the user expand/collapse call graph nodes, jump to the recovered source file, and annotate functions with notes — all without leaving the terminal.

## Mermaid-to-SVG export
Pipe the `call-graph.mermaid` output through `@mermaid-js/mermaid-cli` (or a bundled Puppeteer instance) to produce a standalone SVG diagram alongside the Mermaid source, making it shareable with non-developers.

## Incremental / cached processing
Cache LLM rename results keyed by a hash of each code chunk. Re-running the tool on a bundle that has only partially changed would skip already-processed chunks, significantly reducing cost and runtime on large codebases.

## Batch / directory mode
Accept a directory of `.js` files (not just a single bundle) as input and run the full pipeline on each file in parallel. Useful for analyzing pre-extracted npm packages or already-unbundled code trees.

## Plugin API
Expose the internal `(code: string) => Promise<string>` pipeline as a programmatic API with a documented `plugin` interface, enabling users to inject custom transforms (e.g., project-specific identifier dictionaries) between any two existing pipeline stages.

## Dead code / reachability analysis
Use the call graph to identify functions that are never called from any entry point, flagging them as potentially dead code. This would aid in both understanding and cleaning up obfuscated bundles.

## Taint Analysis (Milestone)
Automated "Taint-to-Sink" mapping to identify DOM-based vulnerabilities and data leaks in deobfuscated code.

- **Track 1: DOM Source/Sink Discovery**
  - [ ] Expand `api-analyzer` to identify DOM sources (`location.hash`, etc.) and execution sinks (`eval`, `innerHTML`).
  - [ ] Build a comprehensive catalog of sources and sinks with AST node locations.
- **Track 2: Intra-procedural Taint Tracking**
  - [ ] Build a data-flow engine for tracking variables from source to sink within a single function.
  - [ ] Handle variable assignments, reassignments, and string concatenations.
- **Track 3: Inter-procedural & Cross-Module Taint Tracking**
  - [ ] Connect local data flows across function boundaries and module imports/exports.
  - [ ] Leverage existing call-graph and module-graph for full-path tracing.
- **Track 4: LLM-Augmented Sanitization Check**
  - [ ] Use LLM to analyze intermediate functions and identify sanitizers (e.g., `DOMPurify`).
  - [ ] Generate natural language explanations and exploitability scores for discovered flows.
- **Track 5: Security Explorer UI & Reporting**
  - [ ] Add a "Security" tab to the Web Explorer for interactive flow visualization.
  - [ ] Implement a structured JSON exporter and a `--security-report` CLI flag.

## Configurable rule profiles
Expose `STRUCTURAL_RULES` and `HEURISTIC_RULES` through a JSON or YAML config file, allowing users to enable, disable, or reorder individual Wakaru transformation rules without modifying source code or rebuilding.

## VS Code extension
A VS Code extension that wraps the CLI: right-click any `.min.js` file, select "Deobfuscate with JS Cartographer", choose a provider, and open the recovered files in a new workspace — with the call graph rendered in a dedicated panel.

## Docker image
A minimal Docker image (`node:20-alpine` base) that bundles the compiled `dist/` and exposes the `cartographer` binary, enabling use in CI pipelines and environments where Node.js is not installed.

---

## New Architectural Patterns & Features (Codebase Intelligence)

Inspired by advancements in codebase mapping tools like GitNexus:

### Embedded Graph Database Integration
Transition from flat JSON files (`module-graph.json`, `call-graph.json`) to an embedded graph database (e.g., LadybugDB or a similar graph library).
- **Benefit:** Allows for complex relationship traversal via Cypher-like queries.
- **Benefit:** Enables "Reachability Analysis" to determine if sensitive sinks are accessible from specific entry points.
- **Benefit:** Better performance for massive bundles by avoiding full JSON loads into memory.

### Community Detection (Leiden Algorithm)
Implement automatic clustering of unbundled modules using the Leiden community detection algorithm.
- **Benefit:** Automatically groups related files (e.g., "Authentication", "Routing") even when they are named with numeric IDs.
- **Benefit:** Provides "neighborhood context" to LLM plugins, improving renaming accuracy by seeing logically related code together.

### Model Context Protocol (MCP) Server
Expose Cartographer's intelligence via an MCP server interface.
- **Benefit:** Allows AI agents (Claude Code, Cursor, Windsurf) to query the deobfuscated bundle's graph directly.
- **Benefit:** Enables natural language queries over the codebase structure: *"Find all paths from the login button to the API request function."*

### High-Performance Querying with Tree-sitter
Integrate Tree-sitter for rapid post-unminification querying.
- **Benefit:** Significant performance improvements for Phase 5 (Call Graph) and Phase 6 (API Surface) analysis compared to full Babel AST traversals.
- **Benefit:** Enables real-time graph updates as the user interacts with the code in the explorer.
