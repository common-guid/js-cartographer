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

JS Cartographer runs a multi-stage pipeline on a minified JS file:

```
Input bundle
     │
     ▼
 1. webcrack          ─── Unbundles Webpack/other bundlers into individual files
     │
     ▼
 2. WakaruSanitizer   ─── Static analysis: restores async/await, ES6 classes, JSX,
     │                    modern syntax idioms, and heuristically renames known APIs
     ▼
 3. Babel transforms  ─── AST-level cleanup (Yoda flip, void→undefined, etc.)
     │
     ▼
 4. LLM renamer       ─── Renames remaining obfuscated identifiers via AI
     │                    (OpenAI / Gemini / OpenRouter / local GGUF model)
     ▼
 5. Prettier          ─── Final consistent formatting
     │
     ▼
 6. GraphBuilder      ─── Generates module-graph.json (import/export dependency map)
     │
     ▼
 7. CallGraphBuilder  ─── Generates call-graph.json (semantic function call graph)
     │
     ▼
Output directory: renamed source files + JSON graph artifacts
```

LLMs only rename identifiers — they never restructure code. All structural transformations happen deterministically at the AST level via Babel and Wakaru, ensuring the output is semantically equivalent to the input.

---

## Features

- **Multi-provider LLM support**: OpenAI, Google Gemini, OpenRouter, or a fully local GGUF model (no API key needed)
- **Wakaru static pre-processing**: Restores transpiled patterns before the LLM ever sees the code:
  - `async/await` from generator state machines
  - ES6 `class` from prototype assignment chains
  - JSX from `React.createElement()` calls
  - Optional chaining, nullish coalescing, template literals
  - Sequence expression splitting (vital for LLM comprehension)
- **Heuristic naming**: Deterministically renames `void 0` → `undefined`, normalizes DOM/Node.js API usage patterns, and reduces LLM token costs with character-savings metrics
- **Module dependency graph**: Writes `module-graph.json` mapping all `import`/`require` relationships across the unbundled project
- **Semantic call graph**: Writes `call-graph.json` indexing every function definition and call edge (internal and cross-file)
- **Graph visualization**: `cartographer graph` sub-command renders the call graph as a depth-limited ASCII tree or Mermaid flowchart
- **Webpack bundle support**: Powered by `webcrack` for automatic bundle extraction
- **Safety-first pipeline**: Each transformation stage wraps errors independently — a failing Wakaru rule or Prettier pass never aborts the entire run

---

## Prerequisites

- **Node.js ≥ 20**
- An API key for your chosen LLM provider (not required for local mode)

---

## Installation

### Use directly via npx (no install required)

```shell
npx cartographer openrouter yourfile.min.js
```

### Install globally

```shell
npm install -g cartographerjs
cartographer openrouter yourfile.min.js
```

### Clone for development

```shell
git clone <repo-url>
cd js-cartographer
npm install
npm run build
```

---

## Quick Start

```shell
# Recommended: OpenRouter (supports many models, free tier available)
export OPENROUTER_API_KEY=your_key
npx cartographer openrouter bundle.min.js

# Output is written to ./output/ by default
ls output/
# module-graph.json  call-graph.json  src/...
```

---

## Usage

### LLM Providers

#### OpenRouter (Recommended)

[OpenRouter](https://openrouter.ai/) provides access to dozens of models through a single API. The default model is `x-ai/grok-4.1-fast`.

```shell
export OPENROUTER_API_KEY=your_key
npx cartographer openrouter bundle.min.js

# Use a specific model
npx cartographer openrouter bundle.min.js -m anthropic/claude-3.5-sonnet
```

#### OpenAI

```shell
export OPENAI_API_KEY=your_key
npx cartographer openai bundle.min.js

# Default model: gpt-4o-mini
npx cartographer openai bundle.min.js -m gpt-4o
```

#### Google Gemini

```shell
export GEMINI_API_KEY=your_key
npx cartographer gemini bundle.min.js
```

#### Azure / Self-hosted OpenAI proxy

```shell
npx cartographer openai bundle.min.js \
  --apiKey your_key \
  --baseURL https://your-azure-endpoint.openai.azure.com/v1
```

---

### Local Mode

Local mode uses a quantized GGUF model running via `node-llama-cpp`. No API key or internet connection is required after the one-time model download.

**Step 1 — Download a model** (only required once):

```shell
# Download the 2B model (~2.4 GB, fast, suitable for most hardware)
npx cartographer download 2b

# Download the 8B model (~4.9 GB, higher quality, requires more RAM/VRAM)
npx cartographer download 8b
```

Models are stored in `~/.cartographerjs/models/`.

| Model key | Model | Size |
|-----------|-------|------|
| `2b` | Phi-3.1-mini-4k-instruct Q4_K_M | ~2.4 GB |
| `8b` | Meta-Llama-3.1-8B-Instruct Q4_K_M | ~4.9 GB |

**Step 2 — Run**:

```shell
npx cartographer local bundle.min.js

# Use the 8B model explicitly
npx cartographer local bundle.min.js -m 8b

# Disable GPU acceleration (e.g. for CI)
npx cartographer local bundle.min.js --disableGpu
```

Apple M-series chips are natively supported via Metal acceleration.

---

### Pipeline Options

These flags are available on all provider commands (`openai`, `gemini`, `openrouter`, `local`):

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --outputDir <dir>` | Directory to write output files | `output` |
| `--contextSize <n>` | LLM context window size (tokens) | provider default |
| `--verbose` | Print verbose logs including raw LLM input/output | off |
| `--no-sanitizer` | Skip the Wakaru static analysis and syntax restoration pass entirely | sanitizer on |
| `--no-heuristic-naming` | Disable Phase 3 heuristic renaming (`void 0` → `undefined`, smart-rename, etc.) | heuristics on |

#### Token cost estimation

For a rough estimate of LLM token usage before running:

```shell
echo "$((2 * $(wc -c < yourscript.min.js)))"
```

A minified `bootstrap.min.js` (~60 KB) costs nearly nothing on budget models via OpenRouter, and roughly $0.50 with GPT-4.

---

### Graph Visualization

After any deobfuscation run, the output directory contains `call-graph.json`. Use the `graph` sub-command to explore it:

```shell
# ASCII tree rooted at a specific function (--entry is required for tree format)
cartographer graph ./output --entry "src/app.js:initApp"

# Limit traversal depth
cartographer graph ./output --entry "src/app.js:initApp" --depth 3

# Export the full graph as a Mermaid flowchart
cartographer graph ./output --format mermaid
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

The Mermaid output can be pasted directly into any Mermaid-compatible renderer (GitHub Markdown, Mermaid Live Editor, VS Code extensions).

---

### All CLI Options

```
cartographer <command> [options] <input>

Commands:
  local       Use a local GGUF model to unminify code
  openai      Use OpenAI's API to unminify code
  gemini      Use Google Gemini's API to unminify code
  openrouter  Use OpenRouter's API to unminify code
  download    Download a local model
  graph       Visualize the call graph of a deobfuscated project

Deobfuscation options (local | openai | gemini | openrouter):
  -m, --model <model>           LLM model name
  -o, --outputDir <dir>         Output directory                  [default: output]
  -k, --apiKey <key>            API key (or use env var)
  --baseURL <url>               Override API base URL
  --contextSize <n>             LLM context window size (tokens)
  --verbose                     Verbose output
  --no-sanitizer                Disable Wakaru syntax restoration
  --no-heuristic-naming         Disable static heuristic renaming

local-specific options:
  -s, --seed <seed>             Seed for reproducible results
  --disableGpu                  Disable GPU acceleration

graph options:
  -e, --entry <id>              Function ID to trace, e.g. "src/main.js:init"
  -d, --depth <n>               Maximum depth to traverse
  -f, --format <type>           Output format: tree (default) or mermaid
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

```
js-cartographer/
├── src/
│   ├── index.ts                     # CLI entry point; registers all commands
│   ├── unminify.ts                  # Core pipeline orchestrator
│   ├── cli.ts                       # Base Commander instance factory
│   ├── cli-error.ts                 # Typed CLI error helpers
│   ├── env.ts                       # Environment variable loader
│   ├── file-utils.ts                # File existence / path helpers
│   ├── number-utils.ts              # Numeric CLI argument parser
│   ├── local-models.ts              # GGUF model registry and downloader
│   ├── progress.ts                  # CLI progress bar helpers
│   ├── verbose.ts                   # Verbose logging singleton
│   ├── url.ts                       # Template literal URL helper
│   │
│   ├── commands/
│   │   ├── openai.ts                # `cartographer openai` command
│   │   ├── gemini.ts                # `cartographer gemini` command
│   │   ├── openrouter.ts            # `cartographer openrouter` command
│   │   ├── local.ts                 # `cartographer local` command
│   │   ├── download.ts              # `cartographer download` command
│   │   ├── graph.ts                 # `cartographer graph` command
│   │   └── default-args.ts          # Shared default CLI argument values
│   │
│   ├── plugins/
│   │   ├── babel/
│   │   │   └── babel.ts             # Babel AST transforms (Yoda, void→undefined, etc.)
│   │   ├── prettier.ts              # Prettier formatting plugin
│   │   ├── webcrack.ts              # webcrack bundle unpacker wrapper
│   │   ├── gemini-rename.ts         # Gemini API identifier renamer
│   │   ├── openai/
│   │   │   └── openai-rename.ts     # OpenAI API identifier renamer
│   │   ├── openrouter/
│   │   │   └── openrouter-rename.ts # OpenRouter identifier renamer
│   │   └── local-llm-rename/
│   │       ├── local-llm-rename.ts  # Local model renamer orchestrator
│   │       ├── visit-all-identifiers.ts  # Babel traversal: visits every identifier
│   │       ├── unminify-variable-name.ts # Per-identifier LLM call
│   │       ├── llama.ts             # node-llama-cpp model loader/session
│   │       ├── gbnf.ts              # Grammar-constrained output (GBNF)
│   │       ├── define-filename.ts   # Filename hint generation for LLM context
│   │       └── phi-jinja-template.ts # Chat template for Phi models
│   │
│   └── services/
│       ├── sanitizer/
│       │   ├── index.ts             # WakaruSanitizer: transform() entry point
│       │   ├── types.ts             # SanitizerConfig, TransformationResult, CodeTransformer
│       │   └── rules.ts             # STRUCTURAL_RULES + HEURISTIC_RULES arrays
│       ├── graph/
│       │   ├── index.ts             # GraphBuilder: produces module-graph.json
│       │   ├── types.ts             # FileNode, ModuleGraph types
│       │   └── file-utils.ts        # Shared file-listing utility (used by graph + callgraph)
│       └── callgraph/
│           ├── index.ts             # CallGraphBuilder: produces call-graph.json
│           ├── types.ts             # FunctionNode, CallEdge, CallGraphData types
│           └── presenter.ts         # GraphPresenter: toAsciiTree(), toMermaid()
│
├── fixtures/
│   ├── example.min.js               # Simple standalone minified JS example
│   └── webpack-hello-world/
│       ├── src/                     # Ground-truth source files (math, greeting, api, app)
│       └── dist/bundle.js           # Pre-built Webpack 5 + Babel (IE11) bundle
│                                    # Primary validation target for the full pipeline
│
├── testing/
│   └── TESTING_GUIDE.md             # Source-of-truth for all test conventions
│
├── .specs/
│   ├── description.md               # Project overview
│   ├── outline.md                   # Implementation phase outline
│   └── phase-1.md … phase-6.md      # Per-phase implementation specs
│
├── dist/                            # Compiled output (pkgroll — ESM)
├── IMPLEMENTATION_PLAN.md           # Development roadmap and phase details
├── LOG_BOOK.md                      # Changelog of completed features
├── .env.example                     # Environment variable reference
├── package.json
└── eslint.config.js
```

### Key architectural patterns

**Plugin pipeline** (`src/unminify.ts`): The core pipeline accepts an array of `(code: string) => Promise<string>` transforms. This signature is intentionally simple — each plugin is a pure async string-to-string function. The sanitizer runs as a pre-plugin step (it receives a file path in addition to code) and is not inserted into the plugins array, preserving backward compatibility.

**Wakaru loading via `createRequire`**: `@wakaru/unminify` ships as a CJS build with a Prettier v2 sub-path incompatibility in ESM strict mode. The `WakaruSanitizer` loads it lazily via `createRequire(import.meta.url)` to avoid triggering the import at module load time.

**Graph IDs**: Both `module-graph.json` and `call-graph.json` use path-qualified IDs (e.g., `src/app.js:startApp`) to avoid naming collisions across files and make graph edges human-readable.

---

## Development

### Building

```shell
npm run build         # Compile TypeScript to dist/ via pkgroll
npm start             # Run directly via tsx (no build required)
npm run debug         # Run with Node.js inspector attached
```

### Testing

The project uses Node.js's built-in `node:test` runner with `tsx` for TypeScript execution. There is no Jest or Vitest.

```shell
npm run test           # Run all test suites
npm run test:unit      # Unit tests (*.test.ts) — no I/O, no LLM
npm run test:e2e       # E2E tests (*.e2etest.ts) — requires a build
npm run test:llm       # Local LLM accuracy tests (*.llmtest.ts)
npm run test:openai    # OpenAI accuracy tests (costs API credits)
npm run test:gemini    # Gemini accuracy tests (costs API credits)
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

- **`src/`** — four human-readable source files: `math.js`, `greeting.js`, `api.js`, `app.js`. These are the **ground truth** for evaluating output quality.
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

| Variable | Used by | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | `cartographer openai` | OpenAI secret key |
| `OPENAI_BASE_URL` | `cartographer openai` | Override for Azure or local proxy |
| `GEMINI_API_KEY` | `cartographer gemini` | Google AI Studio key |
| `OPENROUTER_API_KEY` | `cartographer openrouter` | OpenRouter key |
| `OPENROUTER_BASE_URL` | `cartographer openrouter` | Override OpenRouter base URL |
| `MODEL` | local tests | Model key (`2b` or `8b`) used in test runs |
| `VERBOSE` | all | Set to any value for verbose output in tests |

---

## Roadmap

The following features are candidates for future development, ordered roughly by impact and feasibility.

### Sourcemap integration
Accept an optional `.js.map` file alongside the input bundle. When present, use original symbol names from the sourcemap as locked identifiers — the LLM would only rename symbols that have no sourcemap entry. This would dramatically improve quality for partially-obfuscated production builds.

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

### Framework-aware renaming hints
Detect common framework patterns (React component shapes, Express route handlers, Node.js event emitter patterns) and inject framework-specific system prompt context into the LLM renaming step to produce higher-quality, idiomatic names.

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
# JS Cartographer

This project integrates Wakaru's advanced static analysis and syntax restoration capabilities into the Humanify CLI pipeline to create a highly optimized JavaScript deobfuscation tool. By pre-processing transpiled code to restore modern syntax and deterministically rename standard APIs, the system significantly reduces LLM token costs while improving naming accuracy. Additionally, the integration maps project-wide dependencies to generate a semantic call graph, providing users with a comprehensive visual trace of function execution across the unbundled codebase.

## Prerequisites

- Node.js >= 20
- npm >= 9

## Installation

```shell
npm ci
```

## Environment Setup

Copy the example environment file and fill in the API key(s) for the LLM provider(s) you intend to use:

```shell
cp .env.example .env
```

Edit `.env` and set at least one of:

| Variable | Provider |
|---|---|
| `OPENROUTER_API_KEY` | OpenRouter (recommended) |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini / AIStudio |

No key is needed for `local` mode (see below).

## Usage

Run the CLI via npm:

```shell
npm start -- <command> [options] <input>
```

Or, after building (`npm run build`), use the installed binary:

```shell
npx cartographer <command> [options] <input>
```

### OpenRouter (Recommended)

```shell
npm start -- openrouter fixtures/webpack-hello-world/dist/bundle.js
```

Specify a different model with `-m`:

```shell
npm start -- openrouter fixtures/webpack-hello-world/dist/bundle.js -m anthropic/claude-3.5-sonnet
```

Available OpenRouter models can be found at [openrouter.ai/models](https://openrouter.ai/models). Default is `x-ai/grok-4.1-fast`.

### OpenAI

```shell
npm start -- openai fixtures/webpack-hello-world/dist/bundle.js
```

Specify a different model with `-m`:

```shell
npm start -- openai fixtures/webpack-hello-world/dist/bundle.js -m gpt-4o
```

Common models: `gpt-4o` (default: `gpt-4o-mini`), `gpt-4-turbo`, `gpt-3.5-turbo`

### Google Gemini

```shell
npm start -- gemini fixtures/webpack-hello-world/dist/bundle.js
```

Specify a different model with `-m`:

```shell
npm start -- gemini fixtures/webpack-hello-world/dist/bundle.js -m gemini-2.0-flash
```

Common models: `gemini-1.5-flash` (default), `gemini-1.5-pro`, `gemini-2.0-flash`, `gemini-2.0-pro`

### Local LLM (no API key required)

Download a model first (one-time setup):

```shell
npm start -- download 2b
```

Then analyze the bundle:

```shell
npm start -- local fixtures/webpack-hello-world/dist/bundle.js
```

Specify a different model with `-m`:

```shell
npm start -- local fixtures/webpack-hello-world/dist/bundle.js -m 8b
```

Available models: `2b` (default), `8b`

### Output and Options

By default, output is written to the `output/` directory. Override with `-o`:

```shell
npm start -- local fixtures/webpack-hello-world/dist/bundle.js -o analysis-output
```

For verbose output, add the `--verbose` flag:

```shell
npm start -- local fixtures/webpack-hello-world/dist/bundle.js --verbose
```

## Analyzing the Test Fixture

The `fixtures/webpack-hello-world/` directory contains a complete webpack 5 + Babel (IE11 target) application. The bundled output (`dist/bundle.js`) serves as the primary test input, while the original source files in `fixtures/webpack-hello-world/src/` act as ground truth for validating deobfuscation quality.

### Build the fixture

Before analyzing, ensure the fixture bundle is built:

```shell
npm ci --prefix fixtures/webpack-hello-world
npm run build --prefix fixtures/webpack-hello-world
```

This produces `fixtures/webpack-hello-world/dist/bundle.js`.

### Generate an analysis

To deobfuscate and analyze the bundle using any provider:

**Using local LLM (free, no API key):**
```shell
npm start -- local fixtures/webpack-hello-world/dist/bundle.js -o fixture-analysis
```

**Using OpenRouter:**
```shell
npm start -- openrouter fixtures/webpack-hello-world/dist/bundle.js -o fixture-analysis
```

**Using OpenAI:**
```shell
npm start -- openai fixtures/webpack-hello-world/dist/bundle.js -o fixture-analysis
```

**Using Google Gemini:**
```shell
npm start -- gemini fixtures/webpack-hello-world/dist/bundle.js -o fixture-analysis
```

The analyzed and deobfuscated code will be written to `fixture-analysis/`. Compare the output against the original source in `fixtures/webpack-hello-world/src/` to validate quality.

## Development

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` via pkgroll |
| `npm run test:unit` | Run unit tests (23 tests, no LLM/API required) |
| `npm run test:e2e` | Run end-to-end tests (requires a build) |
| `npm run lint` | Run Prettier + ESLint checks |

## License

MIT
