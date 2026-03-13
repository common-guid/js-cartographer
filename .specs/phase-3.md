### **Phase 3: Static Analysis & Cost Optimization**

**Objective:** Implement deterministic renaming and constant simplification to reduce LLM costs and increase accuracy.
**Key Features:** Granular configuration (`--no-heuristic-naming`), optimization metrics log, and LLM "Hard Lock" on existing names.

---
#### **Step 3.1: Granular Configuration**

We need to update the configuration interface to allow users to toggle the "Smart Renaming" feature independently of the "Syntax Repair" feature.

**Action:**
Update `src/services/sanitizer/types.ts`.

```typescript
// src/services/sanitizer/types.ts

export interface SanitizerConfig {
  /**
   * Master switch. If false, skips everything.
   */
  enabled: boolean;

  /**
   * Phase 3 Toggle: Enables heuristic renaming (smart-rename) and 
   * constant simplification (un-undefined, un-infinity).
   * Default: true
   */
  useHeuristicNaming: boolean;
}

export interface TransformationResult {
  code: string;
  map?: any; 
}

```

---

#### **Step 3.2: Expand the Rule Set**

We will separate the rules into "Structural" (Phase 2) and "Heuristic" (Phase 3) categories in our constants file.

**Action:**
Update `src/services/sanitizer/rules.ts`.

```typescript
// src/services/sanitizer/rules.ts

// Rules from Phase 2 (Structural Repairs)
export const STRUCTURAL_RULES: string[] = [
    'un-async-await',
    'un-jsx',
    'un-es6-class',
    'un-optional-chaining',
    'un-nullish-coalescing',
    'un-template-literals',
    'un-sequence-expression',
    'un-variable-merging',
    'un-curly-braces',
    'un-flip-comparisons',
];

// Rules for Phase 3 (Static Analysis & Optimization)
export const HEURISTIC_RULES: string[] = [
    'un-undefined',       // void 0 -> undefined
    'un-infinity',        // 1/0 -> Infinity
    'un-numeric-literal', // 0x123 -> 291 (Normalizes numbers)
    'smart-rename'        // Renames variables based on DOM/Node usage
];

```

---

#### **Step 3.3: Implement Logic & Metrics**

We update the service to apply the new rules conditionally and calculate how many characters were saved.

**Action:**
Update `src/services/sanitizer/index.ts`.

```typescript
// src/services/sanitizer/index.ts
import { CodeTransformer, SanitizerConfig, TransformationResult } from './types';
import { runTransformationRules } from '@wakaru/unminify';
import { STRUCTURAL_RULES, HEURISTIC_RULES } from './rules'; // Import both sets
import prettier from 'prettier';

export class WakaruSanitizer implements CodeTransformer {
  name = 'Wakaru Syntax Sanitizer';
  private config: SanitizerConfig;

  constructor(config: SanitizerConfig) {
    // Ensure defaults are set if partial config provided
    this.config = { enabled: true, useHeuristicNaming: true, ...config };
  }

  async transform(code: string, filepath: string): Promise<TransformationResult> {
    if (!this.config.enabled) return { code };

    const originalLength = code.length;
    
    // Build the rule list based on config
    const activeRules = [...STRUCTURAL_RULES];
    if (this.config.useHeuristicNaming) {
      activeRules.push(...HEURISTIC_RULES);
    }

    console.log(`[Sanitizer] Optimizing ${filepath}...`);

    try {
      // 1. Run Wakaru
      const result = await runTransformationRules({
        path: filepath,
        source: code,
      }, activeRules);

      let cleanCode = result.code;

      // 2. Metric Logging (The "Hype")
      if (this.config.useHeuristicNaming) {
        const newLength = cleanCode.length;
        const savings = originalLength - newLength;
        const savingsPercent = ((savings / originalLength) * 100).toFixed(1);
        
        if (savings > 0) {
            console.log(`[Sanitizer] ⚡ Optimized size by ${savingsPercent}% (${savings} chars) via static analysis.`);
        }
      }

      // 3. Run Prettier
      try {
        cleanCode = await prettier.format(cleanCode, {
          parser: 'babel',
          semi: true,
          singleQuote: true,
          trailingComma: 'es5',
        });
      } catch (formatError) {
        // Fallback to unformatted if prettier fails
      }

      return { code: cleanCode, map: result.sourceMap };

    } catch (error) {
      console.warn(`[Sanitizer] ⚠️ Failed to sanitize ${filepath}. Proceeding with raw code.`);
      return { code };
    }
  }
}

```

---

#### **Step 3.4: LLM Grounding (The "Hard Lock")**

We must explicitly forbid the LLM from renaming variables that Wakaru has already solved.

**Action:**
Update your System Prompt file (e.g., `src/prompts.ts`).

**Add this specific instruction block:**

> ### **NAMING RULES (STRICT)**
> 
> 
> 1. **Respect Static Analysis:** The code has been pre-analyzed. If a variable is already named meaningfully (e.g., `document`, `window`, `element`, `jsonResponse`), **YOU MUST NOT RENAME IT**. Treat these names as locked facts.
> 2. **Focus on the Unknown:** Only rename variables that are still obfuscated (e.g., `a`, `x`, `_0x4f2`, `var1`).
> 3. **No Hallucinations:** Do not "guess" a name if you are unsure. If a variable name is locked, use it exactly as is.
> 
> 

---

#### **Step 3.5: CLI Update**

Expose the new granular control to the user.

**Action:**
Update `src/cli.ts` (or your main command definition).

```typescript
// Inside your commander setup
program
  .option('--no-sanitizer', 'Disable all sanitization')
  // NEW OPTION:
  .option('--no-heuristic-naming', 'Disable static renaming (Phase 3 optimization)');

// Inside your action handler
const options = program.opts();

const sanitizer = new WakaruSanitizer({ 
  enabled: options.sanitizer !== false,
  useHeuristicNaming: options.heuristicNaming !== false // Commander handles --no-x
});

```

---

#### **Step 3.6: Verification**

To confirm Phase 3 is working:

1. **Create Test File:** `test-phase3.js`
```javascript
// Uses 'void 0' (undefined) and a clear DOM access
var a = void 0; 
var b = document.getElementById('app'); 

```


2. **Run Tool:**
```bash
node dist/cli.js test-phase3.js

```


3. **Expected Output (Pre-LLM):**
* **Metric Log:** `[Sanitizer] ⚡ Optimized size by X%...`
* **Code Transformation:**
* `var a = void 0;`  `var a = undefined;`
* `var b = ...`  `var element = document.getElementById('app');` (or similar, depending on how smart Wakaru is with this specific snippet).
