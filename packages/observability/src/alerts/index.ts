/**
 * Alert System
 *
 * Orchestrates alert evaluation, notification, and history tracking.
 */

import type { MetricsData } from './evaluator';
import type { AlertRule, TriggeredAlert } from './rules';
import type { NotificationChannel } from './channels/types';
import { AlertEvaluator } from './evaluator';
import { AlertHistory, AlertStatus } from './history';
import { defaultAlertRules } from './rules';
import { defaultRegistry } from '../metrics';

/**
 * Alert manager configuration
 */
export interface AlertManagerConfig {
  /** Alert rules to monitor */
  rules?: AlertRule[];

  /** Notification channels */
  channels?: NotificationChannel[];

  /** Evaluation interval in milliseconds */
  evaluationIntervalMs?: number;

  /** Batch alerts by severity */
  batchAlerts?: boolean;

  /** Batch window in milliseconds */
  batchWindowMs?: number;

  /** Auto-cleanup resolved alerts older than this (ms) */
  cleanupIntervalMs?: number;

  /** Enable alert history */
  enableHistory?: boolean;
}

/**
 * Alert manager
 *
 * Orchestrates the complete alert lifecycle:
 * - Evaluates rules against metrics
 * - Sends notifications via configured channels
 * - Tracks alert history and acknowledgments
 * - Manages snoozing and auto-wake
 */
export class AlertManager {
  private config: Required<AlertManagerConfig>;
  private evaluator: AlertEvaluator;
  private history: AlertHistory;
  private channels: NotificationChannel[];

  private monitoringInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private batchBuffer: Map<string, TriggeredAlert[]> = new Map();
  private batchTimer?: NodeJS.Timeout;

  constructor(config: AlertManagerConfig = {}) {
    this.config = {
      rules: config.rules || defaultAlertRules,
      channels: config.channels || [],
      evaluationIntervalMs: config.evaluationIntervalMs || 60000, // 1 minute
      batchAlerts: config.batchAlerts ?? true,
      batchWindowMs: config.batchWindowMs || 5000, // 5 seconds
      cleanupIntervalMs: config.cleanupIntervalMs || 3600000, // 1 hour
      enableHistory: config.enableHistory ?? true,
    };

    this.evaluator = new AlertEvaluator();
    this.history = new AlertHistory();
    this.channels = this.config.channels;
  }

  /**
   * Add a notification channel
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
  }

  /**
   * Remove a notification channel
   */
  removeChannel(channel: NotificationChannel): void {
    const index = this.channels.indexOf(channel);
    if (index > -1) {
      this.channels.splice(index, 1);
    }
  }

  /**
   * Add an alert rule
   */
  addRule(rule: AlertRule): void {
    const existingIndex = this.config.rules.findIndex((r) => r.id === rule.id);
    if (existingIndex > -1) {
      this.config.rules[existingIndex] = rule;
    } else {
      this.config.rules.push(rule);
    }
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): void {
    this.config.rules = this.config.rules.filter((r) => r.id !== ruleId);
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs?: number): void {
    if (this.monitoringInterval) {
      throw new Error('Monitoring is already running');
    }

    const interval = intervalMs || this.config.evaluationIntervalMs;

    // Initial check
    this.manualCheck().catch((error) =>
      console.error('Alert check failed:', error)
    );

    // Set up periodic checks
    this.monitoringInterval = setInterval(() => {
      this.manualCheck().catch((error) =>
        console.error('Alert check failed:', error)
      );
    }, interval);

    // Set up cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);

    console.log(
      `Alert monitoring started (interval: ${interval}ms, rules: ${this.config.rules.length})`
    );
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    console.log('Alert monitoring stopped');
  }

  /**
   * Perform manual check (on-demand evaluation)
   */
  async manualCheck(): Promise<TriggeredAlert[]> {
    // Wake up expired snoozes
    if (this.config.enableHistory) {
      const woken = this.history.wakeExpiredSnoozes();
      if (woken > 0) {
        console.log(`Woke up ${woken} snoozed alert${woken > 1 ? 's' : ''}`);
      }
    }

    // Collect current metrics
    const metrics = this.collectMetrics();

    // Evaluate all rules
    const results = this.evaluator.evaluate(this.config.rules, metrics);

    // Filter triggered alerts
    const triggeredAlerts = results
      .filter((r) => r.triggered && r.alert)
      .map((r) => r.alert!);

    // Record in history
    if (this.config.enableHistory) {
      for (const alert of triggeredAlerts) {
        this.history.record(alert);
      }
    }

    // Send notifications
    if (triggeredAlerts.length > 0) {
      if (this.config.batchAlerts) {
        this.batchAlert(triggeredAlerts);
      } else {
        await this.sendAlerts(triggeredAlerts);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Collect current metrics from registry
   */
  private collectMetrics(): MetricsData {
    const json = defaultRegistry.exportJson();
    const metrics: MetricsData = {};

    for (const [name, values] of Object.entries(json)) {
      metrics[name] = values;
    }

    return metrics;
  }

  /**
   * Batch alerts for bulk notification
   */
  private batchAlert(alerts: TriggeredAlert[]): void {
    // Group by severity for batching
    for (const alert of alerts) {
      const severity = alert.rule.severity;
      if (!this.batchBuffer.has(severity)) {
        this.batchBuffer.set(severity, []);
      }
      this.batchBuffer.get(severity)!.push(alert);
    }

    // Reset batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Set timer to flush batch
    this.batchTimer = setTimeout(() => {
      this.flushBatch().catch((error) =>
        console.error('Failed to flush alert batch:', error)
      );
    }, this.config.batchWindowMs);
  }

  /**
   * Flush batched alerts
   */
  private async flushBatch(): Promise<void> {
    const allAlerts: TriggeredAlert[] = [];

    for (const alerts of this.batchBuffer.values()) {
      allAlerts.push(...alerts);
    }

    if (allAlerts.length > 0) {
      await this.sendAlerts(allAlerts);
    }

    this.batchBuffer.clear();
    this.batchTimer = undefined;
  }

  /**
   * Send alerts to all channels
   */
  private async sendAlerts(alerts: TriggeredAlert[]): Promise<void> {
    if (this.channels.length === 0) {
      console.warn('No notification channels configured, alerts not sent:', {
        count: alerts.length,
        alerts: alerts.map((a) => a.rule.name),
      });
      return;
    }

    const sendPromises: Promise<void>[] = [];

    for (const channel of this.channels) {
      if (alerts.length > 1 && channel.sendBatch) {
        // Use batch send if supported
        sendPromises.push(
          channel.sendBatch(alerts).catch((error) => {
            console.error('Channel batch send failed:', error);
          })
        );
      } else {
        // Send individually
        for (const alert of alerts) {
          sendPromises.push(
            channel.send(alert).catch((error) => {
              console.error('Channel send failed:', error);
            })
          );
        }
      }
    }

    await Promise.allSettled(sendPromises);

    console.log(
      `Sent ${alerts.length} alert${alerts.length > 1 ? 's' : ''} to ${this.channels.length} channel${this.channels.length > 1 ? 's' : ''}`
    );
  }

  /**
   * Acknowledge an alert
   */
  acknowledge(
    alertId: string,
    acknowledgedBy: string,
    note?: string
  ): boolean {
    if (!this.config.enableHistory) {
      return false;
    }

    const entry = this.history.acknowledge(alertId, acknowledgedBy, note);
    return entry !== undefined;
  }

  /**
   * Snooze an alert
   */
  snooze(alertId: string, durationMs: number, snoozedBy: string): boolean {
    if (!this.config.enableHistory) {
      return false;
    }

    const entry = this.history.snooze(alertId, durationMs, snoozedBy);
    return entry !== undefined;
  }

  /**
   * Resolve an alert
   */
  resolve(alertId: string, resolution?: string): boolean {
    if (!this.config.enableHistory) {
      return false;
    }

    const entry = this.history.resolve(alertId, resolution);
    return entry !== undefined;
  }

  /**
   * Get alert history
   */
  getHistory() {
    return this.history;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    if (!this.config.enableHistory) {
      return [];
    }

    return this.history.getActive();
  }

  /**
   * Get statistics
   */
  getStatistics() {
    if (!this.config.enableHistory) {
      return null;
    }

    return this.history.getStatistics();
  }

  /**
   * Clean up old resolved alerts
   */
  private cleanup(): void {
    if (!this.config.enableHistory) {
      return;
    }

    // Clean up alerts older than 7 days
    const olderThanMs = 7 * 24 * 60 * 60 * 1000;
    const removed = this.history.cleanup(olderThanMs);

    if (removed > 0) {
      console.log(`Cleaned up ${removed} old alert${removed > 1 ? 's' : ''}`);
    }
  }

  /**
   * Test all notification channels
   */
  async testChannels(): Promise<Record<number, boolean>> {
    const results: Record<number, boolean> = {};

    for (let i = 0; i < this.channels.length; i++) {
      const channel = this.channels[i];
      if (channel.test) {
        try {
          results[i] = await channel.test();
        } catch (error) {
          console.error(`Channel ${i} test failed:`, error);
          results[i] = false;
        }
      } else {
        results[i] = true; // No test method, assume working
      }
    }

    return results;
  }
}

// Export all types and classes
export * from './rules';
export * from './evaluator';
export * from './history';
export * from './channels/types';
export { SlackChannel } from './channels/slack';
export { EmailChannel } from './channels/email';
