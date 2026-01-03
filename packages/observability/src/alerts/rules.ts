/**
 * Alert Rule Definitions
 *
 * Defines alert rules for monitoring quality metrics degradation.
 * Rules specify conditions and thresholds that trigger alerts.
 */

import type { MetricValue } from '../metrics';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Comparison operators for alert conditions
 */
export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

/**
 * Alert rule definition
 */
export interface AlertRule {
  /** Unique rule identifier */
  id: string;

  /** Human-readable rule name */
  name: string;

  /** Description of what this rule monitors */
  description: string;

  /** Metric name to monitor */
  metricName: string;

  /** Labels to filter metrics (optional) */
  metricLabels?: Record<string, string>;

  /** Condition to check */
  condition: ComparisonOperator;

  /** Threshold value */
  threshold: number;

  /** Severity level */
  severity: AlertSeverity;

  /** Time window for evaluation (in milliseconds) */
  windowMs?: number;

  /** Minimum number of samples required */
  minSamples?: number;

  /** Runbook URL for resolution steps */
  runbookUrl?: string;

  /** Tags for categorization */
  tags?: string[];
}

/**
 * Triggered alert
 */
export interface TriggeredAlert {
  /** Rule that triggered */
  rule: AlertRule;

  /** Metric value that triggered the alert */
  value: number;

  /** Timestamp when alert was triggered */
  timestamp: number;

  /** Alert message */
  message: string;

  /** Unique alert ID */
  id: string;

  /** Labels from the metric */
  labels?: Record<string, string>;
}

/**
 * Pre-defined alert rules for Mobigen quality metrics
 */
export const defaultAlertRules: AlertRule[] = [
  // Validation Success Rate
  {
    id: 'validation_success_low',
    name: 'Low Validation Success Rate',
    description: 'Alert when validation success rate drops below 95%',
    metricName: 'mobigen_validation_total',
    condition: 'lt',
    threshold: 0.95,
    severity: AlertSeverity.CRITICAL,
    windowMs: 5 * 60 * 1000, // 5 minutes
    minSamples: 10,
    runbookUrl: 'https://docs.mobigen.io/runbooks/validation-success-low',
    tags: ['validation', 'quality', 'critical'],
  },

  // Auto-fix Failure Rate
  {
    id: 'autofix_failure_high',
    name: 'High Auto-fix Failure Rate',
    description: 'Alert when auto-fix failure rate exceeds 20%',
    metricName: 'mobigen_validation_total',
    metricLabels: { status: 'failed' },
    condition: 'gt',
    threshold: 0.2,
    severity: AlertSeverity.WARNING,
    windowMs: 10 * 60 * 1000, // 10 minutes
    minSamples: 5,
    runbookUrl: 'https://docs.mobigen.io/runbooks/autofix-failure-high',
    tags: ['autofix', 'quality', 'warning'],
  },

  // Validation Duration (P95)
  {
    id: 'validation_slow',
    name: 'Slow Validation Performance',
    description: 'Alert when P95 validation duration exceeds 60 seconds',
    metricName: 'mobigen_validation_duration_seconds',
    condition: 'gt',
    threshold: 60,
    severity: AlertSeverity.WARNING,
    windowMs: 15 * 60 * 1000, // 15 minutes
    minSamples: 20,
    runbookUrl: 'https://docs.mobigen.io/runbooks/validation-slow',
    tags: ['performance', 'validation', 'warning'],
  },

  // Retry Exhaustion Rate
  {
    id: 'retry_exhausted',
    name: 'High Retry Exhaustion Rate',
    description: 'Alert when retry exhaustion rate exceeds 5%',
    metricName: 'mobigen_validation_total',
    metricLabels: { status: 'retry_exhausted' },
    condition: 'gt',
    threshold: 0.05,
    severity: AlertSeverity.CRITICAL,
    windowMs: 5 * 60 * 1000, // 5 minutes
    minSamples: 20,
    runbookUrl: 'https://docs.mobigen.io/runbooks/retry-exhausted',
    tags: ['retry', 'quality', 'critical'],
  },

  // Generation Success Rate
  {
    id: 'generation_success_low',
    name: 'Low Generation Success Rate',
    description: 'Alert when generation success rate drops below 90%',
    metricName: 'mobigen_generation_total',
    condition: 'lt',
    threshold: 0.9,
    severity: AlertSeverity.CRITICAL,
    windowMs: 10 * 60 * 1000, // 10 minutes
    minSamples: 10,
    runbookUrl: 'https://docs.mobigen.io/runbooks/generation-success-low',
    tags: ['generation', 'quality', 'critical'],
  },

  // Build Success Rate
  {
    id: 'build_success_low',
    name: 'Low Build Success Rate',
    description: 'Alert when build success rate drops below 99%',
    metricName: 'mobigen_build_total',
    condition: 'lt',
    threshold: 0.99,
    severity: AlertSeverity.CRITICAL,
    windowMs: 15 * 60 * 1000, // 15 minutes
    minSamples: 5,
    runbookUrl: 'https://docs.mobigen.io/runbooks/build-success-low',
    tags: ['build', 'quality', 'critical'],
  },

  // API Error Rate
  {
    id: 'api_error_rate_high',
    name: 'High API Error Rate',
    description: 'Alert when API error rate exceeds 1%',
    metricName: 'mobigen_api_request_total',
    metricLabels: { status: '5xx' },
    condition: 'gt',
    threshold: 0.01,
    severity: AlertSeverity.WARNING,
    windowMs: 5 * 60 * 1000, // 5 minutes
    minSamples: 100,
    runbookUrl: 'https://docs.mobigen.io/runbooks/api-error-rate-high',
    tags: ['api', 'reliability', 'warning'],
  },

  // Queue Size
  {
    id: 'queue_size_high',
    name: 'High Queue Size',
    description: 'Alert when queue size exceeds 100 pending jobs',
    metricName: 'mobigen_queue_size',
    metricLabels: { status: 'pending' },
    condition: 'gt',
    threshold: 100,
    severity: AlertSeverity.WARNING,
    windowMs: 5 * 60 * 1000, // 5 minutes
    runbookUrl: 'https://docs.mobigen.io/runbooks/queue-size-high',
    tags: ['queue', 'capacity', 'warning'],
  },

  // Circuit Breaker Open
  {
    id: 'circuit_breaker_open',
    name: 'Circuit Breaker Open',
    description: 'Alert when circuit breaker is in open state',
    metricName: 'mobigen_circuit_breaker_state',
    condition: 'eq',
    threshold: 2, // 0=closed, 1=half-open, 2=open
    severity: AlertSeverity.CRITICAL,
    runbookUrl: 'https://docs.mobigen.io/runbooks/circuit-breaker-open',
    tags: ['circuit-breaker', 'reliability', 'critical'],
  },
];

/**
 * Helper functions for calculating derived metrics
 */
export class MetricCalculator {
  /**
   * Calculate success rate from counter metrics
   */
  static calculateSuccessRate(
    successCount: number,
    failureCount: number
  ): number {
    const total = successCount + failureCount;
    return total > 0 ? successCount / total : 1;
  }

  /**
   * Calculate P95 from histogram buckets
   */
  static calculateP95(buckets: Map<number, number>): number {
    const sortedBuckets = Array.from(buckets.entries()).sort(
      ([a], [b]) => a - b
    );

    const totalCount = Array.from(buckets.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    if (totalCount === 0) return 0;

    const p95Threshold = totalCount * 0.95;
    let cumulativeCount = 0;

    for (const [bucket, count] of sortedBuckets) {
      cumulativeCount += count;
      if (cumulativeCount >= p95Threshold) {
        return bucket;
      }
    }

    return sortedBuckets[sortedBuckets.length - 1][0];
  }

  /**
   * Calculate rate from counter over time window
   */
  static calculateRate(
    currentValue: number,
    previousValue: number,
    windowMs: number
  ): number {
    const delta = currentValue - previousValue;
    const windowSeconds = windowMs / 1000;
    return delta / windowSeconds;
  }
}
