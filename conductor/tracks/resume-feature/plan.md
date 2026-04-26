# Implementation Plan: Resume Feature

## Background & Motivation
Currently, when `cartographer local` (or other LLM commands) is interrupted and restarted, the `webcrack` phase unconditionally extracts the minified modules directly into the `outputDir`. This overwrites any files that were successfully unminified and cached in the previous run. When the system checks the `StateCache`, it accurately sees that the module has been processed (because it hashes the minified code), so it skips the file. However, because `webcrack` just overwrote the target file with minified code, the final result is that the file remains minified.

This makes it impossible to reliably resume a large unbundling job without losing the unminified versions of files processed before the interruption.

## Scope & Impact
- **Impacted Components**: The `unminify` orchestrator (`src/unminify.ts`) and the temporary files lifecycle.
- **Goals**: 
  - Ensure `webcrack` does not overwrite successfully unminified files in the `outputDir`.
  - Maintain the integrity of the Module Graph (built pre-LLM) and Call Graph (built post-LLM).
  - Provide a safe and consistent resume experience.

## Tasks

### Phase 1: Core Implementation
- [x] **Task 1: Setup staging directory and update webcrack call in `unminify.ts`** a0e4772
- [x] **Task 2: Update GraphBuilder to use staging directory in `unminify.ts`** a0e4772
- [x] **Task 3: Update `processFile` to use `destPath` and check for existing unminified files in `unminify.ts`** a0e4772
- [x] **Task 4: Add cleanup logic for staging directory in `unminify.ts`** a0e4772

### Phase 2: Verification
- [x] **Task 5: Ensure `webcrack.test.ts` and `unminify.test.ts` pass** a0e4772
- [x] **Task 6: Create E2E test to verify resume behavior with partial processing** a0e4772

## Proposed Solution
We will introduce a "Staging Directory" pattern to separate the extraction of minified code from the final storage of unminified code.

1. **Staging Directory**: Create a temporary directory (e.g., `outputDir/.cartographer-tmp`) before unbundling.
2. **Webcrack Extraction**: Direct `webcrack` to write all unbundled files into this staging directory instead of `outputDir`.
3. **Module Graph**: `GraphBuilder` will scan the staging directory to build the `module-graph.json`, ensuring it captures all inter-module dependencies before any LLM processing. The graph will be saved to `outputDir`.
4. **Smart Processing & Cache Hit**:
    - For each file in the staging directory, compute its final destination path in `outputDir` (e.g., mapping `.cartographer-tmp/1.js` to `outputDir/1.js`).
    - Read the minified code from the staging file.
    - Check the cache using the **destination path**.
    - If the cache confirms it's completed **AND** the unminified file actually exists at the destination path, skip processing. The unminified file from the previous run is preserved.
5. **Cache Miss**:
    - If not in the cache, run the full sanitizer + LLM + prettier pipeline on the minified code.
    - Write the unminified result to the destination path in `outputDir`.
    - Mark the destination path as completed in the cache.
6. **Cleanup**: After all files are processed, recursively delete the staging directory.

## Verification & Testing
- Create a test scenario where a bundle is processed partially.
- Interrupt the process, ensuring the cache file and some unminified files are in `outputDir`.
- Restart the run.
- Assert that the previously unminified files are **not** overwritten, the cache correctly skips them, and the remaining files are processed and unminified successfully.
- Verify `module-graph.json` and `call-graph.json` are still generated correctly with accurate paths.

## Migration & Rollback
No migration is required since the cache structure and final output structure remain exactly the same. The change only affects the intermediate steps during execution. If issues arise, the code can be trivially reverted by changing `stagingDir` back to `outputDir`.
