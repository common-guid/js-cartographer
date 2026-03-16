import { createRequire } from "node:module";
import type { runTransformationRules as RunTransformationRulesFn } from "@wakaru/unminify";
import type {
  CodeTransformer,
  SanitizerConfig,
  TransformationResult
} from "./types.js";
import { STRUCTURAL_RULES, HEURISTIC_RULES } from "./rules.js";
import * as prettier from "prettier";

/**
 * @wakaru/unminify MUST be loaded via createRequire (CJS build) because its ESM
 * entry point has a Prettier v2 / Node.js 22 strict ESM sub-path resolution
 * incompatibility (`prettier/parser-babel` is not in Prettier v2's exports map).
 *
 * This loader is called lazily so Phase 1's pass-through never triggers the import.
 * Phase 2 will call this when it invokes runTransformationRules.
 */
function loadWakaru(): {
  runTransformationRules: typeof RunTransformationRulesFn;
} {
  const _require = createRequire(import.meta.url);
  return _require("@wakaru/unminify") as {
    runTransformationRules: typeof RunTransformationRulesFn;
  };
}

export class WakaruSanitizer implements CodeTransformer {
  name = "Wakaru Syntax Sanitizer";
  private config: SanitizerConfig;

  constructor(config: SanitizerConfig = { enabled: true }) {
    // Ensure defaults are set if partial config provided
    this.config = { enabled: true, useHeuristicNaming: true, ...config };
  }

  async transform(
    code: string,
    filepath: string
  ): Promise<TransformationResult> {
    // 1. Safe Mode Check
    if (!this.config.enabled) {
      // User explicitly disabled it (e.g. --no-sanitizer)
      return { code };
    }

    const originalLength = code.length;

    // Build the rule list based on config
    const activeRules = [...STRUCTURAL_RULES];
    if (this.config.useHeuristicNaming) {
      activeRules.push(...HEURISTIC_RULES);
    }

    console.log(`[Sanitizer] Optimizing ${filepath}...`);

    try {
      // --- PHASE 2 LOGIC GOES HERE ---
      const { runTransformationRules } = loadWakaru();
      const result = await runTransformationRules(
        { path: filepath, source: code },
        activeRules
      );

      let cleanCode = result.code;

      // 2. Metric Logging (The "Hype")
      if (this.config.useHeuristicNaming) {
        const newLength = cleanCode.length;
        const savings = originalLength - newLength;
        const savingsPercent = ((savings / originalLength) * 100).toFixed(1);

        if (savings > 0) {
          console.log(
            `[Sanitizer] ⚡ Optimized size by ${savingsPercent}% (${savings} chars) via static analysis.`
          );
        }
      }

      // 2. Run Prettier (Formatting)
      // We wrap this in a sub-try/catch because if Prettier fails
      // (due to some weird syntax edge case), we still want the Wakaru result.
      try {
        cleanCode = await prettier.format(cleanCode, {
          parser: "babel",
          semi: true,
          singleQuote: true,
          trailingComma: "es5"
        });
      } catch {
        console.warn(
          `[Sanitizer] Prettier failed to format ${filepath}, returning unformatted clean code.`
        );
      }

      // 3. Return the polished code
      return {
        code: cleanCode,
        map: result.sourceMap // Preserve for Phase 4/5
      };
    } catch (error) {
      // 2. Error Swallow Pattern
      // If Wakaru crashes, we MUST NOT crash the whole tool.
      // We log the error and return the original code so the LLM can still try.
      console.warn(
        `[Sanitizer] ⚠️ Failed to sanitize ${filepath}. Proceeding with raw code.`
      );
      console.warn(`[Sanitizer] Error details:`, error);
      return { code };
    }
  }
}
