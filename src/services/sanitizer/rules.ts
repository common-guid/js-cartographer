/**
 * The specific Wakaru transformation rules enabled for Phase 2.
 * These focus on Structural Restoration (fixing compiler artifacts)
 * and Readability (making code scanable).
 */
export const SANITIZER_RULES: string[] = [
  // --- 1. STRUCTURAL RESTORATION (The Heavy Lifting) ---
  "un-async-await", // Critical: Restores async/await from generator state machines
  "un-jsx", // Critical: Restores <div /> from React.createElement()
  "un-es6-class", // Critical: Restores class MyClass {} from prototype assignments

  // --- 2. SYNTAX MODERNIZATION ---
  "un-optional-chaining", // Restores object?.prop
  "un-nullish-coalescing", // Restores value ?? default
  "un-template-literals", // Restores `string ${var}`

  // --- 3. READABILITY CLEANUP ---
  "un-sequence-expression", // Splits "a=1, b=2" into separate lines. Vital for LLMs.
  "un-variable-merging", // Un-merges unrelated "var a, b, c" declarations.
  "un-curly-braces", // Adds { } to single-line if-statements.
  "un-flip-comparisons" // Fixes Yoda conditions (null == a -> a == null)
];
