/**
 * Retry Logic with Exponential Backoff
 *
 * Provides configurable retry strategies with jitter to prevent thundering herd.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay in ms before first retry */
  initialDelay?: number;
  /** Maximum delay in ms between retries */
  maxDelay?: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Add randomness to delay (0-1) */
  jitter?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown, attempt: number) => boolean;
  /** Callback on each retry attempt */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
  /** Abort signal to cancel retries */
  signal?: AbortSignal;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: unknown;
  attempts: number;
  totalDuration: number;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'signal'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: 0.1,
  isRetryable: () => true,
  onRetry: () => {},
};

/**
 * Execute a function with retry logic
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    // Check for abort
    if (opts.signal?.aborted) {
      throw new RetryAbortedError('Retry aborted by signal');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= opts.maxAttempts) {
        break;
      }

      if (!opts.isRetryable(error, attempt)) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = calculateDelay(attempt, opts);

      // Notify caller
      opts.onRetry(error, attempt, delay);

      // Wait before next attempt
      await sleep(delay, opts.signal);
    }
  }

  throw lastError;
}

/**
 * Execute with retry and return detailed result
 */
export async function retryWithResult<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let attempts = 0;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    attempts = attempt;

    if (opts.signal?.aborted) {
      return {
        success: false,
        error: new RetryAbortedError('Retry aborted by signal'),
        attempts,
        totalDuration: Date.now() - startTime,
      };
    }

    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts,
        totalDuration: Date.now() - startTime,
      };
    } catch (error) {
      if (attempt >= opts.maxAttempts || !opts.isRetryable(error, attempt)) {
        return {
          success: false,
          error,
          attempts,
          totalDuration: Date.now() - startTime,
        };
      }

      const delay = calculateDelay(attempt, opts);
      opts.onRetry(error, attempt, delay);
      await sleep(delay, opts.signal);
    }
  }

  return {
    success: false,
    error: new Error('Max attempts reached'),
    attempts,
    totalDuration: Date.now() - startTime,
  };
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  opts: Required<Omit<RetryOptions, 'signal'>>
): number {
  // Exponential backoff: initialDelay * (multiplier ^ (attempt - 1))
  const exponentialDelay = opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1);

  // Apply max delay cap
  const cappedDelay = Math.min(exponentialDelay, opts.maxDelay);

  // Apply jitter (random variance)
  const jitterRange = cappedDelay * opts.jitter;
  const jitterValue = (Math.random() * 2 - 1) * jitterRange;

  return Math.max(0, Math.floor(cappedDelay + jitterValue));
}

/**
 * Sleep with abort signal support
 */
async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new RetryAbortedError('Retry aborted by signal'));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new RetryAbortedError('Retry aborted by signal'));
    });
  });
}

/**
 * Error thrown when retry is aborted
 */
export class RetryAbortedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryAbortedError';
  }
}

/**
 * Common retry predicates
 */
export const retryPredicates = {
  /** Retry on network errors */
  networkErrors: (error: unknown): boolean => {
    if (error instanceof Error) {
      const networkCodes = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
      return networkCodes.some(code => error.message.includes(code));
    }
    return false;
  },

  /** Retry on HTTP 5xx errors */
  serverErrors: (error: unknown): boolean => {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      return status >= 500 && status < 600;
    }
    return false;
  },

  /** Retry on HTTP 429 (rate limit) */
  rateLimitErrors: (error: unknown): boolean => {
    if (error && typeof error === 'object' && 'status' in error) {
      return (error as { status: number }).status === 429;
    }
    return false;
  },

  /** Retry on transient errors (network + 5xx + 429) */
  transientErrors: (error: unknown): boolean => {
    return (
      retryPredicates.networkErrors(error) ||
      retryPredicates.serverErrors(error) ||
      retryPredicates.rateLimitErrors(error)
    );
  },

  /** Never retry */
  never: (): boolean => false,

  /** Always retry */
  always: (): boolean => true,
};

/**
 * Pre-configured retry strategies
 */
export const retryStrategies = {
  /** Quick retries for fast operations */
  fast: {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffMultiplier: 2,
    jitter: 0.1,
  } as RetryOptions,

  /** Standard retries for API calls */
  standard: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: 0.2,
  } as RetryOptions,

  /** Aggressive retries for critical operations */
  aggressive: {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: 0.3,
  } as RetryOptions,

  /** Patient retries for slow services */
  patient: {
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    jitter: 0.2,
  } as RetryOptions,
};

/**
 * Create a retryable version of an async function
 */
export function withRetry<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => retry(() => fn(...args), options);
}
