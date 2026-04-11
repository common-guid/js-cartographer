# JS Cartographer: Future Roadmap

This roadmap outlines potential directions for the project following the completion of the core pipeline (Phases 1-6). These options focus on improving accuracy, developer experience, and the depth of semantic mapping.

---

## 1. Sourcemap-Driven Truth Injection
**Effort:** Low-Medium
**Objective:** Use existing `.js.map` files to provide "locked" identifiers for the LLM.

Currently, the LLM renames everything it thinks is obfuscated. In many production builds, some parts of the code are mapped via sourcemaps while others (third-party libs, injected scripts) are not. By accepting a sourcemap, we can:
- Automatically "lock" variables that have known original names.
- Provide the LLM with "anchor points" in the code, significantly increasing the accuracy of surrounding variable renames.
- Reduce token usage by skipping already-identified symbols.

---

## 2. Framework-Aware Context & Heuristics
**Effort:** Medium
**Objective:** Detect and adapt deobfuscation strategies for specific libraries (React, Express, Vue).

Modern bundles are heavily shaped by their frameworks. This direction involves:
- **Heuristic Detection:** Identifying React components, hooks, or Express route handlers during the Wakaru/Babel phase.
- **Tailored Prompts:** Injecting framework-specific "Standard Operating Procedures" into the LLM prompt (e.g., "This is a React functional component; rename variables according to common hook patterns like `[state, setState]`").
- **API Mapping:** Normalizing obfuscated calls to framework internals back to their idiomatic signatures.

---

## 3. Incremental Processing & Result Caching
**Effort:** Medium-High
**Objective:** Enable fast, differential deobfuscation for large-scale projects.

Currently, a change in a single module requires re-processing the entire bundle if it's treated as a single unit. This feature would:
- Hash individual modules post-unbundling.
- Maintain a local cache (`.cartographer/cache`) of LLM rename results.
- Only "re-map" modules that have changed or whose dependencies have changed, drastically reducing cost and wait times for developers iterating on a specific part of a bundle.

---

## 4. Interactive Web-based "Cartography" Explorer
**Effort:** High
**Objective:** A dedicated GUI for navigating the recovered codebase and its graphs.

The current `graph` command is useful but limited by the terminal. A web-based explorer would:
- Provide a dual-pane view: The Call/Module Graph on the left, and the recovered Source Code on the right.
- **Dynamic Interaction:** Clicking a node in the graph jumps to the function definition in the source.
- **Manual Overrides:** Allow users to manually rename a variable in the UI, which then propagates through the graph and potentially triggers a "refinement" pass from the LLM.

---

## 6. Black-Box API Surface Reconstruction & Parameter Discovery
**Effort:** High
**Objective:** Reconstruct the backend API surface and hidden parameters from client-side code.

Security researchers often operate in black-box environments. This feature would:
- **Route Synthesis:** Analyze string templates, concatenation, and routing libraries (React Router, etc.) to build a "Virtual OpenAPI Spec."
- **Parameter Discovery:** Identify "hidden" parameters (e.g., `?debug=1`, `?admin=true`) and RESTful patterns that aren't visible in standard traffic.
- **Attack Surface Mapping:** Flag unlinked endpoints or "ghost" routes present in the JS bundle but not used in the UI.

---

## 7. Automated "Taint-to-Sink" Mapping via LLM-Augmented Data Flow
**Effort:** Very High
**Objective:** Trace sensitive data from user-controlled "sources" to dangerous "sinks."

Finding XSS, Open Redirects, or sensitive data leaks in a 5MB bundle is a needle-in-a-haystack problem. This engine would:
- **Sink/Source Identification:** Automatically label common browser sinks (`eval`, `dangerouslySetInnerHTML`, `fetch`) and sources (`location.hash`, `postMessage`).
- **Cross-Module Flow:** Use the recovered call-graph to track data movement across different modules, even when obfuscated.
- **LLM Sanitization Check:** Use the LLM to determine if data passing through a function is being "sanitized" or if it remains "tainted."

---

## 8. Semantic "Security Logic" Tagging & Privilege Analysis
**Effort:** High
**Objective:** Use LLMs to categorize and highlight security-critical logic.

Instead of reading all code, researchers need to focus on the "Auth" and "Logic" layers. This involves:
- **Security Labeling:** Automatically tagging functions as "Auth Check," "Permission Logic," "Crypto/Hashing," or "State Management."
- **Privilege Flow:** Visualizing how "role" or "token" data influences the execution of the application.
- **Bypass Heuristics:** Highlighting client-side checks that are prime candidates for bypass (e.g., `if (!user.isAdmin) { ... }`).

---

## Effort Ranking (Highest to Lowest)

1. **Dynamic Analysis & Runtime-Assisted Naming** (Requires complex instrumentation and sandboxing)
2. **Automated "Taint-to-Sink" Mapping** (Requires extremely complex cross-module data flow analysis)
3. **Interactive Web-based Explorer** (Requires building a full frontend and state management for graph/code sync)
4. **Black-Box API Surface Reconstruction** (Requires deep static analysis of strings and patterns)
5. **Semantic "Security Logic" Tagging** (Requires high-accuracy LLM classification and context)
6. **Incremental Processing & Caching** (Requires robust dependency tracking and stable hashing)
7. **Framework-Aware Context & Heuristics** (Requires extensive prompt engineering and pattern matching)
8. **Sourcemap-Driven Truth Injection** (Relies on existing standards and mapping logic)
