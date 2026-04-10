import { ApiSink, extractQueryParams, inferBaseUrl } from "./sink-discovery.js";
import { ApiSurface, ApiEndpoint, ApiParameter } from "./types.js";

/**
 * Transforms raw API sinks into a structured API surface representation.
 */
export function buildApiSurface(sinks: ApiSink[]): ApiSurface {
  const baseUrl = inferBaseUrl(sinks) || undefined;
  const endpoints: ApiEndpoint[] = [];

  for (const sink of sinks) {
    const rawUrl = sink.url;
    const path = rawUrl.split("?")[0];
    const queryParams: ApiParameter[] = [];
    
    const params = extractQueryParams(rawUrl);
    for (const [name, value] of Object.entries(params)) {
      queryParams.push({
        name,
        type: inferValueType(value),
        required: true // Heuristic: if it's in the URL, it's likely required
      });
    }

    endpoints.push({
      path,
      method: sink.method,
      queryParams: queryParams.length > 0 ? queryParams : undefined,
      requestBody: sink.body,
      // For source locations, we'll need to know which file the sink came from.
      // Current ApiSink only has line/col.
    });
  }

  return {
    baseUrl,
    endpoints
  };
}

function inferValueType(value: string): string {
  if (value === "true" || value === "false") return "boolean";
  if (!isNaN(Number(value)) && value.trim() !== "") return "number";
  return "string";
}
