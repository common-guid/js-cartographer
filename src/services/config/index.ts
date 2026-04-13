import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { env } from "../../env.js";

export interface Config {
  modelsDirectory?: string;
}

const DEFAULT_CONFIG_FILENAME = ".cartographerrc.json";

function resolveConfigPath(): string | undefined {
  const envPath = env("CARTOGRAPHER_CONFIG");
  if (envPath) return resolve(envPath);

  const cwdPath = join(process.cwd(), DEFAULT_CONFIG_FILENAME);
  if (existsSync(cwdPath)) return cwdPath;

  const homePath = join(homedir(), DEFAULT_CONFIG_FILENAME);
  if (existsSync(homePath)) return homePath;

  return undefined;
}

let cachedConfig: Config | undefined;

export function _resetConfig(): void {
  cachedConfig = undefined;
}

export async function getConfig(): Promise<Config> {
  if (cachedConfig) return cachedConfig;

  const configPath = resolveConfigPath();
  if (!configPath || !existsSync(configPath)) {
    cachedConfig = {};
    return cachedConfig;
  }

  try {
    const content = await fs.readFile(configPath, "utf-8");
    const parsed = JSON.parse(content) as Config;
    
    // Resolve modelsDirectory if it's relative
    if (parsed.modelsDirectory) {
      if (parsed.modelsDirectory.startsWith("~")) {
        parsed.modelsDirectory = join(homedir(), parsed.modelsDirectory.slice(1));
      } else {
        // Resolve relative to the config file's directory
        parsed.modelsDirectory = resolve(dirname(configPath), parsed.modelsDirectory);
      }
    }

    cachedConfig = parsed;
  } catch (e) {
    console.warn(`[Config] Failed to load config at ${configPath}:`, e);
    cachedConfig = {};
  }

  return cachedConfig;
}
