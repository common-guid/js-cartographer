import test from "node:test";
import assert from "node:assert";
import { KeyManager } from "./index.js";

test("KeyManager: rotates keys in round-robin fashion", () => {
  const keys = ["key1", "key2", "key3"];
  const manager = new KeyManager(keys);

  assert.strictEqual(manager.getNextKey(), "key1");
  assert.strictEqual(manager.getNextKey(), "key2");
  assert.strictEqual(manager.getNextKey(), "key3");
  assert.strictEqual(manager.getNextKey(), "key1");
});

test("KeyManager: handles single key", () => {
  const manager = new KeyManager(["only-key"]);
  assert.strictEqual(manager.getNextKey(), "only-key");
  assert.strictEqual(manager.getNextKey(), "only-key");
});

test("KeyManager: marks key as failed and removes from rotation", () => {
  const keys = ["key1", "key2", "key3"];
  const manager = new KeyManager(keys);

  assert.strictEqual(manager.getNextKey(), "key1");
  manager.markKeyAsFailed("key1");

  // Subsequent calls should not return key1
  assert.strictEqual(manager.getNextKey(), "key2");
  assert.strictEqual(manager.getNextKey(), "key3");
  assert.strictEqual(manager.getNextKey(), "key2");
});

test("KeyManager: throws error if no keys available", () => {
  const manager = new KeyManager(["bad-key"]);
  manager.markKeyAsFailed("bad-key");

  assert.throws(() => {
    manager.getNextKey();
  }, /No available API keys/);
});
