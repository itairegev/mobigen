/**
 * Metrics Collection
 *
 * Prometheus-compatible metrics for Mobigen services.
 * Provides counters, gauges, histograms, and summaries.
 */

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface MetricLabels {
  [key: string]: string;
}

export interface MetricValue {
  value: number;
  labels: MetricLabels;
  timestamp: number;
}

export interface HistogramBuckets {
  buckets: number[];
  counts: Map<number, number>;
  sum: number;
  count: number;
}

export interface MetricDefinition {
  name: string;
  type: MetricType;
  help: string;
  labelNames?: string[];
}

/**
 * Base metric class
 */
abstract class Metric {
  readonly name: string;
  readonly type: MetricType;
  readonly help: string;
  readonly labelNames: string[];

  constructor(definition: MetricDefinition) {
    this.name = definition.name;
    this.type = definition.type;
    this.help = definition.help;
    this.labelNames = definition.labelNames || [];
  }

  protected getLabelKey(labels: MetricLabels): string {
    return JSON.stringify(labels);
  }

  abstract collect(): MetricValue[];
}

/**
 * Counter - monotonically increasing value
 */
export class Counter extends Metric {
  private values: Map<string, number> = new Map();

  constructor(definition: Omit<MetricDefinition, 'type'>) {
    super({ ...definition, type: 'counter' });
  }

  inc(labels: MetricLabels = {}, value: number = 1): void {
    if (value < 0) {
      throw new Error('Counter can only be incremented');
    }
    const key = this.getLabelKey(labels);
    this.values.set(key, (this.values.get(key) || 0) + value);
  }

  get(labels: MetricLabels = {}): number {
    return this.values.get(this.getLabelKey(labels)) || 0;
  }

  reset(): void {
    this.values.clear();
  }

  collect(): MetricValue[] {
    const result: MetricValue[] = [];
    const timestamp = Date.now();

    for (const [key, value] of this.values) {
      result.push({
        value,
        labels: JSON.parse(key),
        timestamp,
      });
    }

    return result;
  }
}

/**
 * Gauge - value that can go up and down
 */
export class Gauge extends Metric {
  private values: Map<string, number> = new Map();

  constructor(definition: Omit<MetricDefinition, 'type'>) {
    super({ ...definition, type: 'gauge' });
  }

  set(labels: MetricLabels = {}, value: number): void {
    this.values.set(this.getLabelKey(labels), value);
  }

  inc(labels: MetricLabels = {}, value: number = 1): void {
    const key = this.getLabelKey(labels);
    this.values.set(key, (this.values.get(key) || 0) + value);
  }

  dec(labels: MetricLabels = {}, value: number = 1): void {
    const key = this.getLabelKey(labels);
    this.values.set(key, (this.values.get(key) || 0) - value);
  }

  get(labels: MetricLabels = {}): number {
    return this.values.get(this.getLabelKey(labels)) || 0;
  }

  reset(): void {
    this.values.clear();
  }

  collect(): MetricValue[] {
    const result: MetricValue[] = [];
    const timestamp = Date.now();

    for (const [key, value] of this.values) {
      result.push({
        value,
        labels: JSON.parse(key),
        timestamp,
      });
    }

    return result;
  }

  /**
   * Track async function execution and set gauge to duration
   */
  async trackDuration<T>(
    fn: () => Promise<T>,
    labels: MetricLabels = {}
  ): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.set(labels, Date.now() - start);
    }
  }
}

/**
 * Histogram - distribution of values in buckets
 */
export class Histogram extends Metric {
  private bucketBoundaries: number[];
  private data: Map<string, HistogramBuckets> = new Map();

  constructor(
    definition: Omit<MetricDefinition, 'type'>,
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ) {
    super({ ...definition, type: 'histogram' });
    this.bucketBoundaries = [...buckets].sort((a, b) => a - b);
  }

  private getOrCreateBuckets(labels: MetricLabels): HistogramBuckets {
    const key = this.getLabelKey(labels);
    if (!this.data.has(key)) {
      const counts = new Map<number, number>();
      for (const bucket of this.bucketBoundaries) {
        counts.set(bucket, 0);
      }
      counts.set(Infinity, 0);
      this.data.set(key, { buckets: this.bucketBoundaries, counts, sum: 0, count: 0 });
    }
    return this.data.get(key)!;
  }

  observe(labels: MetricLabels = {}, value: number): void {
    const buckets = this.getOrCreateBuckets(labels);
    buckets.sum += value;
    buckets.count++;

    for (const bucket of this.bucketBoundaries) {
      if (value <= bucket) {
        buckets.counts.set(bucket, (buckets.counts.get(bucket) || 0) + 1);
      }
    }
    buckets.counts.set(Infinity, (buckets.counts.get(Infinity) || 0) + 1);
  }

  /**
   * Time an async function and record duration
   */
  async time<T>(fn: () => Promise<T>, labels: MetricLabels = {}): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.observe(labels, (Date.now() - start) / 1000);
    }
  }

  /**
   * Start a timer that records when stopped
   */
  startTimer(labels: MetricLabels = {}): () => number {
    const start = Date.now();
    return () => {
      const duration = (Date.now() - start) / 1000;
      this.observe(labels, duration);
      return duration;
    };
  }

  reset(): void {
    this.data.clear();
  }

  collect(): MetricValue[] {
    const result: MetricValue[] = [];
    const timestamp = Date.now();

    for (const [key, buckets] of this.data) {
      const labels = JSON.parse(key);

      // Emit bucket values
      for (const [le, count] of buckets.counts) {
        result.push({
          value: count,
          labels: { ...labels, le: le === Infinity ? '+Inf' : String(le) },
          timestamp,
        });
      }

      // Emit sum
      result.push({
        value: buckets.sum,
        labels: { ...labels, __name__: `${this.name}_sum` },
        timestamp,
      });

      // Emit count
      result.push({
        value: buckets.count,
        labels: { ...labels, __name__: `${this.name}_count` },
        timestamp,
      });
    }

    return result;
  }
}

/**
 * Metrics Registry - collects and exports all metrics
 */
export class MetricsRegistry {
  private metrics: Map<string, Metric> = new Map();

  register<T extends Metric>(metric: T): T {
    if (this.metrics.has(metric.name)) {
      throw new Error(`Metric ${metric.name} already registered`);
    }
    this.metrics.set(metric.name, metric);
    return metric;
  }

  get(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Export metrics in Prometheus text format
   */
  export(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      for (const value of metric.collect()) {
        const labelStr = Object.entries(value.labels)
          .filter(([k]) => !k.startsWith('__'))
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');

        const name = value.labels.__name__ || metric.name;
        const suffix = metric.type === 'histogram' && value.labels.le ? '_bucket' : '';

        if (labelStr) {
          lines.push(`${name}${suffix}{${labelStr}} ${value.value}`);
        } else {
          lines.push(`${name}${suffix} ${value.value}`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Export metrics as JSON
   */
  exportJson(): Record<string, MetricValue[]> {
    const result: Record<string, MetricValue[]> = {};

    for (const [name, metric] of this.metrics) {
      result[name] = metric.collect();
    }

    return result;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    for (const metric of this.metrics.values()) {
      if ('reset' in metric && typeof metric.reset === 'function') {
        (metric as { reset: () => void }).reset();
      }
    }
  }
}

/**
 * Default registry instance
 */
export const defaultRegistry = new MetricsRegistry();

/**
 * Pre-defined Mobigen metrics
 */
export const mobigenMetrics = {
  // Generation metrics
  generationDuration: new Histogram(
    {
      name: 'mobigen_generation_duration_seconds',
      help: 'Duration of app generation in seconds',
      labelNames: ['template', 'status'],
    },
    [1, 5, 10, 30, 60, 120, 300, 600]
  ),

  generationTotal: new Counter({
    name: 'mobigen_generation_total',
    help: 'Total number of app generations',
    labelNames: ['template', 'status'],
  }),

  activeGenerations: new Gauge({
    name: 'mobigen_active_generations',
    help: 'Number of currently active generations',
  }),

  // Build metrics
  buildDuration: new Histogram(
    {
      name: 'mobigen_build_duration_seconds',
      help: 'Duration of builds in seconds',
      labelNames: ['platform', 'status'],
    },
    [30, 60, 120, 300, 600, 900, 1800]
  ),

  buildTotal: new Counter({
    name: 'mobigen_build_total',
    help: 'Total number of builds',
    labelNames: ['platform', 'status'],
  }),

  // API metrics
  apiRequestDuration: new Histogram(
    {
      name: 'mobigen_api_request_duration_seconds',
      help: 'API request duration in seconds',
      labelNames: ['method', 'path', 'status'],
    },
    [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
  ),

  apiRequestTotal: new Counter({
    name: 'mobigen_api_request_total',
    help: 'Total number of API requests',
    labelNames: ['method', 'path', 'status'],
  }),

  // Validation metrics
  validationDuration: new Histogram(
    {
      name: 'mobigen_validation_duration_seconds',
      help: 'Validation duration in seconds',
      labelNames: ['tier', 'status'],
    },
    [0.5, 1, 5, 10, 30, 60, 120]
  ),

  validationTotal: new Counter({
    name: 'mobigen_validation_total',
    help: 'Total number of validations',
    labelNames: ['tier', 'status'],
  }),

  // Circuit breaker metrics
  circuitBreakerState: new Gauge({
    name: 'mobigen_circuit_breaker_state',
    help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
    labelNames: ['name'],
  }),

  // Queue metrics
  queueSize: new Gauge({
    name: 'mobigen_queue_size',
    help: 'Number of jobs in queue',
    labelNames: ['status'],
  }),

  queueJobDuration: new Histogram(
    {
      name: 'mobigen_queue_job_duration_seconds',
      help: 'Queue job duration in seconds',
      labelNames: ['status'],
    },
    [1, 5, 10, 30, 60, 120, 300, 600]
  ),
};

// Register all default metrics
for (const metric of Object.values(mobigenMetrics)) {
  defaultRegistry.register(metric);
}
