import fs from "fs/promises";
import { existsSync } from "fs";
import { basename } from "path";
import { url } from "./url.js";
import { err } from "./cli-error.js";
import { homedir } from "os";
import { join } from "path";
import { ChatWrapper, Llama3_1ChatWrapper, QwenChatWrapper } from "node-llama-cpp";
import { downloadFile } from "ipull";
import { verbose } from "./verbose.js";
import { getConfig } from "./services/config/index.js";

async function getModelDirectory() {
  const config = await getConfig();
  if (config.modelsDirectory) {
    return config.modelsDirectory;
  }
  return join(homedir(), ".cartographer", "models");
}

type ModelDefinition = { url: URL; wrapper?: ChatWrapper };

export const MODELS: { [modelName: string]: ModelDefinition } = {
  "2b": {
    url: url`https://huggingface.co/bartowski/Phi-3.1-mini-4k-instruct-GGUF/resolve/main/Phi-3.1-mini-4k-instruct-Q4_K_M.gguf?download=true`
  },
  "8b": {
    url: url`https://huggingface.co/lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf?download=true`,
    wrapper: new Llama3_1ChatWrapper()
  },
  "30b": {
    url: url`https://huggingface.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF/resolve/main/Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf`,
    wrapper: new QwenChatWrapper()
  }
};

async function ensureModelDirectory() {
  const directory = await getModelDirectory();
  await fs.mkdir(directory, { recursive: true });
}

export function getModelWrapper(model: string) {
  if (!(model in MODELS)) {
    err(`Model ${model} not found`);
  }
  return MODELS[model].wrapper;
}

export async function downloadModel(model: string) {
  await ensureModelDirectory();
  const url = MODELS[model].url;
  if (url === undefined) {
    err(`Model ${model} not found`);
  }

  const path = await getModelPath(model);

  if (existsSync(path)) {
    console.log(`Model "${model}" already downloaded`);
    return;
  }

  const tmpPath = `${path}.part`;

  const downlaoder = await downloadFile({
    url: url.toString(),
    savePath: tmpPath,
    cliProgress: true,
    cliStyle: verbose.enabled ? "ci" : "auto"
  });
  await downlaoder.download();

  await fs.rename(tmpPath, path);
  console.log(`Model "${model}" downloaded to ${path}`);
}

export const DEFAULT_MODEL = Object.keys(MODELS)[0];

export async function getModelPath(model: string) {
  if (!(model in MODELS)) {
    err(`Model ${model} not found`);
  }
  const filename = basename(MODELS[model].url.pathname);
  const directory = await getModelDirectory();
  return `${directory}/${filename}`;
}

export async function getEnsuredModelPath(model: string) {
  const path = await getModelPath(model);
  if (!existsSync(path)) {
    err(
      `Model "${model}" not found. Run "cartographer download ${model}" to download the model.`
    );
  }
  return path;
}
