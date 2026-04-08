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

## 5. Dynamic Analysis & Runtime-Assisted Naming
**Effort:** Very High
**Objective:** Use execution traces to resolve identities that static analysis cannot.

The "Holy Grail" of deobfuscation. This involves:
- **Instrumentation:** Automatically injecting tracking code into the bundle.
- **Sandbox Execution:** Running the code in a headless environment (Playwright/Puppeteer) to observe real variable values, property access patterns, and function call arguments.
- **Feedback Loop:** Feeding runtime data (e.g., "This variable always holds a URL string") back into the LLM renamer to produce names that are not just syntactically plausible, but factually correct.

---

## Effort Ranking (Highest to Lowest)

1. **Dynamic Analysis & Runtime-Assisted Naming** (Requires complex instrumentation and sandboxing)
2. **Interactive Web-based Explorer** (Requires building a full frontend and state management for graph/code sync)
3. **Incremental Processing & Caching** (Requires robust dependency tracking and stable hashing)
4. **Framework-Aware Context & Heuristics** (Requires extensive prompt engineering and pattern matching)
5. **Sourcemap-Driven Truth Injection** (Relies on existing standards and mapping logic)
