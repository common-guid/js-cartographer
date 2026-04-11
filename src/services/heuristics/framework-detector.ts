import { parseAsync } from "@babel/core";
import * as babelTraverse from "@babel/traverse";
import type { CallExpression } from "@babel/types";

// Same interop hack as visit-all-identifiers.ts (pkgroll ESM/CJS mismatch)
const traverse: typeof babelTraverse.default.default = (
  typeof babelTraverse.default === "function"
    ? babelTraverse.default
    : babelTraverse.default.default
) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

export type DetectedFramework = "react" | "express" | "react-router" | "vue-router";

/**
 * Runs a single-pass Babel AST traversal to detect which JS frameworks are
 * present in the given code.  Detection is purely additive — an empty array
 * means "no known frameworks found", which falls back to the generic prompt.
 *
 * Detected signatures:
 *  - React:   `import ... from 'react'|'react-dom'`, `require('react')`,
 *             `React.createElement(...)` (transpiled JSX)
 *  - Express: `import ... from 'express'`, `require('express')`
 *  - React Router: `import ... from 'react-router'|'react-router-dom'`, `require('react-router'|'react-router-dom')`
 *  - Vue Router: `import ... from 'vue-router'`, `require('vue-router')`
 */
export async function detectFrameworks(
  code: string
): Promise<DetectedFramework[]> {
  const detected = new Set<DetectedFramework>();

  try {
    const ast = await parseAsync(code, { sourceType: "unambiguous" });
    if (!ast) return [];

    traverse(ast, {
      // ESM: import React from 'react' | import express from 'express' | etc.
      ImportDeclaration(path) {
        const src = path.node.source.value;
        if (src === "react" || src === "react-dom") detected.add("react");
        if (src === "express") detected.add("express");
        if (src === "react-router" || src === "react-router-dom") detected.add("react-router");
        if (src === "vue-router") detected.add("vue-router");
      },

      CallExpression(path) {
        const { node } = path;

        // CJS: require('react') | require('express')
        if (isRequireCall(node)) {
          const src = requireSource(node);
          if (src === "react" || src === "react-dom") detected.add("react");
          if (src === "express") detected.add("express");
          if (src === "react-router" || src === "react-router-dom") detected.add("react-router");
          if (src === "vue-router") detected.add("vue-router");
        }

        // Transpiled JSX: React.createElement(...)
        if (isReactCreateElement(node)) detected.add("react");
      }
    });
  } catch {
    // Parsing failures are non-fatal — return whatever was accumulated so far
  }

  return Array.from(detected);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRequireCall(node: CallExpression): boolean {
  return (
    node.callee.type === "Identifier" &&
    node.callee.name === "require" &&
    node.arguments.length >= 1 &&
    node.arguments[0].type === "StringLiteral"
  );
}

function requireSource(node: CallExpression): string {
  const arg = node.arguments[0];
  return arg.type === "StringLiteral" ? arg.value : "";
}

function isReactCreateElement(node: CallExpression): boolean {
  const { callee } = node;
  return (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "React" &&
    callee.property.type === "Identifier" &&
    callee.property.name === "createElement"
  );
}
