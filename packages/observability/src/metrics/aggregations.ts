/**
 * Metric Aggregations
 *
 * Query aggregations for quality metrics.
 * Provides high-level functions for common quality metric queries.
 */

import type { MetricsStorage } from './storage';
import type { MetricLabels, QualityMetricsSummary } from './schema';
import { AggregationFunction } from './storage';

/**
 * Quality metrics aggregator
 */
export class QualityMetricsAggregator {
  constructor(private storage: MetricsStorage) {}

  /**
   * Get validation success rate over time
   *
   * @param timeRange - Time range for analysis
   * @param tier - Optional tier filter (tier1, tier2, tier3)
   * @returns Success rate as percentage (0-100)
   */
  async getSuccessRate(
    timeRange: { start: number; end: number },
    tier?: 'tier1' | 'tier2' | 'tier3'
  ): Promise<number> {
    const labels: MetricLabels = tier ? { tier } : {};

    const [totalRuns, successRuns] = await Promise.all([
      this.storage.aggregate({
        metric: 'mobigen.validation.runs',
        timeRange,
        labels,
        aggregation: AggregationFunction.SUM,
      }),

      this.storage.aggregate({
        metric: 'mobigen.validation.success',
        timeRange,
        labels,
        aggregation: AggregationFunction.SUM,
      }),
    ]);

    const total = Object.values(totalRuns).reduce((sum, v) => sum + v, 0);
    const success = Object.values(successRuns).reduce((sum, v) => sum + v, 0);

    if (total === 0) return 0;
    return (success / total) * 100;
  }

  /**
   * Get auto-fix success rate
   *
   * @param timeRange - Time range for analysis
   * @param tier - Optional tier filter
   * @returns Success rate as percentage (0-100)
   */
  async getAutoFixRate(
    timeRange: { start: number; end: number },
    tier?: 'tier1' | 'tier2' | 'tier3'
  ): Promise<number> {
    const labels: MetricLabels = tier ? { tier } : {};

    const [totalAttempts, successAttempts] = await Promise.all([
      this.storage.aggregate({
        metric: 'mobigen.autofix.attempts',
        timeRange,
        labels,
        aggregation: AggregationFunction.SUM,
      }),

      this.storage.aggregate({
        metric: 'mobigen.autofix.success',
        timeRange,
        labels,
        aggregation: AggregationFunction.SUM,
      }),
    ]);

    const total = Object.values(totalAttempts).reduce((sum, v) => sum + v, 0);
    const success = Object.values(successAttempts).reduce(
      (sum, v) => sum + v,
      0
    );

    if (total === 0) return 0;
    return (success / total) * 100;
  }

  /**
   * Get retry statistics
   *
   * @param timeRange - Time range for analysis
   * @param operation - Optional operation filter
   * @returns Retry statistics
   */
  async getRetryStats(
    timeRange: { start: number; end: number },
    operation?: string
  ): Promise<{
    totalAttempts: number;
    successRate: number;
    avgAttemptsPerOperation: number;
  }> {
    const labels: MetricLabels = operation ? { operation } : {};

    const [totalAttempts, successAttempts] = await Promise.all([
      this.storage.aggregate({
        metric: 'mobigen.retry.attempts',
        timeRange,
        labels,
        aggregation: AggregationFunction.SUM,
      }),

      this.storage.aggregate({
        metric: 'mobigen.retry.success',
        timeRange,
        labels,
        aggregation: AggregationFunction.SUM,
      }),
    ]);

    const total = Object.values(totalAttempts).reduce((sum, v) => sum + v, 0);
    const success = Object.values(successAttempts).reduce(
      (sum, v) => sum + v,
      0
    );

    // Get unique operations count to calculate average
    const attemptsBySeries = await this.storage.query({
      metric: 'mobigen.retry.attempts',
      timeRange,
      labels,
    });

    const uniqueOperations = new Set(
      attemptsBySeries.flatMap((s) =>
        s.points.map((p) => p.labels?.operation || 'unknown')
      )
    ).size;

    return {
      totalAttempts: total,
      successRate: total > 0 ? (success / total) * 100 : 0,
      avgAttemptsPerOperation:
        uniqueOperations > 0 ? total / uniqueOperations : 0,
    };
  }

  /**
   * Get performance metrics (timing percentiles)
   *
   * @param metricName - Name of the metric to analyze
   * @param timeRange - Time range for analysis
   * @param labels - Optional label filters
   * @returns Performance percentiles
   */
  async getPerformanceMetrics(
    metricName: string,
    timeRange: { start: number; end: number },
    labels?: MetricLabels
  ): Promise<{
    avg: number;
    median: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  }> {
    const stats = await this.storage.stats(metricName, timeRange, labels);

    return {
      avg: stats.avg,
      median: stats.median,
      p95: stats.p95,
      p99: stats.p99,
      min: stats.min,
      max: stats.max,
    };
  }

  /**
   * Get validation duration percentiles
   *
   * @param timeRange - Time range for analysis
   * @param tier - Optional tier filter
   * @returns Duration percentiles in seconds
   */
  async getValidationDuration(
    timeRange: { start: number; end: number },
    tier?: 'tier1' | 'tier2' | 'tier3'
  ): Promise<{
    avg: number;
    median: number;
    p95: number;
    p99: number;
  }> {
    const labels: MetricLabels = tier ? { tier } : {};
    const metrics = await this.getPerformanceMetrics(
      'mobigen.validation.duration',
      timeRange,
      labels
    );

    return {
      avg: metrics.avg,
      median: metrics.median,
      p95: metrics.p95,
      p99: metrics.p99,
    };
  }

  /**
   * Get error breakdown by tier
   *
   * @param timeRange - Time range for analysis
   * @returns Errors grouped by tier
   */
  async getErrorsByTier(
    timeRange: { start: number; end: number }
  ): Promise<Record<string, number>> {
    const failures = await this.storage.aggregate({
      metric: 'mobigen.validation.failure',
      timeRange,
      aggregation: AggregationFunction.SUM,
      groupBy: ['tier'],
    });

    return failures;
  }

  /**
   * Get rollback statistics
   *
   * @param timeRange - Time range for analysis
   * @returns Rollback statistics
   */
  async getRollbackStats(
    timeRange: { start: number; end: number }
  ): Promise<{
    totalRollbacks: number;
    reasonBreakdown: Record<string, number>;
    avgFilesAffected: number;
    avgDuration: number;
  }> {
    const [totalRollbacks, rollbacksByReason, filesStats, durationStats] =
      await Promise.all([
        this.storage.aggregate({
          metric: 'mobigen.rollback.executions',
          timeRange,
          aggregation: AggregationFunction.SUM,
        }),

        this.storage.aggregate({
          metric: 'mobigen.rollback.executions',
          timeRange,
          aggregation: AggregationFunction.SUM,
          groupBy: ['reason'],
        }),

        this.storage.stats('mobigen.rollback.files_affected', timeRange),

        this.storage.stats('mobigen.rollback.duration', timeRange),
      ]);

    const total = Object.values(totalRollbacks).reduce(
      (sum, v) => sum + v,
      0
    );

    return {
      totalRollbacks: total,
      reasonBreakdown: rollbacksByReason,
      avgFilesAffected: filesStats.avg,
      avgDuration: durationStats.avg,
    };
  }

  /**
   * Get comprehensive quality metrics summary
   *
   * @param timeRange - Time range for analysis
   * @returns Complete quality metrics summary
   */
  async getQualitySummary(
    timeRange: { start: number; end: number }
  ): Promise<QualityMetricsSummary> {
    const [
      validationSuccessRate,
      validationDuration,
      errorsByTier,
      autoFixRate,
      autoFixDuration,
      retryStats,
      rollbackStats,
    ] = await Promise.all([
      this.getSuccessRate(timeRange),
      this.getValidationDuration(timeRange),
      this.getErrorsByTier(timeRange),
      this.getAutoFixRate(timeRange),
      this.getPerformanceMetrics(
        'mobigen.autofix.duration',
        timeRange
      ),
      this.getRetryStats(timeRange),
      this.getRollbackStats(timeRange),
    ]);

    // Get total validation runs
    const totalRunsResult = await this.storage.aggregate({
      metric: 'mobigen.validation.runs',
      timeRange,
      aggregation: AggregationFunction.SUM,
    });
    const totalRuns = Object.values(totalRunsResult).reduce(
      (sum, v) => sum + v,
      0
    );

    // Get total auto-fix attempts
    const totalAutoFixResult = await this.storage.aggregate({
      metric: 'mobigen.autofix.attempts',
      timeRange,
      aggregation: AggregationFunction.SUM,
    });
    const totalAutoFix = Object.values(totalAutoFixResult).reduce(
      (sum, v) => sum + v,
      0
    );

    // Get error types breakdown
    const errorsByTypeResult = await this.storage.aggregate({
      metric: 'mobigen.autofix.attempts',
      timeRange,
      aggregation: AggregationFunction.SUM,
      groupBy: ['strategy'],
    });

    return {
      timeRange: {
        start: timeRange.start,
        end: timeRange.end,
      },
      validation: {
        totalRuns,
        successRate: validationSuccessRate,
        avgDuration: validationDuration.avg,
        errorsByTier,
      },
      autoFix: {
        totalAttempts: totalAutoFix,
        successRate: autoFixRate,
        avgDuration: autoFixDuration.avg,
        errorsByType: errorsByTypeResult,
      },
      retry: {
        totalAttempts: retryStats.totalAttempts,
        successRate: retryStats.successRate,
        avgAttemptsPerOperation: retryStats.avgAttemptsPerOperation,
      },
      rollback: {
        totalRollbacks: rollbackStats.totalRollbacks,
        reasonBreakdown: rollbackStats.reasonBreakdown,
        avgFilesAffected: rollbackStats.avgFilesAffected,
      },
    };
  }

  /**
   * Get trend over time for a metric
   *
   * @param metricName - Name of the metric
   * @param timeRange - Time range for analysis
   * @param windowMs - Aggregation window in milliseconds
   * @param labels - Optional label filters
   * @returns Time series data points
   */
  async getTrend(
    metricName: string,
    timeRange: { start: number; end: number },
    windowMs: number,
    labels?: MetricLabels
  ): Promise<Array<{ timestamp: number; value: number }>> {
    const series = await this.storage.query({
      metric: metricName,
      timeRange,
      labels,
      aggregationWindow: windowMs,
    });

    if (series.length === 0) return [];

    // Merge all series into single trend
    const allPoints = series.flatMap((s) => s.points);

    // Sort by timestamp
    allPoints.sort((a, b) => a.timestamp - b.timestamp);

    return allPoints.map((p) => ({
      timestamp: p.timestamp,
      value: p.value,
    }));
  }

  /**
   * Compare metrics across two time periods
   *
   * @param metricName - Name of the metric
   * @param current - Current time range
   * @param previous - Previous time range
   * @param labels - Optional label filters
   * @returns Comparison results
   */
  async compareTimePeriods(
    metricName: string,
    current: { start: number; end: number },
    previous: { start: number; end: number },
    labels?: MetricLabels
  ): Promise<{
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  }> {
    const [currentStats, previousStats] = await Promise.all([
      this.storage.stats(metricName, current, labels),
      this.storage.stats(metricName, previous, labels),
    ]);

    const currentValue = currentStats.sum;
    const previousValue = previousStats.sum;
    const change = currentValue - previousValue;
    const changePercent =
      previousValue > 0 ? (change / previousValue) * 100 : 0;

    return {
      current: currentValue,
      previous: previousValue,
      change,
      changePercent,
    };
  }
}

/**
 * Create quality metrics aggregator
 */
export function createAggregator(
  storage: MetricsStorage
): QualityMetricsAggregator {
  return new QualityMetricsAggregator(storage);
}
