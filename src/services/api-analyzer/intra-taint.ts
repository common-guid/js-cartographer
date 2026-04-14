import { parseAsync } from "@babel/core";
import * as babelTraverse from "@babel/traverse";
import { findSecurityFindings, SecurityFinding } from "./sink-discovery.js";

// Same interop hack for babel traverse
const traverse: typeof babelTraverse.default.default = (
  typeof babelTraverse.default === "function"
    ? babelTraverse.default
    : babelTraverse.default.default
) as any;

export interface TaintFlow {
  source: SecurityFinding;
  sink: SecurityFinding;
}

export async function findIntraProceduralFlows(code: string): Promise<TaintFlow[]> {
  const flows: TaintFlow[] = [];
  const findings = await findSecurityFindings(code);
  const sources = findings.filter(f => f.type === "source");
  const sinks = findings.filter(f => f.type === "sink");

  if (sources.length === 0 || sinks.length === 0) return [];

  const ast = await parseAsync(code, { sourceType: "unambiguous" });
  if (!ast) return [];

  traverse(ast, {
    CallExpression(path) {
      const { node } = path;
      const sinkFinding = sinks.find(s => s.loc?.line === node.loc?.start.line && s.loc?.column === node.loc?.start.column);
      
      if (sinkFinding) {
        // Check arguments
        for (let i = 0; i < node.arguments.length; i++) {
          const arg = node.arguments[i];
          const trackedSources = traceTaint(arg, path.get(`arguments.${i}`), sources);
          for (const source of trackedSources) {
            flows.push({ source, sink: sinkFinding });
          }
        }
      }
    },
    AssignmentExpression(path) {
        const { node } = path;
        const sinkFinding = sinks.find(s => s.loc?.line === node.loc?.start.line && s.loc?.column === node.loc?.start.column);
        if (sinkFinding && (sinkFinding.name === "innerHTML" || sinkFinding.name === "outerHTML")) {
            const trackedSources = traceTaint(node.right, path.get("right"), sources);
            for (const source of trackedSources) {
                flows.push({ source, sink: sinkFinding });
            }
        }
    }
  });

  return flows;
}

function traceTaint(node: any, path: any, sources: SecurityFinding[]): SecurityFinding[] {
  const foundSources: SecurityFinding[] = [];

  // 1. Direct source?
  const directSource = sources.find(s => s.loc?.line === node.loc?.start.line && s.loc?.column === node.loc?.start.column);
  if (directSource) {
    foundSources.push(directSource);
  }

  // 2. Identifier? Follow bindings
  if (node.type === "Identifier" && path) {
    const binding = path.scope.getBinding(node.name);
    if (binding) {
      // Check initial value
      if (binding.path.isVariableDeclarator()) {
        const init = binding.path.get("init");
        if (init.node) {
          foundSources.push(...traceTaint(init.node, init, sources));
        }
      }

      // Check re-assignments
      for (const violationPath of binding.constantViolations) {
        if (violationPath.isAssignmentExpression()) {
          const right = violationPath.get("right");
          foundSources.push(...traceTaint(right.node, right, sources));
        }
      }
    }
  }

  // 3. Binary Expression (concatenation)
  if (node.type === "BinaryExpression" && node.operator === "+") {
    foundSources.push(...traceTaint(node.left, path.get("left"), sources));
    foundSources.push(...traceTaint(node.right, path.get("right"), sources));
  }

  // 4. Template Literal
  if (node.type === "TemplateLiteral") {
    for (let i = 0; i < node.expressions.length; i++) {
      foundSources.push(...traceTaint(node.expressions[i], path.get(`expressions.${i}`), sources));
    }
  }

  // Deduplicate sources
  return Array.from(new Set(foundSources));
}
