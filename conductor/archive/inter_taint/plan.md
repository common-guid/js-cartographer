# Implementation Plan: Inter-procedural & Cross-Module Taint Tracking

- [x] Task: Call-Graph Edge Tracking
    - [x] Integrate the call-graph into the data-flow engine to track parameters and return values.
- [x] Task: Cross-Module Flow Mapping
    - [x] Use the module-graph to connect data flows through exports and imports.
- [x] Task: Full Taint Path Reconstruction
    - [x] Build the final "taint-to-sink" paths that span across multiple files.

- [x] Task: Integration Tests
    - [x] Create E2E tests for cross-module flows in `src/services/api-analyzer/inter-taint.test.ts`.
