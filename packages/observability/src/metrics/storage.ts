/**
 * Metrics Storage
 *
 * Time-series storage interface for metrics data.
 * Provides in-memory implementation and interface for ClickHouse/TimescaleDB.
 */

import type {
  MetricValue,
  MetricLabels,
  TimeSeries,
  TimeSeriesPoint,
  MetricStats,
} from './schema';

/**
 * Query time range
 */
export interface TimeRange {
  /** Start timestamp (inclusive) */
  start: number;

  /** End timestamp (inclusive) */
  end: number;
}

/**
 * Query filter for metrics
 */
export interface MetricQuery {
  /** Metric name pattern (supports wildcards) */
  metric: string;

  /** Label filters (AND condition) */
  labels?: MetricLabels;

  /** Time range for query */
  timeRange: TimeRange;

  /** Aggregation window in milliseconds */
  aggregationWindow?: number;

  /** Maximum number of results to return */
  limit?: number;
}

/**
 * Aggregation function type
 */
export enum AggregationFunction {
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  P50 = 'p50',
  P95 = 'p95',
  P99 = 'p99',
}

/**
 * Aggregation query
 */
export interface AggregationQuery extends MetricQuery {
  /** Aggregation function to apply */
  aggregation: AggregationFunction;

  /** Group by labels */
  groupBy?: string[];
}

/**
 * Metrics storage interface
 */
export interface MetricsStorage {
  /**
   * Write metric values to storage
   */
  write(metrics: MetricValue[]): Promise<void>;

  /**
   * Query time series data
   */
  query(query: MetricQuery): Promise<TimeSeries[]>;

  /**
   * Query aggregated data
   */
  aggregate(query: AggregationQuery): Promise<Record<string, number>>;

  /**
   * Calculate statistics for a metric
   */
  stats(metric: string, timeRange: TimeRange, labels?: MetricLabels): Promise<MetricStats>;

  /**
   * Delete metrics matching criteria
   */
  delete(metric: string, timeRange: TimeRange, labels?: MetricLabels): Promise<number>;

  /**
   * Get storage health status
   */
  health(): Promise<{ healthy: boolean; message?: string }>;

  /**
   * Close storage connection
   */
  close(): Promise<void>;
}

/**
 * In-memory metrics storage implementation
 *
 * Suitable for development and testing.
 * Production should use ClickHouse or TimescaleDB.
 */
export class InMemoryMetricsStorage implements MetricsStorage {
  private data: Map<string, TimeSeriesPoint[]> = new Map();
  private readonly maxDataPoints: number;

  constructor(options: { maxDataPoints?: number } = {}) {
    this.maxDataPoints = options.maxDataPoints || 100000;
  }

  /**
   * Write metrics to in-memory storage
   */
  async write(metrics: MetricValue[]): Promise<void> {
    for (const metric of metrics) {
      const key = this.getStorageKey(metric);
      const points = this.data.get(key) || [];

      points.push({
        timestamp: metric.timestamp,
        value: metric.value,
        labels: metric.labels,
      });

      // Sort by timestamp
      points.sort((a, b) => a.timestamp - b.timestamp);

      // Trim if exceeds max
      if (points.length > this.maxDataPoints) {
        points.splice(0, points.length - this.maxDataPoints);
      }

      this.data.set(key, points);
    }
  }

  /**
   * Query time series data
   */
  async query(query: MetricQuery): Promise<TimeSeries[]> {
    const results: TimeSeries[] = [];
    const metricPattern = this.createPattern(query.metric);

    for (const [key, points] of this.data.entries()) {
      if (!this.matchesPattern(key, metricPattern)) {
        continue;
      }

      // Filter by time range and labels
      const filteredPoints = points.filter((point) => {
        if (
          point.timestamp < query.timeRange.start ||
          point.timestamp > query.timeRange.end
        ) {
          return false;
        }

        if (query.labels) {
          return this.matchesLabels(point.labels, query.labels);
        }

        return true;
      });

      if (filteredPoints.length === 0) {
        continue;
      }

      // Apply aggregation window if specified
      const aggregatedPoints = query.aggregationWindow
        ? this.aggregatePoints(filteredPoints, query.aggregationWindow)
        : filteredPoints;

      // Apply limit
      const limitedPoints = query.limit
        ? aggregatedPoints.slice(0, query.limit)
        : aggregatedPoints;

      results.push({
        metric: this.getMetricName(key),
        points: limitedPoints,
        stats: this.calculateStats(limitedPoints.map((p) => p.value)),
      });
    }

    return results;
  }

  /**
   * Query aggregated data
   */
  async aggregate(query: AggregationQuery): Promise<Record<string, number>> {
    const series = await this.query(query);
    const results: Record<string, number> = {};

    for (const s of series) {
      const values = s.points.map((p) => p.value);
      const aggregatedValue = this.applyAggregation(
        values,
        query.aggregation
      );

      const key = query.groupBy
        ? this.getGroupKey(s.points[0]?.labels || {}, query.groupBy)
        : s.metric;

      results[key] = aggregatedValue;
    }

    return results;
  }

  /**
   * Calculate statistics for a metric
   */
  async stats(
    metric: string,
    timeRange: TimeRange,
    labels?: MetricLabels
  ): Promise<MetricStats> {
    const series = await this.query({
      metric,
      timeRange,
      labels,
    });

    if (series.length === 0) {
      return {
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        avg: 0,
        median: 0,
        p95: 0,
        p99: 0,
      };
    }

    const allValues = series.flatMap((s) => s.points.map((p) => p.value));
    return this.calculateStats(allValues);
  }

  /**
   * Delete metrics
   */
  async delete(
    metric: string,
    timeRange: TimeRange,
    labels?: MetricLabels
  ): Promise<number> {
    let deletedCount = 0;
    const metricPattern = this.createPattern(metric);

    for (const [key, points] of this.data.entries()) {
      if (!this.matchesPattern(key, metricPattern)) {
        continue;
      }

      const originalLength = points.length;

      const remainingPoints = points.filter((point) => {
        const inTimeRange =
          point.timestamp >= timeRange.start &&
          point.timestamp <= timeRange.end;

        const matchesLabelFilter = labels
          ? this.matchesLabels(point.labels, labels)
          : true;

        return !(inTimeRange && matchesLabelFilter);
      });

      deletedCount += originalLength - remainingPoints.length;

      if (remainingPoints.length === 0) {
        this.data.delete(key);
      } else {
        this.data.set(key, remainingPoints);
      }
    }

    return deletedCount;
  }

  /**
   * Health check
   */
  async health(): Promise<{ healthy: boolean; message?: string }> {
    const totalPoints = Array.from(this.data.values()).reduce(
      (sum, points) => sum + points.length,
      0
    );

    return {
      healthy: true,
      message: `In-memory storage with ${this.data.size} metrics and ${totalPoints} data points`,
    };
  }

  /**
   * Close storage (no-op for in-memory)
   */
  async close(): Promise<void> {
    this.data.clear();
  }

  /**
   * Get current data size
   */
  getSize(): { metrics: number; dataPoints: number } {
    const dataPoints = Array.from(this.data.values()).reduce(
      (sum, points) => sum + points.length,
      0
    );

    return {
      metrics: this.data.size,
      dataPoints,
    };
  }

  /**
   * Generate storage key for metric
   */
  private getStorageKey(metric: MetricValue): string {
    const labelStr = Object.entries(metric.labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return labelStr ? `metric{${labelStr}}` : 'metric';
  }

  /**
   * Get metric name from storage key
   */
  private getMetricName(key: string): string {
    return key.split('{')[0] || key;
  }

  /**
   * Create regex pattern from metric name (supports wildcards)
   */
  private createPattern(metric: string): RegExp {
    const escaped = metric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = escaped.replace(/\\\*/g, '.*');
    return new RegExp(`^${pattern}`);
  }

  /**
   * Check if key matches pattern
   */
  private matchesPattern(key: string, pattern: RegExp): boolean {
    const metricName = this.getMetricName(key);
    return pattern.test(metricName);
  }

  /**
   * Check if labels match filter
   */
  private matchesLabels(
    labels: MetricLabels | undefined,
    filter: MetricLabels
  ): boolean {
    if (!labels) return false;

    for (const [key, value] of Object.entries(filter)) {
      if (labels[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Aggregate points into time windows
   */
  private aggregatePoints(
    points: TimeSeriesPoint[],
    windowMs: number
  ): TimeSeriesPoint[] {
    const windows: Map<number, number[]> = new Map();

    for (const point of points) {
      const windowStart = Math.floor(point.timestamp / windowMs) * windowMs;
      const values = windows.get(windowStart) || [];
      values.push(point.value);
      windows.set(windowStart, values);
    }

    return Array.from(windows.entries()).map(([timestamp, values]) => ({
      timestamp,
      value: values.reduce((sum, v) => sum + v, 0) / values.length,
    }));
  }

  /**
   * Apply aggregation function to values
   */
  private applyAggregation(
    values: number[],
    aggregation: AggregationFunction
  ): number {
    if (values.length === 0) return 0;

    switch (aggregation) {
      case AggregationFunction.SUM:
        return values.reduce((sum, v) => sum + v, 0);

      case AggregationFunction.AVG:
        return values.reduce((sum, v) => sum + v, 0) / values.length;

      case AggregationFunction.MIN:
        return Math.min(...values);

      case AggregationFunction.MAX:
        return Math.max(...values);

      case AggregationFunction.COUNT:
        return values.length;

      case AggregationFunction.P50:
        return this.percentile(values, 50);

      case AggregationFunction.P95:
        return this.percentile(values, 95);

      case AggregationFunction.P99:
        return this.percentile(values, 99);

      default:
        return 0;
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate statistics for values
   */
  private calculateStats(values: number[]): MetricStats {
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        avg: 0,
        median: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);

    return {
      count: values.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
    };
  }

  /**
   * Generate group key from labels
   */
  private getGroupKey(labels: MetricLabels, groupBy: string[]): string {
    return groupBy
      .map((key) => `${key}=${labels[key] || 'unknown'}`)
      .join(',');
  }
}

/**
 * Create in-memory storage instance
 */
export function createInMemoryStorage(
  options?: { maxDataPoints?: number }
): InMemoryMetricsStorage {
  return new InMemoryMetricsStorage(options);
}

/**
 * ClickHouse storage interface (for future implementation)
 */
export interface ClickHouseStorageOptions {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  table?: string;
}

/**
 * Placeholder for ClickHouse storage implementation
 */
export class ClickHouseMetricsStorage implements MetricsStorage {
  constructor(private options: ClickHouseStorageOptions) {}

  async write(metrics: MetricValue[]): Promise<void> {
    throw new Error('ClickHouse storage not implemented yet');
  }

  async query(query: MetricQuery): Promise<TimeSeries[]> {
    throw new Error('ClickHouse storage not implemented yet');
  }

  async aggregate(query: AggregationQuery): Promise<Record<string, number>> {
    throw new Error('ClickHouse storage not implemented yet');
  }

  async stats(
    metric: string,
    timeRange: TimeRange,
    labels?: MetricLabels
  ): Promise<MetricStats> {
    throw new Error('ClickHouse storage not implemented yet');
  }

  async delete(
    metric: string,
    timeRange: TimeRange,
    labels?: MetricLabels
  ): Promise<number> {
    throw new Error('ClickHouse storage not implemented yet');
  }

  async health(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: false, message: 'Not implemented' };
  }

  async close(): Promise<void> {
    // No-op
  }
}
