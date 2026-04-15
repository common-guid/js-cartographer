import { SecurityFinding } from "./sink-discovery.js";
import { TaintFlow, TaintPathElement } from "./inter-taint.js";
import { buildFlowExplanationPrompt, buildSanitizerIdentificationPrompt } from "./llm-sanitization-prompts.js";

export interface FlowAnalysis {
  explanation: string;
  riskScore: number;
  implications: string;
  bypassSuggestions: string[];
}

export interface SanitizerClassification {
  classification: "SANITIZER" | "OTHER";
  explanation: string;
  confidence: number;
}

export type LlmClient = (prompt: string) => Promise<string | null>;

export class LlmSanitizationService {
  constructor(private llm: LlmClient) {}

  /**
   * Explains a taint flow in natural language using an LLM.
   */
  async explainFlow(flow: TaintFlow): Promise<FlowAnalysis | null> {
    const path = flow.path || [];
    const pathDescriptions = path.map(
      (p) => `${p.name} in ${p.file}:${p.line}`
    );
    
    const sourceName = flow.source?.name || "unknown source";
    const sinkName = flow.sink?.name || "unknown sink";

    const prompt = buildFlowExplanationPrompt(
      sourceName,
      sinkName,
      pathDescriptions
    );

    const response = await this.llm(prompt);
    if (!response) return null;

    try {
      // Basic JSON extraction from LLM response
      const jsonStart = response.indexOf("{");
      const jsonEnd = response.lastIndexOf("}") + 1;
      if (jsonStart === -1 || jsonEnd === -1) return null;
      
      const analysis = JSON.parse(response.substring(jsonStart, jsonEnd));
      return analysis as FlowAnalysis;
    } catch {
      return null;
    }
  }

  /**
   * Classifies a function as a sanitizer using an LLM.
   */
  async classifySanitizer(functionName: string, functionCode: string): Promise<SanitizerClassification | null> {
    const prompt = buildSanitizerIdentificationPrompt(functionName, functionCode);
    
    const response = await this.llm(prompt);
    if (!response) return null;

    try {
      const jsonStart = response.indexOf("{");
      const jsonEnd = response.lastIndexOf("}") + 1;
      if (jsonStart === -1 || jsonEnd === -1) return null;
      
      const classification = JSON.parse(response.substring(jsonStart, jsonEnd));
      return classification as SanitizerClassification;
    } catch {
      return null;
    }
  }
}
