# Implementation Plan: Fix SourcemapService Crash

## Objective
Investigate and resolve the `TypeError: this.consumer.destroy is not a function` crash that occurs during the cleanup phase of `SourcemapService`.

## Key Files & Context
- `src/services/sourcemap/index.ts`: Contains the `SourcemapService` which is responsible for managing the `SourceMapConsumer` instance.
- **Root Cause**: The `SourceMapConsumer.destroy()` method is specific to the WebAssembly-backed `source-map` version 0.7+. If the module resolves to version 0.6.x (due to dependency tree flattening or transitive dependencies), the `destroy` method is absent. When `SourcemapService.destroy()` is called in `unminify.ts` at the end of the batch process, it blindly invokes `this.consumer.destroy()`, leading to a crash.

## Implementation Steps
1. **Safeguard `destroy` method**:
   Update `src/services/sourcemap/index.ts` to check for the existence of the `destroy` function on the `SourceMapConsumer` instance before invoking it.

   ```typescript
   destroy() {
     if (this.consumer) {
       if (typeof (this.consumer as any).destroy === "function") {
         (this.consumer as any).destroy();
       }
       this.consumer = null;
     }
   }
   ```

## Verification & Testing
1. Run the CLI tool with a local chunk and sourcemap to verify the execution completes without errors.
2. Run the `npm run test:unit` test suite to ensure no regressions.
