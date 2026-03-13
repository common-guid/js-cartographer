/**
 * Basic arithmetic and geometry utilities.
 * Ground truth: these function names should be recoverable by JS Cartographer.
 */

export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

export function calculateCircleArea(radius) {
  return multiply(Math.PI, multiply(radius, radius));
}

export function clampValue(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
