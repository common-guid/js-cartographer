import { parseAsync } from "@babel/core";
import * as babelTraverse from "@babel/traverse";
import { findSecurityFindings, SecurityFinding } from "./sink-discovery.js";
import { CallGraphData } from "../callgraph/types.js";

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

export interface FileEntry {
  path: string;
  code: string;
}

interface FunctionSummary {
  id: string; // "file.js:funcName"
  name: string;
  paramsToSinks: Map<number, SecurityFinding[]>;
  paramsToReturn: Set<number>;
  returnSources: SecurityFinding[];
}

export class InterProceduralAnalyzer {
  async analyze(code: string): Promise<TaintFlow[]> {
    return this.analyzeProject([{ path: "source.js", code }], { nodes: {}, edges: [] });
  }

  async analyzeProject(files: FileEntry[], callGraph: CallGraphData): Promise<TaintFlow[]> {
    const flows: TaintFlow[] = [];
    const allSources: SecurityFinding[] = [];
    const allSinks: SecurityFinding[] = [];
    const summaries = new Map<string, FunctionSummary>();
    const fileAsts = new Map<string, any>();

    // Pass 1: Collect findings and build summaries for all files
    for (const file of files) {
      const findings = await findSecurityFindings(file.code);
      const fileSources = findings.filter(f => f.type === "source").map(f => ({ ...f, file: file.path }));
      const fileSinks = findings.filter(f => f.type === "sink").map(f => ({ ...f, file: file.path }));
      
      allSources.push(...fileSources);
      allSinks.push(...fileSinks);

      const ast = await parseAsync(file.code, { sourceType: "unambiguous" });
      if (!ast) continue;
      fileAsts.set(file.path, ast);

      const self = this;
      traverse(ast, {
        FunctionDeclaration(path) {
          if (path.node.id) {
            const summary = self.summarizeFunction(path, file.path, fileSources, fileSinks);
            summaries.set(summary.id, summary);
          }
        }
      });
    }

    const self = this;
    // Pass 2: Propagate flows at call sites
    for (const [filePath, ast] of fileAsts.entries()) {
      traverse(ast, {
        CallExpression(path) {
          const { node } = path;
          let calleeId: string | undefined;

          if (node.callee.type === "Identifier") {
            const funcName = node.callee.name;
            // Find in call-graph or local summaries
            calleeId = self.resolveCalleeId(filePath, funcName, path, callGraph);
          }

          if (calleeId) {
            const summary = summaries.get(calleeId);
            if (summary) {
              // Case 1: Param to Sink
              for (let i = 0; i < node.arguments.length; i++) {
                const arg = node.arguments[i];
                const argSources = self.traceTaint(arg, path.get(`arguments.${i}`), allSources, summaries, filePath, callGraph);
                
                const reachableSinks = summary.paramsToSinks.get(i) || [];
                for (const source of argSources) {
                  for (const sink of reachableSinks) {
                    flows.push({ source, sink });
                  }
                }
              }
            }
          }

          // Case 2: Call results that are used in sinks (inline sinks)
          const sinkFinding = allSinks.find(s => s.file === filePath && s.loc?.line === node.loc?.start.line && s.loc?.column === node.loc?.start.column);
          if (sinkFinding) {
            for (let i = 0; i < node.arguments.length; i++) {
              const arg = node.arguments[i];
              const argSources = self.traceTaint(arg, path.get(`arguments.${i}`), allSources, summaries, filePath, callGraph);
              for (const source of argSources) {
                flows.push({ source, sink: sinkFinding });
              }
            }
          }
        }
      });
    }

    return flows;
  }

  private resolveCalleeId(filePath: string, funcName: string, path: any, callGraph: CallGraphData): string | undefined {
    // 1. Try to find the caller function name
    const parentFunc = path.getFunctionParent();
    const callerName = parentFunc?.node?.id?.type === "Identifier" ? parentFunc.node.id.name : "root";
    const callerId = `${filePath}:${callerName}`;

    // 2. Check call-graph for edges from this caller
    const edge = callGraph.edges.find(e => e.from === callerId && (e.to.endsWith(`:${funcName}`) || e.to === funcName));
    if (edge) return edge.to;

    // 3. Fallback to local file if not in call-graph
    return `${filePath}:${funcName}`;
  }

  private summarizeFunction(path: any, filePath: string, sources: SecurityFinding[], sinks: SecurityFinding[]): FunctionSummary {
    const name = path.node.id.name;
    const id = `${filePath}:${name}`;
    const paramsToSinks = new Map<number, SecurityFinding[]>();
    const paramsToReturn = new Set<number>();
    const returnSources: SecurityFinding[] = [];

    const params = path.node.params;
    const self = this;
    
    // Find sinks reachable from params
    path.traverse({
      CallExpression(innerPath: any) {
        const { node } = innerPath;
        const sinkFinding = sinks.find(s => s.loc?.line === node.loc?.start.line && s.loc?.column === node.loc?.start.column);
        if (sinkFinding) {
          node.arguments.forEach((arg: any, idx: number) => {
            params.forEach((param: any, pIdx: number) => {
              if (param.type === "Identifier" && self.isInfluencedBy(arg, innerPath.get(`arguments.${idx}`), param.name)) {
                const list = paramsToSinks.get(pIdx) || [];
                list.push(sinkFinding);
                paramsToSinks.set(pIdx, list);
              }
            });
          });
        }
      },
      ReturnStatement(innerPath: any) {
        const arg = innerPath.node.argument;
        if (!arg) return;

        // Param influence
        params.forEach((param: any, pIdx: number) => {
          if (param.type === "Identifier" && self.isInfluencedBy(arg, innerPath.get("argument"), param.name)) {
            paramsToReturn.add(pIdx);
          }
        });

        // Direct source return
        const argSources = sources.filter(s => s.loc?.line === arg.loc?.start.line && s.loc?.column === arg.loc?.start.column);
        returnSources.push(...argSources);
      }
    });

    return { id, name, paramsToSinks, paramsToReturn, returnSources };
  }

  private isInfluencedBy(node: any, path: any, varName: string): boolean {
    if (node.type === "Identifier" && node.name === varName) return true;
    
    let found = false;
    if (path && path.traverse) {
        path.traverse({
            Identifier(p: any) {
                if (p.node.name === varName) found = true;
            }
        });
    }
    return found;
  }

  private traceTaint(node: any, path: any, sources: SecurityFinding[], summaries: Map<string, FunctionSummary>, filePath: string, callGraph: CallGraphData): SecurityFinding[] {
    const foundSources: SecurityFinding[] = [];

    // 1. Direct source?
    const directSource = sources.find(s => s.file === filePath && s.loc?.line === node.loc?.start.line && s.loc?.column === node.loc?.start.column);
    if (directSource) {
      foundSources.push(directSource);
    }

    // 2. Call result?
    if (node.type === "CallExpression" && node.callee.type === "Identifier") {
      const calleeId = this.resolveCalleeId(filePath, node.callee.name, path, callGraph);
      const summary = calleeId ? summaries.get(calleeId) : undefined;
      
      if (summary) {
        foundSources.push(...summary.returnSources);
        for (let i = 0; i < node.arguments.length; i++) {
          if (summary.paramsToReturn.has(i)) {
            foundSources.push(...this.traceTaint(node.arguments[i], path.get(`arguments.${i}`), sources, summaries, filePath, callGraph));
          }
        }
      }
    }

    // 3. Identifier? Follow bindings
    if (node.type === "Identifier" && path && path.scope) {
      const binding = path.scope.getBinding(node.name);
      if (binding) {
        if (binding.path.isVariableDeclarator()) {
          const init = binding.path.get("init");
          if (init.node) {
            foundSources.push(...this.traceTaint(init.node, init, sources, summaries, filePath, callGraph));
          }
        }
        for (const violationPath of binding.constantViolations) {
          if (violationPath.isAssignmentExpression()) {
            const right = violationPath.get("right");
            foundSources.push(...this.traceTaint(right.node, right, sources, summaries, filePath, callGraph));
          }
        }
      }
    }

    return Array.from(new Set(foundSources));
  }
}
