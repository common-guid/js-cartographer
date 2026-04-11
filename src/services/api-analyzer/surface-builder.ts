import { ApiSink, extractQueryParams, inferBaseUrl } from "./sink-discovery.js";
import { ApiSurface, ApiEndpoint, ApiParameter } from "./types.js";

/**
 * Transforms raw API sinks into a structured API surface representation.
 */
export function buildApiSurface(sinks: ApiSink[]): ApiSurface {
  const baseUrl = inferBaseUrl(sinks) || undefined;
  const endpointMap = new Map<string, ApiEndpoint>();

  for (const sink of sinks) {
    const rawUrl = sink.url;
    const path = rawUrl.split("?")[0];
    const method = sink.method.toUpperCase();
    const key = `${method} ${path}`;

    const params = extractQueryParams(rawUrl);
    const queryParams: ApiParameter[] = Object.entries(params).map(([name, value]) => ({
      name,
      type: inferValueType(value),
      required: true
    }));

    if (endpointMap.has(key)) {
      const existing = endpointMap.get(key)!;
      // Merge query params
      if (queryParams.length > 0) {
        if (!existing.queryParams) existing.queryParams = [];
        for (const p of queryParams) {
          if (!existing.queryParams.find((ep) => ep.name === p.name)) {
            existing.queryParams.push(p);
          }
        }
      }
      // Merge body schemas
      if (sink.body) {
        if (!existing.requestBody) existing.requestBody = {};
        Object.assign(existing.requestBody, sink.body);
      }
      // Add source location
      if ((sink as any).file && sink.loc) {
        if (!existing.sourceLocations) existing.sourceLocations = [];
        existing.sourceLocations.push({
          file: (sink as any).file,
          line: sink.loc.line,
          column: sink.loc.column
        });
      }
    } else {
      endpointMap.set(key, {
        path,
        method,
        queryParams: queryParams.length > 0 ? queryParams : undefined,
        requestBody: sink.body,
        sourceLocations: (sink as any).file && sink.loc ? [{
          file: (sink as any).file,
          line: sink.loc.line,
          column: sink.loc.column
        }] : undefined
      });
    }
  }

  return {
    baseUrl,
    endpoints: Array.from(endpointMap.values())
  };
}

function inferValueType(value: string): string {
  if (value === "true" || value === "false") return "boolean";
  if (!isNaN(Number(value)) && value.trim() !== "") return "number";
  return "string";
}
