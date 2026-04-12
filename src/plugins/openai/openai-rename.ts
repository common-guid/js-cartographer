import OpenAI from "openai";
import { visitAllIdentifiers } from "../local-llm-rename/visit-all-identifiers.js";
import { showPercentage } from "../../progress.js";
import { verbose } from "../../verbose.js";
import { withRetry } from "../../concurrency.js";
import { detectFrameworks } from "../../services/heuristics/framework-detector.js";
import { buildFrameworkPrompt } from "../prompts/framework-rules.js";
import { SourcemapService } from "../../services/sourcemap/index.js";
import { KeyManager } from "../../services/key-manager/index.js";

export function openaiRename({
  keyManager,
  baseURL,
  model,
  contextWindowSize,
  renameAll = false,
  sourcemapService
}: {
  keyManager: KeyManager;
  baseURL: string;
  model: string;
  contextWindowSize: number;
  renameAll?: boolean;
  sourcemapService?: SourcemapService;
}) {
  let currentKey = keyManager.getNextKey();
  let client = new OpenAI({ apiKey: currentKey, baseURL });
  let requestCount = 0;
  const ROTATION_THRESHOLD = 5;

  return async (code: string): Promise<string> => {
    const frameworks = await detectFrameworks(code);
    return await visitAllIdentifiers(
      code,
      async (name, surroundingCode) => {
        requestCount++;
        if (requestCount >= ROTATION_THRESHOLD) {
          currentKey = keyManager.getNextKey();
          client = new OpenAI({ apiKey: currentKey, baseURL });
          requestCount = 0;
          verbose.log(`[Rotation] Switched to new API key`);
        }

        verbose.log(`Renaming ${name}`);
        verbose.log("Context: ", surroundingCode);

        const renamed = await withRetry(
          async () => {
            const response = await client.chat.completions.create(
              toRenamePrompt(name, surroundingCode, model, frameworks)
            );
            const result = response.choices[0].message?.content;
            if (!result) {
              throw new Error("Failed to rename", { cause: response });
            }
            return JSON.parse(result).newName;
          },
          {
            onRetry: (err) => {
              if (err.status === 429) {
                verbose.log(`[429] Rate limit hit for key. Rotating...`);
                keyManager.markKeyAsFailed(currentKey);
                currentKey = keyManager.getNextKey();
                client = new OpenAI({ apiKey: currentKey, baseURL });
                requestCount = 0;
              }
            }
          }
        );

        verbose.log(`Renamed to ${renamed}`);

        return renamed;
      },
      contextWindowSize,
      showPercentage,
      renameAll,
      sourcemapService
    );
  };
}

function toRenamePrompt(
  name: string,
  surroundingCode: string,
  model: string,
  frameworks: string[] = []
): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
  const frameworkRules = buildFrameworkPrompt(frameworks);
  return {
    model,
    messages: [
      {
        role: "system",
        content: `Rename Javascript variables/function \`${name}\` to have descriptive name based on their usage in the code.

The code you receive has already been structurally de-transpiled and formatted. DO NOT attempt to restructure logic (loops, classes, async/await) unless strictly necessary. Your PRIMARY task is to infer the purpose of variables/functions and rename them to meaningful English names.

### NAMING RULES (STRICT)

1. **Respect Static Analysis & Sourcemaps:** The code has been pre-analyzed and potentially enriched with original names from a sourcemap. If a variable is already named meaningfully (e.g., \`document\`, \`window\`, \`fetchUserData\`, \`AuthService\`), **YOU MUST NOT RENAME IT**. Treat these names as locked, absolute facts.
2. **Contextual Anchors:** Use the already-meaningful names (especially those from sourcemaps) as anchors to understand the developer's intent and help you rename the *remaining* obfuscated variables.
3. **Focus on the Unknown:** Only rename variables that are still obfuscated (e.g., \`a\`, \`x\`, \`_0x4f2\`, \`var1\`).
4. **No Hallucinations:** Do not "guess" a name if you are unsure. If a variable name is locked, use it exactly as is.${frameworkRules ? `\n${frameworkRules}` : ""}`
      },
      {
        role: "user",
        content: surroundingCode
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        strict: true,
        name: "rename",
        schema: {
          type: "object",
          properties: {
            newName: {
              type: "string",
              description: `The new name for the variable/function called \`${name}\``
            }
          },
          required: ["newName"],
          additionalProperties: false
        }
      }
    }
  };
}
