# Specification: Resume Feature

## Goal
Enable JS Cartographer to resume interrupted runs without re-processing already unminified files or reverting them to their minified state.

## Current Behavior
1. `webcrack` extracts minified modules into `outputDir`.
2. Existing unminified files are overwritten by minified ones.
3. `unminify` checks the cache, finds a hit (minified code hash matches), and skips the file.
4. The file remains minified in `outputDir`.

## Expected Behavior
1. The user runs an LLM command (e.g., `npm run -- local`).
2. The command is interrupted (e.g., Ctrl+C or network failure).
3. The user runs the same command again with the same `outputDir`.
4. Files successfully processed in the first run remain unminified.
5. Files not yet processed (or interrupted mid-process) are picked up and processed.
6. The final `outputDir` contains a fully unminified project with all graphs correctly generated.

## Technical Constraints
- Must not break existing cache compatibility.
- Must not significantly increase disk usage (temporary files should be cleaned up).
- Must ensure Module Graph and Call Graph are consistent with the final output.
