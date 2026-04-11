import { ApiEndpoint } from "./types.js";

export interface EndpointEnrichment {
  description: string;
  parameterDescriptions: Record<string, string>;
}

export type LlmEnricher = (context: string, endpoint: string) => Promise<EndpointEnrichment | null>;

/**
 * Uses an LLM to enrich an API endpoint with descriptive metadata based on code context.
 */
export async function enrichEndpointWithLlm(
  endpoint: ApiEndpoint,
  codeContext: string,
  llm: LlmEnricher
): Promise<ApiEndpoint> {
  const endpointSummary = `${endpoint.method} ${endpoint.path}`;
  
  try {
    const enrichment = await llm(codeContext, endpointSummary);
    if (!enrichment) return endpoint;

    const result = { ...endpoint };
    result.description = enrichment.description;

    if (result.queryParams && enrichment.parameterDescriptions) {
      result.queryParams = result.queryParams.map((p) => ({
        ...p,
        description: enrichment.parameterDescriptions[p.name] || p.description
      }));
    }

    return result;
  } catch {
    return endpoint;
  }
}

/**
 * Builds a prompt for the LLM to generate endpoint metadata.
 */
export function buildEnrichmentPrompt(context: string, endpoint: string): string {
  return `You are a security researcher documenting a reconstructed API surface.
Given the following code context and a discovered API endpoint, provide a concise description of the endpoint's purpose and its parameters.

### CODE CONTEXT
\`\`\`javascript
${context}
\`\`\`

### DISCOVERED ENDPOINT
\`${endpoint}\`

### INSTRUCTIONS
1. Analyze the code context to understand what this API endpoint does.
2. Provide a 1-2 sentence description of the endpoint.
3. Provide a brief description for each query parameter or request body field mentioned in the code.
4. Output your response in the following JSON format:
{
  "description": "...",
  "parameterDescriptions": {
    "paramName": "..."
  }
}

JSON Response:`;
}
