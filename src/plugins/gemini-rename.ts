import { visitAllIdentifiers } from "./local-llm-rename/visit-all-identifiers.js";
import { verbose } from "../verbose.js";
import { showPercentage } from "../progress.js";
import {
  GoogleGenerativeAI,
  ModelParams,
  SchemaType
} from "@google/generative-ai";

export function geminiRename({
  apiKey,
  model: modelName,
  contextWindowSize
}: {
  apiKey: string;
  model: string;
  contextWindowSize: number;
}) {
  const client = new GoogleGenerativeAI(apiKey);

  return async (code: string): Promise<string> => {
    return await visitAllIdentifiers(
      code,
      async (name, surroundingCode) => {
        verbose.log(`Renaming ${name}`);
        verbose.log("Context: ", surroundingCode);

        const model = client.getGenerativeModel(
          toRenameParams(name, modelName)
        );

        const result = await model.generateContent(surroundingCode);

        const renamed = JSON.parse(result.response.text()).newName;

        verbose.log(`Renamed to ${renamed}`);

        return renamed;
      },
      contextWindowSize,
      showPercentage
    );
  };
}

function toRenameParams(name: string, model: string): ModelParams {
  return {
    model,
    systemInstruction: `Rename Javascript variables/function \`${name}\` to have descriptive name based on their usage in the code.

The code you receive has already been structurally de-transpiled and formatted. DO NOT attempt to restructure logic (loops, classes, async/await) unless strictly necessary. Your PRIMARY task is to infer the purpose of variables/functions and rename them to meaningful English names.`,
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
