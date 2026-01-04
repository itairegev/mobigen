/**
 * AI formatter
 *
 * Formats errors for AI consumption (structured JSON)
 */

import { ErrorContext, formatCodeContext } from '../enrichers/context';
import { FixSuggestion } from '../enrichers/suggestions';
import { DocLink } from '../enrichers/docs';

export interface AIFormattedError {
  type: 'typescript' | 'eslint' | 'metro' | 'expo' | 'react-native' | 'unknown';
  severity: 'error' | 'warning';
  file: string;
  line?: number;
  column?: number;
  message: string;
  code?: string;
  suggestion?: FixSuggestion;
  context?: string;
  docs?: DocLink[];
  autoFixable: boolean;
  category?: string;
}

export interface AIErrorReport {
  success: boolean;
  totalErrors: number;
  totalWarnings: number;
  errors: AIFormattedError[];
  summary: string;
  timestamp: string;
  buildable: boolean;
}

/**
 * Format a single error for AI
 */
export function formatErrorForAI(
  error: {
    type: string;
    severity: string;
    file: string;
    line?: number;
    column?: number;
    message: string;
    code?: string;
  },
  enrichment: {
    suggestion?: FixSuggestion;
    context?: ErrorContext;
    docs?: DocLink[];
    category?: string;
  } = {}
): AIFormattedError {
  return {
    type: error.type as AIFormattedError['type'],
    severity: error.severity as 'error' | 'warning',
    file: error.file,
    line: error.line,
    column: error.column,
    message: error.message,
    code: error.code,
    suggestion: enrichment.suggestion,
    context: enrichment.context ? formatCodeContext(enrichment.context) : undefined,
    docs: enrichment.docs,
    autoFixable: enrichment.suggestion?.autoFixable || false,
    category: enrichment.category,
  };
}

/**
 * Create AI error report
 */
export function createAIErrorReport(errors: AIFormattedError[]): AIErrorReport {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  // Group errors by type for summary
  const byType = errors.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const parts: string[] = [];
  for (const [type, count] of Object.entries(byType)) {
    parts.push(`${count} ${type}`);
  }

  const summary = errors.length === 0
    ? '✓ No errors found'
    : `✗ Found ${errorCount} error${errorCount !== 1 ? 's' : ''}, ${warningCount} warning${warningCount !== 1 ? 's' : ''}: ${parts.join(', ')}`;

  return {
    success: errorCount === 0,
    totalErrors: errorCount,
    totalWarnings: warningCount,
    errors,
    summary,
    timestamp: new Date().toISOString(),
    buildable: errorCount === 0,
  };
}

/**
 * Format errors as structured JSON for AI
 */
export function formatForAI(report: AIErrorReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Create minimal error format for AI (less tokens)
 */
export function formatMinimalForAI(report: AIErrorReport): string {
  if (report.success) {
    return '{"success":true,"errors":[]}';
  }

  const minimalErrors = report.errors.map(e => ({
    f: e.file,
    l: e.line,
    m: e.message,
    s: e.suggestion?.description,
  }));

  return JSON.stringify({
    success: false,
    errors: minimalErrors,
  });
}

/**
 * Get AI prompt with errors
 */
export function createAIFixPrompt(report: AIErrorReport): string {
  if (report.success) {
    return 'Validation passed. No errors to fix.';
  }

  const errorDescriptions = report.errors
    .filter(e => e.severity === 'error')
    .slice(0, 10) // Limit to first 10 for token efficiency
    .map(e => {
      let desc = `- ${e.file}`;
      if (e.line) desc += `:${e.line}`;
      desc += ` - ${e.message}`;
      if (e.suggestion) desc += `\n  Fix: ${e.suggestion.description}`;
      return desc;
    })
    .join('\n');

  return `The following errors need to be fixed:

${errorDescriptions}

Please fix these errors while preserving the existing functionality.`;
}
