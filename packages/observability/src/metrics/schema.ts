/**
 * Metrics Schema Definitions
 *
 * Defines metric types, interfaces, and structures for quality metrics collection.
 */

/**
 * Type of metric being collected
 */
export enum MetricType {
  /** Monotonically increasing counter (e.g., total validations) */
  COUNTER = 'counter',

  /** Value that can increase or decrease (e.g., active jobs) */
  GAUGE = 'gauge',

  /** Distribution of values in buckets (e.g., duration percentiles) */
  HISTOGRAM = 'histogram',

  /** Summary statistics with quantiles (e.g., response time summary) */
  SUMMARY = 'summary',
}

/**
 * Dimensional labels for metrics
 *
 * Labels allow grouping and filtering metrics by various dimensions.
 * Common labels: tier, status, projectId, template, agent
 */
export interface MetricLabels {
  [key: string]: string | number | boolean;
}

/**
 * Single metric data point with timestamp
 */
export interface MetricValue {
  /** Numeric value of the metric */
  value: number;

  /** Dimensional labels for this value */
  labels: MetricLabels;

  /** Unix timestamp in milliseconds */
  timestamp: number;
}

/**
 * Quality-specific metric for validation operations
 */
export interface QualityMetric extends MetricValue {
  /** Quality tier (tier1, tier2, tier3) */
  tier: 'tier1' | 'tier2' | 'tier3';

  /** Operation status (success, failure, error) */
  status: 'success' | 'failure' | 'error';

  /** Project ID this metric belongs to */
  projectId?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Validation metric data
 */
export interface ValidationMetric extends QualityMetric {
  /** Duration of validation in milliseconds */
  duration: number;

  /** Number of errors found */
  errorCount: number;

  /** Number of warnings found */
  warningCount: number;

  /** Validation stage (typescript, eslint, build, etc.) */
  stage?: string;
}

/**
 * Auto-fix metric data
 */
export interface AutoFixMetric extends QualityMetric {
  /** Duration of fix attempt in milliseconds */
  duration: number;

  /** Number of errors attempted to fix */
  errorsAttempted: number;

  /** Number of errors successfully fixed */
  errorsFixed: number;

  /** Fix strategy used */
  strategy?: string;
}

/**
 * Retry metric data
 */
export interface RetryMetric extends QualityMetric {
  /** Retry attempt number (1, 2, 3) */
  attempt: number;

  /** Total retry attempts for this operation */
  totalAttempts: number;

  /** Operation being retried */
  operation: string;

  /** Whether retry succeeded */
  succeeded: boolean;
}

/**
 * Rollback metric data
 */
export interface RollbackMetric extends QualityMetric {
  /** Reason for rollback */
  reason: string;

  /** Version rolled back from */
  fromVersion?: number;

  /** Version rolled back to */
  toVersion?: number;

  /** Number of files affected */
  filesAffected: number;

  /** Duration of rollback in milliseconds */
  duration: number;
}

/**
 * Aggregated metric statistics
 */
export interface MetricStats {
  /** Total count of values */
  count: number;

  /** Sum of all values */
  sum: number;

  /** Minimum value */
  min: number;

  /** Maximum value */
  max: number;

  /** Average value */
  avg: number;

  /** Median value (50th percentile) */
  median: number;

  /** 95th percentile */
  p95: number;

  /** 99th percentile */
  p99: number;
}

/**
 * Time series data point
 */
export interface TimeSeriesPoint {
  /** Timestamp in milliseconds */
  timestamp: number;

  /** Metric value at this time */
  value: number;

  /** Labels for this data point */
  labels?: MetricLabels;
}

/**
 * Time series data for a metric
 */
export interface TimeSeries {
  /** Metric name */
  metric: string;

  /** Data points in chronological order */
  points: TimeSeriesPoint[];

  /** Statistics for this series */
  stats?: MetricStats;
}

/**
 * Histogram bucket definition
 */
export interface HistogramBucket {
  /** Upper bound of this bucket (le = less than or equal) */
  le: number;

  /** Count of values in this bucket */
  count: number;
}

/**
 * Histogram data structure
 */
export interface HistogramData {
  /** Buckets with counts */
  buckets: HistogramBucket[];

  /** Sum of all observed values */
  sum: number;

  /** Total count of observations */
  count: number;

  /** Labels for this histogram */
  labels: MetricLabels;
}

/**
 * Quality metrics summary
 */
export interface QualityMetricsSummary {
  /** Time range for this summary */
  timeRange: {
    start: number;
    end: number;
  };

  /** Validation statistics */
  validation: {
    totalRuns: number;
    successRate: number;
    avgDuration: number;
    errorsByTier: Record<string, number>;
  };

  /** Auto-fix statistics */
  autoFix: {
    totalAttempts: number;
    successRate: number;
    avgDuration: number;
    errorsByType: Record<string, number>;
  };

  /** Retry statistics */
  retry: {
    totalAttempts: number;
    successRate: number;
    avgAttemptsPerOperation: number;
  };

  /** Rollback statistics */
  rollback: {
    totalRollbacks: number;
    reasonBreakdown: Record<string, number>;
    avgFilesAffected: number;
  };
}

/**
 * Metric export format
 */
export enum MetricFormat {
  /** Prometheus text format */
  PROMETHEUS = 'prometheus',

  /** JSON format */
  JSON = 'json',

  /** OpenMetrics format */
  OPENMETRICS = 'openmetrics',
}
