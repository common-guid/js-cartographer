# Implementation Plan: Interactive Web-based Explorer

## Phase 1: The Server & Frontend Shell
### Objective: Create the foundation for the web explorer.

- [ ] Task: Server Setup
    - [ ] Create a new package/directory for the web explorer (`src/explorer`).
    - [ ] Implement the `humanify explore` CLI command.
    - [ ] Implement an Express server that can serve a "Hello World" React app.
- [ ] Task: Frontend Shell
    - [ ] Set up the basic layout (Sidebar, Header, Main Content Area) using Tailwind CSS.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: The Server & Frontend Shell' (Protocol in workflow.md)

---

## Phase 2: Graph Rendering (The Map)
### Objective: Visualize the codebase structure.

- [ ] Task: React Flow Integration
    - [ ] Integrate `React Flow`.
    - [ ] Implement logic to transform `call-graph.json` into React Flow nodes and edges.
- [ ] Task: Graph Interactions
    - [ ] Add basic graph interactions: Zoom, Pan, Node selection.
- [ ] Task: View Toggling
    - [ ] Implement "Module View" vs "Call Graph View" toggling.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Graph Rendering (The Map)' (Protocol in workflow.md)

---

## Phase 3: Source Code Inspection (The Territory)
### Objective: Integrated code viewing and navigation.

- [ ] Task: Monaco Editor Integration
    - [ ] Integrate `Monaco Editor`.
    - [ ] Implement syntax highlighting and basic navigation.
- [ ] Task: Bidirectional Synchronization
    - [ ] Graph -> Code: Selecting a function node in the graph scrolls the editor to its definition.
    - [ ] Code -> Graph: Clicking a function definition in the editor highlights its corresponding node in the graph.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Source Code Inspection (The Territory)' (Protocol in workflow.md)

---

## Phase 4: Navigation & Search
### Objective: Advanced exploration features.

- [ ] Task: Search & Navigation
    - [ ] Search bar to find functions or variables by name across the entire project.
    - [ ] Breadcrumb navigation for file structure.
- [ ] Task: History Management
    - [ ] Implement "History" (Back/Forward) for navigated code paths.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Navigation & Search' (Protocol in workflow.md)