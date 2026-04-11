# Implementation Plan: Interactive Web-based Explorer

## Phase 1: The Server & Frontend Shell
### Objective: Create the foundation for the web explorer.

- [x] Task: Server Setup (37592d7)
    - [x] Create a new package/directory for the web explorer (`src/explorer`).
    - [x] Implement the `humanify explore` CLI command.
    - [x] Implement an Express server that can serve a "Hello World" React app.
- [x] Task: Frontend Shell (37592d7)
    - [x] Set up the basic layout (Sidebar, Header, Main Content Area) using Tailwind CSS.
- [x] Task: Conductor - User Manual Verification 'Phase 1: The Server & Frontend Shell' (Protocol in workflow.md)

---

## Phase 2: Graph Rendering (The Map)
### Objective: Visualize the codebase structure.

- [x] Task: React Flow Integration (37592d7)
    - [x] Integrate `React Flow`.
    - [x] Implement logic to transform `call-graph.json` into React Flow nodes and edges.
- [x] Task: Graph Interactions (37592d7)
    - [x] Add basic graph interactions: Zoom, Pan, Node selection.
- [x] Task: View Toggling (37592d7)
    - [x] Implement "Module View" vs "Call Graph View" toggling.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Graph Rendering (The Map)' (Protocol in workflow.md)

---

## Phase 3: Source Code Inspection (The Territory)
### Objective: Integrated code viewing and navigation.

- [x] Task: Monaco Editor Integration (37592d7)
    - [x] Integrate `Monaco Editor`.
    - [x] Implement syntax highlighting and basic navigation.
- [x] Task: Bidirectional Synchronization (37592d7)
    - [x] Graph -> Code: Selecting a function node in the graph scrolls the editor to its definition.
    - [x] Code -> Graph: Clicking a function definition in the editor highlights its corresponding node in the graph.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Source Code Inspection (The Territory)' (Protocol in workflow.md)

---

## Phase 4: Navigation & Search
### Objective: Advanced exploration features.

- [x] Task: Search & Navigation (37592d7)
    - [x] Search bar to find functions or variables by name across the entire project.
    - [x] Breadcrumb navigation for file structure.
- [x] Task: History Management (37592d7)
    - [x] Implement "History" (Back/Forward) for navigated code paths.
- [x] Task: Conductor - User Manual Verification 'Phase 4: Navigation & Search' (Protocol in workflow.md)
