### **Phase 2: The Syntax Restoration Layer (Revised)**

**Objective:** Configure the Sanitizer to "de-transpile" code (fix `async/await`, `classes`, `JSX`) and apply formatting via Prettier, ensuring the LLM receives clean, readable JavaScript.

**Constraint Checklist & Confidence Score:**

1. Option A (Wakaru + Prettier)? **Yes.**
2. Cherry-pick rules? **Yes.**
Confidence Score: 5/5

---

#### **Step 2.1: Dependency Management (Prettier Promotion)**

We need to ensure `prettier` is available as a production dependency, not just a dev tool, since the application will now use it at runtime to format the Wakaru output.

**Action:**
Run the following commands:

```bash
# 1. Move prettier from devDependencies to dependencies
npm uninstall prettier
npm install prettier --save-prod

```

**Verification:**
Check `package.json`. `prettier` should now be under `"dependencies"`.

---

#### **Step 2.2: Define the Rule Set**

We will create a specific list of rules that prioritize **readability** and **structure**.

**Action:**
Create (or edit) `src/services/sanitizer/rules.ts`.

```typescript
// src/services/sanitizer/rules.ts

/**
 * The specific Wakaru transformation rules enabled for Phase 2.
 * These focus on Structural Restoration (fixing compiler artifacts)
 * and Readability (making code scanable).
 */
export const SANITIZER_RULES: string[] = [
    // --- 1. STRUCTURAL RESTORATION (The Heavy Lifting) ---
    'un-async-await',        // Critical: Restores async/await from generator state machines
    'un-jsx',                // Critical: Restores <div /> from React.createElement()
    'un-es6-class',          // Critical: Restores class MyClass {} from prototype assignments
    
    // --- 2. SYNTAX MODERNIZATION ---
    'un-optional-chaining',  // Restores object?.prop
    'un-nullish-coalescing', // Restores value ?? default
    'un-template-literals',  // Restores `string ${var}`
    
    // --- 3. READABILITY CLEANUP ---
    'un-sequence-expression',// Splits "a=1, b=2" into separate lines. Vital for LLMs.
    'un-variable-merging',   // Un-merges unrelated "var a, b, c" declarations.
    'un-curly-braces',       // Adds { } to single-line if-statements.
    'un-flip-comparisons',   // Fixes Yoda conditions (null == a -> a == null)
];

```

---

#### **Step 2.3: Implement Logic & Formatting**

Now we update the `WakaruSanitizer` to run the rules AND run Prettier.

**Action:**
Update `src/services/sanitizer/index.ts`.

```typescript
// src/services/sanitizer/index.ts
import { CodeTransformer, SanitizerConfig, TransformationResult } from './types';
import { runTransformationRules } from '@wakaru/unminify';
import { SANITIZER_RULES } from './rules';
import prettier from 'prettier';

export class WakaruSanitizer implements CodeTransformer {
  name = 'Wakaru Syntax Sanitizer';
  private config: SanitizerConfig;

  constructor(config: SanitizerConfig = { enabled: true }) {
    this.config = config;
  }

  async transform(code: string, filepath: string): Promise<TransformationResult> {
    if (!this.config.enabled) return { code };

    console.log(`[Sanitizer] Cleaning syntax for ${filepath}...`);

    try {
      // 1. Run Wakaru (AST Cleaning)
      const result = await runTransformationRules({
        path: filepath,
        source: code,
      }, SANITIZER_RULES);

      let cleanCode = result.code;

      // 2. Run Prettier (Formatting)
      // We wrap this in a sub-try/catch because if Prettier fails 
      // (due to some weird syntax edge case), we still want the Wakaru result.
      try {
        cleanCode = await prettier.format(cleanCode, {
          parser: 'babel',
          semi: true,
          singleQuote: true,
          trailingComma: 'es5',
        });
      } catch (formatError) {
        console.warn(`[Sanitizer] Prettier failed to format ${filepath}, returning unformatted clean code.`);
      }

      // 3. Return the polished code
      return { 
        code: cleanCode,
        map: result.sourceMap // Preserve for Phase 4/5
      };

    } catch (error) {
      console.warn(`[Sanitizer] ⚠️ Failed to sanitize ${filepath}. Proceeding with raw code.`);
      console.warn(`[Sanitizer] Error details:`, error);
      return { code };
    }
  }
}

```

---

#### **Step 2.4: Update System Prompt**

The LLM no longer needs to be told to fix syntax. We want it to focus purely on **naming**.

**Action:**
Locate your prompt definition file (likely `src/prompts.ts`, `src/ai/systemPrompt.ts`, or defined inline in `src/cli.ts`).

**Find:**

> "Fix syntax errors..." or "Convert code to modern JavaScript..."

**Replace with:**

> "The code you receive has already been structurally de-transpiled and formatted.
> **DO NOT** attempt to restructure logic (loops, classes, async/await) unless strictly necessary.
> Your **PRIMARY** task is to infer the purpose of variables/functions and rename them to meaningful English names."

---

#### **Step 2.5: Verification**

To ensure the cherry-picked rules + Prettier are working:

1. **Create Test File:** `test-phase2.js`
```javascript
// Minified generator (mocking transpiled async) and yoda condition
function *t(){ if(null==x) yield 1; } 

```


2. **Run Tool:**
```bash
node dist/cli.js test-phase2.js

```


3. **Expected Output (Before LLM):**
* `if(null==x)` should become `if (x == null)`.
* The spacing should be perfect (Prettier).
* *(Note: The generator might not fully convert to async/await without the `__generator` helper present, but the Yoda condition and formatting will prove the pipeline is active).*
