# Implementation Plan: Fix "No sequences left" Error in Local Mode

## Objective
Resolve the `Error: No sequences left` issue occurring when `node-llama-cpp` is used in local mode to unminify multiple files concurrently.

## Key Files & Context
- `src/plugins/local-llm-rename/llama.ts`: Handles model loading and context creation.
- `src/commands/local.ts`: Passes options to the `llama` plugin.

## Implementation Steps
1. **Update `src/plugins/local-llm-rename/llama.ts`**:
   - Add an optional `sequences?: number` property to the `opts` parameter in the `llama` function.
   - Update the `model.createContext` call to include the `sequences` parameter, setting it to the provided value (defaulting to 1 if not provided or ensuring a minimum of 1).

2. **Update `src/commands/local.ts`**:
   - Update the `llama` function call to include the `sequences` parameter by parsing `opts.fileConcurrency`.

## Verification & Testing
- Run `npm run test:unit` to ensure no regressions.
- Verify `cartographer local` runs successfully on a directory of files with `file-concurrency` greater than 1 without throwing the "No sequences left" error.
