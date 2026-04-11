# Specification: Automated "Taint-to-Sink" Mapping via LLM-Augmented Data Flow

## Objective
Enable automated "taint analysis" in client-side JavaScript bundles by identifying security-sensitive data flows. This helps security researchers find exploitable vulnerabilities by tracing user-controlled input to potentially dangerous execution points.

## High-Level Requirements

### 1. Source and Sink Identification
- **Source Cataloging:** Identify common user-controlled "sources" like `location.hash`, `URLSearchParams`, `window.name`, `postMessage`, `localStorage`, `cookies`.
- **Sink Cataloging:** Identify common sensitive "sinks" like `eval`, `setTimeout`, `setInterval`, `dangerouslySetInnerHTML`, `document.write`, `fetch`/`XHR` (URL and body), and library-specific sinks (e.g., React's `dangerouslySetInnerHTML`).

### 2. Taint Propagation Engine
- **Cross-Module Analysis:** Leverage the recovered call-graph to track data flow through functions and modules.
- **Variable Tracking:** Follow variables and parameters through their lifecycle, including renames and assignments.
- **Flow Confidence Scoring:** Assign a confidence score to each identified flow based on the directness of the connection and the clarity of the code.

### 3. LLM-Augmented Sanitization Logic
- **Sanitization Check:** Use the LLM to determine if a function sitting between a source and a sink acts as a sanitizer (e.g., `DOMPurify.sanitize()`, `encodeURIComponent()`).
- **Explanation Generation:** The LLM should provide a natural language explanation of the identified flow, including potential bypass vectors or reasons why the flow might be benign.

### 4. Security Reporting
- **Vulnerability Alerts:** Flag high-confidence flows from un-sanitized sources to dangerous sinks.
- **Data Leak Detection:** Identify flows where sensitive data (e.g., API keys, tokens) might be sent to third-party domains.

## Success Criteria
1.  **Detection:** Given a bundle with a known XSS vulnerability, the tool correctly identifies the flow from `location.hash` to the relevant sink.
2.  **Accuracy:** Successfully distinguishes between a direct, un-sanitized flow and one that passes through a known sanitization library.
3.  **Visualization:** Displays the entire path of the "tainted" data across at least 3 module boundaries in the Explorer UI.
4.  **Reporting:** Generates a structured JSON report of all identified "Sources," "Sinks," and the "Flows" between them.

## Technical Constraints
- Must handle code deobfuscated by the core pipeline.
- Must operate entirely through static analysis and LLM-based reasoning (no dynamic execution required).
- Should integrate with the existing graph and explorer systems.