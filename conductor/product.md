# JS Cartographer (cartographerjs)

## Vision
To provide a powerful, AI-driven tool for transforming minified, obfuscated, or webpack-bundled JavaScript into human-readable, semantically named source code. Designed primarily for offensive security researchers, it enables rapid comprehension and mapping of complex, undocumented codebases to identify vulnerabilities and attack surfaces.

## Target Audience
- Offensive Security Researchers
- Bug Bounty Hunters
- Reverse Engineers analyzing malicious or proprietary payloads

## Core Features
- **Deobfuscation Pipeline:** Utilizes static analysis (Wakaru) and AST-level transpilation recovery.
- **Rate-Limit Resilience:** Includes state file tracking to resume interrupted runs and API key rotation with automatic failover to mitigate 429 errors.
- **Batch Directory Processing:** Automatically processes entire directories of JavaScript chunks and matches them with corresponding sourcemaps, enabling reconstruction of large-scale projects.
- **Sourcemap Truth Injection:** Leverages existing \`.js.map\` files to provide locked, 'source of truth' identifier names, dramatically improving deobfuscation accuracy for partially mapped bundles.
- **LLM Semantic Renaming:** Leverages large language models (Local, OpenAI, Gemini, OpenRouter) to assign meaningful names to variables and functions.
- **Codebase Mapping:** Generates navigable dependency graphs (`module-graph.json`) and semantic call graphs (`call-graph.json`) to trace data flow and execution paths.
- **Interactive Web Explorer:** Provides a UI for exploring the deobfuscated codebase and its associated graphs, designed for rapid security analysis.
- **Black-Box API Reconstruction:** Automatically identifies backend API routes, methods, and parameters from client-side JS bundles. Generates a structured 'Virtual OpenAPI Spec' and provides integrated exploration within the Web UI.
- **Visualizations:** Generates ASCII trees and Mermaid flowcharts for call graph visualization.
- **Framework Awareness:** Detects frameworks (e.g., React, Express) to inject context-specific naming conventions into LLM prompts, speeding up structural comprehension.

## Architectural & Design Principles
- **Security-First Focus:** Features and UI should prioritize the discovery of vulnerabilities, hidden parameters, and attack vectors over general code maintainability.
- **Speed & Comprehension:** The tool must minimize the time it takes for a researcher to understand the application logic and identify potential targets.
- **Resilience:** The pipeline must handle heavily obfuscated, malformed, or hostile JavaScript gracefully without crashing.

## Success Metrics
- Accelerated time-to-comprehension for researchers analyzing target applications.
- Accurate reconstruction of minified code into understandable formats that highlight potential security flaws.
- Successful mapping of dependencies, function calls, and data sinks.