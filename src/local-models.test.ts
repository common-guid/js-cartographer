import test from "node:test";
import assert from "node:assert";
import { MODELS } from "./local-models.js";

test("MODELS: has 30b model with correct configuration", () => {
  assert.ok(MODELS["30b"], "30b model should be defined");
  assert.strictEqual(
    MODELS["30b"].url.toString(),
    "https://huggingface.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF/resolve/main/Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf"
  );
});
