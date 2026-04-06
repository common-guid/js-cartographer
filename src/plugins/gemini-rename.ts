import { visitAllIdentifiers } from "./local-llm-rename/visit-all-identifiers.js";
import { verbose } from "../verbose.js";
import { showPercentage } from "../progress.js";
import { withRetry } from "../concurrency.js";
import {
  GoogleGenerativeAI,
  ModelParams,
  SchemaType
} from "@google/generative-ai";

export function geminiRename({
  apiKey,
  model: modelName,
  contextWindowSize,
  renameAll = false
}: {
  apiKey: string;
  model: string;
  contextWindowSize: number;
  renameAll?: boolean;
}) {
  const client = new GoogleGenerativeAI(apiKey);

  return async (code: string): Promise<string> => {
    return await visitAllIdentifiers(
      code,
      async (name, surroundingCode) => {
        verbose.log(`Renaming ${name}`);
        verbose.log("Context: ", surroundingCode);

        const renamed = await withRetry(async () => {
          const model = client.getGenerativeModel(
            toRenameParams(name, modelName)
          );
          const result = await model.generateContent(surroundingCode);
          return JSON.parse(result.response.text()).newName;
        });

        verbose.log(`Renamed to ${renamed}`);

        return renamed;
      },
      contextWindowSize,
      showPercentage,
      renameAll
    );
  };
}

function toRenameParams(name: string, model: string): ModelParams {
  return {
    model,
    systemInstruction: `Rename Javascript variables/function \`${name}\` to have descriptive name based on their usage in the code.

The code you receive has already been structurally de-transpiled and formatted. DO NOT attempt to restructure logic (loops, classes, async/await) unless strictly necessary. Your PRIMARY task is to infer the purpose of variables/functions and rename them to meaningful English names.

### NAMING RULES (STRICT)

1. **Respect Static Analysis:** The code has been pre-analyzed. If a variable is already named meaningfully (e.g., \`document\`, \`window\`, \`element\`, \`jsonResponse\`), **YOU MUST NOT RENAME IT**. Treat these names as locked facts.
2. **Focus on the Unknown:** Only rename variables that are still obfuscated (e.g., \`a\`, \`x\`, \`_0x4f2\`, \`var1\`).
3. **No Hallucinations:** Do not "guess" a name if you are unsure. If a variable name is locked, use it exactly as is.`,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        nullable: false,
        description: "The new name for the variable/function",
        type: SchemaType.OBJECT,
        properties: {
          newName: {
            type: SchemaType.STRING,
            nullable: false,
            description: `The new name for the variable/function called \`${name}\``
          }
        },
        required: ["newName"]
      }
    }
  };
}
