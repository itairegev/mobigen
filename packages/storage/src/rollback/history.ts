/**
 * Rollback history tracking
 *
 * Maintains history of snapshots and rollback operations
 */

import { Snapshot, getSnapshotSize } from './snapshot';

export interface RollbackEvent {
  id: string;
  snapshotId: string;
  timestamp: number;
  reason: string;
  filesRestored: number;
  success: boolean;
  error?: string;
}

export interface HistoryEntry {
  snapshot: Snapshot;
  rollbackEvents: RollbackEvent[];
}

/**
 * In-memory history store
 * In production, this would use Redis or S3
 */
class RollbackHistory {
  private snapshots: Map<string, Snapshot> = new Map();
  private rollbackEvents: RollbackEvent[] = [];
  private maxSnapshots: number = 10;

  /**
   * Store a snapshot
   */
  store(snapshot: Snapshot): void {
    // Add to storage
    this.snapshots.set(snapshot.id, snapshot);

    // Enforce max snapshots limit (FIFO)
    if (this.snapshots.size > this.maxSnapshots) {
      const oldestId = Array.from(this.snapshots.keys())[0];
      this.snapshots.delete(oldestId);
    }
  }

  /**
   * Get a snapshot by ID
   */
  get(snapshotId: string): Snapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  /**
   * Get the latest snapshot for a project
   */
  getLatest(projectId: string): Snapshot | undefined {
    const projectSnapshots = Array.from(this.snapshots.values())
      .filter(s => s.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt);

    return projectSnapshots[0];
  }

  /**
   * Get all snapshots for a project
   */
  getAllForProject(projectId: string): Snapshot[] {
    return Array.from(this.snapshots.values())
      .filter(s => s.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Record a rollback event
   */
  recordRollback(event: RollbackEvent): void {
    this.rollbackEvents.push(event);
  }

  /**
   * Get rollback history for a project
   */
  getRollbackHistory(projectId: string): RollbackEvent[] {
    const projectSnapshotIds = new Set(
      Array.from(this.snapshots.values())
        .filter(s => s.projectId === projectId)
        .map(s => s.id)
    );

    return this.rollbackEvents
      .filter(e => projectSnapshotIds.has(e.snapshotId))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete a snapshot
   */
  delete(snapshotId: string): boolean {
    return this.snapshots.delete(snapshotId);
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalSnapshots: number;
    totalRollbacks: number;
    totalSize: number;
  } {
    const totalSize = Array.from(this.snapshots.values())
      .reduce((sum, s) => sum + getSnapshotSize(s), 0);

    return {
      totalSnapshots: this.snapshots.size,
      totalRollbacks: this.rollbackEvents.length,
      totalSize,
    };
  }

  /**
   * Clear all history (for testing)
   */
  clear(): void {
    this.snapshots.clear();
    this.rollbackEvents = [];
  }

  /**
   * Set max snapshots limit
   */
  setMaxSnapshots(max: number): void {
    this.maxSnapshots = max;
  }
}

// Singleton instance
export const rollbackHistory = new RollbackHistory();

/**
 * Generate rollback event ID
 */
export function generateRollbackEventId(): string {
  return `rb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
