# Specification: Black-Box API Surface Reconstruction & Parameter Discovery

## 1. Objective
To automatically reconstruct the backend API surface and discover hidden parameters by analyzing deobfuscated client-side JavaScript bundles. This feature transforms `js-cartographer` into a powerful tool for security researchers who need to understand the backend attack surface without access to source maps or server-side code.

## 2. Background
Offensive security researchers need to understand the backend attack surface of a target application. JavaScript bundles often contain implicit knowledge of the API routes, methods, and parameters used to interact with the backend, but these are often obscured by transpilation and minification.

## 3. Goals
- **Automatic Reconstruction:** Identify all statically-defined and dynamic API routes from client-side JS.
- **Parameter Discovery:** Discover "hidden" or undocumented query and body parameters.
- **API Schema Generation:** Generate a structured "Virtual OpenAPI Spec" for the discovered surface.
- **Integrated Exploration:** Seamlessly integrate the discovered API surface into the Interactive Web Explorer for easy navigation and analysis.

## 4. User Personas
- **Security Researchers:** Mapping attack surfaces during penetration tests or bug hunts.
- **Reverse Engineers:** Deciphering API communication protocols in proprietary or hostile applications.

## 5. Functional Requirements
- **Route Synthesis:** Identify routes for common frameworks and routing libraries.
- **Parameter Analysis:** Resolve complex dynamic URLs and identify query/body parameters.
- **OpenAPI Export:** Export discovered surface as a valid OpenAPI 3.0 specification.
- **Visual Mapping:** Link discovered routes directly to the code that calls them.

## 6. Non-Functional Requirements
- **High Recall:** Aim for comprehensive discovery of the attack surface.
- **Precision:** Use LLM refinement to minimize false positives in complex dynamic URLs.
- **Transparency:** Clearly indicate the evidence (source code) for each discovered API artifact.

## 7. Architecture Overview
- **Routing Detectors:** Specialized detectors for libraries like `react-router`, `vue-router`, etc.
- **API Sink Analyzers:** Scanners for `fetch`, `axios`, `XHR` calls.
- **LLM Refiners:** Targeted LLM passes to resolve dynamic string logic and parameter schemas.
- **Exporter:** Generator for OpenAPI JSON/YAML.

## 8. Security & Safety
- **Read-Only Analysis:** Analysis is strictly static and does not involve executing the bundle.
- **Local Data Handling:** All data remains local unless explicitly exported by the user.