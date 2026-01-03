/**
 * Metrics Collector
 *
 * Thread-safe metric collection with buffering and batching.
 * Collects metrics in memory and periodically flushes to storage.
 */

import {
  MetricType,
  type MetricLabels,
  type MetricValue,
  type QualityMetric,
  type ValidationMetric,
  type AutoFixMetric,
  type RetryMetric,
  type RollbackMetric,
  type HistogramData,
} from './schema';

/**
 * Collector configuration options
 */
export interface CollectorOptions {
  /** Maximum number of metrics to buffer before auto-flush */
  bufferSize?: number;

  /** Auto-flush interval in milliseconds (0 = disabled) */
  flushInterval?: number;

  /** Enable thread-safe collection (uses locks) */
  threadSafe?: boolean;

  /** Custom metric prefix */
  prefix?: string;

  /** Default labels applied to all metrics */
  defaultLabels?: MetricLabels;
}

/**
 * Internal metric buffer entry
 */
interface MetricEntry {
  name: string;
  type: MetricType;
  value: number;
  labels: MetricLabels;
  timestamp: number;
}

/**
 * Histogram state
 */
interface HistogramState {
  buckets: Map<number, number>;
  sum: number;
  count: number;
  bucketBoundaries: number[];
}

/**
 * MetricsCollector - collects and buffers metrics before storage
 */
export class MetricsCollector {
  private buffer: MetricEntry[] = [];
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, HistogramState> = new Map();
  private flushTimer?: NodeJS.Timeout;
  private lock = false;

  /** Default histogram buckets (in seconds) */
  private static readonly DEFAULT_BUCKETS = [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300,
  ];

  constructor(private options: CollectorOptions = {}) {
    const {
      bufferSize = 1000,
      flushInterval = 10000, // 10 seconds
      threadSafe = true,
      prefix = 'mobigen',
      defaultLabels = {},
    } = options;

    this.options = {
      bufferSize,
      flushInterval,
      threadSafe,
      prefix,
      defaultLabels,
    };

    // Start auto-flush timer if enabled
    if (this.options.flushInterval && this.options.flushInterval > 0) {
      this.startAutoFlush();
    }
  }

  /**
   * Record a generic metric value
   */
  record(
    name: string,
    type: MetricType,
    value: number,
    labels: MetricLabels = {}
  ): void {
    this.withLock(() => {
      const fullName = this.prefixName(name);
      const allLabels = { ...this.options.defaultLabels, ...labels };
      const timestamp = Date.now();

      this.buffer.push({
        name: fullName,
        type,
        value,
        labels: allLabels,
        timestamp,
      });

      // Auto-flush if buffer is full
      if (
        this.options.bufferSize &&
        this.buffer.length >= this.options.bufferSize
      ) {
        this.flush();
      }
    });
  }

  /**
   * Increment a counter metric
   */
  increment(name: string, labels: MetricLabels = {}, value: number = 1): void {
    this.withLock(() => {
      const key = this.getMetricKey(name, labels);
      this.counters.set(key, (this.counters.get(key) || 0) + value);

      this.record(name, MetricType.COUNTER, value, labels);
    });
  }

  /**
   * Set a gauge metric value
   */
  gauge(name: string, value: number, labels: MetricLabels = {}): void {
    this.withLock(() => {
      const key = this.getMetricKey(name, labels);
      this.gauges.set(key, value);

      this.record(name, MetricType.GAUGE, value, labels);
    });
  }

  /**
   * Observe a value in a histogram
   */
  observe(
    name: string,
    value: number,
    labels: MetricLabels = {},
    buckets: number[] = MetricsCollector.DEFAULT_BUCKETS
  ): void {
    this.withLock(() => {
      const key = this.getMetricKey(name, labels);
      let histogram = this.histograms.get(key);

      if (!histogram) {
        const bucketMap = new Map<number, number>();
        for (const boundary of buckets) {
          bucketMap.set(boundary, 0);
        }
        bucketMap.set(Infinity, 0); // +Inf bucket

        histogram = {
          buckets: bucketMap,
          sum: 0,
          count: 0,
          bucketBoundaries: [...buckets].sort((a, b) => a - b),
        };
        this.histograms.set(key, histogram);
      }

      // Update histogram
      histogram.sum += value;
      histogram.count++;

      // Increment appropriate buckets
      for (const boundary of histogram.bucketBoundaries) {
        if (value <= boundary) {
          histogram.buckets.set(
            boundary,
            (histogram.buckets.get(boundary) || 0) + 1
          );
        }
      }
      histogram.buckets.set(
        Infinity,
        (histogram.buckets.get(Infinity) || 0) + 1
      );

      this.record(name, MetricType.HISTOGRAM, value, labels);
    });
  }

  /**
   * Record a validation metric
   */
  recordValidation(metric: ValidationMetric): void {
    const labels: MetricLabels = {
      tier: metric.tier,
      status: metric.status,
      ...(metric.projectId && { projectId: metric.projectId }),
      ...(metric.stage && { stage: metric.stage }),
    };

    this.increment('validation.runs', labels);

    if (metric.status === 'success') {
      this.increment('validation.success', labels);
    } else {
      this.increment('validation.failure', labels);
    }

    this.observe('validation.duration', metric.duration / 1000, labels);
    this.gauge('validation.errors', metric.errorCount, labels);
    this.gauge('validation.warnings', metric.warningCount, labels);
  }

  /**
   * Record an auto-fix metric
   */
  recordAutoFix(metric: AutoFixMetric): void {
    const labels: MetricLabels = {
      tier: metric.tier,
      status: metric.status,
      ...(metric.projectId && { projectId: metric.projectId }),
      ...(metric.strategy && { strategy: metric.strategy }),
    };

    this.increment('autofix.attempts', labels);

    if (metric.status === 'success') {
      this.increment('autofix.success', labels);
    }

    this.observe('autofix.duration', metric.duration / 1000, labels);
    this.gauge('autofix.errors_attempted', metric.errorsAttempted, labels);
    this.gauge('autofix.errors_fixed', metric.errorsFixed, labels);
  }

  /**
   * Record a retry metric
   */
  recordRetry(metric: RetryMetric): void {
    const labels: MetricLabels = {
      tier: metric.tier,
      operation: metric.operation,
      ...(metric.projectId && { projectId: metric.projectId }),
    };

    this.increment('retry.attempts', labels);
    this.gauge('retry.attempt_number', metric.attempt, labels);

    if (metric.succeeded) {
      this.increment('retry.success', labels);
    }
  }

  /**
   * Record a rollback metric
   */
  recordRollback(metric: RollbackMetric): void {
    const labels: MetricLabels = {
      tier: metric.tier,
      reason: metric.reason,
      ...(metric.projectId && { projectId: metric.projectId }),
    };

    this.increment('rollback.executions', labels);
    this.observe('rollback.duration', metric.duration / 1000, labels);
    this.gauge('rollback.files_affected', metric.filesAffected, labels);

    if (metric.fromVersion && metric.toVersion) {
      this.gauge(
        'rollback.version_delta',
        metric.fromVersion - metric.toVersion,
        labels
      );
    }
  }

  /**
   * Get current counter value
   */
  getCounter(name: string, labels: MetricLabels = {}): number {
    const key = this.getMetricKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get current gauge value
   */
  getGauge(name: string, labels: MetricLabels = {}): number {
    const key = this.getMetricKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get histogram data
   */
  getHistogram(name: string, labels: MetricLabels = {}): HistogramData | null {
    const key = this.getMetricKey(name, labels);
    const histogram = this.histograms.get(key);

    if (!histogram) {
      return null;
    }

    return {
      buckets: Array.from(histogram.buckets.entries()).map(([le, count]) => ({
        le,
        count,
      })),
      sum: histogram.sum,
      count: histogram.count,
      labels,
    };
  }

  /**
   * Flush buffered metrics and return them
   */
  flush(): MetricValue[] {
    return this.withLock(() => {
      const metrics = this.buffer.map((entry) => ({
        value: entry.value,
        labels: entry.labels,
        timestamp: entry.timestamp,
      }));

      this.buffer = [];
      return metrics;
    });
  }

  /**
   * Get all buffered metrics without flushing
   */
  getBuffered(): MetricValue[] {
    return this.buffer.map((entry) => ({
      value: entry.value,
      labels: entry.labels,
      timestamp: entry.timestamp,
    }));
  }

  /**
   * Clear all metrics and buffers
   */
  reset(): void {
    this.withLock(() => {
      this.buffer = [];
      this.counters.clear();
      this.gauges.clear();
      this.histograms.clear();
    });
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Stop auto-flush timer
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    if (!this.options.flushInterval) return;

    this.flushTimer = setInterval(() => {
      const metrics = this.flush();
      if (metrics.length > 0) {
        // Emit event for storage to handle
        this.emit('flush', metrics);
      }
    }, this.options.flushInterval);
  }

  /**
   * Event emitter for flush events
   */
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();

  on(event: string, handler: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.listeners.get(event) || [];
    for (const handler of handlers) {
      handler(data);
    }
  }

  /**
   * Prefix metric name
   */
  private prefixName(name: string): string {
    return this.options.prefix ? `${this.options.prefix}.${name}` : name;
  }

  /**
   * Generate unique key for metric + labels
   */
  private getMetricKey(name: string, labels: MetricLabels): string {
    const sortedLabels = Object.keys(labels)
      .sort()
      .map((key) => `${key}=${labels[key]}`)
      .join(',');

    return `${this.prefixName(name)}{${sortedLabels}}`;
  }

  /**
   * Execute function with lock (if thread-safe enabled)
   */
  private withLock<T>(fn: () => T): T {
    if (!this.options.threadSafe) {
      return fn();
    }

    // Simple spin lock
    while (this.lock) {
      // Wait
    }

    this.lock = true;
    try {
      return fn();
    } finally {
      this.lock = false;
    }
  }
}

/**
 * Create a new metrics collector instance
 */
export function createCollector(options?: CollectorOptions): MetricsCollector {
  return new MetricsCollector(options);
}
