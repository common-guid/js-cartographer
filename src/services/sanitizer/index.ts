import { createRequire } from "node:module";
import type { runTransformationRules as RunTransformationRulesFn } from "@wakaru/unminify";
import type { CodeTransformer, SanitizerConfig, TransformationResult } from "./types.js";

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
    this.config = config;
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

    console.log(`[Sanitizer] Processing ${filepath}...`);

    try {
      // --- PHASE 2 LOGIC GOES HERE ---
      // const { runTransformationRules } = loadWakaru();
      // const result = await runTransformationRules(
      //   { path: filepath, source: code },
      //   SANITIZER_RULES
      // );
      // return { code: result.code, map: result.sourceMap };

      // Pass-through for Phase 1
      void loadWakaru; // reference to satisfy the unused-import check; removed in Phase 2
      return { code };
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
