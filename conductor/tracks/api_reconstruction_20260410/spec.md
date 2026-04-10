# Specification: Black-Box API Surface Reconstruction & Parameter Discovery

## Background
Offensive security researchers need to understand the backend attack surface of a target application. JavaScript bundles often contain implicit knowledge of the API routes, methods, and parameters used to interact with the backend.

## Goals
- Automatically reconstruct the backend API surface from deobfuscated client-side JavaScript.
- Discover "hidden" or undocumented query and body parameters.
- Generate a structured "Virtual OpenAPI Spec" for the discovered surface.
- Integrate the discovered API surface into the Interactive Web Explorer for easy navigation.

## Functional Requirements
- **Route Synthesis:** Identify all statically-defined and dynamic API routes.
- **Parameter Discovery:** Resolve complex dynamic URLs and identify query/body parameters.
- **API Schema Generation:** Output a structured OpenAPI 3.0 representation of the discovered surface.
- **Explorer Integration:** Provide a dedicated view for exploring the discovered API surface in the web UI.

## Non-Functional Requirements
- **High Recall:** Aim to identify as much of the attack surface as possible.
- **Low Noise:** Minimize false positives in route and parameter discovery.
- **Transparency:** Clearly link discovered API artifacts back to their source code origins.