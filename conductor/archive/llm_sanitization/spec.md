# Specification: LLM-Augmented Sanitization Check

## Objective
Use large language models to identify sanitization functions and provide expert analysis of identified data flows.

## Requirements
1.  **Sanitizer Identification:** Use the LLM to classify if intermediate functions in a taint path act as sanitizers (e.g., `DOMPurify`, `escapeHtml`).
2.  **Flow Explanation:** Generate clear, natural language descriptions of how data moves from source to sink.
3.  **Risk Scoring:** Assign a risk/exploitability score to each flow based on LLM analysis.
4.  **Bypass Vector Analysis:** Suggest potential bypasses or further manual verification steps for each identified flow.
