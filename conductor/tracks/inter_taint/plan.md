# Implementation Plan: Inter-procedural & Cross-Module Taint Tracking

- [x] Task: Call-Graph Edge Tracking
    - [x] Integrate the call-graph into the data-flow engine to track parameters and return values.
- [x] Task: Cross-Module Flow Mapping
    - [x] Use the module-graph to connect data flows through exports and imports.
- [ ] Task: Full Taint Path Reconstruction
    - [ ] Build the final "taint-to-sink" paths that span across multiple files.
- [ ] Task: Integration Tests
    - [ ] Create E2E tests for cross-module flows in `src/services/api-analyzer/inter-taint.test.ts`.
