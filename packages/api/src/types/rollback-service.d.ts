/**
 * Type declarations for RollbackService
 * These types are used for dynamic imports at runtime
 */

import type { PrismaClient } from '@mobigen/db';

export interface RollbackToVersionRequest {
  projectId: string;
  targetVersion: number;
  reason?: string;
}

export interface RollbackToPreviousRequest {
  projectId: string;
  reason?: string;
}

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

export interface RollbackError {
  type: 'validation' | 'restore' | 'publish' | 'system';
  message: string;
  details?: string;
  recoverable: boolean;
}

export interface RollbackUpdateInfo {
  id: string;
  version: number;
  message: string;
  publishedAt: Date;
  platform: string;
  channelId?: string;
  filesModified?: string[];
}

export interface RollbackValidation {
  canRollback: boolean;
  reason?: string;
  targetUpdate?: RollbackUpdateInfo;
  currentUpdate?: RollbackUpdateInfo;
  warnings?: RollbackWarning[];
  restrictions?: RollbackRestriction[];
}

export interface RollbackWarning {
  type: 'data_loss' | 'version_gap' | 'compatibility' | 'metrics';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface RollbackRestriction {
  type: 'cooldown' | 'min_version' | 'no_previous' | 'locked' | 'incompatible';
  message: string;
  canOverride: boolean;
}

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

export interface RollbackHistory {
  projectId: string;
  totalRollbacks: number;
  successfulRollbacks: number;
  failedRollbacks: number;
  lastRollback?: RollbackEvent;
  events: RollbackEvent[];
}

export interface RollbackStatus {
  isRollingBack: boolean;
  currentOperation?: {
    fromVersion: number;
    toVersion: number;
    startedAt: Date;
    progress?: number;
  };
  lastRollback?: RollbackEvent;
  canRollback: boolean;
  availableVersions: number[];
}

export declare class RollbackService {
  constructor(prisma: PrismaClient, otaService?: unknown, config?: unknown);

  rollbackToVersion(
    request: RollbackToVersionRequest,
    userId: string
  ): Promise<RollbackResult>;

  rollbackToPrevious(
    request: RollbackToPreviousRequest,
    userId: string
  ): Promise<RollbackResult>;

  validateRollback(
    projectId: string,
    targetVersion?: number
  ): Promise<RollbackValidation>;

  canRollback(
    projectId: string,
    targetVersion?: number
  ): Promise<RollbackValidation>;

  getRollbackHistory(
    projectId: string,
    limit?: number
  ): Promise<RollbackHistory>;

  getRollbackStatus(projectId: string): Promise<RollbackStatus>;
}
