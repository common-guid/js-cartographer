### **Phase 1: Foundation & Safe Integration**

**Objective:** Install Wakaru, establish the "Sanitizer Service" architecture with safety toggles, and integrate it into the CLI pipeline without altering current output.

#### **Step 1.1: Dependency Injection & Verification**

We need to install the specific Wakaru packages. Since your Babel version is newer, we will let npm resolve the peers.

**Action:**
Run the following command in your project root:

```bash
npm install @wakaru/unminify @wakaru/unpacker

```

**Verification:**
After installation, run `npm list @babel/core`.

* *Success:* You should see one dominant version (likely `7.25.2`) used by both `humanify` and `@wakaru`.
* *Failure:* If you see multiple distinct versions (e.g., `7.15` and `7.25`), run `npm dedupe` to flatten the tree.

#### **Step 1.2: Define the Service Interface**

We will create the types first, incorporating the **Feature Flag** and **Source Maps** as requested.

**Action:**
Create `src/services/sanitizer/types.ts`.

```typescript
// src/services/sanitizer/types.ts

export interface SanitizerConfig {
  /**
   * Master switch for the sanitizer.
   * If false, the transformer returns the original code immediately.
   * Useful for the CLI flag --no-sanitizer.
   */
  enabled: boolean;
}

export interface TransformationResult {
  code: string;
  /**
   * Preserved for Phase 4/5 (Call Graph).
   * Wakaru can return source maps; we store them here to avoid data loss.
   */
  map?: any; 
}

export interface CodeTransformer {
  name: string;
  transform(code: string, filepath: string): Promise<TransformationResult>;
}

```

#### **Step 1.3: Implement the "Safe" Sanitizer Service**

We will implement the class with a `try/catch` safety net. For Phase 1, the logic inside the try block will be a "pass-through" (returning the code as-is), which we will populate in Phase 2.

**Action:**
Create `src/services/sanitizer/index.ts`.

```typescript
// src/services/sanitizer/index.ts
import { CodeTransformer, SanitizerConfig, TransformationResult } from './types';

// We import Wakaru types now to ensure the build works, 
// but we won't invoke the heavy logic just yet.
import { runTransformationRules } from '@wakaru/unminify';

export class WakaruSanitizer implements CodeTransformer {
  name = 'Wakaru Syntax Sanitizer';
  private config: SanitizerConfig;

  constructor(config: SanitizerConfig = { enabled: true }) {
    this.config = config;
  }

  async transform(code: string, filepath: string): Promise<TransformationResult> {
    // 1. Safe Mode Check
    if (!this.config.enabled) {
      // User explicitly disabled it (e.g. --no-sanitizer)
      return { code };
    }

    console.log(`[Sanitizer] Processing ${filepath}...`);

    try {
      // --- FUTURE PHASE 2 LOGIC GOES HERE ---
      // For now, we simulate success to verify the pipeline.
      // const result = await runTransformationRules(...) 
      
      // Pass-through for Phase 1
      return { code }; 

    } catch (error) {
      // 2. Error Swallow Pattern
      // If Wakaru crashes, we MUST NOT crash the whole tool.
      // We log the error and return the original code so the LLM can still try.
      console.warn(`[Sanitizer] ⚠️ Failed to sanitize ${filepath}. Proceeding with raw code.`);
      console.warn(`[Sanitizer] Error details:`, error);
      
      return { code };
    }
  }
}

```

#### **Step 1.4: Integration into CLI (The "Slot")**

Now we modify your main CLI entry point. Based on your dependencies (`commander`), this is likely `src/cli.ts` (or similar).

**Action:**
Open your main CLI file.

**1. Add the CLI Option:**
Find where you define your `commander` program (e.g., `program.option(...)`).

```typescript
program
  // ... existing options ...
  .option('--no-sanitizer', 'Disable the Wakaru syntax cleanup step');

```

**2. Inject the Service:**
Find the loop where you process files. It likely looks like `await processFile(file, options)`. You need to instantiate the sanitizer *before* the loop, and use it *inside* the loop.

```typescript
// Imports
import { WakaruSanitizer } from './services/sanitizer';

// ... inside the action handler ...
const options = program.opts();

// Initialize Service with the CLI flag
const sanitizer = new WakaruSanitizer({ 
  enabled: options.sanitizer !== false // Commander handles --no-x as false
});

// ... inside your file iteration loop ...
// let code = await fs.readFile(filePath, 'utf-8'); 

// --- NEW SANITIZER STEP ---
const sanitized = await sanitizer.transform(code, filePath);
code = sanitized.code; // Update the variable passed to the LLM
// --------------------------

// ... proceed to LLM generation ...

```

#### **Step 1.5: Validation**

Run the following to confirm Phase 1 is successful:

1. **Build:** `npm run build` (Should pass with no type errors).
2. **Run Default:** `node dist/cli.js test.js` -> Should log `[Sanitizer] Processing test.js...`.
3. **Run Disabled:** `node dist/cli.js test.js --no-sanitizer` -> Should **NOT** log the processing message.

