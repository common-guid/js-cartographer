# Specification: Qwen3-Coder-30B-A3B Integration

## Overview
Integrate the `Qwen3-Coder-30B-A3B-Instruct` model from Alibaba's Qwen series into the `js-cartographer` local unminification pipeline. This model is a Mixture-of-Experts (MoE) specialized for coding tasks, offering superior deobfuscation capabilities compared to existing 2B/8B models.

## Goals
- Add `Qwen3-Coder-30B-A3B-Instruct` as a selectable model for the `local` command.
- Provide a seamless download experience via `cartographer download 30b`.
- Ensure the model's GBNF-constrained prompting works correctly with its specific architecture.

## Model Details
- **Source:** `unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF`
- **File:** `Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf`
- **Quantization:** Q4_K_M (4-bit, ~18.6 GB)
- **Architecture:** Mixture-of-Experts (MoE)
- **Key Features:** 256K context window, agentic coding specialization.

## Technical Requirements
- **Format:** GGUF (required for `node-llama-cpp`).
- **RAM/VRAM:** ~19GB minimum for full offload; system RAM fallback for partial offload.
- **Dependencies:** May require an update to `node-llama-cpp` to support the `qwen3_moe` architecture if not already present.

## User Interface
- Command: `cartographer download 30b`
- Usage: `cartographer local <input> --model 30b`
