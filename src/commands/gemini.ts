import { cli } from "../cli.js";
import prettier from "../plugins/prettier.js";
import { unminify } from "../unminify.js";
import babel from "../plugins/babel/babel.js";
import { verbose } from "../verbose.js";
import { geminiRename } from "../plugins/gemini-rename.js";
import { env } from "../env.js";
import { DEFAULT_CONTEXT_WINDOW_SIZE } from "./default-args.js";
import { parseNumber } from "../number-utils.js";
import { WakaruSanitizer } from "../services/sanitizer/index.js";

export const azure = cli()
  .name("gemini")
  .description("Use Google Gemini/AIStudio API to unminify code")
  .option("-m, --model <model>", "The model to use", "gemini-1.5-flash")
  .option("-o, --outputDir <output>", "The output directory", "output")
  .option(
    "--contextSize <contextSize>",
    "The context size to use for the LLM",
    `${DEFAULT_CONTEXT_WINDOW_SIZE}`
  )
  .option(
    "-k, --apiKey <apiKey>",
    "The Google Gemini/AIStudio API key. Alternatively use GEMINI_API_KEY environment variable"
  )
  .option("--verbose", "Show verbose output")
  .option("--rename-all", "Send all identifiers to the LLM (skip smart filtering)")
  .option("--no-sanitizer", "Disable the Wakaru syntax cleanup step")
  .option(
    "--no-heuristic-naming",
    "Disable static renaming (Phase 3 optimization)"
  )
  .argument("input", "The input minified Javascript file")
  .action(async (filename, opts) => {
    if (opts.verbose) {
      verbose.enabled = true;
    }

    const apiKey = opts.apiKey ?? env("GEMINI_API_KEY");
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
        geminiRename({
          apiKey,
          model: opts.model,
          contextWindowSize,
          renameAll: opts.renameAll ?? false
        }),
        prettier
      ],
      sanitizer
    );
  });
