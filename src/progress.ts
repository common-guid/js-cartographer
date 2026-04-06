import { Readable } from "stream";
import { verbose } from "./verbose.js";

export function showProgress(stream: Readable) {
  let bytes = 0;
  let i = 0;
  stream.on("data", (data) => {
    bytes += data.length;
    if (i++ % 1000 !== 0) return;
    process.stdout.clearLine?.(0);
    process.stdout.write(`\rDownloaded ${formatBytes(bytes)}`);
  });
}

function formatBytes(numBytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  while (numBytes > 1024 && unitIndex < units.length) {
    numBytes /= 1024;
    unitIndex++;
  }
  return `${numBytes.toFixed(2)} ${units[unitIndex]}`;
}

export function showPercentage(percentage: number) {
  const percentageStr = Math.round(percentage * 100);
  if (!verbose.enabled) {
    process.stdout.clearLine?.(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Processing: ${percentageStr}%`);
  } else {
    verbose.log(`Processing: ${percentageStr}%`);
  }
  if (percentage === 1) {
    process.stdout.write("\n");
  }
}

/**
 * Creates a progress tracker for processing multiple files concurrently.
 * Returns a factory that produces per-file progress callbacks and renders
 * aggregate completion to stdout.
 */
export function createMultiFileProgress(totalFiles: number) {
  const perFile = new Map<number, number>();

  function render() {
    if (verbose.enabled) return; // verbose mode logs individually
    const parts: string[] = [];
    for (const [idx, pct] of [...perFile.entries()].sort((a, b) => a[0] - b[0])) {
      parts.push(`File ${idx + 1}/${totalFiles}: ${Math.round(pct * 100)}%`);
    }
    const overall =
      totalFiles > 0
        ? [...perFile.values()].reduce((s, v) => s + v, 0) / totalFiles
        : 0;
    const line = `${parts.join(" | ")} | Overall: ${Math.round(overall * 100)}%`;
    process.stdout.clearLine?.(0);
    process.stdout.cursorTo?.(0);
    process.stdout.write(line);
  }

  return {
    /**
     * Returns a progress callback bound to a specific file index.
     * When totalFiles is 1, falls back to the simple `showPercentage`.
     */
    forFile(fileIndex: number): (percentage: number) => void {
      if (totalFiles <= 1) return showPercentage;

      perFile.set(fileIndex, 0);
      return (percentage: number) => {
        if (verbose.enabled) {
          verbose.log(`File ${fileIndex + 1}/${totalFiles}: ${Math.round(percentage * 100)}%`);
          return;
        }
        perFile.set(fileIndex, percentage);
        render();
      };
    },
    /** Print a final newline once all files are done. */
    finish() {
      if (!verbose.enabled && totalFiles > 1) {
        process.stdout.write("\n");
      }
    }
  };
}
