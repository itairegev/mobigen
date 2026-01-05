import { z } from 'zod';

// ============================================================================
// ROLLBACK REQUEST TYPES
// ============================================================================

/**
 * Request to rollback to a specific version
 */
export const RollbackToVersionSchema = z.object({
  projectId: z.string().uuid(),
  targetVersion: z.number().int().positive(),
  reason: z.string().optional(),
});

export type RollbackToVersionRequest = z.infer<typeof RollbackToVersionSchema>;

/**
 * Request to rollback to the previous version
 */
export const RollbackToPreviousSchema = z.object({
  projectId: z.string().uuid(),
  reason: z.string().optional(),
});

export type RollbackToPreviousRequest = z.infer<typeof RollbackToPreviousSchema>;

/**
 * Request to check if rollback is possible
 */
export const CanRollbackSchema = z.object({
  projectId: z.string().uuid(),
  targetVersion: z.number().int().positive().optional(),
});

export type CanRollbackRequest = z.infer<typeof CanRollbackSchema>;

// ============================================================================
// ROLLBACK RESULT TYPES
// ============================================================================

/**
 * Result of a rollback operation
 */
export interface RollbackResult {
  success: boolean;
  previousVersion: number;
  newVersion: number;
  updateId: string;
  rollbackEventId: string;
  message: string;
  filesRestored: number;
  timestamp: Date;
  errors?: RollbackError[];
}

/**
 * Error that occurred during rollback
 */
export interface RollbackError {
  type: 'validation' | 'restore' | 'publish' | 'system';
  message: string;
  details?: string;
  recoverable: boolean;
}

// ============================================================================
// ROLLBACK VALIDATION TYPES
// ============================================================================

/**
 * Update info for rollback validation
 */
export interface RollbackUpdateInfo {
  id: string;
  version: number;
  message: string;
  publishedAt: Date;
  platform: string;
  channelId?: string;
  filesModified?: string[];
}

/**
 * Validation result for rollback eligibility
 */
export interface RollbackValidation {
  canRollback: boolean;
  reason?: string;
  targetUpdate?: RollbackUpdateInfo;
  currentUpdate?: RollbackUpdateInfo;
  warnings?: RollbackWarning[];
  restrictions?: RollbackRestriction[];
}

/**
 * Warning about rollback operation
 */
export interface RollbackWarning {
  type: 'data_loss' | 'version_gap' | 'compatibility' | 'metrics';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Restriction that prevents rollback
 */
export interface RollbackRestriction {
  type: 'cooldown' | 'min_version' | 'no_previous' | 'locked' | 'incompatible';
  message: string;
  canOverride: boolean;
}

// ============================================================================
// ROLLBACK HISTORY TYPES
// ============================================================================

/**
 * Rollback event record
 */
export interface RollbackEvent {
  id: string;
  projectId: string;
  fromVersion: number;
  toVersion: number;
  fromUpdateId: string;
  toUpdateId: string;
  reason?: string;
  performedBy: string;
  performedAt: Date;
  success: boolean;
  filesRestored: number;
  durationMs: number;
  error?: string;
}

/**
 * Rollback history summary
 */
export interface RollbackHistory {
  projectId: string;
  totalRollbacks: number;
  successfulRollbacks: number;
  failedRollbacks: number;
  lastRollback?: RollbackEvent;
  events: RollbackEvent[];
}

// ============================================================================
// ROLLBACK CONFIGURATION TYPES
// ============================================================================

/**
 * Rollback safety configuration
 */
export interface RollbackConfig {
  /**
   * Minimum version that can be rolled back to
   * Prevents rollback to very old versions that may be incompatible
   */
  minRollbackVersion: number;

  /**
   * Cooldown period in milliseconds between rollbacks
   * Prevents rapid-fire rollbacks
   */
  cooldownPeriodMs: number;

  /**
   * Maximum number of versions to rollback at once
   * Prevents large version jumps
   */
  maxVersionJump: number;

  /**
   * Whether to send notifications on rollback
   */
  notifyOnRollback: boolean;

  /**
   * Whether to require approval for rollback
   */
  requireApproval: boolean;

  /**
   * Whether to create a snapshot before rollback
   */
  createSnapshotBeforeRollback: boolean;
}

/**
 * Default rollback configuration
 */
export const DEFAULT_ROLLBACK_CONFIG: RollbackConfig = {
  minRollbackVersion: 1,
  cooldownPeriodMs: 5 * 60 * 1000, // 5 minutes
  maxVersionJump: 10,
  notifyOnRollback: true,
  requireApproval: false,
  createSnapshotBeforeRollback: true,
};

// ============================================================================
// ROLLBACK STATUS TYPES
// ============================================================================

/**
 * Current rollback status for a project
 */
export interface RollbackStatus {
  canRollback: boolean;
  inCooldown: boolean;
  cooldownEndsAt?: Date;
  lastRollbackAt?: Date;
  rollbacksInLast24Hours: number;
  availableVersions: Array<{
    version: number;
    updateId: string;
    message: string;
    publishedAt: Date;
    canRollbackTo: boolean;
    reason?: string;
  }>;
}
