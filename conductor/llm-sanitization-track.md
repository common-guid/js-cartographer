# Implementation Plan: LLM-Augmented Sanitization Check

- [ ] Task: LLM Prompt Engineering for Sanitizers
    - [ ] Create specialized prompts for identifying sanitization patterns and libraries.
- [ ] Task: Flow Explanation Generator
    - [ ] Implement an LLM pipeline to describe full-path taint flows in natural language.
- [ ] Task: Sanitization Refinement Logic
    - [ ] Integrate LLM-based classifier into the taint engine to filter benign flows.
- [ ] Task: LLM Security Analysis Tests
    - [ ] Create test fixtures with known sanitizers in `src/services/api-analyzer/llm-sanitization.test.ts`.