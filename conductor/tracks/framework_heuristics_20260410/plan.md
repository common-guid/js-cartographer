# Implementation Plan: Framework-Aware Context & Heuristics

## Phase 1: Detection Utility
### Objective: Core Babel detection logic.

- [x] Task: Framework Detector Implementation (6e461ce)
    - [x] Create `src/services/heuristics/framework-detector.ts`.
    - [x] Implement basic Babel traversal to detect React (`require('react')`, JSX syntax) and Node/Express (`require('express')`).
- [x] Task: Unit Testing (6e461ce)
    - [x] Add unit tests for the detector using simple fixture files.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Detection Utility' (Protocol in workflow.md)

---

## Phase 2: Pipeline Integration
### Objective: Integrating detection into the main pipeline.

- [x] Task: Pipeline Integration (6e461ce)
    - [x] Update `unminify.ts` to run the `FrameworkDetector` and store the result (e.g., `FileMetadata`). (Note: Implemented via direct integration in plugins called by unminify)
- [x] Task: Plugin Signature Update (6e461ce)
    - [x] Modify the plugin signature or the `visitAllIdentifiers` arguments to accept the `FileMetadata` object.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Pipeline Integration' (Protocol in workflow.md)

---

## Phase 3: Prompt Augmentation
### Objective: Dynamic LLM prompts based on detected frameworks.

- [x] Task: Prompt Logic Update (6e461ce)
    - [x] Update prompt generation logic (like `toRenamePrompt` in `openai-rename.ts`) to accept an optional framework context.
    - [x] Inject specific rules when a framework is present (e.g., React hooks, Express middleware).
- [x] Task: Provider Implementation (6e461ce)
    - [x] Apply changes across all providers: OpenAI, OpenRouter, Gemini, and Local Llama.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Prompt Augmentation' (Protocol in workflow.md)

---

## Phase: Review Fixes
- [x] Task: Apply review suggestions (e80a698)
