# Implementation Plan: Framework-Aware Context & Heuristics

## Phase 1: Detection Utility
### Objective: Core Babel detection logic.

- [ ] Task: Framework Detector Implementation
    - [ ] Create `src/services/heuristics/framework-detector.ts`.
    - [ ] Implement basic Babel traversal to detect React (`require('react')`, JSX syntax) and Node/Express (`require('express')`).
- [ ] Task: Unit Testing
    - [ ] Add unit tests for the detector using simple fixture files.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Detection Utility' (Protocol in workflow.md)

---

## Phase 2: Pipeline Integration
### Objective: Integrating detection into the main pipeline.

- [ ] Task: Pipeline Integration
    - [ ] Update `unminify.ts` to run the `FrameworkDetector` and store the result (e.g., `FileMetadata`).
- [ ] Task: Plugin Signature Update
    - [ ] Modify the plugin signature or the `visitAllIdentifiers` arguments to accept the `FileMetadata` object.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Pipeline Integration' (Protocol in workflow.md)

---

## Phase 3: Prompt Augmentation
### Objective: Dynamic LLM prompts based on detected frameworks.

- [ ] Task: Prompt Logic Update
    - [ ] Update prompt generation logic (like `toRenamePrompt` in `openai-rename.ts`) to accept an optional framework context.
    - [ ] Inject specific rules when a framework is present (e.g., React hooks, Express middleware).
- [ ] Task: Provider Implementation
    - [ ] Apply changes across all providers: OpenAI, OpenRouter, Gemini, and Local Llama.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Prompt Augmentation' (Protocol in workflow.md)