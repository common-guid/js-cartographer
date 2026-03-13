Here is a strategic, phased outline for integrating Wakaru’s capabilities into Humanify and building the new Call Graph feature.

This plan prioritizes stability first, optimization second, and new features third. This ensures that we improve the core tool (better/cheaper deobfuscation) before building complex analytics on top of it.

Phase 1: Foundation & Dependency Integration
Goal: Successfully import Wakaru’s core libraries into the Humanify environment without breaking existing functionality.

1.1. Dependency Injection: Install @wakaru/unminify and @wakaru/unpacker into the Humanify project.
1.2. Pipeline Refactoring: Refactor Humanify’s main execution flow to support a formal "Pre-processing" stage (middleware pattern) before the LLM prompt generation.
1.3. Non-Regression Testing: Establish a baseline test suite using current Humanify samples to ensure the new dependencies don't introduce instability or bloat.
Phase 2: The Syntax Restoration Layer ("The Cleanup Pass")
Goal: Feed the LLM cleaner code by using Wakaru to fix structural ugliness (Async/Await, Loops, Classes) before the AI sees it.

2.1. Rule Selection: Curate the specific Wakaru transformation rules relevant to Humanify (prioritizing un-async-await, un-jsx, un-sequence-expression).
2.2. Integration: Implement the sanitizeCode() function within the new pre-processing stage to run these AST transformations.
2.3. Prompt Optimization: Adjust the LLM system prompt. Since the code is now structurally cleaner, instructions regarding "fixing syntax" can be removed to focus purely on "naming."
Phase 3: Static Analysis & Cost Optimization
Goal: Reduce LLM token costs and improve accuracy by using Wakaru’s heuristic renaming.

3.1. Smart Rename Integration: Implement Wakaru’s smart-rename rule after the syntax cleanup but before the LLM step.
3.2. Context Injection: Pass any statically discovered names (e.g., window, document, React hooks) to the LLM context so it doesn't try to guess them again.
3.3. Performance Benchmarking: Measure the reduction in token usage per file to quantify cost savings.
Phase 4: Module Intelligence (The "Nerves")
Goal: Enable Humanify to understand relationships between files, not just code within a single file.

4.1. Module Mapping: Integrate Wakaru’s unpacker logic (or adapt existing Webcrack logic) to generate a reliable ID-to-Filepath map.
4.2. Cross-Reference Resolution: Create a resolver that translates opaque imports (e.g., require(482)) into readable file paths (e.g., import './utils/auth.js').
4.3. Graph Data Structure: Define the JSON schema for storing the project-wide dependency graph.
Phase 5: The Call Graph Implementation
Goal: Build the logic that tracks function calls across the now-renamed codebase.

5.1. Post-Renaming Visitor: Create a Babel visitor that runs after the LLM has renamed the functions.
5.2. Call Extraction Logic: Implement logic to detect function definitions and function calls (both local and imported).
5.3. Graph Assembly: Synthesize the "Module Intelligence" (Phase 4) with the "Function Calls" (Phase 5.2) to link FileA:functionX to FileB:functionY.
Phase 6: CLI Experience & Visualization
Goal: Expose the new data to the user in a way that fits a terminal environment.

6.1. Interactive CLI Command: Implement humanify graph [entry-file] to display a tree view of function calls in the terminal.
6.2. Export Functionality: Add support for --format mermaid or --format dot to allow users to generate visual diagrams for documentation.
6.3. Documentation: Update README with the new workflow and graph features.
