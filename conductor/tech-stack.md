# JS Cartographer (cartographerjs) Tech Stack

## Programming Languages
- **TypeScript:** Main language for CLI and frontend.

## Runtime & Platform
- **Node.js:** Core runtime environment.

## Frontend Development
- **React:** UI library for the Interactive Web Explorer.
- **Tailwind CSS:** Utility-first CSS framework for styling.
- **Vite:** Build tool and dev server for the frontend.
- **React Flow:** Used for interactive graph visualization.

## Core Deobfuscation & Analysis
- **Babel:** Used for AST parsing and transformations.
- **Wakaru:** Integrated for static structural restoration and heuristic renaming.
- **Webcrack:** Used for unbundling webpack and other formats.

## LLM Integration
- **OpenAI:** API-based model support.
- **Google Gemini:** API-based model support.
- **OpenRouter:** Multi-model API bridge support.
- **Local Llama (via node-llama-cpp):** Fully local GGUF model execution.

## Infrastructure & Tooling
- **pkgroll:** Build tool for the CLI binary.
- **tsx:** TypeScript execution for development and testing.
- **Node.js Test Runner:** Unit and E2E testing framework.
- **ESLint & Prettier:** Code quality and formatting.
- **GitHub Actions:** CI/CD for testing and releases.