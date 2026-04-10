# JS Cartographer (cartographerjs) Product Guidelines

## Communication Style & Tone
- **Direct and Technical:** Use precise, technical language suitable for security researchers.
- **Focus on Action:** Prioritize "how to use this to find X" over general descriptions.
- **Objective and Clear:** Avoid marketing fluff; maintain a professional, analytical tone.

## Naming Conventions (UI & Documentation)
- **Security-Centric Terminology:** Use terms like "Sinks," "Sources," "Taint Tracking," and "Attack Surface" instead of more generic equivalents.
- **Functional Naming:** Labels should describe the security-relevant purpose of a feature (e.g., "Trace Potential API Route" instead of "Show Function Calls").

## UX Principles for Security Analysis
- **High Information Density:** The UI should provide as much relevant data as possible without overwhelming the user, enabling rapid scanning for anomalies.
- **Traceability:** Every piece of deobfuscated code or graph node should be traceable back to its origin in the minified bundle.
- **Keyboard-First Navigation:** Optimize for researchers who prefer efficient, keyboard-driven workflows.
- **Visual Callouts:** Use distinct visual cues (e.g., color, icons) to highlight suspicious patterns, such as hardcoded credentials, sensitive API calls, or complex obfuscation.

## LLM Interaction Guidelines
- **Faithful Reconstruction:** Prioritize semantic names that accurately reflect the *logic* of the code over "natural-sounding" but potentially misleading names.
- **Transparency:** When the LLM is uncertain, the UI should indicate the confidence level or provide multiple naming suggestions.
- **Minimal Hallucination:** Ensure that LLM-generated names and summaries are strictly based on the provided code context.

## Documentation & Reporting
- **Researcher-Oriented Docs:** Provide guides on how to use JS Cartographer for specific security tasks, such as finding hidden API endpoints or analyzing authentication flows.
- **Export-Friendly Formats:** Ensure that graphs and analysis reports can be exported in formats commonly used in security assessments (e.g., Markdown, JSON, Mermaid).