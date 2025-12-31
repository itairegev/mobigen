/**
 * Health Check System
 *
 * Provides standardized health checks for all services.
 * Supports dependency checks, readiness probes, and liveness probes.
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  latencyMs?: number;
  details?: Record<string, unknown>;
}

export interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  service: string;
  version?: string;
  uptime: number;
  checks: HealthCheckResult[];
}

export type HealthChecker = () => Promise<HealthCheckResult>;

export interface HealthCheckOptions {
  /** Service name */
  service: string;
  /** Service version */
  version?: string;
  /** Timeout for each check in ms */
  timeout?: number;
}

/**
 * Health Check Manager
 */
export class HealthCheckManager {
  private checks: Map<string, HealthChecker> = new Map();
  private options: Required<HealthCheckOptions>;
  private startTime: number;

  constructor(options: HealthCheckOptions) {
    this.options = {
      service: options.service,
      version: options.version || '0.0.0',
      timeout: options.timeout ?? 5000,
    };
    this.startTime = Date.now();
  }

  /**
   * Register a health check
   */
  register(name: string, checker: HealthChecker): void {
    this.checks.set(name, checker);
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Run all health checks
   */
  async check(): Promise<HealthReport> {
    const results: HealthCheckResult[] = [];

    for (const [name, checker] of this.checks) {
      const start = Date.now();
      try {
        const result = await Promise.race([
          checker(),
          this.timeoutPromise(name),
        ]);
        result.latencyMs = Date.now() - start;
        results.push(result);
      } catch (error) {
        results.push({
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : String(error),
          latencyMs: Date.now() - start,
        });
      }
    }

    // Determine overall status
    const status = this.determineOverallStatus(results);

    return {
      status,
      timestamp: new Date().toISOString(),
      service: this.options.service,
      version: this.options.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: results,
    };
  }

  /**
   * Quick liveness check (just verifies service is running)
   */
  async liveness(): Promise<{ status: 'ok' | 'error'; uptime: number }> {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Readiness check (verifies service can handle requests)
   */
  async readiness(): Promise<HealthReport> {
    const report = await this.check();
    return report;
  }

  /**
   * Timeout promise for health checks
   */
  private timeoutPromise(name: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check '${name}' timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);
    });
  }

  /**
   * Determine overall status from individual checks
   */
  private determineOverallStatus(results: HealthCheckResult[]): HealthStatus {
    if (results.length === 0) return 'healthy';

    const hasUnhealthy = results.some(r => r.status === 'unhealthy');
    const hasDegraded = results.some(r => r.status === 'degraded');

    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }
}

/**
 * Common health check factories
 */
export const healthChecks = {
  /**
   * Database connectivity check
   */
  database: (
    name: string,
    pingFn: () => Promise<void>
  ): HealthChecker => async () => {
    try {
      await pingFn();
      return { name, status: 'healthy', message: 'Database connected' };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  },

  /**
   * Redis connectivity check
   */
  redis: (
    name: string,
    pingFn: () => Promise<string>
  ): HealthChecker => async () => {
    try {
      const response = await pingFn();
      if (response === 'PONG') {
        return { name, status: 'healthy', message: 'Redis connected' };
      }
      return { name, status: 'degraded', message: `Unexpected response: ${response}` };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  },

  /**
   * External API check
   */
  externalApi: (
    name: string,
    checkFn: () => Promise<boolean>,
    degradedThresholdMs?: number
  ): HealthChecker => async () => {
    const start = Date.now();
    try {
      const isHealthy = await checkFn();
      const latency = Date.now() - start;

      if (!isHealthy) {
        return { name, status: 'unhealthy', message: 'API check failed' };
      }

      if (degradedThresholdMs && latency > degradedThresholdMs) {
        return {
          name,
          status: 'degraded',
          message: `API responding slowly (${latency}ms)`,
          latencyMs: latency,
        };
      }

      return { name, status: 'healthy', message: 'API healthy' };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'API check failed',
      };
    }
  },

  /**
   * Disk space check
   */
  diskSpace: (
    name: string,
    getFreeSpacePercent: () => Promise<number>,
    warningThreshold: number = 20,
    criticalThreshold: number = 10
  ): HealthChecker => async () => {
    try {
      const freePercent = await getFreeSpacePercent();

      if (freePercent < criticalThreshold) {
        return {
          name,
          status: 'unhealthy',
          message: `Disk space critically low: ${freePercent.toFixed(1)}% free`,
          details: { freePercent },
        };
      }

      if (freePercent < warningThreshold) {
        return {
          name,
          status: 'degraded',
          message: `Disk space low: ${freePercent.toFixed(1)}% free`,
          details: { freePercent },
        };
      }

      return {
        name,
        status: 'healthy',
        message: `Disk space OK: ${freePercent.toFixed(1)}% free`,
        details: { freePercent },
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Failed to check disk space',
      };
    }
  },

  /**
   * Memory usage check
   */
  memory: (
    name: string,
    warningThreshold: number = 80,
    criticalThreshold: number = 95
  ): HealthChecker => async () => {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const usagePercent = (used.heapUsed / used.heapTotal) * 100;

    if (usagePercent > criticalThreshold) {
      return {
        name,
        status: 'unhealthy',
        message: `Memory critically high: ${usagePercent.toFixed(1)}%`,
        details: { heapUsedMB, heapTotalMB, usagePercent },
      };
    }

    if (usagePercent > warningThreshold) {
      return {
        name,
        status: 'degraded',
        message: `Memory usage high: ${usagePercent.toFixed(1)}%`,
        details: { heapUsedMB, heapTotalMB, usagePercent },
      };
    }

    return {
      name,
      status: 'healthy',
      message: `Memory OK: ${heapUsedMB}MB / ${heapTotalMB}MB`,
      details: { heapUsedMB, heapTotalMB, usagePercent },
    };
  },

  /**
   * Circuit breaker status check
   */
  circuitBreaker: (
    name: string,
    getState: () => 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  ): HealthChecker => async () => {
    const state = getState();

    if (state === 'OPEN') {
      return {
        name,
        status: 'unhealthy',
        message: `Circuit breaker is OPEN`,
        details: { state },
      };
    }

    if (state === 'HALF_OPEN') {
      return {
        name,
        status: 'degraded',
        message: `Circuit breaker is HALF_OPEN (recovering)`,
        details: { state },
      };
    }

    return {
      name,
      status: 'healthy',
      message: `Circuit breaker is CLOSED`,
      details: { state },
    };
  },
};

/**
 * Create a health check manager for a service
 */
export function createHealthCheckManager(options: HealthCheckOptions): HealthCheckManager {
  return new HealthCheckManager(options);
}
