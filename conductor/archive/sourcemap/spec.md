# Specification: Sourcemap-Driven Truth Injection

## Objective
Enhance the accuracy and efficiency of Cartographer by utilizing provided `.js.map` (sourcemap) files. Sourcemaps act as a "source of truth" containing original variable and function names. The LLM must use these known names as contextual anchors to better deobfuscate the surrounding code, and crucially, the LLM must **never** modify these known names.

## Background & Motivation
Currently, Cartographer's LLM attempts to rename all non-ignored identifiers based on heuristics and surrounding code context. However, if a user has access to a partial or full sourcemap for the bundle (which is essentially the original source code mapping), we can significantly improve results. By pre-filling these known identifiers, we turn a fully blind deobfuscation task into a "fill in the blanks" exercise for the LLM. This not only improves accuracy for the remaining unmapped code but also reduces API costs by skipping already-identified symbols.

## Proposed Solution: "Truth Injection"
1. **Sourcemap Parsing**: Accept an optional `--sourcemap <path>` argument. If provided, parse the sourcemap using the `source-map` library.
2. **Identifier Locking**: Before the code is sent to the LLM for renaming, identify which variables/functions have mappings in the sourcemap.
3. **Pre-Renaming (Injection)**: Apply the original names from the sourcemap to the AST/code directly.
4. **LLM Prompt Constraint**: The LLM prompt MUST be explicitly updated to enforce that these "locked" identifiers are a strict source of truth. The LLM will be instructed to use them for context to understand the developer's intent but under no circumstances should it attempt to rename them.
5. **Selective Processing**: Only identifiers that do *not* have a sourcemap entry will be sent to the LLM for renaming.

## Core Constraints
* **Source of Truth**: Sourcemap entries are absolute. The system must not overwrite or ask the LLM to rename an identifier that has a valid sourcemap entry.
* **Contextual Anchors**: The LLM prompt must explicitly frame the locked identifiers as established context to aid in deducing the names of the remaining obfuscated variables.

## Scope & Impact
* **CLI Updates**: Add `--sourcemap` flag to relevant commands.
* **AST/Plugin Updates**: Modify the renaming pipeline (e.g., `src/plugins/local-llm-rename/visit-all-identifiers.ts` and the main LLM prompts) to support a "locked" state for identifiers.
* **New Module**: Create a service to parse sourcemaps and map them to the extracted file chunks from `webcrack`.