# Implementation Plan: Black-Box API Surface Reconstruction & Parameter Discovery

## Phase 1: Core Route Synthesis
### Objective: Identify all statically-defined and simple dynamic API routes.

- [x] Task: Framework Heuristics Extension (b45545d)
    - [ ] Update the `framework-detector` to identify common routing libraries (`react-router`, `vue-router`, etc.).
- [x] Task: API Sink Discovery (c377428)
    - [ ] Create a new analyzer to find all calls to `fetch`, `axios`, `XHR`, and other HTTP-related libraries.
- [x] Task: Basic String Resolution (12ef885)
    - [ ] Implement a Babel plugin to statically resolve simple string template literals and concatenations for URL arguments.
- [x] Task: Base URL Normalization (102ced4)
    - [ ] Develop a heuristic to detect common API base paths (e.g., `/api/v1`, `https://api.example.com`).
- [x] Task: Conductor - User Manual Verification 'Phase 1: Core Route Synthesis' (Protocol in workflow.md)

---

## Phase 2: Advanced Parameter Discovery
### Objective: Resolve complex dynamic URLs and identify "hidden" query/body parameters.

- [x] Task: LLM-Augmented Route Analysis (3ac6b7a)
    - [ ] Use the LLM to analyze complex URL construction logic that static analysis misses (e.g., `const url = [base, path, id].join("/")`).
- [x] Task: Query Parameter Scanner (e7380a7)
    - [ ] Scan for assignment/concatenation patterns for query strings (e.g., `?debug=true`, `?admin=1`).
- [x] Task: Conditional Parameter Detection (236d7b0)
    - [ ] Identify parameters that are only added based on specific conditions or state.
- [x] Task: Request Body Extraction (21ee12b)
    - [ ] Analyze `body` or `data` arguments in `fetch`/`axios` calls to infer the JSON schema of POST/PUT requests.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Advanced Parameter Discovery' (Protocol in workflow.md)

---

## Phase 3: API Schema Generation
### Objective: Output a structured "Virtual OpenAPI Spec" for the discovered surface.

- [ ] Task: Data Structure Design
    - [ ] Define an internal representation for the discovered routes, methods, and parameters.
- [ ] Task: OpenAPI 3.0 Exporter
    - [ ] Implement a generator to produce a valid OpenAPI JSON/YAML file.
- [ ] Task: Route Deduplication
    - [ ] Ensure that duplicate routes discovered across different modules are merged correctly.
- [ ] Task: Metadata Enrichment
    - [ ] Use the LLM to provide descriptions for routes and parameters based on surrounding code context.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: API Schema Generation' (Protocol in workflow.md)

---

## Phase 4: Explorer Integration & Reporting
### Objective: Visualize the discovered API surface in the Interactive Web-based Explorer.

- [ ] Task: API Surface View
    - [ ] Create a new "API Explorer" tab in the web interface.
- [ ] Task: Route-to-Source Linking
    - [ ] Enable clicking an API route to jump to the code that calls it.
- [ ] Task: Attack Surface Highlighting
    - [ ] Visually flag "sensitive" or "hidden" endpoints in the UI.
- [ ] Task: Download Export
    - [ ] Add a button to download the generated OpenAPI specification.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Explorer Integration & Reporting' (Protocol in workflow.md)