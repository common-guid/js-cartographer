import assert from "node:assert";
import test from "node:test";
import { cartographer } from "./test-utils.js";

for (const cmd of ["openai", "local"]) {
  test(`${cmd} throws error on missing file`, async () => {
    await assert.rejects(cartographer(cmd, "nonexistent-file.js"));
  });
}

test("local throws error on missing model", async () => {
  await assert.rejects(cartographer("local", "--model", "nonexistent-model"));
});
