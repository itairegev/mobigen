import { PrismaClient } from '@mobigen/db';
import type {
  CreateChannelInput,
  PublishUpdateInput,
  RollbackUpdateInput,
  UpdateChannel,
  OTAUpdate,
  UpdateMetrics,
  TrackUpdateEventInput,
} from './types';
import { ExpoUpdatesClient } from './expo-updates-client';

/**
 * Service for managing OTA (Over-The-Air) updates using Expo Updates
 */
export class OTAUpdatesService {
  private prisma: PrismaClient;
  private expoClient: ExpoUpdatesClient;

  constructor(prisma: PrismaClient, expoToken?: string) {
    this.prisma = prisma;
    this.expoClient = new ExpoUpdatesClient(expoToken);
  }

  // ============================================================================
  // CHANNEL MANAGEMENT
  // ============================================================================

  /**
   * Create a new update channel
   */
  async createChannel(input: CreateChannelInput): Promise<UpdateChannel> {
    const { projectId, name, description, isDefault, runtimeVersion } = input;

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
        runtimeVersion,
        branchName,
      },
    });

    return channel as UpdateChannel;
  }

  /**
   * Get all channels for a project
   */
  async listChannels(projectId: string): Promise<UpdateChannel[]> {
    const channels = await this.prisma.updateChannel.findMany({
      where: { projectId },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return channels as UpdateChannel[];
  }

  /**
   * Get a specific channel
   */
  async getChannel(channelId: string): Promise<UpdateChannel | null> {
    const channel = await this.prisma.updateChannel.findUnique({
      where: { id: channelId },
    });

    return channel as UpdateChannel | null;
  }

  /**
   * Get the default channel for a project
   */
  async getDefaultChannel(projectId: string): Promise<UpdateChannel | null> {
    const channel = await this.prisma.updateChannel.findFirst({
      where: { projectId, isDefault: true },
    });

    return channel as UpdateChannel | null;
  }

  /**
   * Delete a channel (and all its updates)
   */
  async deleteChannel(channelId: string): Promise<void> {
    await this.prisma.updateChannel.delete({
      where: { id: channelId },
    });
  }

  // ============================================================================
  // UPDATE PUBLISHING
  // ============================================================================

  /**
   * Publish a new OTA update
   */
  async publishUpdate(
    input: PublishUpdateInput,
    projectPath: string,
    userId: string
  ): Promise<OTAUpdate> {
    const {
      projectId,
      channelId,
      message,
      changeType,
      platform,
      rolloutPercent,
    } = input;

    // Get channel info
    const channel = await this.getChannel(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    // Get the next version number for this channel
    const latestUpdate = await this.prisma.oTAUpdate.findFirst({
      where: { projectId, channelId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestUpdate?.version || 0) + 1;

    // Get runtime version
    const runtimeVersion = channel.runtimeVersion ||
      await this.expoClient.getRuntimeVersion(projectPath);

    // Ensure branch exists in Expo
    await this.expoClient.configureBranch(
      channel.branchName,
      projectPath,
      runtimeVersion
    );

    // Publish to Expo
    const expoUpdate = await this.expoClient.publishUpdate({
      projectPath,
      message,
      branchName: channel.branchName,
      platform,
      runtimeVersion,
    });

    // Get list of modified files (from git or storage service)
    const filesModified = await this.getModifiedFiles(projectPath);

    // Create update record in database
    const update = await this.prisma.oTAUpdate.create({
      data: {
        projectId,
        channelId,
        version: nextVersion,
        updateId: expoUpdate.id,
        groupId: expoUpdate.groupId,
        runtimeVersion,
        platform,
        message,
        changeType,
        filesModified,
        status: 'published',
        rolloutPercent,
        manifestUrl: expoUpdate.manifestUrl,
        publishedBy: userId,
        publishedAt: new Date(),
      },
    });

    // Archive previous active updates if rollout is 100%
    if (rolloutPercent === 100) {
      await this.prisma.oTAUpdate.updateMany({
        where: {
          projectId,
          channelId,
          status: 'active',
          id: { not: update.id },
        },
        data: { status: 'archived' },
      });
    }

    // Mark this update as active
    await this.prisma.oTAUpdate.update({
      where: { id: update.id },
      data: { status: 'active' },
    });

    return update as OTAUpdate;
  }

  /**
   * Get update history for a project/channel
   */
  async listUpdates(
    projectId: string,
    channelId?: string,
    limit = 50
  ): Promise<OTAUpdate[]> {
    const where: any = { projectId };
    if (channelId) {
      where.channelId = channelId;
    }

    const updates = await this.prisma.oTAUpdate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        channel: true,
      },
    });

    return updates as unknown as OTAUpdate[];
  }

  /**
   * Get a specific update
   */
  async getUpdate(updateId: string): Promise<OTAUpdate | null> {
    const update = await this.prisma.oTAUpdate.findUnique({
      where: { id: updateId },
      include: {
        channel: true,
      },
    });

    return update as unknown as OTAUpdate | null;
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  /**
   * Rollback to a previous update
   */
  async rollbackUpdate(input: RollbackUpdateInput, userId: string): Promise<OTAUpdate> {
    const { updateId, targetUpdateId } = input;

    // Get the current update
    const currentUpdate = await this.getUpdate(updateId);
    if (!currentUpdate) {
      throw new Error(`Update ${updateId} not found`);
    }

    if (!currentUpdate.canRollback) {
      throw new Error(`Update ${updateId} cannot be rolled back`);
    }

    // Determine target update
    let targetUpdate: OTAUpdate | null;
    if (targetUpdateId) {
      targetUpdate = await this.getUpdate(targetUpdateId);
    } else {
      // Get the previous version
      targetUpdate = await this.prisma.oTAUpdate.findFirst({
        where: {
          projectId: currentUpdate.projectId,
          channelId: currentUpdate.channelId,
          version: { lt: currentUpdate.version },
          status: { in: ['active', 'archived'] },
        },
        orderBy: { version: 'desc' },
      }) as OTAUpdate | null;
    }

    if (!targetUpdate) {
      throw new Error('No previous update found to rollback to');
    }

    // Mark current update as rolled back
    await this.prisma.oTAUpdate.update({
      where: { id: updateId },
      data: {
        status: 'rolled_back',
        rolledBackTo: targetUpdate.id,
        rolledBackAt: new Date(),
      },
    });

    // Reactivate target update
    const rolledBackUpdate = await this.prisma.oTAUpdate.update({
      where: { id: targetUpdate.id },
      data: {
        status: 'active',
        publishedBy: userId,
        publishedAt: new Date(),
      },
    });

    return rolledBackUpdate as OTAUpdate;
  }

  // ============================================================================
  // METRICS & ANALYTICS
  // ============================================================================

  /**
   * Track an update event (download, apply, error, etc.)
   */
  async trackEvent(input: TrackUpdateEventInput): Promise<void> {
    const {
      updateId,
      eventType,
      platform,
      appVersion,
      deviceId,
      errorMessage,
      errorStack,
      durationMs,
      metadata,
    } = input;

    // Store the event
    await this.prisma.oTAUpdateEvent.create({
      data: {
        updateId,
        eventType,
        platform,
        appVersion,
        deviceId,
        errorMessage,
        errorStack,
        durationMs,
        metadata: (metadata || {}) as Record<string, string | number | boolean | null>,
      },
    });

    // Update counters on the update record
    if (eventType === 'download_complete') {
      await this.prisma.oTAUpdate.update({
        where: { id: updateId },
        data: { downloadCount: { increment: 1 } },
      });
    } else if (eventType.includes('error')) {
      await this.prisma.oTAUpdate.update({
        where: { id: updateId },
        data: { errorCount: { increment: 1 } },
      });
    }

    // Aggregate metrics daily
    await this.aggregateMetrics(updateId, platform, appVersion);
  }

  /**
   * Get metrics for an update
   */
  async getUpdateMetrics(updateId: string): Promise<UpdateMetrics[]> {
    const metrics = await this.prisma.oTAUpdateMetric.findMany({
      where: { updateId },
      orderBy: { date: 'desc' },
    });

    return metrics.map((m) => ({
      updateId: m.updateId,
      platform: m.platform,
      successCount: m.successCount,
      failureCount: m.failureCount,
      rollbackCount: m.rollbackCount,
      avgDownloadTimeMs: m.avgDownloadTime || undefined,
      avgApplyTimeMs: m.avgApplyTime || undefined,
      successRate: m.successCount / (m.successCount + m.failureCount) || 0,
    }));
  }

  /**
   * Get update status/health for monitoring
   */
  async getUpdateStatus(updateId: string): Promise<{
    update: OTAUpdate;
    metrics: UpdateMetrics[];
    recentErrors: Array<{ message: string; count: number }>;
  }> {
    const update = await this.getUpdate(updateId);
    if (!update) {
      throw new Error(`Update ${updateId} not found`);
    }

    const metrics = await this.getUpdateMetrics(updateId);

    // Get recent errors
    const recentErrors = await this.prisma.oTAUpdateEvent.groupBy({
      by: ['errorMessage'],
      where: {
        updateId,
        eventType: { contains: 'error' },
        errorMessage: { not: null },
      },
      _count: { errorMessage: true },
      orderBy: { _count: { errorMessage: 'desc' } },
      take: 10,
    });

    return {
      update,
      metrics,
      recentErrors: recentErrors.map((e) => ({
        message: e.errorMessage || 'Unknown error',
        count: e._count.errorMessage,
      })),
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Generate a branch name from project ID and channel name
   */
  private generateBranchName(projectId: string, channelName: string): string {
    // Use first 8 chars of project ID + channel name
    const projectPrefix = projectId.substring(0, 8);
    return `${projectPrefix}-${channelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  /**
   * Get list of modified files for an update
   */
  private async getModifiedFiles(projectPath: string): Promise<string[]> {
    // TODO: Integrate with storage service to get actual modified files
    // For now, return empty array
    return [];
  }

  /**
   * Aggregate metrics for an update
   */
  private async aggregateMetrics(
    updateId: string,
    platform: string,
    appVersion: string
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get events for today
    const events = await this.prisma.oTAUpdateEvent.findMany({
      where: {
        updateId,
        platform,
        appVersion,
        createdAt: { gte: today },
      },
    });

    // Calculate metrics
    const successCount = events.filter((e) =>
      e.eventType === 'apply_complete'
    ).length;
    const failureCount = events.filter((e) =>
      e.eventType.includes('error')
    ).length;
    const rollbackCount = events.filter((e) =>
      e.eventType === 'rollback'
    ).length;

    const downloadTimes = events
      .filter((e) => e.eventType === 'download_complete' && e.durationMs)
      .map((e) => e.durationMs!);
    const applyTimes = events
      .filter((e) => e.eventType === 'apply_complete' && e.durationMs)
      .map((e) => e.durationMs!);

    const avgDownloadTime = downloadTimes.length > 0
      ? Math.round(downloadTimes.reduce((a, b) => a + b, 0) / downloadTimes.length)
      : null;
    const avgApplyTime = applyTimes.length > 0
      ? Math.round(applyTimes.reduce((a, b) => a + b, 0) / applyTimes.length)
      : null;

    // Upsert metrics
    await this.prisma.oTAUpdateMetric.upsert({
      where: {
        updateId_platform_appVersion_date: {
          updateId,
          platform,
          appVersion,
          date: today,
        },
      },
      create: {
        updateId,
        platform,
        appVersion,
        date: today,
        successCount,
        failureCount,
        rollbackCount,
        avgDownloadTime,
        avgApplyTime,
      },
      update: {
        successCount,
        failureCount,
        rollbackCount,
        avgDownloadTime,
        avgApplyTime,
      },
    });
  }
}
