import { verbose } from "../../verbose.js";
import { gbnf } from "./gbnf.js";
import { Prompt } from "./llama.js";
import { buildFrameworkPrompt } from "../prompts/framework-rules.js";

export async function unminifyVariableName(
  prompt: Prompt,
  variableName: string,
  filename: string,
  code: string,
  frameworks: string[] = []
) {
  verbose.log("Unminifying variable name:", variableName);
  verbose.log("Surrounding code:", code);

  const frameworkRules = buildFrameworkPrompt(frameworks);

  const description = await prompt(
    `Your task is to read the code in file "${filename}" and write the purpose of variable, argument or function '${variableName}' in one sentence. Use simple language so it's understandable by a junior programmer.

The code you receive has already been structurally de-transpiled and formatted. DO NOT attempt to restructure logic (loops, classes, async/await) unless strictly necessary. Your PRIMARY task is to infer the purpose of variables/functions and rename them to meaningful English names.

### NAMING RULES (STRICT)

1. **Respect Static Analysis:** The code has been pre-analyzed. If a variable is already named meaningfully (e.g., \`document\`, \`window\`, \`element\`, \`jsonResponse\`), **YOU MUST NOT RENAME IT**. Treat these names as locked facts.
2. **Focus on the Unknown:** Only rename variables that are still obfuscated (e.g., \`a\`, \`x\`, \`_0x4f2\`, \`var1\`).
3. **No Hallucinations:** Do not "guess" a name if you are unsure. If a variable name is locked, use it exactly as is.${frameworkRules ? `\n${frameworkRules}` : ""}`,
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
