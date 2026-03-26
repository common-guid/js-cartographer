# JS Cartographer
This project integrates Wakaru's advanced static analysis and syntax restoration capabilities into the Humanify CLI pipeline to create a highly optimized JavaScript deobfuscation tool. By pre-processing transpiled code to restore modern syntax and deterministically rename standard APIs, the system significantly reduces LLM token costs while improving naming accuracy. Additionally, the integration maps project-wide dependencies to generate a semantic call graph, providing users with a comprehensive visual trace of function execution across the unbundled codebase.

## CLI Usage

### Advanced Pipeline Options

By default, Humanify cleans up the JS AST before renaming and uses heuristic naming to optimize LLM tokens:

* `--no-sanitizer` disables the Wakaru syntax restoration pass.
* `--no-heuristic-naming` disables the Phase 3 token-savings optimization that resolves `void 0` and standard libraries locally.

### Visualization: The Call Graph

If Humanify finishes a full unminify run (which outputs to `./output` by default), a semantic call graph is generated in the output directory. You can query it using the new `graph` sub-command:

```bash
# Render a depth-limited ASCII tree
npx humanify graph ./output --entry "src/main.js:initApp" --depth 2

# Export the entire graph as a Mermaid chart
npx humanify graph ./output --format mermaid
```