/**
 * Circuit Breaker Implementation
 *
 * Prevents cascading failures by failing fast when a service is unhealthy.
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing)
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Simple EventEmitter for circuit breaker events
 */
type Listener = (...args: unknown[]) => void;

class SimpleEventEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();

  on(event: string, listener: Listener): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  off(event: string, listener: Listener): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) return false;
    for (const listener of eventListeners) {
      listener(...args);
    }
    return true;
  }
}

export interface CircuitBreakerOptions {
  /** Name for logging/metrics */
  name: string;
  /** Number of failures before opening circuit */
  failureThreshold?: number;
  /** Time in ms before attempting recovery */
  resetTimeout?: number;
  /** Number of successful calls in HALF_OPEN to close circuit */
  successThreshold?: number;
  /** Timeout for each request in ms */
  requestTimeout?: number;
  /** Custom function to determine if error should trip the breaker */
  isFailure?: (error: unknown) => boolean;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export interface CircuitBreakerEvents {
  stateChange: [state: CircuitState, previousState: CircuitState];
  success: [duration: number];
  failure: [error: unknown, duration: number];
  timeout: [duration: number];
  rejected: [];
}

export class CircuitBreaker extends SimpleEventEmitter {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailure: Date | null = null;
  private lastSuccess: Date | null = null;
  private nextAttempt: number = 0;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions) {
    super();
    this.options = {
      name: options.name,
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 30000,
      successThreshold: options.successThreshold ?? 2,
      requestTimeout: options.requestTimeout ?? 10000,
      isFailure: options.isFailure ?? (() => true),
    };
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        this.emit('rejected');
        throw new CircuitOpenError(
          `Circuit breaker '${this.options.name}' is OPEN`,
          this.options.name
        );
      }
      // Time to try again - move to half-open
      this.transitionTo('HALF_OPEN');
    }

    const startTime = Date.now();

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      this.onSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof TimeoutError) {
        this.emit('timeout', duration);
        this.onFailure(error, duration);
      } else if (this.options.isFailure(error)) {
        this.onFailure(error, duration);
      } else {
        // Error doesn't trip the breaker
        this.emit('success', duration);
      }

      throw error;
    }
  }

  /**
   * Execute with timeout wrapper
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(
          `Request timed out after ${this.options.requestTimeout}ms`,
          this.options.requestTimeout
        ));
      }, this.options.requestTimeout);

      fn()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Handle successful execution
   */
  private onSuccess(duration: number): void {
    this.lastSuccess = new Date();
    this.totalSuccesses++;
    this.emit('success', duration);

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo('CLOSED');
      }
    }

    // Reset failure count on success in closed state
    if (this.state === 'CLOSED') {
      this.failures = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: unknown, duration: number): void {
    this.lastFailure = new Date();
    this.totalFailures++;
    this.emit('failure', error, duration);

    if (this.state === 'HALF_OPEN') {
      // Failed during test - reopen circuit
      this.transitionTo('OPEN');
      return;
    }

    if (this.state === 'CLOSED') {
      this.failures++;
      if (this.failures >= this.options.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;

    const previousState = this.state;
    this.state = newState;

    // Reset counters based on new state
    if (newState === 'CLOSED') {
      this.failures = 0;
      this.successes = 0;
    } else if (newState === 'OPEN') {
      this.nextAttempt = Date.now() + this.options.resetTimeout;
      this.successes = 0;
    } else if (newState === 'HALF_OPEN') {
      this.successes = 0;
    }

    this.emit('stateChange', newState, previousState);
  }

  /**
   * Get current statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.transitionTo('CLOSED');
    this.failures = 0;
    this.successes = 0;
  }

  /**
   * Manually open the circuit breaker
   */
  open(): void {
    this.transitionTo('OPEN');
  }
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  readonly circuitName: string;

  constructor(message: string, circuitName: string) {
    super(message);
    this.name = 'CircuitOpenError';
    this.circuitName = circuitName;
  }
}

/**
 * Error thrown on timeout
 */
export class TimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Create a circuit breaker with default settings for a service
 */
export function createCircuitBreaker(
  name: string,
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  return new CircuitBreaker({ name, ...options });
}

/**
 * Pre-configured circuit breakers for common services
 */
export const defaultCircuitBreakers = {
  claude: () => createCircuitBreaker('claude-api', {
    failureThreshold: 3,
    resetTimeout: 60000,
    requestTimeout: 120000, // Claude can be slow
  }),

  eas: () => createCircuitBreaker('eas-api', {
    failureThreshold: 5,
    resetTimeout: 30000,
    requestTimeout: 30000,
  }),

  s3: () => createCircuitBreaker('s3', {
    failureThreshold: 5,
    resetTimeout: 15000,
    requestTimeout: 10000,
  }),

  database: () => createCircuitBreaker('database', {
    failureThreshold: 3,
    resetTimeout: 10000,
    requestTimeout: 5000,
  }),
};
