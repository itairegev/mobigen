/**
 * Enhanced Error Messages
 *
 * Transforms cryptic errors into actionable messages with context and suggestions.
 */

// Parsers
export * from './parsers';

// Enrichers
export * from './enrichers';

// Formatters
export * from './formatters';

import {
  parseTypeScriptOutput,
  TypeScriptError,
  getErrorCategory as getTSCategory,
  getErrorSeverityLevel,
} from './parsers/typescript';

import {
  parseESLintJsonOutput,
  parseESLintStylishOutput,
  ESLintError,
  getESLintErrorCategory,
} from './parsers/eslint';

import { parseMetroOutput, MetroError } from './parsers/metro';

import {
  getCodeContext,
  getCodeContextWithPointer,
  ErrorContext,
} from './enrichers/context';

import {
  getTypeScriptSuggestion,
  getESLintSuggestion,
  getGenericSuggestion,
  FixSuggestion,
} from './enrichers/suggestions';

import {
  getTypeScriptDocLinks,
  getESLintDocLinks,
  getContextualDocLinks,
  DocLink,
} from './enrichers/docs';

import {
  formatErrorForAI,
  createAIErrorReport,
  AIFormattedError,
  AIErrorReport,
} from './formatters/ai';

import { formatReportForConsole, formatReportAsMarkdown } from './formatters/user';

/**
 * Raw error from any source
 */
export interface RawError {
  source: 'typescript' | 'eslint' | 'metro';
  rawOutput: string;
}

/**
 * Process TypeScript errors with enrichment
 */
export async function processTypeScriptErrors(
  output: string,
  projectRoot: string
): Promise<AIFormattedError[]> {
  const parsed = parseTypeScriptOutput(output);
  const enriched: AIFormattedError[] = [];

  for (const error of parsed) {
    const context = await getCodeContextWithPointer(
      error.file,
      error.line,
      error.column,
      projectRoot
    );

    const suggestion = getTypeScriptSuggestion(error.code, error.message);
    const docs = getTypeScriptDocLinks(error.code);
    const category = getTSCategory(error.code);

    enriched.push(
      formatErrorForAI(
        {
          type: 'typescript',
          severity: error.severity,
          file: error.file,
          line: error.line,
          column: error.column,
          message: error.message,
          code: error.code,
        },
        { suggestion: suggestion || undefined, context: context || undefined, docs, category }
      )
    );
  }

  return enriched;
}

/**
 * Process ESLint errors with enrichment
 */
export async function processESLintErrors(
  output: string,
  projectRoot: string,
  isJson: boolean = true
): Promise<AIFormattedError[]> {
  const parsed = isJson
    ? parseESLintJsonOutput(output)
    : parseESLintStylishOutput(output);

  const enriched: AIFormattedError[] = [];

  for (const error of parsed) {
    const context = await getCodeContext(error.file, error.line, projectRoot);
    const suggestion = getESLintSuggestion(error.ruleId);
    const docs = getESLintDocLinks(error.ruleId);
    const category = getESLintErrorCategory(error.ruleId);

    enriched.push(
      formatErrorForAI(
        {
          type: 'eslint',
          severity: error.severity,
          file: error.file,
          line: error.line,
          column: error.column,
          message: error.message,
          code: error.ruleId,
        },
        { suggestion: suggestion || undefined, context: context || undefined, docs, category }
      )
    );
  }

  return enriched;
}

/**
 * Process Metro errors with enrichment
 */
export async function processMetroErrors(
  output: string,
  projectRoot: string
): Promise<AIFormattedError[]> {
  const parsed = parseMetroOutput(output);
  const enriched: AIFormattedError[] = [];

  for (const error of parsed) {
    const context = error.line
      ? await getCodeContext(error.file, error.line, projectRoot)
      : null;

    const suggestion = getGenericSuggestion(error.message);
    const docs = getContextualDocLinks(error.message, error.file);

    enriched.push(
      formatErrorForAI(
        {
          type: 'metro',
          severity: 'error',
          file: error.file,
          line: error.line,
          column: error.column,
          message: error.message,
        },
        { suggestion: suggestion || undefined, context: context || undefined, docs, category: error.type }
      )
    );
  }

  return enriched;
}

/**
 * Process all errors from multiple sources
 */
export async function processAllErrors(
  errors: RawError[],
  projectRoot: string
): Promise<AIErrorReport> {
  const allErrors: AIFormattedError[] = [];

  for (const error of errors) {
    switch (error.source) {
      case 'typescript':
        allErrors.push(...await processTypeScriptErrors(error.rawOutput, projectRoot));
        break;
      case 'eslint':
        allErrors.push(...await processESLintErrors(error.rawOutput, projectRoot));
        break;
      case 'metro':
        allErrors.push(...await processMetroErrors(error.rawOutput, projectRoot));
        break;
    }
  }

  return createAIErrorReport(allErrors);
}

/**
 * Create enhanced error report for display
 */
export async function createEnhancedReport(
  errors: RawError[],
  projectRoot: string,
  format: 'console' | 'markdown' | 'json' = 'console'
): Promise<string> {
  const report = await processAllErrors(errors, projectRoot);

  switch (format) {
    case 'console':
      return formatReportForConsole(report);
    case 'markdown':
      return formatReportAsMarkdown(report);
    case 'json':
      return JSON.stringify(report, null, 2);
  }
}
