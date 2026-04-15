import { LlmClient } from "./llm-sanitization-service.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

/**
 * Creates an LLM client for Google Gemini.
 */
export function createGeminiClient(apiKey: string, modelName: string): LlmClient {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  return async (prompt: string) => {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("[Gemini Client] Error:", error);
      return null;
    }
  };
}

/**
 * Creates an LLM client for OpenAI.
 */
export function createOpenAIClient(apiKey: string, modelName: string, baseURL?: string): LlmClient {
  const openai = new OpenAI({ apiKey, baseURL });

  return async (prompt: string) => {
    try {
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error("[OpenAI Client] Error:", error);
      return null;
    }
  };
}

/**
 * Creates an LLM client for a local Llama model.
 */
export function createLlamaClient(llamaSession: any): LlmClient {
  return async (prompt: string) => {
    try {
      // Assuming llamaSession has a prompt method that returns a string
      return await llamaSession.prompt(prompt);
    } catch (error) {
      console.error("[Llama Client] Error:", error);
      return null;
    }
  };
}
