import { parseAsync } from "@babel/core";
import * as babelTraverse from "@babel/traverse";
import type { CallExpression, ObjectExpression } from "@babel/types";

// Same interop hack for babel traverse
const traverse: typeof babelTraverse.default.default = (
  typeof babelTraverse.default === "function"
    ? babelTraverse.default
    : babelTraverse.default.default
) as any;

export interface ApiSink {
  url: string;
  method: string;
  loc?: { line: number; column: number };
}

export async function findApiSinks(code: string): Promise<ApiSink[]> {
  const sinks: ApiSink[] = [];

  try {
    const ast = await parseAsync(code, { sourceType: "unambiguous" });
    if (!ast) return [];

    traverse(ast, {
      CallExpression(path) {
        const { node } = path;

        // 1. fetch('/api/...')
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "fetch" &&
          node.arguments.length >= 1
        ) {
          const url = resolveString(node.arguments[0]);
          if (url !== null) {
            let method = "GET";
            if (node.arguments.length >= 2 && node.arguments[1].type === "ObjectExpression") {
              const options = node.arguments[1] as ObjectExpression;
              const methodProp = options.properties.find(
                (p) =>
                  p.type === "ObjectProperty" &&
                  p.key.type === "Identifier" &&
                  p.key.name === "method"
              );
              if (methodProp && methodProp.type === "ObjectProperty") {
                const m = resolveString(methodProp.value);
                if (m !== null) method = m.toUpperCase();
              }
            }
            sinks.push({ url, method, loc: node.loc?.start });
          }
        }

        // 2. axios.get('/api/...')
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "axios" &&
          node.callee.property.type === "Identifier"
        ) {
          const axiosMethod = node.callee.property.name.toLowerCase();
          const validMethods = ["get", "post", "put", "delete", "patch", "head", "options"];
          if (validMethods.includes(axiosMethod) && node.arguments.length >= 1) {
            const url = resolveString(node.arguments[0]);
            if (url !== null) {
              sinks.push({ url, method: axiosMethod.toUpperCase(), loc: node.loc?.start });
            }
          }
        }

        // 3. axios({ url: '/api/...', method: 'post' })
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "axios" &&
          node.arguments.length >= 1 &&
          node.arguments[0].type === "ObjectExpression"
        ) {
          const config = node.arguments[0] as ObjectExpression;
          const urlProp = config.properties.find(
            (p) =>
              p.type === "ObjectProperty" &&
              p.key.type === "Identifier" &&
              p.key.name === "url"
          );
          const methodProp = config.properties.find(
            (p) =>
              p.type === "ObjectProperty" &&
              p.key.type === "Identifier" &&
              p.key.name === "method"
          );

          if (urlProp && urlProp.type === "ObjectProperty") {
            const url = resolveString(urlProp.value, path.get("arguments.0.properties") as any); // Simplified path
            if (url !== null) {
              let method = "GET";
              if (methodProp && methodProp.type === "ObjectProperty") {
                const m = resolveString(methodProp.value, path.get("arguments.0.properties") as any);
                if (m !== null) method = m.toUpperCase();
              }
              sinks.push({ url, method, loc: node.loc?.start });
            }
          }
        }
      },
    });
  } catch {
    // Non-fatal
  }

  return sinks;
}

/**
 * Infers the most likely base URL from a set of discovered API sinks.
 * It finds the longest common prefix that looks like a base path.
 */
export function inferBaseUrl(sinks: ApiSink[]): string | null {
  if (sinks.length === 0) return null;

  const urls = sinks.map((s) => s.url).filter((u) => u.startsWith("http") || u.startsWith("/"));
  if (urls.length === 0) return null;

  // Start with the first URL as a candidate
  let prefix = urls[0];

  for (let i = 1; i < urls.length; i++) {
    while (!urls[i].startsWith(prefix) && prefix.length > 0) {
      prefix = prefix.substring(0, prefix.length - 1);
    }
  }

  // Clean up: remove trailing slashes
  if (prefix.endsWith("/")) {
    prefix = prefix.substring(0, prefix.length - 1);
  }

  // Further refinement: common API bases often end with /api, /v1, /v2, etc.
  // We'll trim the prefix to the last segment boundary if it's not a known base.
  const segments = prefix.split("/");
  if (segments.length > 1) {
    const lastSegment = segments[segments.length - 1];
    const commonBases = ["api", "v1", "v2", "v3", "rest", "graphql"];
    if (!commonBases.includes(lastSegment.toLowerCase()) && !lastSegment.includes(".")) {
      // If the last segment isn't a known base keyword, it might be a resource (like /users)
      // so we trim it to the previous segment.
      prefix = segments.slice(0, -1).join("/");
    }
  }

  return prefix || null;
}

function resolveString(node: any, path?: any): string | null {
  if (node.type === "StringLiteral") {
    return node.value;
  }

  // Handle simple concatenation: 'a' + 'b'
  if (node.type === "BinaryExpression" && node.operator === "+") {
    const left = resolveString(node.left);
    const right = resolveString(node.right);
    if (left !== null && right !== null) {
      return left + right;
    }
  }

  // Handle template literals: `/api/${'users'}`
  if (node.type === "TemplateLiteral") {
    let result = "";
    for (let i = 0; i < node.quasis.length; i++) {
      result += node.quasis[i].value.cooked || "";
      if (i < node.expressions.length) {
        const expr = resolveString(node.expressions[i]);
        if (expr === null) return null; // Can't resolve part of it
        result += expr;
      }
    }
    return result;
  }

  return null;
}
