import { cli } from "../cli.js";
import prettier from "../plugins/prettier.js";
import { unminify } from "../unminify.js";
import babel from "../plugins/babel/babel.js";
import { openaiRename } from "../plugins/openai/openai-rename.js";
import { verbose } from "../verbose.js";
import { env } from "../env.js";
import { parseNumber } from "../number-utils.js";
import { DEFAULT_CONTEXT_WINDOW_SIZE } from "./default-args.js";
import { WakaruSanitizer } from "../services/sanitizer/index.js";
import { DEFAULT_FILE_CONCURRENCY } from "../unminify.js";

export const openai = cli()
  .name("openai")
  .description("Use OpenAI's API to unminify code")
  .option("-m, --model <model>", "The model to use", "gpt-4o-mini")
  .option("-o, --outputDir <output>", "The output directory", "output")
  .option(
    "-k, --apiKey <apiKey>",
    "The OpenAI API key. Alternatively use OPENAI_API_KEY environment variable"
  )
  .option(
    "--baseURL <baseURL>",
    "The OpenAI base server URL.",
    env("OPENAI_BASE_URL") ?? "https://api.openai.com/v1"
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
  .argument("input", "The input minified Javascript file")
  .action(async (filename, opts) => {
    if (opts.verbose) {
      verbose.enabled = true;
    }

    const apiKey = opts.apiKey ?? env("OPENAI_API_KEY");
    const baseURL = opts.baseURL;
    const contextWindowSize = parseNumber(opts.contextSize);
    const sanitizer = new WakaruSanitizer({
      enabled: opts.sanitizer !== false,
      useHeuristicNaming: opts.heuristicNaming !== false
    });
    await unminify(
      filename,
      opts.outputDir,
      [
        babel,
        openaiRename({
          apiKey,
          baseURL,
          model: opts.model,
          contextWindowSize,
          renameAll: opts.renameAll ?? false
        }),
        prettier
      ],
      sanitizer,
      parseNumber(opts.fileConcurrency),
      opts.sourcemap
    );
  });
