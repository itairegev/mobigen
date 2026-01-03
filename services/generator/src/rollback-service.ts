import { PrismaClient } from '@mobigen/db';
import { OTAUpdatesService } from '@mobigen/ota-updates';
import {
  DEFAULT_ROLLBACK_CONFIG,
  type RollbackToVersionRequest,
  type RollbackToPreviousRequest,
  type RollbackResult,
  type RollbackValidation,
  type RollbackHistory,
  type RollbackStatus,
  type RollbackConfig,
  type RollbackEvent,
  type RollbackError,
  type RollbackWarning,
  type RollbackRestriction,
} from './rollback-types';

/**
 * Service for managing OTA update rollbacks
 * Provides safe rollback capabilities with validation and recovery
 */
export class RollbackService {
  private prisma: PrismaClient;
  private otaService: OTAUpdatesService;
  private config: RollbackConfig;

  constructor(
    prisma: PrismaClient,
    otaService?: OTAUpdatesService,
    config?: Partial<RollbackConfig>
  ) {
    this.prisma = prisma;
    this.otaService = otaService || new OTAUpdatesService(prisma);
    this.config = { ...DEFAULT_ROLLBACK_CONFIG, ...config };
  }

  // ============================================================================
  // ROLLBACK OPERATIONS
  // ============================================================================

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(
    request: RollbackToVersionRequest,
    userId: string
  ): Promise<RollbackResult> {
    const { projectId, targetVersion, reason } = request;

    // Validate rollback eligibility
    const validation = await this.validateRollback(projectId, targetVersion);
    if (!validation.canRollback) {
      throw new Error(validation.reason || 'Rollback not allowed');
    }

    // Get current and target updates
    const currentUpdate = validation.currentUpdate!;
    const targetUpdate = validation.targetUpdate!;

    const startTime = Date.now();
    const errors: RollbackError[] = [];

    try {
      // Create snapshot if configured
      if (this.config.createSnapshotBeforeRollback) {
        await this.createRollbackSnapshot(projectId, currentUpdate.version);
      }

      // Mark current update as rolled back
      await this.prisma.oTAUpdate.update({
        where: { id: currentUpdate.id },
        data: {
          status: 'rolled_back',
          rolledBackTo: targetUpdate.id,
          rolledBackAt: new Date(),
        },
      });

      // Reactivate target update
      const reactivatedUpdate = await this.prisma.oTAUpdate.update({
        where: { id: targetUpdate.id },
        data: {
          status: 'active',
          publishedBy: userId,
          publishedAt: new Date(),
        },
      });

      // Archive any other active updates in the same channel
      await this.prisma.oTAUpdate.updateMany({
        where: {
          projectId,
          channelId: targetUpdate.channelId,
          status: 'active',
          id: { not: targetUpdate.id },
        },
        data: { status: 'archived' },
      });

      // Record rollback event
      const rollbackEvent = await this.recordRollbackEvent({
        projectId,
        fromVersion: currentUpdate.version,
        toVersion: targetUpdate.version,
        fromUpdateId: currentUpdate.id,
        toUpdateId: targetUpdate.id,
        reason,
        performedBy: userId,
        performedAt: new Date(),
        success: true,
        filesRestored: targetUpdate.filesModified?.length || 0,
        durationMs: Date.now() - startTime,
      });

      // Send notifications if configured
      if (this.config.notifyOnRollback) {
        await this.sendRollbackNotification(
          projectId,
          currentUpdate.version,
          targetUpdate.version,
          userId
        );
      }

      return {
        success: true,
        previousVersion: currentUpdate.version,
        newVersion: targetUpdate.version,
        updateId: reactivatedUpdate.id,
        rollbackEventId: rollbackEvent.id,
        message: `Successfully rolled back from v${currentUpdate.version} to v${targetUpdate.version}`,
        filesRestored: targetUpdate.filesModified?.length || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      const rollbackError: RollbackError = {
        type: 'system',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
        recoverable: false,
      };

      errors.push(rollbackError);

      // Record failed rollback event
      await this.recordRollbackEvent({
        projectId,
        fromVersion: currentUpdate.version,
        toVersion: targetVersion,
        fromUpdateId: currentUpdate.id,
        toUpdateId: targetUpdate.id,
        reason,
        performedBy: userId,
        performedAt: new Date(),
        success: false,
        filesRestored: 0,
        durationMs: Date.now() - startTime,
        error: rollbackError.message,
      });

      throw error;
    }
  }

  /**
   * Rollback to the previous version
   */
  async rollbackToPrevious(
    request: RollbackToPreviousRequest,
    userId: string
  ): Promise<RollbackResult> {
    const { projectId, reason } = request;

    // Get current active update
    const currentUpdate = await this.prisma.oTAUpdate.findFirst({
      where: {
        projectId,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!currentUpdate) {
      throw new Error('No active update found for project');
    }

    // Get previous version
    const previousUpdate = await this.prisma.oTAUpdate.findFirst({
      where: {
        projectId,
        channelId: currentUpdate.channelId,
        version: { lt: currentUpdate.version },
        status: { in: ['active', 'archived'] },
      },
      orderBy: { version: 'desc' },
    });

    if (!previousUpdate) {
      throw new Error('No previous version found to rollback to');
    }

    // Use rollbackToVersion with the previous version
    return this.rollbackToVersion(
      {
        projectId,
        targetVersion: previousUpdate.version,
        reason: reason || 'Rollback to previous version',
      },
      userId
    );
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Check if rollback is possible
   */
  async canRollback(
    projectId: string,
    targetVersion?: number
  ): Promise<RollbackValidation> {
    return this.validateRollback(projectId, targetVersion);
  }

  /**
   * Validate rollback eligibility
   */
  private async validateRollback(
    projectId: string,
    targetVersion?: number
  ): Promise<RollbackValidation> {
    const warnings: RollbackWarning[] = [];
    const restrictions: RollbackRestriction[] = [];

    // Get current active update
    const currentUpdate = await this.prisma.oTAUpdate.findFirst({
      where: {
        projectId,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!currentUpdate) {
      return {
        canRollback: false,
        reason: 'No active update found for project',
        restrictions: [{
          type: 'no_previous',
          message: 'No active update to rollback from',
          canOverride: false,
        }],
      };
    }

    // Check if current update allows rollback
    if (!currentUpdate.canRollback) {
      return {
        canRollback: false,
        reason: 'Current update is locked and cannot be rolled back',
        currentUpdate: this.formatUpdateInfo(currentUpdate),
        restrictions: [{
          type: 'locked',
          message: 'Update is locked and cannot be rolled back',
          canOverride: false,
        }],
      };
    }

    // Determine target update
    let targetUpdate;
    if (targetVersion !== undefined) {
      targetUpdate = await this.prisma.oTAUpdate.findFirst({
        where: {
          projectId,
          version: targetVersion,
          status: { in: ['active', 'archived'] },
        },
      });

      if (!targetUpdate) {
        return {
          canRollback: false,
          reason: `Target version ${targetVersion} not found`,
          currentUpdate: this.formatUpdateInfo(currentUpdate),
          restrictions: [{
            type: 'no_previous',
            message: `Version ${targetVersion} does not exist`,
            canOverride: false,
          }],
        };
      }
    } else {
      // Get previous version
      targetUpdate = await this.prisma.oTAUpdate.findFirst({
        where: {
          projectId,
          channelId: currentUpdate.channelId,
          version: { lt: currentUpdate.version },
          status: { in: ['active', 'archived'] },
        },
        orderBy: { version: 'desc' },
      });

      if (!targetUpdate) {
        return {
          canRollback: false,
          reason: 'No previous version found to rollback to',
          currentUpdate: this.formatUpdateInfo(currentUpdate),
          restrictions: [{
            type: 'no_previous',
            message: 'No previous version available',
            canOverride: false,
          }],
        };
      }
    }

    // Check minimum version restriction
    if (targetUpdate.version < this.config.minRollbackVersion) {
      restrictions.push({
        type: 'min_version',
        message: `Cannot rollback to version ${targetUpdate.version} (minimum: ${this.config.minRollbackVersion})`,
        canOverride: true,
      });
    }

    // Check version jump restriction
    const versionJump = currentUpdate.version - targetUpdate.version;
    if (versionJump > this.config.maxVersionJump) {
      warnings.push({
        type: 'version_gap',
        message: `Large version jump detected (${versionJump} versions). This may cause compatibility issues.`,
        severity: 'high',
      });
    }

    // Check cooldown period
    const lastRollback = await this.getLastRollback(projectId);
    if (lastRollback) {
      const timeSinceLastRollback = Date.now() - lastRollback.performedAt.getTime();
      if (timeSinceLastRollback < this.config.cooldownPeriodMs) {
        const cooldownEndsAt = new Date(
          lastRollback.performedAt.getTime() + this.config.cooldownPeriodMs
        );
        restrictions.push({
          type: 'cooldown',
          message: `Cooldown period active. Next rollback available at ${cooldownEndsAt.toISOString()}`,
          canOverride: true,
        });
      }
    }

    // Check platform compatibility
    if (currentUpdate.platform !== targetUpdate.platform) {
      warnings.push({
        type: 'compatibility',
        message: `Platform mismatch: current (${currentUpdate.platform}) vs target (${targetUpdate.platform})`,
        severity: 'medium',
      });
    }

    // Check for high error rates on target version
    if (targetUpdate.errorCount > 0) {
      const errorRate = targetUpdate.errorCount / (targetUpdate.downloadCount || 1);
      if (errorRate > 0.1) {
        warnings.push({
          type: 'metrics',
          message: `Target version has high error rate (${(errorRate * 100).toFixed(1)}%)`,
          severity: 'high',
        });
      }
    }

    const canRollback = restrictions.length === 0 ||
                        restrictions.every(r => r.canOverride);

    return {
      canRollback,
      reason: !canRollback ? restrictions[0]?.message : undefined,
      currentUpdate: this.formatUpdateInfo(currentUpdate),
      targetUpdate: this.formatUpdateInfo(targetUpdate),
      warnings: warnings.length > 0 ? warnings : undefined,
      restrictions: restrictions.length > 0 ? restrictions : undefined,
    };
  }

  // ============================================================================
  // ROLLBACK HISTORY
  // ============================================================================

  /**
   * Get rollback history for a project
   */
  async getRollbackHistory(projectId: string, limit = 50): Promise<RollbackHistory> {
    const events = await this.prisma.rollbackEvent.findMany({
      where: { projectId },
      orderBy: { performedAt: 'desc' },
      take: limit,
    });

    const typedEvents: RollbackEvent[] = events.map(event => ({
      id: event.id,
      projectId: event.projectId,
      fromVersion: event.fromVersion,
      toVersion: event.toVersion,
      fromUpdateId: event.fromUpdateId,
      toUpdateId: event.toUpdateId,
      reason: event.reason || undefined,
      performedBy: event.performedBy,
      performedAt: event.performedAt,
      success: event.success,
      filesRestored: event.filesRestored,
      durationMs: event.durationMs,
      error: event.error || undefined,
    }));

    const successfulRollbacks = typedEvents.filter(e => e.success).length;
    const failedRollbacks = typedEvents.length - successfulRollbacks;

    return {
      projectId,
      totalRollbacks: typedEvents.length,
      successfulRollbacks,
      failedRollbacks,
      lastRollback: typedEvents[0],
      events: typedEvents,
    };
  }

  /**
   * Get rollback status for a project
   */
  async getRollbackStatus(projectId: string): Promise<RollbackStatus> {
    const lastRollback = await this.getLastRollback(projectId);

    // Check cooldown
    let inCooldown = false;
    let cooldownEndsAt: Date | undefined;
    if (lastRollback) {
      const timeSinceLastRollback = Date.now() - lastRollback.performedAt.getTime();
      if (timeSinceLastRollback < this.config.cooldownPeriodMs) {
        inCooldown = true;
        cooldownEndsAt = new Date(
          lastRollback.performedAt.getTime() + this.config.cooldownPeriodMs
        );
      }
    }

    // Get rollbacks in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRollbacks = await this.prisma.rollbackEvent.count({
      where: {
        projectId,
        performedAt: { gte: twentyFourHoursAgo },
      },
    });

    // Get available versions
    const updates = await this.prisma.oTAUpdate.findMany({
      where: {
        projectId,
        status: { in: ['active', 'archived'] },
      },
      orderBy: { version: 'desc' },
    });

    const currentUpdate = updates[0];
    const availableVersions = await Promise.all(
      updates.map(async (update) => {
        const validation = await this.validateRollback(projectId, update.version);
        return {
          version: update.version,
          updateId: update.id,
          message: update.message,
          publishedAt: update.publishedAt!,
          canRollbackTo: validation.canRollback && update.version !== currentUpdate?.version,
          reason: !validation.canRollback ? validation.reason : undefined,
        };
      })
    );

    return {
      canRollback: availableVersions.some(v => v.canRollbackTo),
      inCooldown,
      cooldownEndsAt,
      lastRollbackAt: lastRollback?.performedAt,
      rollbacksInLast24Hours: recentRollbacks,
      availableVersions,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Get the last rollback event for a project
   */
  private async getLastRollback(projectId: string): Promise<RollbackEvent | null> {
    const event = await this.prisma.rollbackEvent.findFirst({
      where: { projectId },
      orderBy: { performedAt: 'desc' },
    });

    if (!event) return null;

    return {
      id: event.id,
      projectId: event.projectId,
      fromVersion: event.fromVersion,
      toVersion: event.toVersion,
      fromUpdateId: event.fromUpdateId,
      toUpdateId: event.toUpdateId,
      reason: event.reason || undefined,
      performedBy: event.performedBy,
      performedAt: event.performedAt,
      success: event.success,
      filesRestored: event.filesRestored,
      durationMs: event.durationMs,
      error: event.error || undefined,
    };
  }

  /**
   * Record a rollback event
   */
  private async recordRollbackEvent(event: Omit<RollbackEvent, 'id'>): Promise<{ id: string }> {
    return this.prisma.rollbackEvent.create({
      data: {
        projectId: event.projectId,
        fromVersion: event.fromVersion,
        toVersion: event.toVersion,
        fromUpdateId: event.fromUpdateId,
        toUpdateId: event.toUpdateId,
        reason: event.reason,
        performedBy: event.performedBy,
        performedAt: event.performedAt,
        success: event.success,
        filesRestored: event.filesRestored,
        durationMs: event.durationMs,
        error: event.error,
      },
    });
  }

  /**
   * Create a snapshot before rollback
   */
  private async createRollbackSnapshot(
    projectId: string,
    version: number
  ): Promise<void> {
    // TODO: Integrate with storage service to create actual snapshot
    console.log(`[Rollback] Creating snapshot for project ${projectId} v${version}`);
  }

  /**
   * Send rollback notification
   */
  private async sendRollbackNotification(
    projectId: string,
    fromVersion: number,
    toVersion: number,
    userId: string
  ): Promise<void> {
    // TODO: Integrate with notification service
    console.log(
      `[Rollback] Notification: Project ${projectId} rolled back from v${fromVersion} to v${toVersion} by ${userId}`
    );
  }

  /**
   * Format update info for validation response
   */
  private formatUpdateInfo(update: any): {
    id: string;
    version: number;
    message: string;
    publishedAt: Date;
    platform: string;
  } {
    return {
      id: update.id,
      version: update.version,
      message: update.message,
      publishedAt: update.publishedAt!,
      platform: update.platform,
    };
  }
}
