# Specification: Intra-procedural Taint Tracking

## Objective
Implement local data flow analysis to track the movement of "tainted" data within a single function's body.

## Requirements
1.  **Variable Tracking:** Follow variables from their declaration/assignment to their usage.
2.  **Assignment Analysis:** Handle basic variable reassignments and property accesses.
3.  **String Operations:** Track data through basic string concatenations and template literals.
4.  **Local Flow Discovery:** Identify flows where a source is used as an argument to a sink within the same scope.
