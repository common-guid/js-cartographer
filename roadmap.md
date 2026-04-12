# JS Cartographer: Future Roadmap

This roadmap outlines the evolution of JS Cartographer from a core unbundler to a sophisticated security research platform.

## ✅ Completed Features
These features have been successfully implemented and verified through Conductor tracks.

- [x] **Sourcemap-Driven Truth Injection**: Use `.js.map` files to provide locked identifiers for the LLM, significantly improving accuracy.
- [x] **Batch Directory Processing**: Automatically reconstruct entire projects from directories of chunks and sourcemaps.
- [x] **Framework-Aware Context & Heuristics**: Detect React, Express, etc., to inject idiomatic naming conventions into LLM prompts.
- [x] **Interactive Web-based "Cartography" Explorer**: Dual-pane GUI for navigating recovered source code alongside module and call graphs.
- [x] **Black-Box API Surface Reconstruction**: Automatically build Virtual OpenAPI specs from client-side code analysis.

---

## 🚀 Active Conductor Tracks
These features are currently under active development.

### 1. Rate-Limit Resilience (Resume + Key Rotation)
**Effort:** Medium
**Objective:** Handle large-scale deobfuscation without crashing on API limits.
- **[ACTIVE] State File Tracking:** Maintain a cache to resume interrupted runs without re-processing completed chunks.
- **[ACTIVE] API Key Rotation:** Support multiple API keys with round-robin rotation and automatic failover on 429 errors.

### 2. Automated "Taint-to-Sink" Mapping
**Effort:** Very High
**Objective:** Trace sensitive data from user-controlled "sources" to dangerous "sinks" using LLM-augmented flow analysis.
- **[ACTIVE] Sink/Source Identification:** Labeling browser sinks (`eval`, `innerHTML`) and sources (`location.hash`).
- **[ACTIVE] Cross-Module Flow:** Tracking data movement across modules via the recovered call graph.

### 3. Qwen3-Coder Local Model Integration
**Effort:** Medium
**Objective:** Integrate the latest Qwen3-Coder models (30B-A3B) for high-performance local deobfuscation.
- **[PLANNED] GGUF Integration:** native support for Qwen3-Coder weights.
- **[PLANNED] Advanced Path:** High-performance inference via AWQ/vLLM for users with dedicated hardware.

### 4. Continuous Quality & Testing Suite
**Effort:** Low-Medium
**Objective:** Consolidate quality gates and automated benchmarking.
- **[ACTIVE] Merge Quality Suite:** Finalizing the automated accuracy scoring system.

---

## 🔮 Future Directions
Potential directions for future research.

### 1. Semantic "Security Logic" Tagging
**Effort:** High
**Objective:** Use LLMs to categorize logic as "Auth Check," "Permission Logic," or "Crypto," allowing researchers to focus on critical attack surfaces.

### 2. Dynamic Analysis & Runtime-Assisted Naming
**Effort:** Extreme
**Objective:** Use instrumented execution (sandboxing) to observe variable values at runtime, providing "ground truth" labels for the LLM renamer.

---

## Effort Ranking (Highest to Lowest)

1. **Dynamic Analysis & Runtime-Assisted Naming**
2. **Automated "Taint-to-Sink" Mapping**
3. **Semantic "Security Logic" Tagging**
4. **Rate-Limit Resilience (Resume + Key Rotation)**
5. **Qwen3-Coder Local Model Integration**
6. **Continuous Quality & Testing Suite**
