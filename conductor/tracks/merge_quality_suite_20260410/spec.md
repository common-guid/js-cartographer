# Specification: Merge Quality Testing Suite

## Background
The quality testing suite was developed in the `003-feat_01-test-output` branch but has not been merged into the current working branch (`007-feat_01-enhance-test-suite`). This suite introduces a "Source Map Recovery Score" and "Interactive Snapshot Diffing" to measure the quality of deobfuscation outputs.

## Goals
- Merge the `testing/quality/` directory from `003-feat_01-test-output` into the current branch.
- Identify and merge any missing dependencies (e.g., `source-map`, `diff`, `@inquirer/prompts`) required by the suite.
- Verify that the `npm run test:quality` script functions correctly without interfering with subsequent test suite enhancements in the `007` branch.
- Verify the main test suite (`npm run test:unit`) continues to pass.