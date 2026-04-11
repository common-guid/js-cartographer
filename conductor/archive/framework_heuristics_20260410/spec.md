# Specification: Framework-Aware Context & Heuristics

## 1. Objective
To improve the accuracy and idiomatic quality of LLM-based deobfuscation by injecting framework-specific knowledge (e.g., React, Express, Node.js) into the pipeline. This ensures that variables like React hooks or Express middleware are named according to standard conventions.

## 2. Functional Requirements
- **Framework Detection:** Automatically identify frameworks via AST signature detection (e.g., `useState` calls, `import React`, `express()` usage).
- **Context Injection:** Pass detected framework metadata to all LLM providers (OpenAI, Gemini, OpenRouter, Local).
- **Heuristic Naming Rules:** Apply standard naming patterns (e.g., `[val, setVal]` for React state, `(req, res, next)` for Express) directly in the LLM prompts.

## 3. Architecture
- **Detector:** A new Babel-based service in `src/services/heuristics/framework-detector.ts`.
- **Pipeline:** Integration into `src/unminify.ts` to coordinate detection and context passing.
- **Prompts:** Dynamic prompt augmentation in all LLM provider plugins.