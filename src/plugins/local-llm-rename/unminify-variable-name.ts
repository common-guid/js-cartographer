import { verbose } from "../../verbose.js";
import { gbnf } from "./gbnf.js";
import { Prompt } from "./llama.js";

export async function unminifyVariableName(
  prompt: Prompt,
  variableName: string,
  filename: string,
  code: string
) {
  verbose.log("Unminifying variable name:", variableName);
  verbose.log("Surrounding code:", code);

  const description = await prompt(
    `Your task is to read the code in file "${filename}" and write the purpose of variable, argument or function '${variableName}' in one sentence. Use simple language so it's understandable by a junior programmer.

The code you receive has already been structurally de-transpiled and formatted. DO NOT attempt to restructure logic (loops, classes, async/await) unless strictly necessary. Your PRIMARY task is to infer the purpose of variables/functions and rename them to meaningful English names.`,
    code,
    gbnf`A good description for '${variableName}' is: ${/[^\r\n\x0b\x0c\x85\u2028\u2029.]+/}.`
  );

  verbose.log("Description:", description);

  const result = await prompt(
    `You are a Code Assistant.`,
    `What would be a good name for the following function or a variable in Typescript? Don't mind the minified variable names.\n${description}`,
    gbnf`A good name would be '${/[a-zA-Z] [a-zA-Z0-9]{2,12}/}'`
  );

  verbose.log("Renaming to:", result);

  return result;
}
