export type LlmResolver = (context: string, expression: string) => Promise<string | null>;

/**
 * Uses an LLM to resolve a complex URL expression within a given code context.
 */
export async function resolveUrlWithLlm(
  code: string,
  expression: string,
  llm: LlmResolver
): Promise<string | null> {
  // Extract surrounding context for the expression
  const context = extractContext(code, expression);
  
  try {
    return await llm(context, expression);
  } catch {
    return null;
  }
}

function extractContext(code: string, expression: string): string {
  // For now, just return the whole code or a large chunk around the expression
  // In a real implementation, we might want to use AST to find the relevant lines
  return code;
}

/**
 * Example prompt generator for the LLM
 */
export function buildRouteResolutionPrompt(context: string, expression: string): string {
  return `You are a security researcher analyzing deobfuscated JavaScript code.
Your goal is to resolve the final value of a URL expression.

### CODE CONTEXT
\`\`\`javascript
${context}
\`\`\`

### TARGET EXPRESSION
\`${expression}\`

### INSTRUCTIONS
1. Analyze the code to trace the values of variables involved in the target expression.
2. Determine the most likely string value of the final URL.
3. If the URL contains dynamic parts that cannot be resolved (like a user ID from state), use placeholders like "{id}".
4. Output ONLY the resolved URL string. No explanation.

Resolved URL:`;
}
