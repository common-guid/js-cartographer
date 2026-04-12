# Implementation Plan: Rate-Limit Resilience

## 1. Key Rotation Service
- [x] Create `src/services/key-manager/index.ts`. (ba7abf2)
- [x] Implement `KeyManager` class: (ba7abf2)
    - Stores an array of keys.
    - `getNextKey()`: Returns the next key using round-robin logic.
    - `markKeyAsFailed(key: string)`: Temporarily removes a key from rotation if it hits a 429.
- [x] Update `src/commands/*.ts` to parse `apiKey` as a comma-separated list and instantiate `KeyManager`. (07004ae)

## 2. State File Tracking (Resume)
- [x] Create `src/services/cache/index.ts`. (c929751)
- [x] Implement `StateCache` to read/write `.cartographer-cache.json`. (c929751)
- [~] Integrate into `src/unminify.ts`:
    - Before processing a module, check hash against cache.
    - After successful LLM pass, update cache.

## 3. Resilience Integration
- [ ] Update `withRetry` in `src/concurrency.ts` to optionally accept the `KeyManager`.
- [ ] If a 429 occurs, trigger `keyManager.markKeyAsFailed` and immediately retry with a new key if available.

## 4. Verification & Testing
- [ ] Unit tests for `KeyManager` rotation and failover.
- [ ] Unit tests for `StateCache` hashing and persistence.
- [ ] Integration test simulating 429s and verifying successful completion via key rotation.
