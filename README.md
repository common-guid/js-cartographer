# JS Cartographer (cartographerjs)

> AI-powered JavaScript deobfuscator and semantic code mapper

JS Cartographer combines Wakaru's static analysis, AST-level transpilation recovery, and large language models to transform minified, obfuscated, or webpack-bundled JavaScript into human-readable, semantically named source code. It then maps the recovered codebase into a navigable dependency graph and semantic call graph.

## Table of Contents

- [How It Works](#how-it-works)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [LLM Providers](#llm-providers)
  - [Local Mode](#local-mode)
  - [Pipeline Options](#pipeline-options)
  - [Graph Visualization](#graph-visualization)
  - [Web Explorer](#web-explorer)
  - [All CLI Options](#all-cli-options)
- [Output Files](#output-files)
- [Project Structure](#project-structure)
- [Development](#development)
  - [Building](#building)
  - [Testing](#testing)
  - [Fixtures](#fixtures)
- [Configuration](#configuration)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## How It Works

JS Cartographer runs a staged pipeline on a minified bundle. The core strategy is to combine **Wakaru** (deterministic structural restoration) with **Humanify** (semantic identifier humanization), then emit dependency and call-graph artifacts.

```
Input bundle
     │
     ▼
 1. webcrack              ─── Unbundles webpack/other bundle formats into files
     │
     ▼
 2. Sourcemap Injection   ─── (Optional) Injects original names from a .js.map file
     │                       as locked "source of truth" identifiers
     ▼
 3. WakaruSanitizer       ─── Restores structure (async/await, class, JSX, optional chaining)
     │                       and applies static heuristic rules (e.g., void 0 → undefined)
     ▼
 4. Babel transforms      ─── Additional AST normalization/cleanup passes
     │
     ▼
 5. Humanify filter       ─── Selects identifiers that still look obfuscated
     │                       (skip globals/descriptive names unless --rename-all)
     ▼
 6. Humanify LLM rename   ─── Renames unresolved identifiers via OpenAI/Gemini/
     │                       OpenRouter/local GGUF with strict JSON output
     ▼
 7. Prettier              ─── Final formatting pass
     │
     ▼
 8. GraphBuilder          ─── Writes module-graph.json (imports/exports per file)
     │
     ▼
 9. CallGraphBuilder      ─── Writes call-graph.json (function nodes + call edges)
     │
     ▼
Output directory: recovered source files + graph artifacts
```

### Why Humanify + Wakaru together?

- **Wakaru alone** is strong at deterministic syntax recovery and known-pattern renaming, but it does not infer project-specific intent for remaining obfuscated names.
- **Humanify alone** (LLM renaming without cleanup) sees noisier transpiled code, which increases token cost and reduces naming reliability.
- **Combined pipeline** gives the LLM cleaner code and a smaller target set of identifiers, so you get better names at lower cost while keeping structural changes deterministic.

LLMs in this pipeline are used for naming, while structural restoration is handled by AST transforms. That separation is what keeps output readable without sacrificing semantic stability.

### Sourcemap Truth Injection

Cartographer can leverage existing `.js.map` files to dramatically improve deobfuscation accuracy through **Truth Injection**:

1. **Source of Truth** — If a sourcemap is provided, Cartographer extracts the original variable and function names. These are treated as absolute "truth."
2. **Identifier Locking** — Before any LLM processing, mapped identifiers are restored to their original names and "locked."
3. **Contextual Anchoring** — The LLM is instructed to use these locked names as anchors. By seeing real names like `fetchUserData` or `AuthService` in the code, the LLM can more accurately deduce the purpose of the *remaining* obfuscated variables.
4. **Efficiency** — Locked identifiers skip the LLM renaming phase entirely, reducing API token usage and runtime.

### Framework-Aware Context & Heuristics

One of the highest-leverage enhancements to JS Cartographer is **automatic framework detection** and context injection. Modern bundles are shaped by their frameworks — React, Express, Vue, etc. — but the LLM renamer has no way to know this from obfuscated code alone. The framework-heuristics track solves this:

1. **Deterministic detection** — A single Babel AST pass per file looks for telltale patterns:
   - `import/require('react')`, JSX syntax, `React.createElement()` → React
   - `import/require('express')` → Express.js
   - Additional frameworks can be trivially added

2. **Zero-cost** — Detection runs once per file during transpilation; no LLM calls.

3. **Prompt augmentation** — Once a framework is detected, the LLM's system prompt is conditionally enriched with framework-specific "Standard Operating Procedures." For React, this includes:
   - Hook variable destructuring: `useState` returns `[state, setState]`
   - Component names: capitalized and often suffixed with `Component`
   - JSX fragment names and element-holding variables

   For Express, this includes middleware patterns, request/response handler conventions, route builder idioms, etc.

4. **Idiiomatic output** — The LLM produces names that *feel* native to the framework, dramatically reducing the "generated code" impression. A React hook variable is instantly recognizable as `useAuth`, not `getRenamedVar42`.

5. **No false positives** — Files with no detected framework use the generic prompt; detection is purely additive.

This approach makes the LLM's job easier (smaller decision space, clearer conventions), produces more maintainable names, and keeps the pipeline's determinism intact. Framework detection is pluggable, so new frameworks and domain-specific patterns can be added without changing core logic.

---

## Features

- **Multi-provider LLM support**: OpenAI, Google Gemini, OpenRouter, or a fully local GGUF model (no API key needed)
- **Sourcemap truth injection**: Accept an optional `.js.map` file alongside the input bundle. Original symbol names from the sourcemap are used as locked identifiers — the LLM will only rename symbols that have no sourcemap entry. These "locked" names act as contextual anchors, significantly improving the LLM's accuracy for the remaining unmapped code.
- **Wakaru static pre-processing**: Restores transpiled patterns before the LLM ever sees the code:
  - `async/await` from generator state machines
  - ES6 `class` from prototype assignment chains
  - JSX from `React.createElement()` calls
  - Optional chaining, nullish coalescing, template literals
  - Sequence expression splitting (vital for LLM comprehension)
- **Heuristic naming**: Deterministically renames `void 0` → `undefined`, normalizes DOM/Node.js API usage patterns, and reduces LLM token costs with character-savings metrics
- **Framework-aware context**: Automatically detects framework fingerprints (React hooks, JSX, Express middleware patterns) and injects framework-specific naming conventions into the LLM prompt. This dramatically improves identifier quality by teaching the LLM idiomatic patterns (e.g., `useState` hook destructuring as `[state, setState]`, React component names capitalized, Express routes as `(req, res, next) => {}`) without polluting the generic prompt for non-framework code. Detection is deterministic and cost-free.
- **Module dependency graph**: Writes `module-graph.json` mapping all `import`/`require` relationships across the unbundled project
- **Semantic call graph**: Writes `call-graph.json` indexing every function definition and call edge (internal and cross-file)
- **Interactive Web Explorer**: A browser-based UI for exploring the deobfuscated codebase, dependency graph, and call graph in an integrated "Map and Territory" view.
- **Graph visualization**: `cartographer graph` sub-command renders the call graph as a depth-limited ASCII tree or Mermaid flowchart
- **Webpack bundle support**: Powered by `webcrack` for automatic bundle extraction
- **Safety-first pipeline**: Each transformation stage wraps errors independently — a failing Wakaru rule or Prettier pass never aborts the entire run

---

## Prerequisites

- **Node.js ≥ 20**
- An API key for your chosen LLM provider (not required for local mode)

---

## Installation

JS Cartographer is currently documented for **local repository usage** (no `npx` required).

```shell
git clone <repo-url>
cd js-cartographer
npm install
npm run build
```

Run from source during development:

```shell
npm start -- --help
npm start -- openrouter --help
```

Or run the built binary directly:

```shell
node dist/index.mjs --help
```

---

## Quick Start

```shell
# Recommended: OpenRouter (supports many models, free tier available)
export OPENROUTER_API_KEY=your_key
npm start -- openrouter bundle.min.js

# Output is written to ./output/ by default
ls output/
# module-graph.json  call-graph.json  src/...
```

---

## Usage

### LLM Providers

#### OpenRouter (Recommended)

[OpenRouter](https://openrouter.ai/) provides access to many models through one API. The default model is `x-ai/grok-4.1-fast`.

```shell
export OPENROUTER_API_KEY=your_key
npm start -- openrouter bundle.min.js

# Use a specific model
npm start -- openrouter bundle.min.js -m anthropic/claude-3.5-sonnet
```

#### OpenAI

```shell
export OPENAI_API_KEY=your_key
npm start -- openai bundle.min.js

# Default model: gpt-4o-mini
npm start -- openai bundle.min.js -m gpt-4o
```

#### Google Gemini

```shell
export GEMINI_API_KEY=your_key
npm start -- gemini bundle.min.js
```

#### Azure / Self-hosted OpenAI proxy

```shell
npm start -- openai bundle.min.js \
  --apiKey your_key \
  --baseURL https://your-azure-endpoint.openai.azure.com/v1
```


---

### Local Mode

Local mode uses a quantized GGUF model via `node-llama-cpp`. No API key is required.

**Step 1 — Download a model** (one-time):

```shell
# Download the 2B model (~2.4 GB, lower memory footprint)
npm start -- download 2b

# Download the 8B model (~4.9 GB, higher quality, higher memory use)
npm start -- download 8b
```

Models are stored in `~/.cartographer/models/` by default (see [Configuration](#configuration-file-cartographerrcjson) to customize).

| Model key | Model | Size |
|-----------|-------|------|
| `2b` | Phi-3.1-mini-4k-instruct Q4_K_M | ~2.4 GB |
| `8b` | Meta-Llama-3.1-8B-Instruct Q4_K_M | ~4.9 GB |
| `30b` | Qwen3-Coder-30B-A3B-Instruct Q4_K_M | ~18.6 GB |

**Note on 30b (Qwen3-Coder):** This is a Mixture-of-Experts (MoE) model. While it only activates ~3B parameters per token for fast inference, the **entire 18.6 GB model** must fit in your VRAM or system RAM. Recommended for users with 24GB+ VRAM or 32GB+ system RAM.

**Step 2 — Run deobfuscation**:

```shell
npm start -- local bundle.min.js

# Use the 8B model explicitly
npm start -- local bundle.min.js -m 8b

# Disable GPU acceleration (e.g. CI)
npm start -- local bundle.min.js --disableGpu
```


---

### Pipeline Options

These flags are available on deobfuscation commands (`openai`, `gemini`, `openrouter`, `local`):

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --outputDir <dir>` | Directory to write output files | `output` |
| `-s, --sourcemap <path>` | Optional sourcemap file for truth injection | none |
| `--contextSize <n>` | Context window passed to the renamer | `1000` |
| `--file-concurrency <n>` | Number of files processed in parallel | `3` |
| `--rename-all` | Rename all identifiers (skip smart filtering) | off |
| `--verbose` | Print verbose logs including model I/O context | off |
| `--no-sanitizer` | Skip the Wakaru syntax restoration stage | sanitizer on |
| `--no-heuristic-naming` | Disable static heuristic naming (`void 0`, smart-rename, etc.) | heuristics on |

#### Token cost estimation

For a rough estimate of LLM token usage before running:

```shell
echo "$((2 * $(wc -c < yourscript.min.js)))"
```

A minified `bootstrap.min.js` (~60 KB) is typically inexpensive on budget models.


---

### Graph Visualization

After a successful deobfuscation run, JS Cartographer writes `call-graph.json`. The `graph` command reads that file and renders function-call relationships.

What it does:

1. Loads `call-graph.json` (`nodes` + `edges`) from your output directory.
2. Traverses outgoing call edges from an entry function (tree mode) or from all nodes (Mermaid mode).
3. Applies optional depth limiting with `--depth`.
4. Renders either terminal-friendly ASCII output or a Mermaid flowchart file.

```shell
# ASCII tree rooted at a specific function (--entry required for tree mode)
npm start -- graph ./output --entry "src/app.js:initApp"

# Limit traversal depth
npm start -- graph ./output --entry "src/app.js:initApp" --depth 3

# Export Mermaid flowchart (full graph if no --entry)
npm start -- graph ./output --format mermaid
# Writes: ./output/call-graph.mermaid
```

**Example ASCII tree output:**

```
src/app.js:initApp
├── src/app.js:loadConfig
│   └── src/utils.js:parseJSON
└── src/app.js:startServer
    ├── src/server.js:listen
    └── src/server.js:bindRoutes
```

Tree mode is best for tracing one execution path. Mermaid mode is best for sharing or reviewing the full graph in tools that render Mermaid.


---

### Web Explorer

The Web Explorer is an interactive browser-based interface for navigating your deobfuscated project. It provides an integrated view of the "Map" (dependency and call graphs) and the "Territory" (the recovered source code).

#### How It Works

The explorer starts a local Express server that:
1. **API Server**: Serves the `module-graph.json` and `call-graph.json` files as well as the deobfuscated source code.
2. **Frontend**: Serves a React-based single-page application built with React Flow for interactive graph visualization.
3. **Integration**: Selecting a file or function in the graph automatically opens and highlights the corresponding source code in the code pane.

#### How to Start and Use

After running a deobfuscation command (e.g., `openai` or `local`), you can launch the explorer pointing to your output directory:

```shell
npm start -- explore ./output
```

**Options:**
- `-p, --port <number>`: Change the default port (default: `3000`)
- `--no-open`: Start the server without automatically opening your browser

```shell
# Use a custom port
npm start -- explore ./output --port 8080

# Start without opening browser
npm start -- explore ./output --no-open
```


---

### All CLI Options

```text
npm start -- <command> [options] <input>

Commands:
  local       Use a local GGUF model to unminify code
  openai      Use OpenAI's API to unminify code
  gemini      Use Google Gemini/AIStudio API to unminify code
  openrouter  Use OpenRouter's API to unminify code
  download    Download supported local models (subcommands: 2b, 8b)
  graph       Visualize the call graph of a deobfuscated project
  explore     Launch an interactive web-based explorer for a deobfuscated project

Shared deobfuscation options (local | openai | gemini | openrouter):
  -m, --model <model>           Model name
  -o, --outputDir <dir>         Output directory                  [default: output]
  -k, --apiKey <key>            API key (or environment variable)
  --baseURL <url>               Override API base URL (OpenAI/OpenRouter)
  --contextSize <n>             Context size                       [default: 1000]
  --file-concurrency <n>        Number of files in parallel        [default: 3]
  --rename-all                  Rename all identifiers
  --verbose                     Verbose output
  --no-sanitizer                Disable Wakaru syntax restoration
  --no-heuristic-naming         Disable static heuristic naming

local-specific options:
  -s, --seed <seed>             Seed for reproducible results
  --disableGpu                  Disable GPU acceleration

graph options:
  -e, --entry <id>              Function ID to trace, e.g. "src/main.js:init"
  -d, --depth <n>               Maximum depth to traverse
  -f, --format <type>           Output format: tree (default) or mermaid

explore options:
  -p, --port <number>           Port to listen on                  [default: 3000]
  --no-open                     Do not automatically open the browser
```

For exact options in your current branch, use:

```shell
npm start -- --help
npm start -- openrouter --help
npm start -- local --help
npm start -- graph --help
```


---

## Output Files

Every deobfuscation run produces the following in the output directory:

| File | Description |
|------|-------------|
| `src/**/*.js` | Recovered and renamed source files (mirroring the original module structure) |
| `module-graph.json` | Project-wide import/require dependency map. Each entry lists the `imports` and `exports` for every file. |
| `call-graph.json` | Semantic function call graph. Contains a `nodes` registry (one entry per named function: file, name, line) and an `edges` array recording every call site with `type: "internal"` or `"external"`. |
| `call-graph.mermaid` | Mermaid flowchart export (only when `--format mermaid` is used) |

### module-graph.json schema

```json
{
  "files": {
    "src/app.js": {
      "id": "src/app.js",
      "imports": ["src/utils.js"],
      "exports": ["startApp"]
    }
  },
  "entryPoint": "src/app.js"
}
```

### call-graph.json schema

```json
{
  "nodes": {
    "src/app.js:startApp": {
      "id": "src/app.js:startApp",
      "file": "src/app.js",
      "name": "startApp",
      "line": 12
    }
  },
  "edges": [
    {
      "from": "src/app.js:startApp",
      "to": "src/utils.js:parseConfig",
      "type": "external"
    }
  ]
}
```

---

## Project Structure

A trimmed view of the current repository layout (focused on active runtime and test paths):

```text
js-cartographer/
├── src/
│   ├── index.ts                     # CLI entrypoint
│   ├── unminify.ts                  # Pipeline orchestrator
│   ├── concurrency.ts               # pLimit/withRetry helpers
│   ├── cli.ts                       # Shared Commander instance
│   ├── commands/
│   │   ├── openai.ts
│   │   ├── gemini.ts
│   │   ├── openrouter.ts
│   │   ├── local.ts
│   │   ├── download.ts
│   │   └── graph.ts
│   ├── plugins/
│   │   ├── babel/babel.ts
│   │   ├── webcrack.ts
│   │   ├── prettier.ts
│   │   ├── gemini-rename.ts
│   │   ├── openai/openai-rename.ts
│   │   ├── openrouter/openrouter-rename.ts
│   │   └── local-llm-rename/
│   │       ├── local-llm-rename.ts
│   │       ├── identifier-filter.ts
│   │       ├── visit-all-identifiers.ts
│   │       ├── unminify-variable-name.ts
│   │       ├── llama.ts
│   │       └── gbnf.ts
│   ├── services/
│   │   ├── sanitizer/               # Wakaru wrapper + rule config
│   │   ├── graph/                   # module-graph builder
│   │   └── callgraph/               # semantic call graph + presenters
│   ├── test/                        # e2e + LLM validation tests
│   └── test-utils.ts                # CLI spawn/assert helpers
├── fixtures/
│   ├── example.min.js
│   └── webpack-hello-world/         # canonical end-to-end fixture
├── testing/
│   ├── TESTING_GUIDE.md
│   └── phase_tests/
├── conductor/
│   └── testing-quality-suite.md     # quality-suite plan/spec
├── .specs/                          # implementation phase specs
├── dist/                            # compiled CLI output
├── README.md
└── package.json
```

### Key architectural patterns

**Plugin pipeline** (`src/unminify.ts`): each deobfuscation provider composes `babel -> provider rename plugin -> prettier` into a simple async string-to-string chain. The sanitizer runs before plugin execution.

**Humanify identifier strategy** (`src/plugins/local-llm-rename/visit-all-identifiers.ts` + `identifier-filter.ts`): by default, only likely-obfuscated identifiers are sent to the LLM. Use `--rename-all` to bypass filtering.

**Wakaru loading via `createRequire`** (`src/services/sanitizer/index.ts`): `@wakaru/unminify` is loaded lazily via `createRequire(import.meta.url)` for compatibility with its CJS packaging.

**Graph IDs**: `call-graph.json` and graph output use path-qualified IDs (e.g., `src/app.js:initApp`) to avoid cross-file naming collisions.

---

## Development

### Building

```shell
npm run build         # Compile TypeScript to dist/ via pkgroll
npm start -- --help   # Run CLI directly via tsx (no build required)
npm run debug         # Run with Node.js inspector attached
```

### Testing

The project uses Node.js's built-in `node:test` runner with `tsx` for TypeScript execution.

```shell
npm run test            # Runs test:unit + test:e2e + test:llm
npm run test:unit       # Unit tests (*.test.ts)
npm run test:e2e        # E2E tests (*.e2etest.ts), runs npm run build first
npm run test:llm        # Local-model accuracy tests (*.llmtest.ts)
npm run test:openai     # OpenAI accuracy tests (*.openaitest.ts)
npm run test:gemini     # Gemini accuracy tests (*.geminitest.ts)
```

`test:e2e` and `test:llm` include local-model coverage. Download a model first:

```shell
npm start -- download 2b
```

About `npm run test:quality`:

- The script exists in `package.json`, but currently points to `testing/quality/runner.ts`, which is not present in this branch.
- Until that runner is restored, use this working quality gate:

```shell
npm run lint && npm run test:unit && npm run test:e2e
```

Test files live **alongside the source they test** inside `src/`. See `testing/TESTING_GUIDE.md` for conventions.


### Linting

```shell
npm run lint           # Run Prettier check + ESLint
npm run lint:prettier  # Prettier format check only
npm run lint:eslint    # ESLint only
```

### Fixtures

The `fixtures/webpack-hello-world/` directory is the canonical end-to-end validation target. It contains:

- **`src/`** — four human-readable source files: `tasks.js`, `storage.js`, `filters.js`, `app.js`. These are the **ground truth** for evaluating output quality.
- **`dist/bundle.js`** — a pre-built Webpack 5 + Babel (IE11 target) bundle that exercises: async/await (generator transpilation), ES6 classes (prototype transpilation), cross-file imports, and named functions.

To validate the full pipeline against the fixture:

```shell
npm run build
node dist/index.mjs openai fixtures/webpack-hello-world/dist/bundle.js -o /tmp/carto-out
# Then compare /tmp/carto-out/src/ against fixtures/webpack-hello-world/src/
```

---

## Configuration

Copy `.env.example` to `.env` and fill in the keys you need:

```shell
cp .env.example .env
```

### Environment Variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | `cartographer openai` | OpenAI secret key |
| `OPENAI_BASE_URL` | `cartographer openai` | Override for Azure or local proxy |
| `GEMINI_API_KEY` | `cartographer gemini` | Google AI Studio key |
| `OPENROUTER_API_KEY` | `cartographer openrouter` | OpenRouter key |
| `OPENROUTER_BASE_URL` | `cartographer openrouter` | Override OpenRouter base URL |
| `CARTOGRAPHER_CONFIG` | all | Path to a custom `.cartographerrc.json` file |
| `MODEL` | local tests | Model key (`2b` or `8b`) used in test runs |
| `VERBOSE` | all | Set to any value for verbose output in tests |

### Configuration File (.cartographerrc.json)

You can further customize JS Cartographer using a `.cartographerrc.json` file. The tool looks for this file in the following order:
1. The path specified by the `CARTOGRAPHER_CONFIG` environment variable.
2. The current working directory.
3. Your home directory (`~/.cartographerrc.json`).

#### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `modelsDirectory` | Path where local GGUF models are stored | `~/.cartographer/models/` |

**Example `.cartographerrc.json`:**

```json
{
  "modelsDirectory": "/mnt/data/ai-models/cartographer"
}
```

---

## Roadmap

The following features are candidates for future development, ordered roughly by impact and feasibility.

### Tests

Comprehensive test suite additions to improve coverage and reduce blind spots.

#### Highest-priority gaps (completed)
- [x] End-to-end fixture validation against the new task manager — `src/services/fixture.e2etest.ts`
- [x] `--no-heuristic-naming` CLI contract test (all providers) — added to `src/services/sanitizer/sanitizer-flag.e2etest.ts`
- [x] `--rename-all` integration behavior test — `src/plugins/local-llm-rename/rename-all.test.ts`
- [x] `webcrack` output discovery test (recursive files) — `src/plugins/webcrack.test.ts`
- [x] Call graph import variants test (alias, default, namespace, CJS) — added to `src/services/callgraph/index.test.ts`
- [x] Sourcemap-driven truth injection — `src/services/sourcemap/index.ts`

#### Additional comprehensive tests
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

### Interactive graph explorer (TUI)
Replace the current ASCII tree output with a navigable terminal UI (e.g., using `ink` or `blessed`) that lets the user expand/collapse call graph nodes, jump to the recovered source file, and annotate functions with notes — all without leaving the terminal.

### Mermaid-to-SVG export
Pipe the `call-graph.mermaid` output through `@mermaid-js/mermaid-cli` (or a bundled Puppeteer instance) to produce a standalone SVG diagram alongside the Mermaid source, making it shareable with non-developers.

### Incremental / cached processing
Cache LLM rename results keyed by a hash of each code chunk. Re-running the tool on a bundle that has only partially changed would skip already-processed chunks, significantly reducing cost and runtime on large codebases.

### Batch / directory mode
Accept a directory of `.js` files (not just a single bundle) as input and run the full pipeline on each file in parallel. Useful for analyzing pre-extracted npm packages or already-unbundled code trees.

### Plugin API
Expose the internal `(code: string) => Promise<string>` pipeline as a programmatic API with a documented `plugin` interface, enabling users to inject custom transforms (e.g., project-specific identifier dictionaries) between any two existing pipeline stages.

### Dead code / reachability analysis
Use the call graph to identify functions that are never called from any entry point, flagging them as potentially dead code. This would aid in both understanding and cleaning up obfuscated bundles.

### Taint Analysis (Milestone)
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


### Configurable rule profiles
Expose `STRUCTURAL_RULES` and `HEURISTIC_RULES` through a JSON or YAML config file, allowing users to enable, disable, or reorder individual Wakaru transformation rules without modifying source code or rebuilding.

### VS Code extension
A VS Code extension that wraps the CLI: right-click any `.min.js` file, select "Deobfuscate with JS Cartographer", choose a provider, and open the recovered files in a new workspace — with the call graph rendered in a dedicated panel.

### Docker image
A minimal Docker image (`node:20-alpine` base) that bundles the compiled `dist/` and exposes the `cartographer` binary, enabling use in CI pipelines and environments where Node.js is not installed.

---

## Contributing

Fork the repository and create a feature branch. Pull requests are welcome.

When adding new functionality:
1. Follow the test conventions in `testing/TESTING_GUIDE.md`
2. Add an entry to `LOG_BOOK.md` on completion
3. Keep the plugin pipeline signature `(code: string) => Promise<string>` intact

---

## License

MIT — see individual source files for details.
