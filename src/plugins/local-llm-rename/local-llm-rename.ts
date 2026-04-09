import { showPercentage } from "../../progress.js";
import { defineFilename } from "./define-filename.js";
import { Prompt } from "./llama.js";
import { unminifyVariableName } from "./unminify-variable-name.js";
import { visitAllIdentifiers } from "./visit-all-identifiers.js";
import { detectFrameworks } from "../../services/heuristics/framework-detector.js";

const PADDING_CHARS = 200;

export const localReanme = (
  prompt: Prompt,
  contextWindowSize: number,
  renameAll: boolean = false
) => {
  return async (code: string): Promise<string> => {
    const [filename, frameworks] = await Promise.all([
      defineFilename(prompt, code.slice(0, PADDING_CHARS * 2)),
      detectFrameworks(code)
    ]);

    return await visitAllIdentifiers(
      code,
      (name, surroundingCode) =>
        unminifyVariableName(prompt, name, filename, surroundingCode, frameworks),
      contextWindowSize,
      showPercentage,
      renameAll
    );
  };
};
