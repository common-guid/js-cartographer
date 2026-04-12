/**
 * Lightweight concurrency utilities — no external dependencies.
 */

// ---------------------------------------------------------------------------
// pLimit — concurrency limiter
// ---------------------------------------------------------------------------

type Task<T> = () => Promise<T>;

/**
 * Returns a function that limits the number of concurrently executing
 * async tasks.  Behaves like the popular `p-limit` package.
 *
 * Usage:
 *   const limit = pLimit(3);
 *   const results = await Promise.all(items.map(i => limit(() => process(i))));
 */
export function pLimit(concurrency: number) {
  if (concurrency < 1) {
    throw new RangeError("concurrency must be >= 1");
  }

  let activeCount = 0;
  const queue: Array<() => void> = [];

  function next() {
    if (queue.length > 0 && activeCount < concurrency) {
      activeCount++;
      const run = queue.shift()!;
      run();
    }
  }

  return <T>(fn: Task<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        fn().then(
          (val) => {
            resolve(val);
            activeCount--;
            next();
          },
          (err) => {
            reject(err);
            activeCount--;
            next();
          }
        );
      };
      queue.push(run);
      // Kick off immediately if under the limit
      next();
    });
}

// ---------------------------------------------------------------------------
// withRetry — exponential backoff retry wrapper
// ---------------------------------------------------------------------------

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 4. */
  maxAttempts?: number;
  /** Initial delay in ms before the first retry. Default: 1000. */
  initialDelayMs?: number;
  /** Multiplier applied to the delay after each retry. Default: 2. */
  backoffFactor?: number;
  /** Callback triggered before each retry attempt. */
  onRetry?: (error: any, attempt: number) => void | Promise<void>;
}

/**
 * Wraps an async function with automatic retry + exponential backoff.
 *
 * If all attempts fail, the error from the last attempt is thrown.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 4,
    initialDelayMs = 1000,
    backoffFactor = 2,
    onRetry
  } = opts;

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        if (onRetry) {
          await onRetry(err, attempt);
        }
        await sleep(delay);
        delay *= backoffFactor;
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
