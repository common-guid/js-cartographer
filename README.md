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
npx humanify <command> [options] <input>
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
