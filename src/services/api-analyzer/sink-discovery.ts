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
  possibleUrls?: string[];
  body?: Record<string, string>;
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
          const possibleUrls = resolveAllPossibleStrings(node.arguments[0], path.get("arguments.0"));
          if (possibleUrls.length > 0) {
            let method = "GET";
            let body: Record<string, string> | undefined;
            if (node.arguments.length >= 2 && node.arguments[1].type === "ObjectExpression") {
              const options = node.arguments[1] as ObjectExpression;
              const methodProp = options.properties.find(
                (p) =>
                  p.type === "ObjectProperty" &&
                  p.key.type === "Identifier" &&
                  p.key.name === "method"
              );
              if (methodProp && methodProp.type === "ObjectProperty") {
                const m = resolveString(methodProp.value, path.get("arguments.1"));
                if (m !== null) method = m.toUpperCase();
              }

              const bodyProp = options.properties.find(
                (p) =>
                  p.type === "ObjectProperty" &&
                  p.key.type === "Identifier" &&
                  p.key.name === "body"
              );
              if (bodyProp && bodyProp.type === "ObjectProperty") {
                body = inferSchema(bodyProp.value);
              }
            }
            sinks.push({ 
              url: possibleUrls[0], 
              method, 
              loc: node.loc?.start,
              possibleUrls: possibleUrls.length > 1 ? possibleUrls : undefined,
              body
            });
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
            const possibleUrls = resolveAllPossibleStrings(node.arguments[0], path.get("arguments.0"));
            if (possibleUrls.length > 0) {
              let body: Record<string, string> | undefined;
              if (node.arguments.length >= 2 && node.arguments[1].type === "ObjectExpression") {
                  body = inferSchema(node.arguments[1]);
              }
              sinks.push({ 
                url: possibleUrls[0], 
                method: axiosMethod.toUpperCase(), 
                loc: node.loc?.start,
                possibleUrls: possibleUrls.length > 1 ? possibleUrls : undefined,
                body
              });
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
          const dataProp = config.properties.find(
            (p) =>
              p.type === "ObjectProperty" &&
              p.key.type === "Identifier" &&
              p.key.name === "data"
          );

          if (urlProp && urlProp.type === "ObjectProperty") {
            const possibleUrls = resolveAllPossibleStrings(urlProp.value, path.get("arguments.0"));
            if (possibleUrls.length > 0) {
              let method = "GET";
              if (methodProp && methodProp.type === "ObjectProperty") {
                const m = resolveString(methodProp.value, path.get("arguments.0"));
                if (m !== null) method = m.toUpperCase();
              }
              let body: Record<string, string> | undefined;
              if (dataProp && dataProp.type === "ObjectProperty") {
                  body = inferSchema(dataProp.value);
              }
              sinks.push({ 
                url: possibleUrls[0], 
                method, 
                loc: node.loc?.start,
                possibleUrls: possibleUrls.length > 1 ? possibleUrls : undefined,
                body
              });
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
 * Infers a simple JSON schema (key: type) from a Babel node representing a request body.
 */
function inferSchema(node: any): Record<string, string> | undefined {
  let objectNode = node;

  // Handle JSON.stringify({ ... })
  if (
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    node.callee.object.type === "Identifier" &&
    node.callee.object.name === "JSON" &&
    node.callee.property.type === "Identifier" &&
    node.callee.property.name === "stringify" &&
    node.arguments.length >= 1
  ) {
    objectNode = node.arguments[0];
  }

  if (objectNode.type === "ObjectExpression") {
    const schema: Record<string, string> = {};
    for (const prop of objectNode.properties) {
      if (prop.type === "ObjectProperty" && prop.key.type === "Identifier") {
        let type = "any";
        if (prop.value.type === "StringLiteral") type = "string";
        else if (prop.value.type === "NumericLiteral") type = "number";
        else if (prop.value.type === "BooleanLiteral") type = "boolean";
        else if (prop.value.type === "ObjectExpression") type = "object";
        else if (prop.value.type === "ArrayExpression") type = "array";
        
        schema[prop.key.name] = type;
      }
    }
    return schema;
  }

  return undefined;
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

/**
 * Extracts query parameters from a URL string.
 */
export function extractQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryString = url.split("?")[1];
  if (!queryString) return params;

  const pairs = queryString.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    }
  }
  return params;
}

function resolveString(node: any, path?: any): string | null {
  if (node.type === "StringLiteral") {
    return node.value;
  }

  // Handle variable tracking: fetch(url) where url is defined earlier
  if (node.type === "Identifier" && path) {
    const binding = path.scope.getBinding(node.name);
    if (binding) {
      // If we find multiple assignments, we can't return a single string
      // but we can maybe return the first one or signal multiple
    }
  }

  // Handle simple concatenation: 'a' + 'b'
  if (node.type === "BinaryExpression" && node.operator === "+") {
    const left = resolveString(node.left, path);
    const right = resolveString(node.right, path);
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
        const expr = resolveString(node.expressions[i], path);
        if (expr === null) return null; // Can't resolve part of it
        result += expr;
      }
    }
    return result;
  }

  return null;
}

/**
 * Resolves all possible string values for a given node by tracking assignments.
 */
function resolveAllPossibleStrings(node: any, path: any): string[] {
  if (node.type === "StringLiteral") {
    return [node.value];
  }

  if (node.type === "Identifier") {
    const binding = path.scope.getBinding(node.name);
    if (binding) {
      const values: string[] = [];
      
      // Check initial value
      if (binding.path.isVariableDeclarator()) {
          const init = binding.path.get("init");
          if (init.node) {
              const resolved = resolveAllPossibleStrings(init.node, init);
              values.push(...resolved);
          }
      }

      // Check constant violations (re-assignments)
      for (const violationPath of binding.constantViolations) {
        if (violationPath.isAssignmentExpression()) {
          const right = violationPath.get("right");
          const resolved = resolveAllPossibleStrings(right.node, right);
          values.push(...resolved);
        }
      }
      return Array.from(new Set(values));
    }
  }

  const single = resolveString(node, path);
  return single ? [single] : [];
}
