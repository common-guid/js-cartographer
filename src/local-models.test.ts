import test from "node:test";
import assert from "node:assert";
import { MODELS, getModelWrapper } from "./local-models.js";
import { QwenChatWrapper } from "node-llama-cpp";

test("MODELS: has 30b model with correct configuration", () => {
  assert.ok(MODELS["30b"], "30b model should be defined");
  assert.strictEqual(
    MODELS["30b"].url.toString(),
    "https://huggingface.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF/resolve/main/Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf"
  );
  assert.ok(
    getModelWrapper("30b") instanceof QwenChatWrapper,
    "30b model should use QwenChatWrapper"
  );
});
