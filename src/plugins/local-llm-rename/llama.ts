import {
  getLlama,
  LlamaChatSession,
  LlamaGrammar,
  LlamaModelOptions
} from "node-llama-cpp";
import { Gbnf } from "./gbnf.js";
import { getModelPath, getModelWrapper } from "../../local-models.js";
import { verbose } from "../../verbose.js";
import { withRetry } from "../../concurrency.js";

export type Prompt = (
  systemPrompt: string,
  userPrompt: string,
  responseGrammar: Gbnf
) => Promise<string>;

const IS_CI = process.env["CI"] === "true";

export async function llama(opts: {
  seed?: number;
  model: string;
  disableGpu?: boolean;
  sequences?: number;
  contextSize?: number;
}): Promise<Prompt> {
  const disableGpu = opts.disableGpu ?? IS_CI;
  const llama = await getLlama({ gpu: disableGpu ? false : "auto" });
  const modelOpts: LlamaModelOptions = {
    modelPath: await getModelPath(opts?.model),
    gpuLayers: disableGpu ? 0 : undefined
  };
  verbose.log("Loading model with options", modelOpts);
  const model = await llama.loadModel(modelOpts);

  let sequences = opts.sequences ?? 1;
  const requiredPerSequenceTokens = opts.contextSize
    ? Math.floor(opts.contextSize / 2 + 1000)
    : 2048;
  
  // Total context size requested
  let contextSize = requiredPerSequenceTokens * (sequences + 2); // Buffer for system prompts/shared KV

  if (model.maxContextLength > 0 && contextSize > model.maxContextLength) {
    verbose.log(`Requested context size ${contextSize} exceeds model max ${model.maxContextLength}, capping.`);
    contextSize = model.maxContextLength;

    const maxPossibleSequences = Math.floor(contextSize / requiredPerSequenceTokens);
    if (maxPossibleSequences < sequences) {
      console.warn(`[LLM] Warning: Reducing active sequences from ${sequences} to ${Math.max(1, maxPossibleSequences)} due to context size limits. This may slow down processing.`);
      sequences = Math.max(1, maxPossibleSequences);
    }
  }

  verbose.log(`Creating context with ${sequences} sequences and ${contextSize} context size`);

  const context = await model.createContext({
    seed: opts?.seed,
    sequences,
    contextSize
  });

  return async (systemPrompt, userPrompt, responseGrammar) => {
    const sequence = await withRetry(async () => context.getSequence(), {
      maxAttempts: 100, // Increase retries for high concurrency
      initialDelayMs: 200,
      backoffFactor: 1.05,
      onRetry: (err) => {
        if (err instanceof Error && err.message.includes("No sequences left")) {
          verbose.log("No sequences left, waiting for one to become available...");
        } else {
          throw err;
        }
      }
    });

    const session = new LlamaChatSession({
      contextSequence: sequence,
      autoDisposeSequence: true,
      systemPrompt,
      chatWrapper: getModelWrapper(opts.model)
    });
    try {
      const response = await session.promptWithMeta(userPrompt, {
        temperature: 0.8,
        maxTokens: 100, // Safety limit for variable names
        grammar: new LlamaGrammar(llama, {
          grammar: `${responseGrammar}`
        }),
        stopOnAbortSignal: true
      });
      return responseGrammar.parseResult(response.responseText);
    } finally {
      session.dispose();
    }
  };
}
