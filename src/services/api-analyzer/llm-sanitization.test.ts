import { describe, it } from "node:test";
import assert from "node:assert";
import { LlmSanitizationService, FlowAnalysis, SanitizerClassification } from "./llm-sanitization-service.js";
import { TaintFlow } from "./inter-taint.js";

describe("LlmSanitizationService", () => {
  it("explains a taint flow correctly", async () => {
    const mockLlm = async (prompt: string) => {
      return JSON.stringify({
        explanation: "The data from location.hash moves to eval via a direct call.",
        riskScore: 9,
        implications: "Remote Code Execution (RCE)",
        bypassSuggestions: ["Check if the payload is escaped", "Use a CSP"]
      });
    };

    const service = new LlmSanitizationService(mockLlm);
    const flow: TaintFlow = {
      source: { type: "source", category: "DOM", name: "location.hash", loc: { line: 1, column: 0 }, file: "test.js" },
      sink: { type: "sink", category: "DOM", name: "eval", loc: { line: 5, column: 0 }, file: "test.js" },
      path: [
        { file: "test.js", line: 2, column: 0, name: "validate" }
      ]
    };

    const analysis = await service.explainFlow(flow);
    assert.ok(analysis);
    assert.strictEqual(analysis!.riskScore, 9);
    assert.strictEqual(analysis!.implications, "Remote Code Execution (RCE)");
  });

  it("classifies a sanitizer correctly", async () => {
    const mockLlm = async (prompt: string) => {
      return JSON.stringify({
        classification: "SANITIZER",
        explanation: "This function escapes HTML characters.",
        confidence: 0.95
      });
    };

    const service = new LlmSanitizationService(mockLlm);
    const classification = await service.classifySanitizer("escapeHtml", "function escapeHtml(str) { ... }");
    
    assert.ok(classification);
    assert.strictEqual(classification!.classification, "SANITIZER");
    assert.strictEqual(classification!.confidence, 0.95);
  });

  it("handles LLM errors gracefully", async () => {
    const mockLlm = async (prompt: string) => null;
    const service = new LlmSanitizationService(mockLlm);
    
    const analysis = await service.explainFlow({} as any);
    assert.strictEqual(analysis, null);
  });

  it("handles malformed JSON response", async () => {
    const mockLlm = async (prompt: string) => "Not JSON";
    const service = new LlmSanitizationService(mockLlm);
    
    const analysis = await service.explainFlow({} as any);
    assert.strictEqual(analysis, null);
  });
});
