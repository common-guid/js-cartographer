# Implementation Plan: Qwen3-Coder-30B-A3B Integration

## Current Status
- [ ] Preparation
- [ ] Integration
- [ ] Validation

---

## Preparation
- [x] **Verify `node-llama-cpp` compatibility.** Research if `node-llama-cpp` (and its underlying `llama.cpp`) version currently in `package.json` supports the `qwen3_moe` architecture. If not, upgrade the dependency. (643907e)
- [x] **Define the model configuration.** Determine the final download URL and naming convention for the "30b" model. (643907e)

## Integration
- [x] **Update `src/local-models.ts`.** Add the `30b` model entry to the `MODELS` object, including the URL for the `unsloth` GGUF. (7fde68f)
- [~] **Verify model download functionality.** Manually test `cartographer download 30b` to ensure the file downloads correctly and its integrity is maintained.
- [ ] **Confirm LLM output.** Test the `30b` model with GBNF to ensure the output remains correctly formatted as a string/identifier.

## Validation
- [ ] **Manual testing on a fixture.** Run `cartographer local fixtures/example.min.js --model 30b` and verify the quality of the renamed identifiers.
- [ ] **Performance benchmark.** Observe the memory usage and speed of the `30b` model compared to the `8b` model on representative files.
- [ ] **Update `README.md` or help documentation.** Ensure the new model is listed and its hardware requirements are noted.
