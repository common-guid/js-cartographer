# Specification: Advanced Path - High-Performance Local Inference

## Overview
Enable high-performance local unminification using the `Qwen3-Coder-30B-A3B-Instruct-AWQ-4bit` model via an external inference server (e.g., `vLLM` or `Ollama`). This "Advanced Path" targets users with high-end NVIDIA GPUs who want maximum speed and accuracy without GGUF conversion.

## Goals
- Support the `Qwen3-Coder-30B-A3B-Instruct-AWQ-4bit` model through its native AWQ format.
- Leverage `vLLM` as a local backend via the OpenAI-compatible API.
- Validate that the existing `openai` command and `openaiRename` plugin correctly interact with this specific model.
- Document a reproducible "Recipe" for users to set up this high-performance environment.

## Model Details
- **Source:** `cyankiwi/Qwen3-Coder-30B-A3B-Instruct-AWQ-4bit`
- **Format:** AWQ (4-bit, ~16.9 GB)
- **Backend Recommended:** `vLLM` (v0.5.0+) or `AutoAWQ`.
- **Target Hardware:** NVIDIA GPUs with 24GB+ VRAM (RTX 3090/4090).

## Technical Requirements
- Use the `cartographer openai` command as the entry point.
- Ensure `openaiRename` provides high-quality prompts compatible with the Qwen3 series.
- Provide a clear mapping of `--baseURL` and `--apiKey none` for local server connection.
