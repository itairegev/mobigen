/**
 * Types for the Contextual Retry System
 */

export interface RetryContext {
  /** Number of retry attempts made */
  attempt: number;

  /** Maximum number of retries allowed */
  maxAttempts: number;

  /** History of all previous attempts */
  attemptHistory: AttemptRecord[];

  /** Errors from the current/last attempt */
  currentErrors: ErrorRecord[];

  /** Auto-fixes that have been applied */
  appliedFixes: AppliedFix[];

  /** Files that have been modified */
  modifiedFiles: string[];

  /** Strategy being used for retry */
  strategy: RetryStrategy;
}

export interface AttemptRecord {
  /** Attempt number (1-indexed) */
  attempt: number;

  /** Timestamp of the attempt */
  timestamp: Date;

  /** Duration of the attempt in ms */
  duration: number;

  /** Whether the attempt succeeded */
  succeeded: boolean;

  /** Errors encountered */
  errors: ErrorRecord[];

  /** Fixes applied during this attempt */
  fixesApplied: AppliedFix[];

  /** Summary of what was done */
  summary: string;
}

export interface ErrorRecord {
  /** Error code/type */
  code: string;

  /** Error message */
  message: string;

  /** File where error occurred */
  file?: string;

  /** Line number */
  line?: number;

  /** Column number */
  column?: number;

  /** Severity level */
  severity: 'error' | 'warning';

  /** Category of error */
  category: ErrorCategory;

  /** Whether this error is fixable */
  fixable: boolean;

  /** Suggested fix if available */
  suggestedFix?: string;

  /** Whether this error has been fixed */
  fixed: boolean;

  /** Previous fix attempts for this error */
  fixAttempts: FixAttempt[];
}

export type ErrorCategory =
  | 'typescript'
  | 'eslint'
  | 'navigation'
  | 'import'
  | 'runtime'
  | 'build'
  | 'unknown';

export interface AppliedFix {
  /** ID of the fix */
  id: string;

  /** Error that was fixed */
  errorCode: string;

  /** File that was modified */
  file: string;

  /** What was changed */
  change: string;

  /** Whether the fix resolved the error */
  successful: boolean;

  /** Timestamp */
  timestamp: Date;
}

export interface FixAttempt {
  /** What was tried */
  description: string;

  /** Whether it worked */
  successful: boolean;

  /** New errors introduced if any */
  introducedErrors?: string[];

  /** Timestamp */
  timestamp: Date;
}

export type RetryStrategy =
  | 'auto-fix'          // Apply automatic fixes
  | 'ai-guided'         // Let AI analyze and fix
  | 'rollback-retry'    // Rollback and retry with different approach
  | 'escalate';         // Escalate to human review

export interface RetryDecision {
  /** Whether to retry */
  shouldRetry: boolean;

  /** Strategy to use */
  strategy: RetryStrategy;

  /** Reason for decision */
  reason: string;

  /** Specific instructions for the retry */
  instructions?: string;

  /** Files to focus on */
  targetFiles?: string[];

  /** Errors to prioritize */
  priorityErrors?: string[];
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;

  /** Delay between retries in ms */
  retryDelay: number;

  /** Whether to use auto-fix patterns first */
  autoFixFirst: boolean;

  /** Whether to rollback on failure */
  rollbackOnFailure: boolean;

  /** Strategy selection function */
  strategySelector?: (context: RetryContext) => RetryStrategy;

  /** Callback when retry starts */
  onRetryStart?: (context: RetryContext) => void;

  /** Callback when retry completes */
  onRetryComplete?: (context: RetryContext, success: boolean) => void;

  /** Callback for progress updates */
  onProgress?: (message: string, context: RetryContext) => void;
}

export interface RetryResult {
  /** Whether all retries succeeded */
  success: boolean;

  /** Total attempts made */
  totalAttempts: number;

  /** Final context */
  context: RetryContext;

  /** Final errors if failed */
  finalErrors: ErrorRecord[];

  /** All fixes that were applied */
  allFixes: AppliedFix[];

  /** Total duration */
  duration: number;

  /** Whether human review is needed */
  needsHumanReview: boolean;

  /** Summary of what happened */
  summary: string;
}
