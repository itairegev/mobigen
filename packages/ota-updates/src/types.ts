import { z } from 'zod';

// ============================================================================
// CHANNEL TYPES
// ============================================================================

export const CreateChannelSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  runtimeVersion: z.string().optional(),
});

export type CreateChannelInput = z.infer<typeof CreateChannelSchema>;

export interface UpdateChannel {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  runtimeVersion?: string;
  branchName: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// UPDATE TYPES
// ============================================================================

export const PublishUpdateSchema = z.object({
  projectId: z.string().uuid(),
  channelId: z.string().uuid(),
  message: z.string().min(1).max(500),
  changeType: z.enum(['feature', 'fix', 'style', 'content']).optional(),
  platform: z.enum(['ios', 'android', 'all']).default('all'),
  rolloutPercent: z.number().int().min(0).max(100).default(100),
});

export type PublishUpdateInput = z.infer<typeof PublishUpdateSchema>;

export const RollbackUpdateSchema = z.object({
  updateId: z.string().uuid(),
  targetUpdateId: z.string().uuid().optional(), // If not provided, rollback to previous
});

export type RollbackUpdateInput = z.infer<typeof RollbackUpdateSchema>;

export interface OTAUpdate {
  id: string;
  projectId: string;
  channelId: string;
  version: number;
  updateId?: string;
  groupId?: string;
  runtimeVersion: string;
  platform: string;
  message: string;
  changeType?: string;
  filesModified: string[];
  status: 'draft' | 'published' | 'active' | 'rolled_back' | 'archived';
  rolloutPercent: number;
  downloadCount: number;
  errorCount: number;
  canRollback: boolean;
  rolledBackTo?: string;
  rolledBackAt?: Date;
  manifestUrl?: string;
  publishedBy?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// METRICS TYPES
// ============================================================================

export interface UpdateMetrics {
  updateId: string;
  platform: string;
  successCount: number;
  failureCount: number;
  rollbackCount: number;
  avgDownloadTimeMs?: number;
  avgApplyTimeMs?: number;
  successRate: number;
}

export interface UpdateEvent {
  updateId: string;
  eventType: 'download_start' | 'download_complete' | 'download_error' |
             'apply_start' | 'apply_complete' | 'apply_error' | 'rollback';
  platform: string;
  appVersion: string;
  deviceId?: string;
  errorMessage?: string;
  errorStack?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export const TrackUpdateEventSchema = z.object({
  updateId: z.string().uuid(),
  eventType: z.enum([
    'download_start',
    'download_complete',
    'download_error',
    'apply_start',
    'apply_complete',
    'apply_error',
    'rollback',
  ]),
  platform: z.enum(['ios', 'android']),
  appVersion: z.string(),
  deviceId: z.string().optional(),
  errorMessage: z.string().optional(),
  errorStack: z.string().optional(),
  durationMs: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type TrackUpdateEventInput = z.infer<typeof TrackUpdateEventSchema>;

// ============================================================================
// EXPO UPDATES API TYPES
// ============================================================================

export interface ExpoUpdateResponse {
  id: string;
  groupId: string;
  runtimeVersion: string;
  platform: string;
  message: string;
  createdAt: string;
  branchName: string;
  manifestUrl: string;
}

export interface ExpoPublishOptions {
  projectPath: string;
  message: string;
  branchName: string;
  platform?: 'ios' | 'android' | 'all';
  runtimeVersion?: string;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface OTAConfig {
  easProjectId: string;
  runtimeVersion: string;
  updateUrl: string;
  channels: {
    production: string;
    staging?: string;
    development?: string;
  };
}
