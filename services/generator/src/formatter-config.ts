/**
 * Configuration for code formatting in exported projects
 */

import type { Options as PrettierOptions } from 'prettier';

/**
 * Default Prettier configuration for exported code
 * Optimized for React Native and TypeScript projects
 */
export const DEFAULT_PRETTIER_CONFIG: PrettierOptions = {
  // Print width - reasonable for mobile development
  printWidth: 100,

  // Use 2 spaces for indentation (React Native standard)
  tabWidth: 2,
  useTabs: false,

  // Use single quotes for strings (matches most React Native projects)
  singleQuote: true,

  // Add semicolons at the end of statements
  semi: true,

  // Use trailing commas where valid in ES5 (objects, arrays, etc.)
  trailingComma: 'es5',

  // Print spaces between brackets in object literals
  bracketSpacing: true,

  // Put the > of a multi-line JSX element at the end of the last line
  bracketSameLine: false,

  // Include parentheses around a sole arrow function parameter
  arrowParens: 'always',

  // End of line character (LF for cross-platform compatibility)
  endOfLine: 'lf',

  // Format embedded code (e.g., in markdown or HTML)
  embeddedLanguageFormatting: 'auto',

  // Respect .prettierignore files
  ignorePath: '.prettierignore',
};

/**
 * ESLint configuration for exported code
 * Focuses on code quality and best practices
 */
export const DEFAULT_ESLINT_CONFIG = {
  root: true,
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    // TypeScript-specific rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // React-specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in React Native
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // General code quality
    'no-console': 'off', // Allow console logs in mobile apps
    'prefer-const': 'warn',
    'no-var': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

/**
 * Files to ignore during formatting
 */
export const PRETTIER_IGNORE_PATTERNS = [
  // Dependencies
  'node_modules/**',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',

  // Build outputs
  'dist/**',
  'build/**',
  '.expo/**',
  'android/**',
  'ios/**',
  '.next/**',

  // Generated files
  '*.generated.*',
  'coverage/**',
  '.turbo/**',

  // Config files that shouldn't be formatted
  '.vscode/**',
  '.idea/**',
];

/**
 * File type to formatter mapping
 */
export const FILE_TYPE_FORMATTERS: Record<string, 'prettier' | 'eslint' | 'both' | 'none'> = {
  // TypeScript/JavaScript files - use both
  '.ts': 'both',
  '.tsx': 'both',
  '.js': 'both',
  '.jsx': 'both',

  // JSON files - use prettier
  '.json': 'prettier',
  '.jsonc': 'prettier',

  // Markdown - use prettier
  '.md': 'prettier',
  '.mdx': 'prettier',

  // YAML - use prettier
  '.yml': 'prettier',
  '.yaml': 'prettier',

  // CSS/Styling - use prettier
  '.css': 'prettier',
  '.scss': 'prettier',
  '.less': 'prettier',

  // GraphQL - use prettier
  '.graphql': 'prettier',
  '.gql': 'prettier',

  // HTML - use prettier
  '.html': 'prettier',

  // Don't format these
  '.lock': 'none',
  '.log': 'none',
  '.png': 'none',
  '.jpg': 'none',
  '.jpeg': 'none',
  '.gif': 'none',
  '.svg': 'none',
  '.ico': 'none',
  '.ttf': 'none',
  '.woff': 'none',
  '.woff2': 'none',
  '.eot': 'none',
};

/**
 * Get the appropriate formatter for a file based on its extension
 */
export function getFormatterForFile(filePath: string): 'prettier' | 'eslint' | 'both' | 'none' {
  const extension = filePath.substring(filePath.lastIndexOf('.'));
  return FILE_TYPE_FORMATTERS[extension] || 'none';
}

/**
 * Check if a file should be formatted
 */
export function shouldFormatFile(filePath: string): boolean {
  // Check against ignore patterns
  for (const pattern of PRETTIER_IGNORE_PATTERNS) {
    // Simple pattern matching (can be enhanced with minimatch if needed)
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');

    if (new RegExp(regexPattern).test(filePath)) {
      return false;
    }
  }

  const formatter = getFormatterForFile(filePath);
  return formatter !== 'none';
}

/**
 * ESLint rules to apply during --fix
 */
export const ESLINT_FIX_RULES = [
  'indent',
  'quotes',
  'semi',
  'comma-dangle',
  'no-trailing-spaces',
  'eol-last',
  'no-multiple-empty-lines',
  '@typescript-eslint/no-unused-vars',
];
