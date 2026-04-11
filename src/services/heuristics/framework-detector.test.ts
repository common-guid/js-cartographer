import assert from "assert";
import test from "node:test";
import { detectFrameworks } from "./framework-detector.js";
import { buildFrameworkPrompt, FRAMEWORK_RULES } from "../../plugins/prompts/framework-rules.js";

// ---------------------------------------------------------------------------
// detectFrameworks — React
// ---------------------------------------------------------------------------

test("detects React via ESM default import", async () => {
  const code = `import React from 'react'; function App() { return null; }`;
  const result = await detectFrameworks(code);
  assert.ok(result.includes("react"), "expected 'react' to be detected");
});

test("detects React via named ESM import", async () => {
  const code = `import { useState, useEffect } from 'react';`;
  const result = await detectFrameworks(code);
  assert.ok(result.includes("react"));
});

test("detects React via react-dom ESM import", async () => {
  const code = `import ReactDOM from 'react-dom';`;
  const result = await detectFrameworks(code);
  assert.ok(result.includes("react"));
});

test("detects React via CJS require", async () => {
  const code = `var React = require('react');`;
  const result = await detectFrameworks(code);
  assert.ok(result.includes("react"));
});

test("detects React via CJS require of react-dom", async () => {
  const code = `var ReactDOM = require('react-dom');`;
  const result = await detectFrameworks(code);
  assert.ok(result.includes("react"));
});

test("detects React via React.createElement (transpiled JSX)", async () => {
  const code = `
    var App = function App() {
      return React.createElement('div', null, React.createElement('span', null, 'hello'));
    };
  `;
  const result = await detectFrameworks(code);
  assert.ok(result.includes("react"));
});

// ---------------------------------------------------------------------------
// detectFrameworks — Express
// ---------------------------------------------------------------------------

test("detects Express via ESM default import", async () => {
  const code = `import express from 'express'; const app = express();`;
  const result = await detectFrameworks(code);
  assert.ok(result.includes("express"));
});

test("detects Express via CJS require", async () => {
  const code = `var express = require('express'); var app = express();`;
  const result = await detectFrameworks(code);
  assert.ok(result.includes("express"));
});

// ---------------------------------------------------------------------------
// detectFrameworks — multi-framework
// ---------------------------------------------------------------------------

test("detects both React and Express in the same file", async () => {
  const code = `
    var React = require('react');
    var express = require('express');
    var app = express();
  `;
  const result = await detectFrameworks(code);
  assert.ok(result.includes("react"), "should detect react");
  assert.ok(result.includes("express"), "should detect express");
  assert.strictEqual(result.length, 2);
});

// ---------------------------------------------------------------------------
// detectFrameworks — no framework
// ---------------------------------------------------------------------------

test("returns empty array for plain JS with no frameworks", async () => {
  const code = `
    function add(a, b) { return a + b; }
    console.log(add(1, 2));
  `;
  const result = await detectFrameworks(code);
  assert.deepStrictEqual(result, []);
});

test("returns empty array for empty string", async () => {
  const result = await detectFrameworks("");
  assert.deepStrictEqual(result, []);
});

test("returns empty array (does not throw) for invalid/unparseable JS", async () => {
  const result = await detectFrameworks("this is not javascript ><><><");
  assert.deepStrictEqual(result, []);
});

test("does NOT detect unrelated require calls", async () => {
  const code = `var fs = require('fs'); var path = require('path');`;
  const result = await detectFrameworks(code);
  assert.deepStrictEqual(result, []);
});

// ---------------------------------------------------------------------------
// buildFrameworkPrompt
// ---------------------------------------------------------------------------

test("buildFrameworkPrompt returns empty string for empty array", () => {
  assert.strictEqual(buildFrameworkPrompt([]), "");
});

test("buildFrameworkPrompt returns empty string for unknown frameworks", () => {
  assert.strictEqual(buildFrameworkPrompt(["angular", "svelte"]), "");
});

test("buildFrameworkPrompt includes React rules when react is detected", () => {
  const result = buildFrameworkPrompt(["react"]);
  assert.ok(result.includes("React Framework Context"));
  assert.ok(result.includes("PascalCase"));
  assert.ok(result.includes("useState"));
});

test("buildFrameworkPrompt includes Express rules when express is detected", () => {
  const result = buildFrameworkPrompt(["express"]);
  assert.ok(result.includes("Express/Node.js Framework Context"));
  assert.ok(result.includes("req, res, next"));
});

test("buildFrameworkPrompt combines rules for multiple frameworks", () => {
  const result = buildFrameworkPrompt(["react", "express"]);
  assert.ok(result.includes("React Framework Context"));
  assert.ok(result.includes("Express/Node.js Framework Context"));
});

test("FRAMEWORK_RULES contains entries for react and express", () => {
  assert.ok("react" in FRAMEWORK_RULES);
  assert.ok("express" in FRAMEWORK_RULES);
});
