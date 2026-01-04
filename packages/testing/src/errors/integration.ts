/**
 * Integration helpers for using enhanced error messages in the validation pipeline
 */

import type { StageResult, ValidationError } from '../types';
import {
  processTypeScriptErrors,
  processESLintErrors,
  processMetroErrors,
  processExpoErrors,
  processReactNativeErrors,
  createEnhancedReport,
  type AIErrorReport,
  type AIFormattedError,
} from './index';

/**
 * Enhance validation errors from a stage result
 */
export async function enhanceStageErrors(
  stage: StageResult,
  projectRoot: string
): Promise<AIFormattedError[]> {
  if (!stage.output) {
    // No raw output, just convert ValidationErrors to AIFormattedErrors
    return stage.errors.map((error) => ({
      type: 'unknown' as const,
      severity: error.severity,
      file: error.file,
      line: error.line,
      column: error.column,
      message: error.message,
      code: error.rule,
      autoFixable: false,
    }));
  }

  // Process based on stage name
  switch (stage.name) {
    case 'typescript':
      return await processTypeScriptErrors(stage.output, projectRoot);

    case 'eslint':
      return await processESLintErrors(stage.output, projectRoot, false);

    case 'metro-bundle':
    case 'metro':
      return await processMetroErrors(stage.output, projectRoot);

    case 'expo-prebuild':
    case 'expo-doctor':
      return await processExpoErrors(stage.output, projectRoot);

    default:
      // Try to detect error type from output
      return await autoDetectAndProcess(stage.output, projectRoot);
  }
}

/**
 * Auto-detect error type from output and process accordingly
 */
async function autoDetectAndProcess(
  output: string,
  projectRoot: string
): Promise<AIFormattedError[]> {
  const errors: AIFormattedError[] = [];

  // Try each parser in order
  if (output.match(/\((\d+),(\d+)\):\s*error\s+TS\d+/)) {
    errors.push(...await processTypeScriptErrors(output, projectRoot));
  }

  if (output.match(/error|warning.*\d+:\d+/i)) {
    errors.push(...await processESLintErrors(output, projectRoot, false));
  }

  if (output.match(/unable to resolve|metro|bundler/i)) {
    errors.push(...await processMetroErrors(output, projectRoot));
  }

  if (output.match(/expo|prebuild|app\.json/i)) {
    errors.push(...await processExpoErrors(output, projectRoot));
  }

  if (output.match(/react|component|invariant/i)) {
    errors.push(...await processReactNativeErrors(output, projectRoot));
  }

  return errors;
}

/**
 * Create user-friendly error summary from stage results
 */
export async function createErrorSummary(
  stages: Record<string, StageResult>,
  projectRoot: string,
  format: 'console' | 'markdown' | 'json' = 'console'
): Promise<string> {
  const allErrors: AIFormattedError[] = [];

  for (const stage of Object.values(stages)) {
    if (!stage.passed) {
      const enhanced = await enhanceStageErrors(stage, projectRoot);
      allErrors.push(...enhanced);
    }
  }

  const report: AIErrorReport = {
    success: allErrors.length === 0,
    totalErrors: allErrors.filter((e) => e.severity === 'error').length,
    totalWarnings: allErrors.filter((e) => e.severity === 'warning').length,
    errors: allErrors,
    summary: createSummaryText(allErrors),
    timestamp: new Date().toISOString(),
    buildable: allErrors.filter((e) => e.severity === 'error').length === 0,
  };

  // Use existing formatters
  const { formatReportForConsole, formatReportAsMarkdown } = await import('./formatters/user');

  switch (format) {
    case 'console':
      return formatReportForConsole(report);
    case 'markdown':
      return formatReportAsMarkdown(report);
    case 'json':
      return JSON.stringify(report, null, 2);
  }
}

/**
 * Create summary text from errors
 */
function createSummaryText(errors: AIFormattedError[]): string {
  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  if (errors.length === 0) {
    return '✓ All validation checks passed';
  }

  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
  }

  return `✗ Found ${parts.join(', ')}`;
}

/**
 * Get actionable fixes from errors
 */
export function getActionableFixes(errors: AIFormattedError[]): {
  autoFixable: AIFormattedError[];
  manualFixes: AIFormattedError[];
  needsReview: AIFormattedError[];
} {
  const autoFixable = errors.filter((e) => e.autoFixable);
  const manualFixes = errors.filter(
    (e) => !e.autoFixable && e.suggestion?.action !== 'review'
  );
  const needsReview = errors.filter(
    (e) => !e.autoFixable && e.suggestion?.action === 'review'
  );

  return { autoFixable, manualFixes, needsReview };
}

/**
 * Generate fix instructions for AI
 */
export function generateFixInstructions(errors: AIFormattedError[]): string {
  if (errors.length === 0) {
    return 'No errors to fix.';
  }

  const lines: string[] = ['Please fix the following errors:', ''];

  // Group by file
  const byFile = errors.reduce((acc, error) => {
    (acc[error.file] = acc[error.file] || []).push(error);
    return acc;
  }, {} as Record<string, AIFormattedError[]>);

  for (const [file, fileErrors] of Object.entries(byFile)) {
    lines.push(`## ${file}`);
    lines.push('');

    for (const error of fileErrors) {
      const location = error.line ? `:${error.line}` : '';
      lines.push(`- **Line ${error.line || '?'}**: ${error.message}`);

      if (error.suggestion) {
        lines.push(`  - Fix: ${error.suggestion.description}`);
        if (error.suggestion.example) {
          lines.push(`  - Example: \`${error.suggestion.example}\``);
        }
      }

      if (error.context) {
        lines.push('  ```typescript');
        lines.push(error.context.split('\n').map(l => '  ' + l).join('\n'));
        lines.push('  ```');
      }

      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Check if errors are critical (block deployment)
 */
export function hasCriticalErrors(errors: AIFormattedError[]): boolean {
  // All errors with severity 'error' are critical
  return errors.some((e) => e.severity === 'error');
}

/**
 * Get error statistics
 */
export function getErrorStats(errors: AIFormattedError[]): {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  autoFixableCount: number;
} {
  const stats = {
    total: errors.length,
    byType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    autoFixableCount: 0,
  };

  for (const error of errors) {
    stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

    if (error.category) {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
    }

    if (error.autoFixable) {
      stats.autoFixableCount++;
    }
  }

  return stats;
}

/**
 * Convert ValidationError to enhanced error
 */
export async function enhanceValidationError(
  error: ValidationError,
  projectRoot: string
): Promise<AIFormattedError> {
  const { getCodeContext } = await import('./enrichers/context');
  const { getGenericSuggestion } = await import('./enrichers/suggestions');
  const { getContextualDocLinks } = await import('./enrichers/docs');

  const context = error.line
    ? await getCodeContext(error.file, error.line, projectRoot)
    : null;

  const suggestion = getGenericSuggestion(error.message);
  const docs = getContextualDocLinks(error.message, error.file);

  return {
    type: 'unknown',
    severity: error.severity,
    file: error.file,
    line: error.line,
    column: error.column,
    message: error.message,
    code: error.rule,
    suggestion: suggestion || undefined,
    context: context ? formatContext(context) : undefined,
    docs,
    autoFixable: suggestion?.autoFixable || false,
  };
}

/**
 * Format error context for display
 */
function formatContext(context: any): string {
  const { formatCodeContext } = require('./enrichers/context');
  return formatCodeContext(context);
}
