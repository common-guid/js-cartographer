# Implementation Plan: Model Storage Configuration

## Objective
Allow users to configure the local models' storage location via a dedicated JSON configuration file (`.cartographerrc.json`), with the ability to override or specify the configuration file's path via an environment variable (`CARTOGRAPHER_CONFIG`).

## Key Files & Context
- `src/local-models.ts`: Currently hardcodes the model storage path.
- `src/services/config/index.ts` (New): Will handle resolving and parsing `.cartographerrc.json`.
- `.env.example`: To document the `CARTOGRAPHER_CONFIG` environment variable.

## Implementation Steps
1. **Create Configuration Service**:
   - Create `src/services/config/index.ts` to expose a `getConfig()` method.
   - Implement logic to load the JSON configuration file from the path specified in `process.env.CARTOGRAPHER_CONFIG`. If not set, try `process.cwd()/.cartographerrc.json`, then `~/.cartographerrc.json`.
   - The configuration should parse and return a typed object including `modelsDirectory`.

2. **Update Model Path Resolution**:
   - In `src/local-models.ts`, update `MODEL_DIRECTORY` to use the Configuration Service. If a custom `modelsDirectory` is present, resolve it (if relative, against the directory containing the config file).
   - Ensure the fallback remains `~/.cartographer/models/` if the configuration file is absent or the `modelsDirectory` key is not set.

3. **Update Environment Example**:
   - Add `CARTOGRAPHER_CONFIG` to `.env.example` with a comment explaining its purpose.

## Verification & Testing
- Create `src/services/config/index.test.ts` to test configuration loading priorities and default fallbacks.
- Update `src/local-models.test.ts` if needed to mock or test the directory resolution.
- Verify running the CLI respects a newly created `.cartographerrc.json`.
