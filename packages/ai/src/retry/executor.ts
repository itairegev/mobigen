/**
 * Contextual Retry Executor
 *
 * Executes retries using the context manager and various strategies.
 */

import type {
  RetryContext,
  RetryConfig,
  RetryResult,
  RetryStrategy,
  ErrorRecord,
  AppliedFix,
} from './types';
import {
  createRetryContext,
  analyzeAndDecide,
  recordAttempt,
  updateErrors,
  updateStrategy,
  generateRetryReport,
} from './context-manager';

/**
 * Strategy handlers for different retry approaches
 */
export interface StrategyHandler {
  /** Execute the strategy */
  execute: (context: RetryContext, config: RetryConfig) => Promise<StrategyResult>;
}

export interface StrategyResult {
  /** Whether the strategy succeeded */
  success: boolean;

  /** Errors after strategy execution */
  errors: ErrorRecord[];

  /** Fixes that were applied */
  fixes: AppliedFix[];

  /** Duration of execution */
  duration: number;

  /** Any message or output */
  message?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  retryDelay: 1000,
  autoFixFirst: true,
  rollbackOnFailure: true,
};

/**
 * Execute retries with contextual awareness
 */
export async function executeWithRetry(
  operation: () => Promise<{ errors: ErrorRecord[] }>,
  config: Partial<RetryConfig> = {},
  strategyHandlers: Partial<Record<RetryStrategy, StrategyHandler>> = {}
): Promise<RetryResult> {
  const mergedConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  let context = createRetryContext(mergedConfig);

  // Initial execution
  const initialResult = await operation();
  context = updateErrors(context, initialResult.errors);

  // If no errors, we're done
  if (initialResult.errors.length === 0) {
    return buildSuccessResult(context, Date.now() - startTime);
  }

  // Record initial attempt
  context = recordAttempt(
    context,
    false,
    initialResult.errors,
    [],
    Date.now() - startTime
  );

  // Notify start
  mergedConfig.onRetryStart?.(context);

  // Main retry loop
  while (context.attempt < context.maxAttempts) {
    // Analyze and decide on strategy
    const decision = analyzeAndDecide(context);

    if (!decision.shouldRetry) {
      break;
    }

    // Update strategy
    context = updateStrategy(context, decision.strategy);

    // Log progress
    mergedConfig.onProgress?.(
      `Retry ${context.attempt + 1}/${context.maxAttempts}: ${decision.reason}`,
      context
    );

    // Delay before retry
    if (context.attempt > 0 && mergedConfig.retryDelay > 0) {
      await delay(mergedConfig.retryDelay);
    }

    // Execute strategy
    const handler = strategyHandlers[decision.strategy] || getDefaultHandler(decision.strategy);
    const attemptStart = Date.now();

    try {
      const strategyResult = await handler.execute(context, mergedConfig);

      // Record the attempt
      context = recordAttempt(
        context,
        strategyResult.success,
        strategyResult.errors,
        strategyResult.fixes,
        strategyResult.duration
      );

      // Update current errors
      context = updateErrors(context, strategyResult.errors);

      // Check if we succeeded
      if (strategyResult.success || strategyResult.errors.length === 0) {
        mergedConfig.onRetryComplete?.(context, true);
        return buildSuccessResult(context, Date.now() - startTime);
      }
    } catch (error) {
      // Strategy execution failed
      context = recordAttempt(
        context,
        false,
        context.currentErrors,
        [],
        Date.now() - attemptStart
      );

      mergedConfig.onProgress?.(
        `Strategy ${decision.strategy} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context
      );
    }
  }

  // All retries exhausted
  mergedConfig.onRetryComplete?.(context, false);
  return buildFailureResult(context, Date.now() - startTime);
}

/**
 * Get default handler for a strategy
 */
function getDefaultHandler(strategy: RetryStrategy): StrategyHandler {
  switch (strategy) {
    case 'auto-fix':
      return {
        execute: async (context) => {
          // This would integrate with the auto-fix system
          // For now, return current state
          return {
            success: false,
            errors: context.currentErrors,
            fixes: [],
            duration: 0,
            message: 'Auto-fix handler not configured',
          };
        },
      };

    case 'ai-guided':
      return {
        execute: async (context) => {
          // This would integrate with the AI agent
          return {
            success: false,
            errors: context.currentErrors,
            fixes: [],
            duration: 0,
            message: 'AI-guided handler not configured',
          };
        },
      };

    case 'rollback-retry':
      return {
        execute: async (context) => {
          // This would integrate with the rollback manager
          return {
            success: false,
            errors: context.currentErrors,
            fixes: [],
            duration: 0,
            message: 'Rollback handler not configured',
          };
        },
      };

    case 'escalate':
      return {
        execute: async (context) => {
          return {
            success: false,
            errors: context.currentErrors,
            fixes: [],
            duration: 0,
            message: 'Escalated for human review',
          };
        },
      };
  }
}

/**
 * Build success result
 */
function buildSuccessResult(context: RetryContext, duration: number): RetryResult {
  return {
    success: true,
    totalAttempts: context.attempt,
    context,
    finalErrors: [],
    allFixes: context.appliedFixes,
    duration,
    needsHumanReview: false,
    summary: `Successfully fixed all errors in ${context.attempt} attempt(s)`,
  };
}

/**
 * Build failure result
 */
function buildFailureResult(context: RetryContext, duration: number): RetryResult {
  return {
    success: false,
    totalAttempts: context.attempt,
    context,
    finalErrors: context.currentErrors,
    allFixes: context.appliedFixes,
    duration,
    needsHumanReview: true,
    summary: `Failed after ${context.attempt} attempts. ${context.currentErrors.length} errors remain.`,
  };
}

/**
 * Delay utility
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a retry wrapper for async operations
 */
export function createRetryWrapper(
  config: Partial<RetryConfig> = {},
  handlers: Partial<Record<RetryStrategy, StrategyHandler>> = {}
) {
  return async <T>(
    operation: () => Promise<T>,
    errorExtractor: (result: T) => ErrorRecord[]
  ): Promise<RetryResult & { result?: T }> => {
    let lastResult: T | undefined;

    const wrappedResult = await executeWithRetry(
      async () => {
        lastResult = await operation();
        return { errors: errorExtractor(lastResult) };
      },
      config,
      handlers
    );

    return {
      ...wrappedResult,
      result: lastResult,
    };
  };
}

/**
 * Get retry statistics from a result
 */
export function getRetryStats(result: RetryResult): {
  totalAttempts: number;
  totalDuration: number;
  errorReduction: number;
  fixSuccessRate: number;
  strategiesUsed: RetryStrategy[];
} {
  const context = result.context;
  const initialErrors = context.attemptHistory[0]?.errors.length || 0;
  const finalErrors = result.finalErrors.length;
  const errorReduction = initialErrors > 0
    ? ((initialErrors - finalErrors) / initialErrors) * 100
    : 0;

  const successfulFixes = context.appliedFixes.filter((f) => f.successful).length;
  const totalFixes = context.appliedFixes.length;
  const fixSuccessRate = totalFixes > 0
    ? (successfulFixes / totalFixes) * 100
    : 0;

  const strategiesUsed = Array.from(
    new Set(context.attemptHistory.map(() => context.strategy))
  );

  return {
    totalAttempts: result.totalAttempts,
    totalDuration: result.duration,
    errorReduction,
    fixSuccessRate,
    strategiesUsed,
  };
}

/**
 * Export report generator
 */
export { generateRetryReport };
