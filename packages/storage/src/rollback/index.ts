/**
 * Rollback Manager
 *
 * Captures snapshots before risky operations and enables rollback on failure.
 */

import {
  Snapshot,
  captureSnapshot,
  captureFullSnapshot,
  generateSnapshotId,
  serializeSnapshot,
  deserializeSnapshot,
} from './snapshot';

import {
  RestoreResult,
  restoreFromSnapshot,
  restoreSingleFile,
  compareWithSnapshot,
} from './restore';

import {
  rollbackHistory,
  generateRollbackEventId,
  RollbackEvent,
} from './history';

// Re-export types
export * from './snapshot';
export * from './restore';
export * from './history';

/**
 * Rollback Manager class
 */
export class RollbackManager {
  private currentSnapshot: Snapshot | null = null;

  /**
   * Create a snapshot before risky operation
   */
  async createSnapshot(
    projectRoot: string,
    files: string[],
    reason: string
  ): Promise<string> {
    const snapshot = await captureSnapshot(projectRoot, files, reason);
    this.currentSnapshot = snapshot;
    rollbackHistory.store(snapshot);

    console.log(`[Rollback] Snapshot created: ${snapshot.id} (${snapshot.files.length} files)`);

    return snapshot.id;
  }

  /**
   * Create a full project snapshot
   */
  async createFullSnapshot(
    projectRoot: string,
    reason: string
  ): Promise<string> {
    const snapshot = await captureFullSnapshot(projectRoot, reason);
    this.currentSnapshot = snapshot;
    rollbackHistory.store(snapshot);

    console.log(`[Rollback] Full snapshot created: ${snapshot.id} (${snapshot.files.length} files)`);

    return snapshot.id;
  }

  /**
   * Rollback to a snapshot
   */
  async rollback(
    projectRoot: string,
    snapshotId: string
  ): Promise<RestoreResult> {
    const snapshot = rollbackHistory.get(snapshotId);

    if (!snapshot) {
      return {
        success: false,
        filesRestored: 0,
        filesSkipped: 0,
        errors: [{ file: '', error: 'Snapshot not found' }],
        duration: 0,
      };
    }

    console.log(`[Rollback] Rolling back to snapshot: ${snapshotId}`);

    const result = await restoreFromSnapshot(snapshot, projectRoot);

    // Record rollback event
    const event: RollbackEvent = {
      id: generateRollbackEventId(),
      snapshotId,
      timestamp: Date.now(),
      reason: `Rollback: ${snapshot.reason}`,
      filesRestored: result.filesRestored,
      success: result.success,
      error: result.errors.length > 0 ? result.errors[0].error : undefined,
    };
    rollbackHistory.recordRollback(event);

    console.log(`[Rollback] ${result.success ? 'Success' : 'Failed'}: ${result.filesRestored} files restored in ${result.duration}ms`);

    return result;
  }

  /**
   * Rollback to the latest snapshot for a project
   */
  async rollbackToLatest(projectRoot: string): Promise<RestoreResult> {
    const projectId = require('path').basename(projectRoot);
    const snapshot = rollbackHistory.getLatest(projectId);

    if (!snapshot) {
      return {
        success: false,
        filesRestored: 0,
        filesSkipped: 0,
        errors: [{ file: '', error: 'No snapshot found for project' }],
        duration: 0,
      };
    }

    return this.rollback(projectRoot, snapshot.id);
  }

  /**
   * Get current snapshot
   */
  getCurrentSnapshot(): Snapshot | null {
    return this.currentSnapshot;
  }

  /**
   * Check what would change if we rolled back
   */
  async previewRollback(
    projectRoot: string,
    snapshotId: string
  ): Promise<{
    unchanged: string[];
    modified: string[];
    deleted: string[];
    added: string[];
  } | null> {
    const snapshot = rollbackHistory.get(snapshotId);

    if (!snapshot) {
      return null;
    }

    return compareWithSnapshot(snapshot, projectRoot);
  }

  /**
   * Get rollback history for a project
   */
  getHistory(projectId: string): {
    snapshots: Snapshot[];
    rollbackEvents: RollbackEvent[];
  } {
    return {
      snapshots: rollbackHistory.getAllForProject(projectId),
      rollbackEvents: rollbackHistory.getRollbackHistory(projectId),
    };
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId: string): boolean {
    return rollbackHistory.delete(snapshotId);
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalSnapshots: number;
    totalRollbacks: number;
    totalSize: number;
  } {
    return rollbackHistory.getStats();
  }
}

// Singleton instance
export const rollbackManager = new RollbackManager();

/**
 * Utility: Execute operation with automatic rollback on failure
 */
export async function withRollback<T>(
  projectRoot: string,
  files: string[],
  reason: string,
  operation: () => Promise<T>
): Promise<{ result: T | null; rolledBack: boolean; error?: string }> {
  // Create snapshot before operation
  const snapshotId = await rollbackManager.createSnapshot(projectRoot, files, reason);

  try {
    // Execute operation
    const result = await operation();
    return { result, rolledBack: false };
  } catch (error) {
    // Operation failed - rollback
    console.error(`[Rollback] Operation failed, rolling back: ${error}`);
    await rollbackManager.rollback(projectRoot, snapshotId);
    return { result: null, rolledBack: true, error: String(error) };
  }
}

/**
 * Utility: Execute operation with validation and rollback
 */
export async function withValidationAndRollback<T>(
  projectRoot: string,
  files: string[],
  reason: string,
  operation: () => Promise<T>,
  validate: () => Promise<boolean>
): Promise<{
  result: T | null;
  rolledBack: boolean;
  validationPassed: boolean;
  error?: string;
}> {
  // Create snapshot before operation
  const snapshotId = await rollbackManager.createSnapshot(projectRoot, files, reason);

  try {
    // Execute operation
    const result = await operation();

    // Validate result
    const validationPassed = await validate();

    if (!validationPassed) {
      // Validation failed - rollback
      console.log('[Rollback] Validation failed, rolling back');
      await rollbackManager.rollback(projectRoot, snapshotId);
      return { result: null, rolledBack: true, validationPassed: false };
    }

    return { result, rolledBack: false, validationPassed: true };
  } catch (error) {
    // Operation failed - rollback
    console.error(`[Rollback] Operation failed, rolling back: ${error}`);
    await rollbackManager.rollback(projectRoot, snapshotId);
    return {
      result: null,
      rolledBack: true,
      validationPassed: false,
      error: String(error),
    };
  }
}
