/**
 * Alert History
 *
 * Tracks fired alerts, acknowledgments, and snoozing.
 */

import type { TriggeredAlert } from './rules';
import { AlertSeverity } from './rules';

/**
 * Alert status
 */
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  SNOOZED = 'snoozed',
  RESOLVED = 'resolved',
}

/**
 * Alert history entry
 */
export interface AlertHistoryEntry {
  /** Alert details */
  alert: TriggeredAlert;

  /** Current status */
  status: AlertStatus;

  /** When the alert was recorded */
  recordedAt: number;

  /** When the alert was acknowledged (if applicable) */
  acknowledgedAt?: number;

  /** Who acknowledged the alert */
  acknowledgedBy?: string;

  /** Acknowledgment note */
  acknowledgmentNote?: string;

  /** When the alert was snoozed until (if applicable) */
  snoozedUntil?: number;

  /** Who snoozed the alert */
  snoozedBy?: string;

  /** When the alert was resolved */
  resolvedAt?: number;

  /** How the alert was resolved */
  resolution?: string;
}

/**
 * Alert query options
 */
export interface AlertQueryOptions {
  /** Filter by status */
  status?: AlertStatus[];

  /** Filter by severity */
  severity?: AlertSeverity[];

  /** Filter by rule ID */
  ruleId?: string;

  /** Start time (timestamp) */
  startTime?: number;

  /** End time (timestamp) */
  endTime?: number;

  /** Maximum results */
  limit?: number;

  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Alert history manager
 */
export class AlertHistory {
  private entries: Map<string, AlertHistoryEntry> = new Map();
  private ruleIndex: Map<string, Set<string>> = new Map();
  private statusIndex: Map<AlertStatus, Set<string>> = new Map();

  /**
   * Record a new alert
   */
  record(alert: TriggeredAlert): AlertHistoryEntry {
    const entry: AlertHistoryEntry = {
      alert,
      status: AlertStatus.ACTIVE,
      recordedAt: Date.now(),
    };

    this.entries.set(alert.id, entry);
    this.updateIndices(alert.id, entry);

    return entry;
  }

  /**
   * Acknowledge an alert
   */
  acknowledge(
    alertId: string,
    acknowledgedBy: string,
    note?: string
  ): AlertHistoryEntry | undefined {
    const entry = this.entries.get(alertId);
    if (!entry) return undefined;

    // Can only acknowledge active or snoozed alerts
    if (
      entry.status !== AlertStatus.ACTIVE &&
      entry.status !== AlertStatus.SNOOZED
    ) {
      return entry;
    }

    const previousStatus = entry.status;
    entry.status = AlertStatus.ACKNOWLEDGED;
    entry.acknowledgedAt = Date.now();
    entry.acknowledgedBy = acknowledgedBy;
    entry.acknowledgmentNote = note;

    this.updateStatusIndex(alertId, previousStatus, entry.status);

    return entry;
  }

  /**
   * Snooze an alert
   */
  snooze(
    alertId: string,
    durationMs: number,
    snoozedBy: string
  ): AlertHistoryEntry | undefined {
    const entry = this.entries.get(alertId);
    if (!entry) return undefined;

    // Can only snooze active alerts
    if (entry.status !== AlertStatus.ACTIVE) {
      return entry;
    }

    const previousStatus = entry.status;
    entry.status = AlertStatus.SNOOZED;
    entry.snoozedUntil = Date.now() + durationMs;
    entry.snoozedBy = snoozedBy;

    this.updateStatusIndex(alertId, previousStatus, entry.status);

    return entry;
  }

  /**
   * Resolve an alert
   */
  resolve(
    alertId: string,
    resolution?: string
  ): AlertHistoryEntry | undefined {
    const entry = this.entries.get(alertId);
    if (!entry) return undefined;

    const previousStatus = entry.status;
    entry.status = AlertStatus.RESOLVED;
    entry.resolvedAt = Date.now();
    entry.resolution = resolution;

    this.updateStatusIndex(alertId, previousStatus, entry.status);

    return entry;
  }

  /**
   * Get alert by ID
   */
  get(alertId: string): AlertHistoryEntry | undefined {
    return this.entries.get(alertId);
  }

  /**
   * Query alerts with filters
   */
  query(options: AlertQueryOptions = {}): AlertHistoryEntry[] {
    let results = Array.from(this.entries.values());

    // Filter by status
    if (options.status && options.status.length > 0) {
      const statusSet = new Set(options.status);
      results = results.filter((entry) => statusSet.has(entry.status));
    }

    // Filter by severity
    if (options.severity && options.severity.length > 0) {
      const severitySet = new Set(options.severity);
      results = results.filter((entry) =>
        severitySet.has(entry.alert.rule.severity)
      );
    }

    // Filter by rule ID
    if (options.ruleId) {
      results = results.filter(
        (entry) => entry.alert.rule.id === options.ruleId
      );
    }

    // Filter by time range
    if (options.startTime) {
      results = results.filter(
        (entry) => entry.alert.timestamp >= options.startTime!
      );
    }
    if (options.endTime) {
      results = results.filter(
        (entry) => entry.alert.timestamp <= options.endTime!
      );
    }

    // Sort
    const sortOrder = options.sortOrder || 'desc';
    results.sort((a, b) => {
      const diff = a.alert.timestamp - b.alert.timestamp;
      return sortOrder === 'asc' ? diff : -diff;
    });

    // Limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get recent alerts (last N hours)
   */
  getRecent(hours: number = 24): AlertHistoryEntry[] {
    const startTime = Date.now() - hours * 60 * 60 * 1000;

    return this.query({
      startTime,
      sortOrder: 'desc',
    });
  }

  /**
   * Get active alerts
   */
  getActive(): AlertHistoryEntry[] {
    return this.query({
      status: [AlertStatus.ACTIVE],
    });
  }

  /**
   * Get snoozed alerts that should wake up
   */
  getSnoozedExpired(): AlertHistoryEntry[] {
    const now = Date.now();
    return this.query({
      status: [AlertStatus.SNOOZED],
    }).filter((entry) => entry.snoozedUntil && entry.snoozedUntil <= now);
  }

  /**
   * Wake up expired snoozes
   */
  wakeExpiredSnoozes(): number {
    const expired = this.getSnoozedExpired();
    let count = 0;

    for (const entry of expired) {
      const previousStatus = entry.status;
      entry.status = AlertStatus.ACTIVE;
      entry.snoozedUntil = undefined;
      this.updateStatusIndex(entry.alert.id, previousStatus, entry.status);
      count++;
    }

    return count;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    total: number;
    byStatus: Record<AlertStatus, number>;
    bySeverity: Record<AlertSeverity, number>;
  } {
    const stats = {
      total: this.entries.size,
      byStatus: {
        [AlertStatus.ACTIVE]: 0,
        [AlertStatus.ACKNOWLEDGED]: 0,
        [AlertStatus.SNOOZED]: 0,
        [AlertStatus.RESOLVED]: 0,
      },
      bySeverity: {
        [AlertSeverity.INFO]: 0,
        [AlertSeverity.WARNING]: 0,
        [AlertSeverity.CRITICAL]: 0,
      },
    };

    for (const entry of this.entries.values()) {
      stats.byStatus[entry.status]++;
      stats.bySeverity[entry.alert.rule.severity]++;
    }

    return stats;
  }

  /**
   * Clean up old resolved alerts
   */
  cleanup(olderThanMs: number): number {
    const cutoff = Date.now() - olderThanMs;
    let removed = 0;

    for (const [alertId, entry] of this.entries) {
      if (
        entry.status === AlertStatus.RESOLVED &&
        entry.resolvedAt &&
        entry.resolvedAt < cutoff
      ) {
        this.entries.delete(alertId);
        this.removeFromIndices(alertId, entry);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Clear all alerts
   */
  clear(): void {
    this.entries.clear();
    this.ruleIndex.clear();
    this.statusIndex.clear();
  }

  /**
   * Update all indices for an entry
   */
  private updateIndices(alertId: string, entry: AlertHistoryEntry): void {
    // Rule index
    const ruleId = entry.alert.rule.id;
    if (!this.ruleIndex.has(ruleId)) {
      this.ruleIndex.set(ruleId, new Set());
    }
    this.ruleIndex.get(ruleId)!.add(alertId);

    // Status index
    if (!this.statusIndex.has(entry.status)) {
      this.statusIndex.set(entry.status, new Set());
    }
    this.statusIndex.get(entry.status)!.add(alertId);
  }

  /**
   * Update status index when status changes
   */
  private updateStatusIndex(
    alertId: string,
    oldStatus: AlertStatus,
    newStatus: AlertStatus
  ): void {
    // Remove from old status
    const oldSet = this.statusIndex.get(oldStatus);
    if (oldSet) {
      oldSet.delete(alertId);
    }

    // Add to new status
    if (!this.statusIndex.has(newStatus)) {
      this.statusIndex.set(newStatus, new Set());
    }
    this.statusIndex.get(newStatus)!.add(alertId);
  }

  /**
   * Remove from all indices
   */
  private removeFromIndices(
    alertId: string,
    entry: AlertHistoryEntry
  ): void {
    // Rule index
    const ruleSet = this.ruleIndex.get(entry.alert.rule.id);
    if (ruleSet) {
      ruleSet.delete(alertId);
    }

    // Status index
    const statusSet = this.statusIndex.get(entry.status);
    if (statusSet) {
      statusSet.delete(alertId);
    }
  }

  /**
   * Export history as JSON
   */
  export(): AlertHistoryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Import history from JSON
   */
  import(entries: AlertHistoryEntry[]): void {
    this.clear();
    for (const entry of entries) {
      this.entries.set(entry.alert.id, entry);
      this.updateIndices(entry.alert.id, entry);
    }
  }
}
