/**
 * Multi-Channel OTA Update Service
 *
 * Service for managing multiple OTA update channels (development, staging, production)
 * with channel-specific configurations and promotion workflows.
 */

import { PrismaClient } from '@mobigen/db';
import { OTAUpdatesService } from '@mobigen/ota-updates';
import type { OTAUpdate } from '@mobigen/ota-updates';
import type {
  Channel,
  ChannelConfig,
  ChannelPromotion,
  ChannelSummary,
  CreateChannelInput,
  UpdateChannelInput,
  PromoteUpdateInput,
  PromotionStatus,
  DEFAULT_CHANNEL_CONFIGS,
} from './channel-types';
import { DEFAULT_CHANNEL_CONFIGS as DEFAULT_CONFIGS } from './channel-types';

/**
 * ChannelService - manages multiple deployment channels with promotion workflows
 */
export class ChannelService {
  private prisma: PrismaClient;
  private otaService: OTAUpdatesService;

  constructor(prisma: PrismaClient, expoToken?: string) {
    this.prisma = prisma;
    this.otaService = new OTAUpdatesService(prisma, expoToken);
  }

  // ============================================================================
  // CHANNEL MANAGEMENT
  // ============================================================================

  /**
   * Create a new channel
   */
  async createChannel(
    projectId: string,
    input: CreateChannelInput
  ): Promise<Channel> {
    const { name, description, config, isDefault } = input;

    // Generate branch name from channel name
    const branchName = this.generateBranchName(projectId, name);

    // If this is the default channel, unset any existing default
    if (isDefault) {
      await this.prisma.updateChannel.updateMany({
        where: { projectId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create the channel in database
    const channel = await this.prisma.updateChannel.create({
      data: {
        projectId,
        name,
        description,
        isDefault,
        branchName,
        // Store config as JSON (requires prisma schema to have config field)
        // For now, we'll store config in a separate table or extend the schema
      },
    });

    console.log(`[channel-service] Created channel: ${channel.name} (${channel.id})`);

    return this.mapToChannel(channel, config);
  }

  /**
   * Get all channels for a project
   */
  async getChannels(projectId: string): Promise<Channel[]> {
    const channels = await this.prisma.updateChannel.findMany({
      where: { projectId },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return channels.map(c => this.mapToChannel(c, this.getDefaultConfigForChannel(c.name)));
  }

  /**
   * Get a specific channel
   */
  async getChannel(projectId: string, channelId: string): Promise<Channel | null> {
    const channel = await this.prisma.updateChannel.findFirst({
      where: { id: channelId, projectId },
    });

    if (!channel) {
      return null;
    }

    return this.mapToChannel(channel, this.getDefaultConfigForChannel(channel.name));
  }

  /**
   * Update channel configuration
   */
  async updateChannel(
    projectId: string,
    channelId: string,
    input: UpdateChannelInput
  ): Promise<Channel> {
    const { name, description, config, isDefault } = input;

    // Check if channel exists and belongs to project
    const existingChannel = await this.getChannel(projectId, channelId);
    if (!existingChannel) {
      throw new Error(`Channel ${channelId} not found in project ${projectId}`);
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await this.prisma.updateChannel.updateMany({
        where: { projectId, isDefault: true, id: { not: channelId } },
        data: { isDefault: false },
      });
    }

    // Update the channel
    const updatedChannel = await this.prisma.updateChannel.update({
      where: { id: channelId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    console.log(`[channel-service] Updated channel: ${updatedChannel.name} (${channelId})`);

    // Merge config with existing
    const newConfig = config
      ? { ...existingChannel.config, ...config }
      : existingChannel.config;

    return this.mapToChannel(updatedChannel, newConfig);
  }

  /**
   * Delete a channel
   */
  async deleteChannel(projectId: string, channelId: string): Promise<void> {
    // Verify channel exists and belongs to project
    const channel = await this.getChannel(projectId, channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found in project ${projectId}`);
    }

    // Don't allow deleting the default channel
    if (channel.isDefault) {
      throw new Error('Cannot delete the default channel. Set another channel as default first.');
    }

    // Check if channel has active updates
    const activeUpdates = await this.prisma.oTAUpdate.count({
      where: {
        channelId,
        status: { in: ['published', 'active'] },
      },
    });

    if (activeUpdates > 0) {
      throw new Error(
        `Cannot delete channel with ${activeUpdates} active update(s). Archive or rollback updates first.`
      );
    }

    // Delete the channel (cascades to updates via foreign key)
    await this.prisma.updateChannel.delete({
      where: { id: channelId },
    });

    console.log(`[channel-service] Deleted channel: ${channel.name} (${channelId})`);
  }

  /**
   * Get channel summary with latest update info
   */
  async getChannelSummary(projectId: string, channelId: string): Promise<ChannelSummary> {
    const channel = await this.getChannel(projectId, channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    // Get latest update
    const latestUpdate = await this.prisma.oTAUpdate.findFirst({
      where: { channelId, status: 'active' },
      orderBy: { version: 'desc' },
    });

    // Get total update count
    const updateCount = await this.prisma.oTAUpdate.count({
      where: { channelId },
    });

    return {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      config: channel.config,
      isDefault: channel.isDefault,
      latestUpdate: latestUpdate
        ? {
            id: latestUpdate.id,
            version: latestUpdate.version,
            message: latestUpdate.message,
            publishedAt: latestUpdate.publishedAt!,
            status: latestUpdate.status,
          }
        : undefined,
      updateCount,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }

  // ============================================================================
  // CHANNEL PROMOTION
  // ============================================================================

  /**
   * Promote an update from one channel to another
   * This copies the update to the target channel with a new version
   */
  async promoteUpdate(
    projectId: string,
    sourceChannelId: string,
    input: PromoteUpdateInput,
    userId: string
  ): Promise<PromotionStatus> {
    const { updateId, targetChannelId, message, changeType, rolloutPercent } = input;

    // Validate source channel and update
    const sourceChannel = await this.getChannel(projectId, sourceChannelId);
    if (!sourceChannel) {
      throw new Error(`Source channel ${sourceChannelId} not found`);
    }

    const sourceUpdate = await this.otaService.getUpdate(updateId);
    if (!sourceUpdate) {
      throw new Error(`Update ${updateId} not found`);
    }

    if (sourceUpdate.channelId !== sourceChannelId) {
      throw new Error(`Update ${updateId} does not belong to source channel ${sourceChannelId}`);
    }

    // Validate target channel
    const targetChannel = await this.getChannel(projectId, targetChannelId);
    if (!targetChannel) {
      throw new Error(`Target channel ${targetChannelId} not found`);
    }

    if (sourceChannelId === targetChannelId) {
      throw new Error('Source and target channels cannot be the same');
    }

    console.log(
      `[channel-service] Promoting update ${updateId} from ${sourceChannel.name} to ${targetChannel.name}`
    );

    // Create promotion record
    // Note: This would require a new table in the schema
    // For now, we'll just create the new update directly

    // Get the next version for target channel
    const latestTargetUpdate = await this.prisma.oTAUpdate.findFirst({
      where: { projectId, channelId: targetChannelId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestTargetUpdate?.version || 0) + 1;

    // Create the promoted update
    const promotedUpdate = await this.prisma.oTAUpdate.create({
      data: {
        projectId,
        channelId: targetChannelId,
        version: nextVersion,
        updateId: sourceUpdate.updateId,
        groupId: sourceUpdate.groupId,
        runtimeVersion: sourceUpdate.runtimeVersion,
        platform: sourceUpdate.platform,
        message: message || `Promoted from ${sourceChannel.name}: ${sourceUpdate.message}`,
        changeType: changeType || sourceUpdate.changeType,
        filesModified: sourceUpdate.filesModified,
        status: 'published',
        rolloutPercent: rolloutPercent !== undefined
          ? rolloutPercent
          : targetChannel.config.rolloutPercentage,
        manifestUrl: sourceUpdate.manifestUrl,
        publishedBy: userId,
        publishedAt: new Date(),
      },
    });

    // Mark as active
    await this.prisma.oTAUpdate.update({
      where: { id: promotedUpdate.id },
      data: { status: 'active' },
    });

    console.log(
      `[channel-service] Promoted to version ${nextVersion} in ${targetChannel.name}`
    );

    return {
      promotion: {
        id: promotedUpdate.id, // Using update ID as promotion ID for now
        projectId,
        sourceChannelId,
        targetChannelId,
        updateId,
        status: 'completed',
        promotedBy: userId,
        promotedAt: new Date(),
        completedAt: new Date(),
      },
      sourceChannel,
      targetChannel,
      update: {
        id: promotedUpdate.id,
        version: promotedUpdate.version,
        message: promotedUpdate.message,
      },
    };
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize default channels for a new project
   * Creates development, staging, and production channels
   */
  async initializeDefaultChannels(projectId: string): Promise<Channel[]> {
    console.log(`[channel-service] Initializing default channels for project ${projectId}`);

    const channelNames = ['development', 'staging', 'production'];
    const channels: Channel[] = [];

    for (let i = 0; i < channelNames.length; i++) {
      const name = channelNames[i];
      const config = DEFAULT_CONFIGS[name];

      try {
        const channel = await this.createChannel(projectId, {
          name,
          description: `${name.charAt(0).toUpperCase() + name.slice(1)} environment`,
          config,
          isDefault: name === 'production', // Production is default
        });

        channels.push(channel);
      } catch (error) {
        console.error(`[channel-service] Failed to create ${name} channel:`, error);
        throw error;
      }
    }

    console.log(`[channel-service] Created ${channels.length} default channels`);

    return channels;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Generate a branch name from project ID and channel name
   */
  private generateBranchName(projectId: string, channelName: string): string {
    const projectPrefix = projectId.substring(0, 8);
    return `${projectPrefix}-${channelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  /**
   * Get default config for a channel based on its name
   */
  private getDefaultConfigForChannel(channelName: string): ChannelConfig {
    const normalized = channelName.toLowerCase();

    if (normalized.includes('dev')) {
      return DEFAULT_CONFIGS.development;
    } else if (normalized.includes('stag')) {
      return DEFAULT_CONFIGS.staging;
    } else if (normalized.includes('prod')) {
      return DEFAULT_CONFIGS.production;
    }

    // Default to development config
    return DEFAULT_CONFIGS.development;
  }

  /**
   * Map database channel to Channel interface
   */
  private mapToChannel(dbChannel: any, config: ChannelConfig): Channel {
    return {
      id: dbChannel.id,
      projectId: dbChannel.projectId,
      name: dbChannel.name,
      description: dbChannel.description || undefined,
      config,
      branchName: dbChannel.branchName,
      isDefault: dbChannel.isDefault,
      createdAt: dbChannel.createdAt,
      updatedAt: dbChannel.updatedAt,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let channelServiceInstance: ChannelService | null = null;

/**
 * Get or create the ChannelService singleton
 */
export function getChannelService(prisma?: PrismaClient): ChannelService {
  if (!channelServiceInstance) {
    channelServiceInstance = new ChannelService(
      prisma || new PrismaClient(),
      process.env.EXPO_ACCESS_TOKEN
    );
  }
  return channelServiceInstance;
}

export default ChannelService;
