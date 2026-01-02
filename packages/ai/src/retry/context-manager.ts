/**
 * Contextual Retry Manager
 *
 * Manages retry context and makes intelligent decisions about
 * how to proceed when errors occur.
 */

import type {
  RetryContext,
  RetryConfig,
  RetryDecision,
  RetryStrategy,
  ErrorRecord,
  AttemptRecord,
  AppliedFix,
  ErrorCategory,
} from './types';

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  retryDelay: 1000,
  autoFixFirst: true,
  rollbackOnFailure: true,
};

/**
 * Create a new retry context
 */
export function createRetryContext(
  config: Partial<RetryConfig> = {}
): RetryContext {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    attempt: 0,
    maxAttempts: mergedConfig.maxAttempts,
    attemptHistory: [],
    currentErrors: [],
    appliedFixes: [],
    modifiedFiles: [],
    strategy: 'auto-fix',
  };
}

/**
 * Analyze errors and determine retry strategy
 */
export function analyzeAndDecide(context: RetryContext): RetryDecision {
  // Check if we've exhausted retries
  if (context.attempt >= context.maxAttempts) {
    return {
      shouldRetry: false,
      strategy: 'escalate',
      reason: `Maximum retry attempts (${context.maxAttempts}) reached`,
    };
  }

  // Check if there are no errors (shouldn't happen but handle it)
  if (context.currentErrors.length === 0) {
    return {
      shouldRetry: false,
      strategy: 'auto-fix',
      reason: 'No errors to fix',
    };
  }

  // Analyze error patterns
  const errorAnalysis = analyzeErrors(context);

  // Check for repeating errors (same errors in multiple attempts)
  const repeatingErrors = findRepeatingErrors(context);
  if (repeatingErrors.length > 0 && context.attempt >= 2) {
    // If we keep hitting the same errors, try a different strategy
    if (context.strategy === 'auto-fix') {
      return {
        shouldRetry: true,
        strategy: 'ai-guided',
        reason: `${repeatingErrors.length} errors persist after auto-fix attempts`,
        instructions: buildAIInstructions(repeatingErrors, context),
        priorityErrors: repeatingErrors.map((e) => e.code),
      };
    } else if (context.strategy === 'ai-guided') {
      return {
        shouldRetry: true,
        strategy: 'rollback-retry',
        reason: 'AI-guided fixes did not resolve repeating errors',
        instructions: 'Rollback to last working state and try alternative approach',
      };
    }
  }

  // Check if all errors are auto-fixable
  const fixableErrors = context.currentErrors.filter((e) => e.fixable);
  if (fixableErrors.length === context.currentErrors.length) {
    return {
      shouldRetry: true,
      strategy: 'auto-fix',
      reason: `All ${fixableErrors.length} errors are auto-fixable`,
      priorityErrors: fixableErrors.map((e) => e.code),
    };
  }

  // Mix of fixable and non-fixable errors
  if (fixableErrors.length > 0) {
    return {
      shouldRetry: true,
      strategy: context.attempt === 0 ? 'auto-fix' : 'ai-guided',
      reason: `${fixableErrors.length} fixable, ${context.currentErrors.length - fixableErrors.length} need AI guidance`,
      instructions: buildMixedInstructions(context),
    };
  }

  // All errors need AI guidance
  return {
    shouldRetry: true,
    strategy: 'ai-guided',
    reason: 'No auto-fixable errors, AI guidance needed',
    instructions: buildAIInstructions(context.currentErrors, context),
    targetFiles: getAffectedFiles(context.currentErrors),
  };
}

/**
 * Record an attempt in the context
 */
export function recordAttempt(
  context: RetryContext,
  success: boolean,
  errors: ErrorRecord[],
  fixes: AppliedFix[],
  duration: number
): RetryContext {
  const attempt: AttemptRecord = {
    attempt: context.attempt + 1,
    timestamp: new Date(),
    duration,
    succeeded: success,
    errors: [...errors],
    fixesApplied: [...fixes],
    summary: buildAttemptSummary(success, errors, fixes),
  };

  return {
    ...context,
    attempt: context.attempt + 1,
    attemptHistory: [...context.attemptHistory, attempt],
    currentErrors: errors,
    appliedFixes: [...context.appliedFixes, ...fixes],
  };
}

/**
 * Update context with new errors
 */
export function updateErrors(
  context: RetryContext,
  errors: ErrorRecord[]
): RetryContext {
  return {
    ...context,
    currentErrors: errors,
  };
}

/**
 * Update context strategy
 */
export function updateStrategy(
  context: RetryContext,
  strategy: RetryStrategy
): RetryContext {
  return {
    ...context,
    strategy,
  };
}

/**
 * Analyze error patterns
 */
function analyzeErrors(context: RetryContext): {
  byCategory: Record<ErrorCategory, number>;
  fixable: number;
  unfixable: number;
  recurring: number;
} {
  const byCategory: Record<ErrorCategory, number> = {
    typescript: 0,
    eslint: 0,
    navigation: 0,
    import: 0,
    runtime: 0,
    build: 0,
    unknown: 0,
  };

  let fixable = 0;
  let unfixable = 0;
  let recurring = 0;

  for (const error of context.currentErrors) {
    byCategory[error.category]++;

    if (error.fixable) {
      fixable++;
    } else {
      unfixable++;
    }

    // Check if this error appeared in previous attempts
    const appearedBefore = context.attemptHistory.some((attempt) =>
      attempt.errors.some((e) => e.code === error.code && e.file === error.file)
    );
    if (appearedBefore) {
      recurring++;
    }
  }

  return { byCategory, fixable, unfixable, recurring };
}

/**
 * Find errors that keep repeating across attempts
 */
function findRepeatingErrors(context: RetryContext): ErrorRecord[] {
  if (context.attemptHistory.length < 2) {
    return [];
  }

  const repeating: ErrorRecord[] = [];
  const previousAttempt = context.attemptHistory[context.attemptHistory.length - 1];

  for (const error of context.currentErrors) {
    const existedBefore = previousAttempt.errors.some(
      (e) => e.code === error.code && e.file === error.file && e.line === error.line
    );
    if (existedBefore) {
      repeating.push(error);
    }
  }

  return repeating;
}

/**
 * Build instructions for AI-guided retry
 */
function buildAIInstructions(
  errors: ErrorRecord[],
  context: RetryContext
): string {
  const lines: string[] = [];

  lines.push('## Previous Attempts Summary');
  for (const attempt of context.attemptHistory) {
    lines.push(`- Attempt ${attempt.attempt}: ${attempt.succeeded ? 'SUCCESS' : 'FAILED'}`);
    if (attempt.fixesApplied.length > 0) {
      lines.push(`  Fixes applied: ${attempt.fixesApplied.map((f) => f.change).join(', ')}`);
    }
    if (!attempt.succeeded && attempt.errors.length > 0) {
      lines.push(`  Errors: ${attempt.errors.slice(0, 3).map((e) => e.message).join('; ')}`);
    }
  }

  lines.push('');
  lines.push('## Current Errors to Fix');
  for (const error of errors.slice(0, 10)) {
    lines.push(`- [${error.category}] ${error.file}:${error.line || '?'}`);
    lines.push(`  ${error.message}`);
    if (error.suggestedFix) {
      lines.push(`  Suggested fix: ${error.suggestedFix}`);
    }
    if (error.fixAttempts.length > 0) {
      lines.push(`  Previous fix attempts: ${error.fixAttempts.map((f) => f.description).join('; ')}`);
    }
  }

  if (errors.length > 10) {
    lines.push(`... and ${errors.length - 10} more errors`);
  }

  lines.push('');
  lines.push('## Instructions');
  lines.push('1. Analyze the error patterns and previous fix attempts');
  lines.push('2. Apply fixes that address the root cause, not just symptoms');
  lines.push('3. Avoid fixes that have already been tried and failed');
  lines.push('4. Ensure fixes do not introduce new errors');

  return lines.join('\n');
}

/**
 * Build instructions for mixed auto-fix and AI-guided retry
 */
function buildMixedInstructions(context: RetryContext): string {
  const fixable = context.currentErrors.filter((e) => e.fixable);
  const unfixable = context.currentErrors.filter((e) => !e.fixable);

  const lines: string[] = [];

  lines.push('## Auto-fixable Errors (will be fixed automatically)');
  for (const error of fixable.slice(0, 5)) {
    lines.push(`- ${error.file}: ${error.message}`);
  }

  lines.push('');
  lines.push('## Errors Requiring AI Analysis');
  for (const error of unfixable.slice(0, 5)) {
    lines.push(`- ${error.file}:${error.line || '?'}: ${error.message}`);
    if (error.suggestedFix) {
      lines.push(`  Suggestion: ${error.suggestedFix}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get unique affected files from errors
 */
function getAffectedFiles(errors: ErrorRecord[]): string[] {
  const files = new Set<string>();
  for (const error of errors) {
    if (error.file) {
      files.add(error.file);
    }
  }
  return Array.from(files);
}

/**
 * Build summary of an attempt
 */
function buildAttemptSummary(
  success: boolean,
  errors: ErrorRecord[],
  fixes: AppliedFix[]
): string {
  if (success) {
    return `Success! Applied ${fixes.length} fixes.`;
  }

  const errorCounts: Record<string, number> = {};
  for (const error of errors) {
    errorCounts[error.category] = (errorCounts[error.category] || 0) + 1;
  }

  const categories = Object.entries(errorCounts)
    .map(([cat, count]) => `${count} ${cat}`)
    .join(', ');

  return `Failed with ${errors.length} errors (${categories}). Applied ${fixes.length} fixes.`;
}

/**
 * Generate a human-readable report of the retry process
 */
export function generateRetryReport(context: RetryContext): string {
  const lines: string[] = [];

  lines.push('# Retry Process Report');
  lines.push('');
  lines.push(`Total Attempts: ${context.attempt}`);
  lines.push(`Final Strategy: ${context.strategy}`);
  lines.push(`Total Fixes Applied: ${context.appliedFixes.length}`);
  lines.push(`Remaining Errors: ${context.currentErrors.length}`);
  lines.push('');

  lines.push('## Attempt History');
  for (const attempt of context.attemptHistory) {
    lines.push(`### Attempt ${attempt.attempt}`);
    lines.push(`- Status: ${attempt.succeeded ? '✅ Success' : '❌ Failed'}`);
    lines.push(`- Duration: ${attempt.duration}ms`);
    lines.push(`- Errors: ${attempt.errors.length}`);
    lines.push(`- Fixes: ${attempt.fixesApplied.length}`);
    lines.push(`- Summary: ${attempt.summary}`);
    lines.push('');
  }

  if (context.appliedFixes.length > 0) {
    lines.push('## Applied Fixes');
    for (const fix of context.appliedFixes) {
      lines.push(`- ${fix.file}: ${fix.change} (${fix.successful ? '✅' : '❌'})`);
    }
    lines.push('');
  }

  if (context.currentErrors.length > 0) {
    lines.push('## Remaining Errors');
    for (const error of context.currentErrors.slice(0, 20)) {
      lines.push(`- [${error.severity}] ${error.file}:${error.line || '?'}: ${error.message}`);
    }
    if (context.currentErrors.length > 20) {
      lines.push(`... and ${context.currentErrors.length - 20} more`);
    }
  }

  return lines.join('\n');
}
