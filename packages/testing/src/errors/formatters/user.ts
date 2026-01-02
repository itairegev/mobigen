/**
 * User formatter
 *
 * Formats errors for human-readable display (markdown/console)
 */

import { AIFormattedError, AIErrorReport } from './ai';
import { formatDocLinks, DocLink } from '../enrichers/docs';

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

/**
 * Format a single error for console display
 */
export function formatErrorForConsole(error: AIFormattedError): string {
  const lines: string[] = [];

  // Header with severity color
  const severityColor = error.severity === 'error' ? colors.red : colors.yellow;
  const icon = error.severity === 'error' ? '✗' : '⚠';

  lines.push(`${severityColor}${icon} ${error.type.toUpperCase()}${colors.reset}`);

  // Location
  let location = `  ${colors.bold}${error.file}${colors.reset}`;
  if (error.line) {
    location += `:${error.line}`;
    if (error.column) location += `:${error.column}`;
  }
  lines.push(location);

  // Message
  lines.push(`  ${error.message}`);
  if (error.code) {
    lines.push(`  ${colors.gray}(${error.code})${colors.reset}`);
  }

  // Code context
  if (error.context) {
    lines.push('');
    lines.push(`${colors.gray}${error.context}${colors.reset}`);
  }

  // Suggestion
  if (error.suggestion) {
    lines.push('');
    lines.push(`  ${colors.green}💡 ${error.suggestion.description}${colors.reset}`);
    if (error.suggestion.example) {
      lines.push(`  ${colors.gray}   Example: ${error.suggestion.example}${colors.reset}`);
    }
    if (error.autoFixable) {
      lines.push(`  ${colors.blue}   ⚡ Auto-fixable${colors.reset}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format error report for console display
 */
export function formatReportForConsole(report: AIErrorReport): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(`${'═'.repeat(60)}`);

  if (report.success) {
    lines.push(`${colors.green}${colors.bold}✓ All checks passed!${colors.reset}`);
  } else {
    lines.push(`${colors.red}${colors.bold}${report.summary}${colors.reset}`);
  }

  lines.push(`${'═'.repeat(60)}`);
  lines.push('');

  // Errors
  for (const error of report.errors) {
    lines.push(formatErrorForConsole(error));
    lines.push('');
  }

  // Footer
  if (!report.success) {
    lines.push(`${'-'.repeat(60)}`);
    lines.push(`${report.totalErrors} error(s), ${report.totalWarnings} warning(s)`);

    if (report.errors.some(e => e.autoFixable)) {
      const autoFixCount = report.errors.filter(e => e.autoFixable).length;
      lines.push(`${colors.blue}${autoFixCount} error(s) can be auto-fixed${colors.reset}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format error report as markdown
 */
export function formatReportAsMarkdown(report: AIErrorReport): string {
  const lines: string[] = [];

  // Header
  if (report.success) {
    lines.push('## ✅ Validation Passed\n');
    lines.push('No errors found. The code is ready to build.\n');
    return lines.join('\n');
  }

  lines.push('## ❌ Validation Failed\n');
  lines.push(`**Summary:** ${report.summary}\n`);

  // Group errors by file
  const byFile = report.errors.reduce((acc, e) => {
    (acc[e.file] = acc[e.file] || []).push(e);
    return acc;
  }, {} as Record<string, AIFormattedError[]>);

  for (const [file, fileErrors] of Object.entries(byFile)) {
    lines.push(`### \`${file}\`\n`);

    for (const error of fileErrors) {
      const icon = error.severity === 'error' ? '🔴' : '🟡';
      const location = error.line ? `Line ${error.line}` : '';
      const code = error.code ? ` \`${error.code}\`` : '';

      lines.push(`${icon} **${location}**${code}`);
      lines.push(`> ${error.message}\n`);

      if (error.suggestion) {
        lines.push(`💡 **Suggestion:** ${error.suggestion.description}`);
        if (error.suggestion.example) {
          lines.push(`\`\`\`typescript\n${error.suggestion.example}\n\`\`\``);
        }
        lines.push('');
      }

      if (error.context) {
        lines.push('```typescript');
        lines.push(error.context);
        lines.push('```\n');
      }
    }
  }

  // Auto-fix summary
  const autoFixable = report.errors.filter(e => e.autoFixable);
  if (autoFixable.length > 0) {
    lines.push('---\n');
    lines.push(`### ⚡ Auto-Fixable Errors (${autoFixable.length})\n`);
    for (const error of autoFixable) {
      lines.push(`- \`${error.file}\`: ${error.message}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format single error as markdown
 */
export function formatErrorAsMarkdown(error: AIFormattedError): string {
  const lines: string[] = [];

  const icon = error.severity === 'error' ? '🔴' : '🟡';
  lines.push(`${icon} **${error.file}**`);

  if (error.line) {
    lines.push(`Line ${error.line}${error.column ? `:${error.column}` : ''}`);
  }

  lines.push(`> ${error.message}`);

  if (error.code) {
    lines.push(`Code: \`${error.code}\``);
  }

  if (error.suggestion) {
    lines.push(`\n💡 **Suggestion:** ${error.suggestion.description}`);
  }

  if (error.context) {
    lines.push('\n```typescript');
    lines.push(error.context);
    lines.push('```');
  }

  return lines.join('\n');
}

/**
 * Format error summary for quick display
 */
export function formatQuickSummary(report: AIErrorReport): string {
  if (report.success) {
    return '✅ No errors';
  }

  const parts: string[] = [];
  if (report.totalErrors > 0) {
    parts.push(`❌ ${report.totalErrors} error${report.totalErrors > 1 ? 's' : ''}`);
  }
  if (report.totalWarnings > 0) {
    parts.push(`⚠️ ${report.totalWarnings} warning${report.totalWarnings > 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}
