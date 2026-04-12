# Implementation Plan: Batch Directory Processing

## 1. Discovery Service Implementation
- [x] Create `src/services/discovery/index.ts`. (7c550b9)
- [x] Implement `scanDirectory(path: string)` to find all `.js` files. (7c550b9)
- [x] Implement `matchSourcemaps(jsFiles: string[], mapsDir: string)`: (7c550b9)
    - Read the last 1KB of each file to extract `sourceMappingURL`.
    - Fallback to filename-based matching.
    - Return an array of `{ jsPath: string, mapPath?: string }` pairs.

## 2. CLI Command Updates
- [x] Update all deobfuscation command files (`src/commands/*.ts`). (18e09ad)
- [x] Add `--maps <dir>` option. (18e09ad)
- [x] Update the `action` logic to check if the input is a file or directory. (18e09ad)
- [x] Call the `DiscoveryService` to generate the list of tasks. (18e09ad)

## 3. `unminify.ts` Refactoring
- [x] Modify `unminify` signature to accept `InputTask[]` (array of JS+Map pairs). (7a2343e)
- [x] Implement a loop/batching logic that: (7a2343e)
    - Runs `webcrack` on each JS file.
    - Consolidates all results into the single `outputDir`.
    - Handles shared `SourcemapService` instances per chunk.
- [x] Ensure `GraphBuilder` and `CallGraphBuilder` run exactly once *after* all chunks are processed. (7a2343e)

## 4. Progress Tracking & Concurrency
- [~] Update `src/progress.ts` to handle total task count across multiple chunks.
- [ ] Ensure `file-concurrency` is respected globally across the batch.

## 5. Verification & Testing
- Create a unit test for `DiscoveryService`.
- Create a fixture with 2-3 interdependent chunks and partial sourcemaps.
- Verify that the resulting `module-graph.json` correctly links modules across different chunks.

## Phase: Review Fixes
- [x] Task: Apply review suggestions (35560db)
