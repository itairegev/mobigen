/**
 * Alert Rule Evaluator
 *
 * Evaluates alert rules against current metrics to determine
 * if any alerts should be triggered.
 */

import type { MetricValue } from '../metrics';
import type {
  AlertRule,
  TriggeredAlert,
  ComparisonOperator,
} from './rules';
import { MetricCalculator } from './rules';

/**
 * Alert evaluation result
 */
export interface AlertResult {
  /** Rule that was evaluated */
  rule: AlertRule;

  /** Whether the rule triggered */
  triggered: boolean;

  /** Current metric value */
  currentValue: number;

  /** Threshold that was checked */
  threshold: number;

  /** Evaluation timestamp */
  timestamp: number;

  /** Alert details if triggered */
  alert?: TriggeredAlert;
}

/**
 * Metrics data for evaluation
 */
export interface MetricsData {
  [metricName: string]: MetricValue[];
}

/**
 * Alert rule evaluator
 */
export class AlertEvaluator {
  private evaluationHistory: Map<string, number[]> = new Map();
  private lastEvaluation: Map<string, number> = new Map();

  /**
   * Evaluate all rules against current metrics
   */
  evaluate(rules: AlertRule[], metrics: MetricsData): AlertResult[] {
    const results: AlertResult[] = [];
    const now = Date.now();

    for (const rule of rules) {
      try {
        const result = this.evaluateRule(rule, metrics, now);
        results.push(result);

        // Store evaluation result
        this.storeEvaluation(rule.id, result.currentValue, now);
      } catch (error) {
        console.error(`Failed to evaluate rule ${rule.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Evaluate a single rule
   */
  private evaluateRule(
    rule: AlertRule,
    metrics: MetricsData,
    timestamp: number
  ): AlertResult {
    // Get metric values
    const metricValues = this.getMetricValues(rule, metrics, timestamp);

    // Check if we have enough samples
    if (
      rule.minSamples &&
      metricValues.length < rule.minSamples
    ) {
      return {
        rule,
        triggered: false,
        currentValue: 0,
        threshold: rule.threshold,
        timestamp,
      };
    }

    // Calculate current value based on metric type
    const currentValue = this.calculateValue(rule, metricValues);

    // Check threshold
    const triggered = this.checkThreshold(
      currentValue,
      rule.condition,
      rule.threshold
    );

    const result: AlertResult = {
      rule,
      triggered,
      currentValue,
      threshold: rule.threshold,
      timestamp,
    };

    // Create alert if triggered
    if (triggered) {
      result.alert = this.createAlert(rule, currentValue, timestamp);
    }

    return result;
  }

  /**
   * Get metric values matching the rule
   */
  private getMetricValues(
    rule: AlertRule,
    metrics: MetricsData,
    timestamp: number
  ): MetricValue[] {
    const metricValues = metrics[rule.metricName] || [];

    // Filter by labels if specified
    let filtered = metricValues;
    if (rule.metricLabels) {
      filtered = metricValues.filter((value) =>
        this.matchesLabels(value.labels, rule.metricLabels!)
      );
    }

    // Filter by time window if specified
    if (rule.windowMs) {
      const cutoff = timestamp - rule.windowMs;
      filtered = filtered.filter((value) => value.timestamp >= cutoff);
    }

    return filtered;
  }

  /**
   * Check if metric labels match rule labels
   */
  private matchesLabels(
    metricLabels: Record<string, string>,
    ruleLabels: Record<string, string>
  ): boolean {
    return Object.entries(ruleLabels).every(
      ([key, value]) => metricLabels[key] === value
    );
  }

  /**
   * Calculate aggregated value from metric values
   */
  private calculateValue(
    rule: AlertRule,
    values: MetricValue[]
  ): number {
    if (values.length === 0) return 0;

    // For rate-based metrics (counters), calculate success rate
    if (rule.metricName.includes('_total')) {
      return this.calculateSuccessRate(rule, values);
    }

    // For duration metrics, calculate P95
    if (rule.metricName.includes('_duration_')) {
      return this.calculateP95(values);
    }

    // For gauges, use latest value
    if (rule.metricName.includes('_size') || rule.metricName.includes('_state')) {
      return values[values.length - 1].value;
    }

    // Default: average
    const sum = values.reduce((acc, v) => acc + v.value, 0);
    return sum / values.length;
  }

  /**
   * Calculate success rate from counter metrics
   */
  private calculateSuccessRate(
    rule: AlertRule,
    values: MetricValue[]
  ): number {
    // Group by success/failure labels
    const successLabels = ['success', 'completed', 'ok'];
    const failureLabels = ['failed', 'error', 'retry_exhausted'];

    let successCount = 0;
    let failureCount = 0;

    for (const value of values) {
      const status = value.labels.status?.toLowerCase() || '';

      if (successLabels.includes(status)) {
        successCount += value.value;
      } else if (failureLabels.includes(status)) {
        failureCount += value.value;
      }
    }

    return MetricCalculator.calculateSuccessRate(
      successCount,
      failureCount
    );
  }

  /**
   * Calculate P95 from histogram values
   */
  private calculateP95(values: MetricValue[]): number {
    // Extract bucket counts
    const buckets = new Map<number, number>();

    for (const value of values) {
      const le = value.labels.le;
      if (le && le !== '+Inf') {
        const bucket = parseFloat(le);
        buckets.set(bucket, (buckets.get(bucket) || 0) + value.value);
      }
    }

    return MetricCalculator.calculateP95(buckets);
  }

  /**
   * Check if value meets threshold condition
   */
  checkThreshold(
    value: number,
    operator: ComparisonOperator,
    threshold: number
  ): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return Math.abs(value - threshold) < 0.0001; // Float comparison
      case 'neq':
        return Math.abs(value - threshold) >= 0.0001;
      default:
        return false;
    }
  }

  /**
   * Create triggered alert
   */
  private createAlert(
    rule: AlertRule,
    value: number,
    timestamp: number
  ): TriggeredAlert {
    const id = `${rule.id}_${timestamp}`;

    let message = `${rule.name}: `;
    message += `${value.toFixed(2)} ${this.getOperatorSymbol(rule.condition)} ${rule.threshold}`;

    return {
      id,
      rule,
      value,
      timestamp,
      message,
      labels: rule.metricLabels,
    };
  }

  /**
   * Get human-readable operator symbol
   */
  private getOperatorSymbol(operator: ComparisonOperator): string {
    const symbols: Record<ComparisonOperator, string> = {
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      eq: '=',
      neq: '!=',
    };
    return symbols[operator];
  }

  /**
   * Store evaluation result for trend analysis
   */
  private storeEvaluation(
    ruleId: string,
    value: number,
    timestamp: number
  ): void {
    const history = this.evaluationHistory.get(ruleId) || [];

    // Keep last 100 evaluations
    history.push(value);
    if (history.length > 100) {
      history.shift();
    }

    this.evaluationHistory.set(ruleId, history);
    this.lastEvaluation.set(ruleId, timestamp);
  }

  /**
   * Get evaluation history for a rule
   */
  getHistory(ruleId: string): number[] {
    return this.evaluationHistory.get(ruleId) || [];
  }

  /**
   * Get last evaluation timestamp for a rule
   */
  getLastEvaluation(ruleId: string): number | undefined {
    return this.lastEvaluation.get(ruleId);
  }

  /**
   * Clear evaluation history
   */
  clearHistory(): void {
    this.evaluationHistory.clear();
    this.lastEvaluation.clear();
  }
}
