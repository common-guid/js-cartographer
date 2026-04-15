# Specification: Security Explorer UI & Reporting

## Objective
Provide an interactive and visual way for security researchers to explore, analyze, and export taint analysis results.

## Requirements
1.  **Security Tab:** A new top-level tab in the Web Explorer dedicated to security analysis.
2.  **Interactive Flow Map:** A visual map showing the source, intermediate steps, and sink for each identified flow.
3.  **Explanation Panel:** Display LLM-generated explanations and risk scores for each flow.
4.  **Structured JSON Export:** Allow users to export all findings as a structured security report.
5.  **CLI Report Flag:** Implement `--security-report` CLI flag for headless report generation.
