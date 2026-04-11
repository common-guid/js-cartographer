/**
 * Per-framework naming convention rules that are injected into LLM prompts
 * whenever the FrameworkDetector identifies a known framework in the source.
 *
 * Each entry is a self-contained prompt section (markdown-formatted) that
 * extends the generic rename instructions with idiomatic naming guidance.
 */
export const FRAMEWORK_RULES: Record<string, string> = {
  react: `
### React Framework Context
This code is part of a React application. Apply these additional naming conventions:
- **Components**: Functions that return JSX/React elements MUST be PascalCase (e.g. \`UserCard\`, \`NavBar\`, \`LoginForm\`).
- **Hooks**: Custom hook functions MUST be prefixed with \`use\` (e.g. \`useState\`, \`useEffect\`, \`useFetchUser\`).
- **State pairs**: Destructured arrays from \`useState\`-like hooks follow the \`[value, setValue]\` pattern (e.g. \`[count, setCount]\`, \`[user, setUser]\`, \`[isOpen, setIsOpen]\`).
- **Event handlers**: Functions that handle DOM events are prefixed with \`handle\` or \`on\` (e.g. \`handleClick\`, \`handleSubmit\`, \`onClose\`).
- **Props**: The props parameter of a component function is named \`props\` (or individually destructured).`,

  express: `
### Express/Node.js Framework Context
This code is part of an Express.js application. Apply these additional naming conventions:
- **Route handlers**: HTTP handler parameters follow the \`(req, res, next)\` pattern — use these exact names.
- **App instance**: The Express application object is named \`app\`.
- **Router instance**: An Express Router object is named \`router\`.
- **Middleware**: Middleware factory functions describe their purpose (e.g. \`authMiddleware\`, \`errorHandler\`, \`requestLogger\`, \`corsMiddleware\`).`
};

/**
 * Builds the framework-specific prompt suffix for the given list of detected
 * frameworks.  Returns an empty string when no matching rules exist so callers
 * can safely append without adding blank lines.
 */
export function buildFrameworkPrompt(frameworks: string[]): string {
  return frameworks
    .filter((f) => f in FRAMEWORK_RULES)
    .map((f) => FRAMEWORK_RULES[f])
    .join("\n");
}
