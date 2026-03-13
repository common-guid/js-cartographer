# webpack-hello-world — JS Cartographer Test Fixture

A small webpack application with **known source code**, used as a ground truth to validate JS Cartographer's deobfuscation pipeline.

## Purpose

This fixture lets you answer the question: *"Given a webpack bundle, how accurately does JS Cartographer recover the original code?"*

The workflow is:
1. The **source files** (`src/`) are the ground truth — meaningful names, readable structure.
2. Webpack + Babel (IE11 target) produces `dist/bundle.js` — minified, obfuscated, with single-letter variable names.
3. Run JS Cartographer against `dist/bundle.js`.
4. Compare the recovered output against the original `src/` files.

## Source Structure

```
src/
├── math.js        — Pure utility functions (add, multiply, calculateCircleArea, clampValue)
├── greeting.js    — Greeting helpers + GreetingFormatter class; imports from math.js
├── api.js         — Async fetch simulation (fetchUserData, processUserData, fetchMultipleUsers); imports from math.js
└── app.js         — Entry point; imports from all three modules
```

## What Each File Tests

| File | Wakaru Rules Exercised | Feature |
|---|---|---|
| `math.js` | `un-numeric-literal`, `smart-rename` | Pure functions, cross-file import source |
| `greeting.js` | `un-es6-class`, `un-template-literals` | Class → prototype pattern restoration |
| `api.js` | `un-async-await` | Generator state machine → async/await restoration |
| `app.js` | All of the above | Full call graph: 5+ cross-file edges |

## Expected Call Graph (Ground Truth)

```
app.js:initApp
├── greeting.js:formatGreeting
│   └── math.js:add
│   └── greeting.js:getTimeOfDay
├── math.js:calculateCircleArea
│   └── math.js:multiply
├── api.js:processUserData
│   ├── api.js:fetchUserData
│   └── math.js:clampValue
└── api.js:fetchMultipleUsers
    └── api.js:fetchUserData

app.js:displayResults
└── greeting.js:GreetingFormatter.formatFormal
```

## How to Use as a Validation Target

```bash
# From the JS Cartographer root:
npx humanify openai fixtures/webpack-hello-world/dist/bundle.js -o /tmp/cartographer-out

# Then compare recovered names against src/
diff fixtures/webpack-hello-world/src/ /tmp/cartographer-out/
```

## Rebuild the Bundle

The pre-built `dist/bundle.js` is committed so you can run JS Cartographer without building first. To rebuild after source changes:

```bash
cd fixtures/webpack-hello-world
npm install
npm run build
```

The build uses:
- **webpack 5** in production mode (Terser minification + tree shaking)
- **Babel** with `@babel/preset-env` targeting IE11 — this forces:
  - `async/await` → generator state machines (`_asyncToGenerator`)
  - `class` syntax → prototype-chain functions
  - Template literals → string concatenation
  - Arrow functions → regular functions
