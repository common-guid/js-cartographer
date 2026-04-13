import test from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { getConfig, _resetConfig } from "./index.js";

test("getConfig: returns empty object if no config file exists", async () => {
  _resetConfig();
  const oldEnv = process.env.CARTOGRAPHER_CONFIG;
  delete process.env.CARTOGRAPHER_CONFIG;
  
  try {
    const config = await getConfig();
    assert.strictEqual(typeof config, "object");
  } finally {
    process.env.CARTOGRAPHER_CONFIG = oldEnv;
  }
});

test("getConfig: respects CARTOGRAPHER_CONFIG environment variable", async (t) => {
  const tmpConfigPath = join(tmpdir(), `.cartographerrc-${Date.now()}.json`);
  const testConfig = { modelsDirectory: "/tmp/custom-models" };
  await fs.writeFile(tmpConfigPath, JSON.stringify(testConfig));

  _resetConfig();
  const oldEnv = process.env.CARTOGRAPHER_CONFIG;
  process.env.CARTOGRAPHER_CONFIG = tmpConfigPath;

  try {
    const config = await getConfig();
    assert.strictEqual(config.modelsDirectory, "/tmp/custom-models");
  } finally {
    process.env.CARTOGRAPHER_CONFIG = oldEnv;
    await fs.unlink(tmpConfigPath);
  }
});

test("getConfig: resolves relative paths in modelsDirectory correctly", async (t) => {
  const configDir = join(tmpdir(), `config-test-${Date.now()}`);
  await fs.mkdir(configDir, { recursive: true });
  const tmpConfigPath = join(configDir, ".cartographerrc.json");
  const testConfig = { modelsDirectory: "./custom-models" };
  await fs.writeFile(tmpConfigPath, JSON.stringify(testConfig));

  _resetConfig();
  const oldEnv = process.env.CARTOGRAPHER_CONFIG;
  process.env.CARTOGRAPHER_CONFIG = tmpConfigPath;

  try {
    const config = await getConfig();
    const expectedPath = resolve(configDir, "./custom-models");
    assert.strictEqual(config.modelsDirectory, expectedPath);
  } finally {
    process.env.CARTOGRAPHER_CONFIG = oldEnv;
    await fs.rm(configDir, { recursive: true, force: true });
  }
});
