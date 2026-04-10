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
