# Specification: DOM Source/Sink Discovery

## Objective
Identify and catalog security-sensitive DOM sources (user-controlled inputs) and sinks (dangerous execution points) in JavaScript code.

## Requirements
1.  **Source Cataloging:** Identify `location.hash`, `URLSearchParams`, `window.name`, `postMessage`, `localStorage`, `cookies`.
2.  **Sink Cataloging:** Identify `eval`, `setTimeout` (string arg), `setInterval` (string arg), `dangerouslySetInnerHTML`, `document.write`, `fetch`/`XHR`.
3.  **AST Detection:** Implement a Babel-based scanner to find these identifiers and calls.
4.  **Reporting:** Output a structured list of discovered sources and sinks with their source locations.
