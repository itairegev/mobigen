/**
 * @mobigen/resilience
 *
 * Resilience patterns for Mobigen services:
 * - Circuit Breaker: Prevent cascading failures
 * - Retry: Handle transient failures with exponential backoff
 * - Bulkhead: Isolate resources (coming soon)
 * - Rate Limiter: Control throughput (coming soon)
 */

export {
  CircuitBreaker,
  CircuitOpenError,
  TimeoutError,
  createCircuitBreaker,
  defaultCircuitBreakers,
  type CircuitState,
  type CircuitBreakerOptions,
  type CircuitBreakerStats,
} from './circuit-breaker';

export {
  retry,
  retryWithResult,
  withRetry,
  RetryAbortedError,
  retryPredicates,
  retryStrategies,
  type RetryOptions,
  type RetryResult,
} from './retry';
