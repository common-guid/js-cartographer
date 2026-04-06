import assert from "assert";
import test from "node:test";
import { pLimit, withRetry } from "./concurrency.js";

// ---------------------------------------------------------------------------
// pLimit tests
// ---------------------------------------------------------------------------

test("pLimit: runs all tasks and returns results", async () => {
  const limit = pLimit(2);
  const results = await Promise.all(
    [1, 2, 3, 4, 5].map((n) => limit(() => Promise.resolve(n * 10)))
  );
  assert.deepStrictEqual(results, [10, 20, 30, 40, 50]);
});

test("pLimit: respects concurrency cap", async () => {
  let active = 0;
  let maxActive = 0;
  const limit = pLimit(2);

  const task = () =>
    new Promise<void>((resolve) => {
      active++;
      if (active > maxActive) maxActive = active;
      setTimeout(() => {
        active--;
        resolve();
      }, 20);
    });

  await Promise.all(Array.from({ length: 6 }, () => limit(task)));
  assert.strictEqual(maxActive, 2, `Max concurrent should be 2, was ${maxActive}`);
});

test("pLimit: concurrency=1 runs tasks sequentially", async () => {
  const order: number[] = [];
  const limit = pLimit(1);

  await Promise.all(
    [1, 2, 3].map((n) =>
      limit(async () => {
        order.push(n);
        await new Promise((r) => setTimeout(r, 10));
      })
    )
  );
  assert.deepStrictEqual(order, [1, 2, 3]);
});

test("pLimit: propagates errors without blocking queue", async () => {
  const limit = pLimit(2);
  const results: Array<string | Error> = [];

  const tasks = [
    limit(async () => "ok1"),
    limit(async () => {
      throw new Error("fail");
    }).catch((e: Error) => e),
    limit(async () => "ok2"),
  ];

  const settled = await Promise.all(tasks);
  assert.strictEqual(settled[0], "ok1");
  assert.ok(settled[1] instanceof Error);
  assert.strictEqual(settled[2], "ok2");
});

test("pLimit: throws on concurrency < 1", () => {
  assert.throws(() => pLimit(0), /concurrency must be >= 1/);
});

// ---------------------------------------------------------------------------
// withRetry tests
// ---------------------------------------------------------------------------

test("withRetry: returns immediately on success", async () => {
  let attempts = 0;
  const result = await withRetry(
    async () => {
      attempts++;
      return "done";
    },
    { maxAttempts: 3, initialDelayMs: 1 }
  );
  assert.strictEqual(result, "done");
  assert.strictEqual(attempts, 1);
});

test("withRetry: retries on failure then succeeds", async () => {
  let attempts = 0;
  const result = await withRetry(
    async () => {
      attempts++;
      if (attempts < 3) throw new Error(`fail ${attempts}`);
      return "recovered";
    },
    { maxAttempts: 4, initialDelayMs: 1, backoffFactor: 1 }
  );
  assert.strictEqual(result, "recovered");
  assert.strictEqual(attempts, 3);
});

test("withRetry: throws last error after all attempts exhausted", async () => {
  let attempts = 0;
  await assert.rejects(
    () =>
      withRetry(
        async () => {
          attempts++;
          throw new Error(`fail ${attempts}`);
        },
        { maxAttempts: 3, initialDelayMs: 1, backoffFactor: 1 }
      ),
    (err: Error) => {
      assert.strictEqual(err.message, "fail 3");
      return true;
    }
  );
  assert.strictEqual(attempts, 3);
});

test("withRetry: respects backoff timing", async () => {
  const timestamps: number[] = [];
  let attempts = 0;
  await assert.rejects(() =>
    withRetry(
      async () => {
        attempts++;
        timestamps.push(Date.now());
        throw new Error("fail");
      },
      { maxAttempts: 3, initialDelayMs: 50, backoffFactor: 2 }
    )
  );
  assert.strictEqual(attempts, 3);
  // First retry delay ~50ms, second ~100ms
  const gap1 = timestamps[1] - timestamps[0];
  const gap2 = timestamps[2] - timestamps[1];
  assert.ok(gap1 >= 40, `First retry gap ${gap1}ms should be >= 40ms`);
  assert.ok(gap2 >= 80, `Second retry gap ${gap2}ms should be >= 80ms`);
});
