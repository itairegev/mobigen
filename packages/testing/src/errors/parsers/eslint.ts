/**
 * ESLint error parser
 *
 * Parses ESLint output into structured format
 */

export interface ESLintError {
  ruleId: string;
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  fixable: boolean;
}

export interface ESLintResult {
  filePath: string;
  messages: Array<{
    ruleId: string;
    severity: 1 | 2;
    message: string;
    line: number;
    column: number;
    fix?: {
      range: [number, number];
      text: string;
    };
  }>;
  errorCount: number;
  warningCount: number;
}

/**
 * Parse ESLint JSON output
 */
export function parseESLintJsonOutput(jsonOutput: string): ESLintError[] {
  try {
    const results: ESLintResult[] = JSON.parse(jsonOutput);
    const errors: ESLintError[] = [];

    for (const result of results) {
      for (const msg of result.messages) {
        errors.push({
          ruleId: msg.ruleId || 'unknown',
          file: result.filePath,
          line: msg.line,
          column: msg.column,
          message: msg.message,
          severity: msg.severity === 2 ? 'error' : 'warning',
          fixable: !!msg.fix,
        });
      }
    }

    return errors;
  } catch {
    return [];
  }
}

/**
 * Parse ESLint stylish output (default format)
 */
export function parseESLintStylishOutput(output: string): ESLintError[] {
  const errors: ESLintError[] = [];
  const lines = output.split('\n');

  // Pattern: "  12:5  error  'x' is not defined  no-undef"
  const errorRegex = /^\s*(\d+):(\d+)\s+(error|warning)\s+(.+?)\s{2,}(.+)$/;
  let currentFile = '';

  for (const line of lines) {
    // File header line (ends with .ts, .tsx, .js, .jsx)
    if (line.match(/\.(ts|tsx|js|jsx)$/)) {
      currentFile = line.trim();
      continue;
    }

    const match = line.match(errorRegex);
    if (match && currentFile) {
      const [, lineStr, colStr, severity, message, ruleId] = match;

      errors.push({
        ruleId,
        file: currentFile,
        line: parseInt(lineStr, 10),
        column: parseInt(colStr, 10),
        message,
        severity: severity as 'error' | 'warning',
        fixable: false,
      });
    }
  }

  return errors;
}

/**
 * Get error category from ESLint rule ID
 */
export function getESLintErrorCategory(ruleId: string): string {
  const categories: Record<string, string[]> = {
    'import': [
      'import/no-unresolved',
      'import/named',
      'import/default',
      'import/namespace',
    ],
    'react': [
      'react/jsx-no-undef',
      'react/jsx-key',
      'react/jsx-uses-vars',
      'react/prop-types',
      'react/no-unknown-property',
    ],
    'hooks': [
      'react-hooks/rules-of-hooks',
      'react-hooks/exhaustive-deps',
    ],
    'variables': [
      'no-undef',
      'no-unused-vars',
      '@typescript-eslint/no-unused-vars',
    ],
    'types': [
      '@typescript-eslint/no-explicit-any',
      '@typescript-eslint/explicit-function-return-type',
    ],
    'style': [
      'semi',
      'quotes',
      'indent',
      'comma-dangle',
    ],
  };

  for (const [category, rules] of Object.entries(categories)) {
    if (rules.includes(ruleId)) {
      return category;
    }
  }

  return 'unknown';
}

/**
 * Check if an ESLint error is auto-fixable
 */
export function isAutoFixable(ruleId: string): boolean {
  const autoFixableRules = [
    'semi',
    'quotes',
    'indent',
    'comma-dangle',
    'no-extra-semi',
    'no-trailing-spaces',
    'eol-last',
    '@typescript-eslint/no-unused-vars', // Can be fixed by removing
  ];

  return autoFixableRules.includes(ruleId);
}
