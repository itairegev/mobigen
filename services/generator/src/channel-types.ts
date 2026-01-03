/**
 * Multi-Channel OTA Update Types
 *
 * Type definitions for managing multiple OTA update channels
 * (development, staging, production) with channel-specific configurations
 */

import { z } from 'zod';

// ============================================================================
// CHANNEL TYPES
// ============================================================================

/**
 * Channel interface - represents a deployment channel
 */
export interface Channel {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  config: ChannelConfig;
  branchName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Channel configuration - controls update behavior for the channel
 */
export interface ChannelConfig {
  /** Auto-update enabled for this channel (default: true) */
  autoUpdate?: boolean;

  /** Rollout percentage (0-100) for gradual rollout (default: 100) */
  rolloutPercentage?: number;

  /** Minimum app version required for this channel */
  minVersion?: string;

  /** Maximum retries for failed updates */
  maxRetries?: number;

  /** Update check interval in seconds */
  updateCheckInterval?: number;

  /** Whether to notify users before updating */
  notifyBeforeUpdate?: boolean;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Default channel configurations
 */
export const DEFAULT_CHANNEL_CONFIGS: Record<string, Required<ChannelConfig>> = {
  development: {
    autoUpdate: true,
    rolloutPercentage: 100,
    maxRetries: 3,
    updateCheckInterval: 60, // Check every minute
    notifyBeforeUpdate: false,
    minVersion: undefined,
    metadata: {},
  },
  staging: {
    autoUpdate: true,
    rolloutPercentage: 50, // Gradual rollout to 50% of users
    maxRetries: 3,
    updateCheckInterval: 300, // Check every 5 minutes
    notifyBeforeUpdate: true,
    minVersion: undefined,
    metadata: {},
  },
  production: {
    autoUpdate: false, // Require user confirmation
    rolloutPercentage: 10, // Conservative 10% rollout
    maxRetries: 2,
    updateCheckInterval: 3600, // Check every hour
    notifyBeforeUpdate: true,
    minVersion: undefined,
    metadata: {},
  },
};

// ============================================================================
// CHANNEL PROMOTION
// ============================================================================

/**
 * Channel promotion - copy an update from one channel to another
 */
export interface ChannelPromotion {
  id: string;
  projectId: string;
  sourceChannelId: string;
  targetChannelId: string;
  updateId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  promotedBy: string;
  promotedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for creating a new channel
 */
export const CreateChannelSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  config: z.object({
    autoUpdate: z.boolean().default(true),
    rolloutPercentage: z.number().int().min(0).max(100).default(100),
    minVersion: z.string().optional(),
    maxRetries: z.number().int().min(0).max(10).optional(),
    updateCheckInterval: z.number().int().min(60).optional(),
    notifyBeforeUpdate: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  }).default(DEFAULT_CHANNEL_CONFIGS.development),
  isDefault: z.boolean().default(false),
});

export type CreateChannelInput = z.infer<typeof CreateChannelSchema>;

/**
 * Schema for updating a channel
 */
export const UpdateChannelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  config: z.object({
    autoUpdate: z.boolean().optional(),
    rolloutPercentage: z.number().int().min(0).max(100).optional(),
    minVersion: z.string().optional(),
    maxRetries: z.number().int().min(0).max(10).optional(),
    updateCheckInterval: z.number().int().min(60).optional(),
    notifyBeforeUpdate: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  }).optional(),
  isDefault: z.boolean().optional(),
});

export type UpdateChannelInput = z.infer<typeof UpdateChannelSchema>;

/**
 * Schema for promoting an update between channels
 */
export const PromoteUpdateSchema = z.object({
  updateId: z.string().uuid(),
  targetChannelId: z.string().uuid(),
  message: z.string().optional(),
  changeType: z.enum(['feature', 'fix', 'style', 'content']).optional(),
  rolloutPercent: z.number().int().min(0).max(100).optional(),
});

export type PromoteUpdateInput = z.infer<typeof PromoteUpdateSchema>;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Channel summary with latest update info
 */
export interface ChannelSummary {
  id: string;
  name: string;
  description?: string;
  config: ChannelConfig;
  isDefault: boolean;
  latestUpdate?: {
    id: string;
    version: number;
    message: string;
    publishedAt: Date;
    status: string;
  };
  updateCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Promotion status with details
 */
export interface PromotionStatus {
  promotion: ChannelPromotion;
  sourceChannel: Channel;
  targetChannel: Channel;
  update: {
    id: string;
    version: number;
    message: string;
  };
}
