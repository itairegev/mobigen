import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  OTAUpdatesService,
  CreateChannelSchema,
  PublishUpdateSchema,
  RollbackUpdateSchema,
  TrackUpdateEventSchema,
} from '@mobigen/ota-updates';
import type { RollbackService as RollbackServiceType } from '../types/rollback-service';

/**
 * Helper to dynamically import RollbackService with proper types
 * Using dynamic import to avoid circular dependencies
 * The path is computed to prevent TypeScript from following it during compilation
 */
async function getRollbackService(prisma: unknown): Promise<RollbackServiceType> {
  const servicePath = ['..', '..', '..', '..', 'services', 'generator', 'src', 'rollback-service'].join('/');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const module = await import(/* webpackIgnore: true */ servicePath) as any;
  return new module.RollbackService(prisma) as RollbackServiceType;
}

/**
 * OTA Updates Router
 * Handles Over-The-Air updates using Expo Updates
 */
export const otaUpdatesRouter = router({
  // ============================================================================
  // CHANNEL MANAGEMENT
  // ============================================================================

  /**
   * Create a new update channel
   */
  createChannel: protectedProcedure
    .input(CreateChannelSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const service = new OTAUpdatesService(ctx.prisma);
      return service.createChannel(input);
    }),

  /**
   * List all channels for a project
   */
  listChannels: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const service = new OTAUpdatesService(ctx.prisma);
      return service.listChannels(input.projectId);
    }),

  /**
   * Get a specific channel
   */
  getChannel: protectedProcedure
    .input(z.object({ channelId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const service = new OTAUpdatesService(ctx.prisma);
      const channel = await service.getChannel(input.channelId);

      if (!channel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Channel not found' });
      }

      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: channel.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      return channel;
    }),

  /**
   * Delete a channel
   */
  deleteChannel: protectedProcedure
    .input(z.object({ channelId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const service = new OTAUpdatesService(ctx.prisma);
      const channel = await service.getChannel(input.channelId);

      if (!channel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Channel not found' });
      }

      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: channel.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      await service.deleteChannel(input.channelId);
      return { success: true };
    }),

  // ============================================================================
  // UPDATE PUBLISHING
  // ============================================================================

  /**
   * Publish a new OTA update
   */
  publishUpdate: protectedProcedure
    .input(PublishUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Get project path from storage service
      // TODO: Integrate with storage service to get actual project path
      const projectPath = `/tmp/projects/${input.projectId}`;

      const service = new OTAUpdatesService(ctx.prisma);
      return service.publishUpdate(input, projectPath, ctx.userId!);
    }),

  /**
   * List updates for a project/channel
   */
  listUpdates: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        channelId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const service = new OTAUpdatesService(ctx.prisma);
      return service.listUpdates(input.projectId, input.channelId, input.limit);
    }),

  /**
   * Get a specific update
   */
  getUpdate: protectedProcedure
    .input(z.object({ updateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const service = new OTAUpdatesService(ctx.prisma);
      const update = await service.getUpdate(input.updateId);

      if (!update) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Update not found' });
      }

      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: update.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      return update;
    }),

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  /**
   * Rollback to a previous update (legacy - kept for compatibility)
   */
  rollback: protectedProcedure
    .input(RollbackUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new OTAUpdatesService(ctx.prisma);
      const currentUpdate = await service.getUpdate(input.updateId);

      if (!currentUpdate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Update not found' });
      }

      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: currentUpdate.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      return service.rollbackUpdate(input, ctx.userId!);
    }),

  /**
   * Rollback to previous version
   */
  rollbackToPrevious: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Use helper to get typed RollbackService
      const rollbackService = await getRollbackService(ctx.prisma);

      return rollbackService.rollbackToPrevious(
        { projectId: input.projectId, reason: input.reason },
        ctx.userId!
      );
    }),

  /**
   * Rollback to specific version
   */
  rollbackToVersion: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      targetVersion: z.number().int().positive(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Use helper to get typed RollbackService
      const rollbackService = await getRollbackService(ctx.prisma);

      return rollbackService.rollbackToVersion(
        {
          projectId: input.projectId,
          targetVersion: input.targetVersion,
          reason: input.reason,
        },
        ctx.userId!
      );
    }),

  /**
   * Check if rollback is possible
   */
  canRollback: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      targetVersion: z.number().int().positive().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Use helper to get typed RollbackService
      const rollbackService = await getRollbackService(ctx.prisma);

      return rollbackService.canRollback(input.projectId, input.targetVersion);
    }),

  /**
   * Get rollback status for a project
   */
  getRollbackStatus: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Use helper to get typed RollbackService
      const rollbackService = await getRollbackService(ctx.prisma);

      return rollbackService.getRollbackStatus(input.projectId);
    }),

  /**
   * Get rollback history for a project
   */
  getRollbackHistory: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Use helper to get typed RollbackService
      const rollbackService = await getRollbackService(ctx.prisma);

      return rollbackService.getRollbackHistory(input.projectId, input.limit);
    }),

  // ============================================================================
  // METRICS & ANALYTICS
  // ============================================================================

  /**
   * Track an update event (called from mobile apps)
   */
  trackEvent: publicProcedure
    .input(TrackUpdateEventSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new OTAUpdatesService(ctx.prisma);
      await service.trackEvent(input);
      return { success: true };
    }),

  /**
   * Get metrics for an update
   */
  getMetrics: protectedProcedure
    .input(z.object({ updateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const service = new OTAUpdatesService(ctx.prisma);
      const update = await service.getUpdate(input.updateId);

      if (!update) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Update not found' });
      }

      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: update.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      return service.getUpdateMetrics(input.updateId);
    }),

  /**
   * Get update status/health
   */
  getUpdateStatus: protectedProcedure
    .input(z.object({ updateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const service = new OTAUpdatesService(ctx.prisma);
      const update = await service.getUpdate(input.updateId);

      if (!update) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Update not found' });
      }

      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: update.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      return service.getUpdateStatus(input.updateId);
    }),

  /**
   * Get update configuration for a project (used by mobile apps)
   */
  getConfig: publicProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get project
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Get default channel
      const service = new OTAUpdatesService(ctx.prisma);
      const defaultChannel = await service.getDefaultChannel(input.projectId);

      // Get project config from app.json
      // TODO: Read from storage service
      const runtimeVersion = '1.0.0'; // Default

      return {
        easProjectId: process.env.EAS_PROJECT_ID || '',
        runtimeVersion,
        updateUrl: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
        channels: {
          production: defaultChannel?.branchName || 'production',
          staging: 'staging',
          development: 'development',
        },
      };
    }),
});
