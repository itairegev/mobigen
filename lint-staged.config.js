module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    // Run ESLint with auto-fix
    'eslint --fix --max-warnings=0',
    // Format with Prettier
    'prettier --write',
  ],

  // JSON, Markdown, YAML files
  '*.{json,md,yml,yaml}': [
    'prettier --write',
  ],

  // TypeScript type checking
  // Note: This runs on all TS files to ensure type safety across the project
  '*.{ts,tsx}': () => 'pnpm typecheck',
};
