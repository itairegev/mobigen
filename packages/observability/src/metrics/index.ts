/**
 * Metrics Module
 *
 * Comprehensive metrics collection for quality operations.
 * Provides thread-safe collection, time-series storage, and aggregations.
 *
 * @example Basic Usage
 * ```typescript
 * import { metricsCollector } from '@mobigen/observability/metrics';
 *
 * // Record a validation
 * metricsCollector.recordValidation({
 *   tier: 'tier1',
 *   status: 'success',
 *   duration: 1500,
 *   errorCount: 0,
 *   warningCount: 2,
 *   value: 1,
 *   labels: {},
 *   timestamp: Date.now(),
 * });
 *
 * // Increment a counter
 * metricsCollector.increment('validation.runs', { tier: 'tier1' });
 * ```
 *
 * @example Querying Metrics
 * ```typescript
 * import { createAggregator, createInMemoryStorage } from '@mobigen/observability/metrics';
 *
 * const storage = createInMemoryStorage();
 * const aggregator = createAggregator(storage);
 *
 * // Get success rate
 * const successRate = await aggregator.getSuccessRate({
 *   start: Date.now() - 24 * 60 * 60 * 1000,
 *   end: Date.now(),
 * });
 *
 * // Get quality summary
 * const summary = await aggregator.getQualitySummary({
 *   start: Date.now() - 7 * 24 * 60 * 60 * 1000,
 *   end: Date.now(),
 * });
 * ```
 */

// Schema exports
export {
  MetricType,
  type MetricLabels,
  type MetricValue,
  type QualityMetric,
  type ValidationMetric,
  type AutoFixMetric,
  type RetryMetric,
  type RollbackMetric,
  type MetricStats,
  type TimeSeries,
  type TimeSeriesPoint,
  type HistogramData,
  type HistogramBucket,
  type QualityMetricsSummary,
  MetricFormat,
} from './schema';

// Collector exports
export {
  MetricsCollector,
  createCollector,
  type CollectorOptions,
} from './collector';

// Storage exports
export {
  type MetricsStorage,
  type TimeRange,
  type MetricQuery,
  type AggregationQuery,
  AggregationFunction,
  InMemoryMetricsStorage,
  ClickHouseMetricsStorage,
  createInMemoryStorage,
  type ClickHouseStorageOptions,
} from './storage';

// Aggregation exports
export {
  QualityMetricsAggregator,
  createAggregator,
} from './aggregations';

// ============================================================================
// Singleton Instances
// ============================================================================

/**
 * Default metrics collector instance
 *
 * Pre-configured with:
 * - 1000 metric buffer size
 * - 10 second flush interval
 * - Thread-safe collection
 * - 'mobigen' prefix
 */
export const metricsCollector = new (await import('./collector')).MetricsCollector({
  bufferSize: 1000,
  flushInterval: 10000,
  threadSafe: true,
  prefix: 'mobigen',
});

/**
 * Default in-memory storage instance
 *
 * Suitable for development and testing.
 * For production, use ClickHouse or TimescaleDB.
 */
export const metricsStorage = new (await import('./storage')).InMemoryMetricsStorage({
  maxDataPoints: 100000,
});

/**
 * Default aggregator instance
 */
export const metricsAggregator = new (await import('./aggregations')).QualityMetricsAggregator(
  metricsStorage
);

// ============================================================================
// Auto-flush: Collector → Storage
// ============================================================================

/**
 * Connect collector flush events to storage
 */
metricsCollector.on('flush', async (metrics) => {
  await metricsStorage.write(metrics as import('./schema').MetricValue[]);
});

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Graceful shutdown handler
 */
export async function shutdownMetrics(): Promise<void> {
  // Flush remaining metrics
  const remaining = metricsCollector.flush();
  if (remaining.length > 0) {
    await metricsStorage.write(remaining);
  }

  // Stop collector
  metricsCollector.stop();

  // Close storage
  await metricsStorage.close();
}

// Register shutdown handler
if (typeof process !== 'undefined' && 'on' in process && typeof process.on === 'function') {
  (process as NodeJS.Process).on('SIGTERM', shutdownMetrics);
  (process as NodeJS.Process).on('SIGINT', shutdownMetrics);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Record a validation metric (convenience wrapper)
 */
export function recordValidation(
  tier: 'tier1' | 'tier2' | 'tier3',
  status: 'success' | 'failure' | 'error',
  duration: number,
  options: {
    errorCount?: number;
    warningCount?: number;
    stage?: string;
    projectId?: string;
  } = {}
): void {
  metricsCollector.recordValidation({
    tier,
    status,
    duration,
    errorCount: options.errorCount || 0,
    warningCount: options.warningCount || 0,
    stage: options.stage,
    projectId: options.projectId,
    value: 1,
    labels: {},
    timestamp: Date.now(),
  });
}

/**
 * Record an auto-fix metric (convenience wrapper)
 */
export function recordAutoFix(
  tier: 'tier1' | 'tier2' | 'tier3',
  status: 'success' | 'failure' | 'error',
  duration: number,
  options: {
    errorsAttempted?: number;
    errorsFixed?: number;
    strategy?: string;
    projectId?: string;
  } = {}
): void {
  metricsCollector.recordAutoFix({
    tier,
    status,
    duration,
    errorsAttempted: options.errorsAttempted || 0,
    errorsFixed: options.errorsFixed || 0,
    strategy: options.strategy,
    projectId: options.projectId,
    value: 1,
    labels: {},
    timestamp: Date.now(),
  });
}

/**
 * Record a retry metric (convenience wrapper)
 */
export function recordRetry(
  tier: 'tier1' | 'tier2' | 'tier3',
  operation: string,
  attempt: number,
  totalAttempts: number,
  succeeded: boolean,
  options: {
    projectId?: string;
  } = {}
): void {
  metricsCollector.recordRetry({
    tier,
    status: succeeded ? 'success' : 'failure',
    operation,
    attempt,
    totalAttempts,
    succeeded,
    projectId: options.projectId,
    value: 1,
    labels: {},
    timestamp: Date.now(),
  });
}

/**
 * Record a rollback metric (convenience wrapper)
 */
export function recordRollback(
  tier: 'tier1' | 'tier2' | 'tier3',
  reason: string,
  duration: number,
  filesAffected: number,
  options: {
    fromVersion?: number;
    toVersion?: number;
    projectId?: string;
  } = {}
): void {
  metricsCollector.recordRollback({
    tier,
    status: 'success',
    reason,
    duration,
    filesAffected,
    fromVersion: options.fromVersion,
    toVersion: options.toVersion,
    projectId: options.projectId,
    value: 1,
    labels: {},
    timestamp: Date.now(),
  });
}
