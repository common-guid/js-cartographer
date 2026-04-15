# Implementation Plan: LLM-Augmented Sanitization Check

- [x] Task: LLM Prompt Engineering for Sanitizers
    - [x] Create specialized prompts for identifying sanitization patterns and libraries.
- [x] Task: Flow Explanation Generator
    - [x] Implement an LLM pipeline to describe full-path taint flows in natural language.
- [x] Task: Sanitization Refinement Logic
    - [x] Integrate LLM-based classifier into the taint engine to filter benign flows.
- [x] Task: LLM Security Analysis Tests
    - [x] Create test fixtures with known sanitizers in `src/services/api-analyzer/llm-sanitization.test.ts`.
