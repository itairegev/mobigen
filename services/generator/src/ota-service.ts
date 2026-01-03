/**
 * OTA Service
 *
 * Service for managing Over-the-Air (OTA) updates using Expo EAS Update
 * This service wraps the OTA updates package and provides integration
 * with the generator service, S3 storage, and project management.
 */

import { PrismaClient } from '@mobigen/db';
import { OTAUpdatesService } from '@mobigen/ota-updates';
import type {
  OTAUpdate,
  UpdateChannel,
  UpdateMetrics,
} from '@mobigen/ota-updates';
import * as path from 'path';
import * as fs from 'fs';
import type {
  OTAPublishOptions,
  OTAUpdateStatus,
  OTARollbackOptions,
  UpdateManifest,
} from './ota-types';

// Configuration
const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN;
const MOBIGEN_ROOT = process.env.MOBIGEN_ROOT || path.resolve(process.cwd(), '../..');

/**
 * OTA Service for the Generator
 *
 * Provides methods to:
 * - Publish OTA updates
 * - List and query update status
 * - Rollback to previous versions
 * - Manage update channels
 */
export class OTAService {
  private prisma: PrismaClient;
  private otaUpdatesService: OTAUpdatesService;

  constructor(prisma?: PrismaClient, expoToken?: string) {
    this.prisma = prisma || new PrismaClient();
    this.otaUpdatesService = new OTAUpdatesService(
      this.prisma,
      expoToken || EXPO_ACCESS_TOKEN
    );
  }

  // ============================================================================
  // PUBLISH UPDATES
  // ============================================================================

  /**
   * Publish a new OTA update for a project
   */
  async publishUpdate(
    options: OTAPublishOptions,
    userId: string
  ): Promise<OTAUpdate> {
    const {
      projectId,
      channelId,
      message,
      changeType,
      platform = 'all',
      rolloutPercent = 100,
    } = options;

    // Validate project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get project path
    const projectPath = this.getProjectPath(projectId);

    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project directory not found: ${projectPath}`);
    }

    console.log(`[ota-service] Publishing update for project ${projectId}`);
    console.log(`[ota-service] Channel: ${channelId}, Platform: ${platform}`);

    // Publish the update
    const update = await this.otaUpdatesService.publishUpdate(
      {
        projectId,
        channelId,
        message,
        changeType,
        platform,
        rolloutPercent,
      },
      projectPath,
      userId
    );

    console.log(`[ota-service] Update published: ${update.id} (version ${update.version})`);

    return update;
  }

  // ============================================================================
  // QUERY UPDATES
  // ============================================================================

  /**
   * Get update status with metrics
   */
  async getUpdateStatus(projectId: string, updateId: string): Promise<OTAUpdateStatus> {
    // Get the update
    const update = await this.otaUpdatesService.getUpdate(updateId);

    if (!update) {
      throw new Error(`Update ${updateId} not found`);
    }

    if (update.projectId !== projectId) {
      throw new Error(`Update ${updateId} does not belong to project ${projectId}`);
    }

    // Get metrics
    const metrics = await this.otaUpdatesService.getUpdateMetrics(updateId);

    // Calculate aggregate success rate
    const totalSuccess = metrics.reduce((sum, m) => sum + m.successCount, 0);
    const totalFailure = metrics.reduce((sum, m) => sum + m.failureCount, 0);
    const successRate = totalSuccess + totalFailure > 0
      ? totalSuccess / (totalSuccess + totalFailure)
      : 0;

    return {
      updateId: update.id,
      projectId: update.projectId,
      channelId: update.channelId,
      version: update.version,
      status: update.status,
      rolloutPercent: update.rolloutPercent,
      downloadCount: update.downloadCount,
      errorCount: update.errorCount,
      successRate,
      canRollback: update.canRollback,
      publishedAt: update.publishedAt,
      createdAt: update.createdAt,
    };
  }

  /**
   * List all updates for a project
   */
  async listUpdates(
    projectId: string,
    channelId?: string,
    limit = 50
  ): Promise<OTAUpdate[]> {
    return this.otaUpdatesService.listUpdates(projectId, channelId, limit);
  }

  /**
   * Get update manifest for debugging
   */
  async getUpdateManifest(updateId: string): Promise<UpdateManifest> {
    const update = await this.otaUpdatesService.getUpdate(updateId);

    if (!update) {
      throw new Error(`Update ${updateId} not found`);
    }

    return {
      updateId: update.id,
      groupId: update.groupId || '',
      runtimeVersion: update.runtimeVersion,
      platform: update.platform,
      message: update.message,
      filesModified: update.filesModified,
      manifestUrl: update.manifestUrl || '',
      createdAt: update.createdAt.toISOString(),
    };
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  /**
   * Rollback to a previous update
   */
  async rollbackTo(
    projectId: string,
    options: OTARollbackOptions,
    userId: string
  ): Promise<OTAUpdate> {
    const { updateId, targetUpdateId } = options;

    // Validate the update belongs to this project
    const update = await this.otaUpdatesService.getUpdate(updateId);

    if (!update) {
      throw new Error(`Update ${updateId} not found`);
    }

    if (update.projectId !== projectId) {
      throw new Error(`Update ${updateId} does not belong to project ${projectId}`);
    }

    console.log(`[ota-service] Rolling back update ${updateId}`);

    // Perform rollback
    const rolledBackUpdate = await this.otaUpdatesService.rollbackUpdate(
      { updateId, targetUpdateId },
      userId
    );

    console.log(`[ota-service] Rolled back to update ${rolledBackUpdate.id}`);

    return rolledBackUpdate;
  }

  // ============================================================================
  // CHANNEL MANAGEMENT
  // ============================================================================

  /**
   * List all channels for a project
   */
  async listChannels(projectId: string): Promise<UpdateChannel[]> {
    return this.otaUpdatesService.listChannels(projectId);
  }

  /**
   * Get the default channel for a project
   */
  async getDefaultChannel(projectId: string): Promise<UpdateChannel | null> {
    return this.otaUpdatesService.getDefaultChannel(projectId);
  }

  /**
   * Create a new update channel
   */
  async createChannel(
    projectId: string,
    name: string,
    isDefault = false
  ): Promise<UpdateChannel> {
    return this.otaUpdatesService.createChannel({
      projectId,
      name,
      isDefault,
    });
  }

  // ============================================================================
  // METRICS
  // ============================================================================

  /**
   * Get detailed metrics for an update
   */
  async getUpdateMetrics(updateId: string): Promise<UpdateMetrics[]> {
    return this.otaUpdatesService.getUpdateMetrics(updateId);
  }

  /**
   * Get update health status with recent errors
   */
  async getUpdateHealth(updateId: string): Promise<{
    update: OTAUpdate;
    metrics: UpdateMetrics[];
    recentErrors: Array<{ message: string; count: number }>;
  }> {
    return this.otaUpdatesService.getUpdateStatus(updateId);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get the file system path for a project
   */
  private getProjectPath(projectId: string): string {
    return path.join(MOBIGEN_ROOT, 'projects', projectId);
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Singleton instance
let otaServiceInstance: OTAService | null = null;

/**
 * Get or create the OTA service singleton
 */
export function getOTAService(prisma?: PrismaClient): OTAService {
  if (!otaServiceInstance) {
    otaServiceInstance = new OTAService(prisma);
  }
  return otaServiceInstance;
}

export default OTAService;
