# Specification: Batch Directory Processing

## Objective
Implement a "Batch Mode" that allows users to provide a directory of JavaScript files (chunks) and a directory of sourcemaps. Cartographer will automatically pair each JS file with its corresponding sourcemap and process them as a single project, resulting in a unified dependency and call graph.

## Background & Motivation
Offensive security researchers often encounter large web applications built with Webpack that split code into dozens or hundreds of chunks. Manually running Cartographer on each chunk is tedious. By supporting directory-level input and automated sourcemap matching, we can automate the reconstruction of massive codebases.

## Proposed Solution
1. **Directory Input**: The CLI `input` argument will now accept a directory path.
2. **Sourcemap Discovery**: A new `--maps <dir>` flag will allow providing a directory of `.js.map` files.
3. **Automated Matching**:
    - **Step 1: Comment Parsing**: Cartographer will read the last line of each JS file to look for `//# sourceMappingURL=...`.
    - **Step 2: Filename Matching**: If no comment is found, it will look for a `.map` file with the same base name.
4. **Unified Processing Pipeline**:
    - Iterate through matched pairs.
    - Run the unminify pipeline on each.
    - Accumulate all unbundled files into a single `outputDir/src`.
5. **Global Graph Construction**: The `GraphBuilder` and `CallGraphBuilder` will run once at the end, covering all extracted modules from all chunks to provide a complete view of the application.

## User Experience (CLI)
```bash
# Process an entire directory of chunks with a directory of maps
npm start -- gemini ./input_chunks --maps ./input_maps -o ./project_reconstruction
```

## Scope & Impact
- **CLI Commands**: Update `gemini`, `local`, `openai`, and `openrouter` to support directory inputs.
- **New Service**: `DiscoveryService` to handle file scanning and matching logic.
- **Pipeline Refactor**: `unminify.ts` must be updated to handle an array of inputs rather than a single file.
- **Resource Management**: Ensure high-concurrency batching doesn't overwhelm LLM rate limits.
