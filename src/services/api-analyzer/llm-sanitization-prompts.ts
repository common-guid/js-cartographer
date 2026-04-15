/**
 * Builds a prompt for the LLM to identify if a function acts as a sanitizer.
 */
export function buildSanitizerIdentificationPrompt(functionName: string, functionCode: string): string {
  return `You are a security researcher analyzing JavaScript code for potential vulnerabilities.
Given the following function name and code, determine if this function acts as a sanitizer or an escape utility.

### FUNCTION NAME
\`${functionName}\`

### FUNCTION CODE
\`\`\`javascript
${functionCode}
\`\`\`

### INSTRUCTIONS
1. Analyze the function's logic to see if it modifies input data to make it safe for a specific sink (e.g., HTML escaping, URL encoding, removal of dangerous tags).
2. Consider known sanitization libraries (e.g., DOMPurify, sanitize-html) or common patterns (e.g., regex-based replacement of < and >).
3. Classify the function as "SANITIZER" if it significantly reduces the security risk of a payload, or "OTHER" if it is just a transformation without clear security benefits.
4. Provide a brief explanation for your choice.
5. Output your response in the following JSON format:
{
  "classification": "SANITIZER" | "OTHER",
  "explanation": "...",
  "confidence": 0.0 to 1.0
}

JSON Response:`;
}

/**
 * Builds a prompt for the LLM to explain a full-path taint flow.
 */
export function buildFlowExplanationPrompt(source: string, sink: string, path: string[]): string {
  const pathStr = path.length > 0 ? `\n### INTERMEDIATE STEPS\n${path.map((p, i) => `${i + 1}. ${p}`).join("\n")}` : "";

  return `You are a security researcher explaining a data flow path to a developer.
A potentially untrusted source has been traced to a sensitive security sink.

### SOURCE
\`${source}\`

### SINK
\`${sink}\`${pathStr}

### INSTRUCTIONS
1. Describe how data moves from the source through the intermediate steps (if any) to the sink.
2. Explain the security implications of this flow in natural language.
3. Assign a risk/exploitability score from 0 (benign) to 10 (critical).
4. Suggest potential bypass vectors or further manual verification steps for a human researcher.
5. Output your response in the following JSON format:
{
  "explanation": "...",
  "riskScore": 0-10,
  "implications": "...",
  "bypassSuggestions": ["...", "..."]
}

JSON Response:`;
}
