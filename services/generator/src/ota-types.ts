/**
 * OTA (Over-the-Air) Update Types
 *
 * Type definitions for OTA update deployment
 */

// Re-export types from the OTA updates package
export type {
  OTAUpdate,
  UpdateChannel,
  PublishUpdateInput,
  RollbackUpdateInput,
  UpdateMetrics,
  OTAConfig,
} from '@mobigen/ota-updates';

// Additional types specific to the generator service

export interface OTAPublishOptions {
  projectId: string;
  channelId: string;
  message: string;
  changeType?: 'feature' | 'fix' | 'style' | 'content';
  platform?: 'ios' | 'android' | 'all';
  rolloutPercent?: number;
}

export interface OTAUpdateStatus {
  updateId: string;
  projectId: string;
  channelId: string;
  version: number;
  status: 'draft' | 'published' | 'active' | 'rolled_back' | 'archived';
  rolloutPercent: number;
  downloadCount: number;
  errorCount: number;
  successRate: number;
  canRollback: boolean;
  publishedAt?: Date;
  createdAt: Date;
}

export interface OTARollbackOptions {
  updateId: string;
  targetUpdateId?: string;
}

export type OTAChannel = 'staging' | 'production' | 'development';

export interface UpdateManifest {
  updateId: string;
  groupId: string;
  runtimeVersion: string;
  platform: string;
  message: string;
  filesModified: string[];
  manifestUrl: string;
  createdAt: string;
}
