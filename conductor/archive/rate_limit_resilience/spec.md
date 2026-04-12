# Specification: Rate-Limit Resilience

## Objective
Enhance Cartographer's robustness against API rate limits (429 errors) and interruptions through two primary mechanisms: **State File Tracking (Resume)** and **API Key Rotation**.

## 1. State File Tracking (Resume)
### Problem
Interrupted runs (due to network drops or 429s) currently require a full restart, wasting time and tokens.
### Solution
- Maintain a `.cartographer-cache.json` in the `outputDir`.
- Track successfully processed files/chunks by hashing their input.
- Skip files that are already successfully cached and written to disk.

## 2. API Key Rotation
### Problem
Providers like Gemini Flash Lite have low RPM (Requests Per Minute) limits.
### Solution
- **Key Pool**: Support multiple API keys passed via the CLI (comma-separated).
- **Rotation Strategy**: Implement a Round-Robin rotation. Every $X$ requests (default 5-10), the system switches to the next API key in the pool.
- **Failover Logic**: If a key receives a 429 error, it is temporarily "deprioritized" or the system immediately moves to the next key in the rotation.

## Scope & Impact
- **Services**: Create `CacheService` and `KeyManagerService`.
- **Concurrency**: Update `withRetry` to handle key switching upon 429 detection.
- **CLI**: Update deobfuscation commands to parse multiple keys.
- **Plugins**: Update LLM plugins to request keys from the `KeyManager`.
