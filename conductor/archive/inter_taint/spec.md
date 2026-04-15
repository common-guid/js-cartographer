# Specification: Inter-procedural & Cross-Module Taint Tracking

## Objective
Scale data flow analysis to work across function calls and module boundaries.

## Requirements
1.  **Function Boundary Propagation:** Track data flow through function parameters and return values.
2.  **Graph Integration:** Leverage the existing call-graph to follow call edges and module-graph to track imports/exports.
3.  **Full Path Reconstruction:** Reconstruct complete paths from a source in Module A to a sink in Module C.
4.  **Performance Optimization:** Implement caching for local flow summaries to handle large codebases.
