# Implementation Plan: Advanced Path - High-Performance Local Inference

## Current Status
- [ ] Preparation
- [ ] Implementation
- [ ] Documentation & Validation

---

## Preparation
- [ ] **Research the `vLLM` server setup.** Confirm the command line arguments required to load `cyankiwi/Qwen3-Coder-30B-A3B-Instruct-AWQ-4bit` in vLLM with OpenAI-compatible API mode.
- [ ] **Verify `cartographer openai` options.** Ensure the `--baseURL` and `--apiKey` are correctly passed through to the `openaiRename` plugin without issues.

## Implementation
- [ ] **Enhance `openaiRename` for Qwen compatibility.** While Qwen3 is largely OpenAI-compatible, check if there are any prompt format optimizations (like specific system-message tokens) that could improve results for this specific model series.
- [ ] **(Optional) Add a `local-api` command.** Consider adding a convenience command `cartographer local-api` that defaults to `localhost:8000/v1` and `apiKey: none` to simplify the CLI interface for this path.

## Documentation & Validation
- [ ] **Create a `docs/advanced-local-setup.md`.** Write a step-by-step guide for users on how to:
    1. Install `vLLM` or use a Docker container.
    2. Download the AWQ model.
    3. Run the inference server.
    4. Connect `js-cartographer` to the server.
- [ ] **Verify with a live `vLLM` instance.** Test the end-to-end flow with the actual AWQ model to ensure the output quality is high and the connection is stable.
- [ ] **Update `README.md`.** Add a "Local Performance" section pointing to this documentation.
