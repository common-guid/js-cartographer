import { cli } from "../cli.js";
import prettier from "../plugins/prettier.js";
import { unminify } from "../unminify.js";
import babel from "../plugins/babel/babel.js";
import { openrouterRename } from "../plugins/openrouter/openrouter-rename.js";
import { verbose } from "../verbose.js";
import { env } from "../env.js";
import { parseNumber } from "../number-utils.js";
import { DEFAULT_CONTEXT_WINDOW_SIZE } from "./default-args.js";
import { WakaruSanitizer } from "../services/sanitizer/index.js";
import { DEFAULT_FILE_CONCURRENCY } from "../unminify.js";
import { DiscoveryService } from "../services/discovery/index.js";
import { stat } from "node:fs/promises";
import { KeyManager } from "../services/key-manager/index.js";
import { createOpenAIClient } from "../services/api-analyzer/llm-client-factory.js";

export const openrouter = cli()
  .name("openrouter")
  .description("Use OpenRouter's API to unminify code")
  .option("-m, --model <model>", "The model to use", "x-ai/grok-4.1-fast")
  .option("-o, --outputDir <output>", "The output directory", "output")
  .option(
    "-k, --apiKey <apiKey>",
    "The OpenRouter API key. Alternatively use OPENROUTER_API_KEY environment variable"
  )
  .option(
    "--baseURL <baseURL>",
    "The OpenRouter base server URL.",
    env("OPENROUTER_BASE_URL") ?? "https://openrouter.ai/api/v1"
  )
  .option("--verbose", "Show verbose output")
  .option(
    "--contextSize <contextSize>",
    "The context size to use for the LLM",
    `${DEFAULT_CONTEXT_WINDOW_SIZE}`
  )
  .option(
    "--file-concurrency <n>",
    "Number of files to process in parallel",
    `${DEFAULT_FILE_CONCURRENCY}`
  )
  .option("--rename-all", "Send all identifiers to the LLM (skip smart filtering)")
  .option("--no-sanitizer", "Disable the Wakaru syntax cleanup step")
  .option(
    "--no-heuristic-naming",
    "Disable static renaming (Phase 3 optimization)"
  )
  .option("-s, --sourcemap <path>", "The sourcemap file to use for truth injection")
  .option("--maps <dir>", "Directory containing sourcemap files for automated matching")
  .argument("input", "The input minified Javascript file or directory")
  .action(async (input, opts) => {
    if (opts.verbose) {
      verbose.enabled = true;
    }

    const discovery = new DiscoveryService();
    let tasks = [];

    const stats = await stat(input);
    if (stats.isDirectory()) {
      const jsFiles = await discovery.scanDirectory(input);
      tasks = await discovery.matchSourcemaps(jsFiles, opts.maps || input);
    } else {
      tasks = [{ jsPath: input, mapPath: opts.sourcemap }];
    }

    if (tasks.length === 0) {
      console.error(`No JavaScript files found in ${input}`);
      process.exit(1);
    }

    const apiKeys = (opts.apiKey ?? env("OPENROUTER_API_KEY")).split(",").map((k: string) => k.trim());
    const keyManager = new KeyManager(apiKeys);
    const baseURL = opts.baseURL;
    const contextWindowSize = parseNumber(opts.contextSize);
    const llmClient = createOpenAIClient(apiKeys[0], opts.model, baseURL);
    const sanitizer = new WakaruSanitizer({
      enabled: opts.sanitizer !== false,
      useHeuristicNaming: opts.heuristicNaming !== false
    });
    await unminify(
      tasks,
      opts.outputDir,
      [
        babel,
        openrouterRename({
          keyManager,
          baseURL,
          model: opts.model,
          contextWindowSize,
          renameAll: opts.renameAll ?? false
        }),
        prettier
      ],
      sanitizer,
      parseNumber(opts.fileConcurrency),
      llmClient
    );
  });
