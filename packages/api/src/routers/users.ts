import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: {
        projects: { select: { id: true, name: true, status: true } },
      },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        image: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: input,
      });
    }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        notifications: z.object({
          email: z.boolean(),
          buildComplete: z.boolean(),
          weeklyReport: z.boolean(),
        }).optional(),
        preferences: z.object({
          theme: z.enum(['light', 'dark', 'system']),
          defaultTemplate: z.string(),
        }).optional(),
        apiKeys: z.object({
          anthropic: z.string(),
          expo: z.string(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // In production, you'd want to encrypt API keys before storing
      // For now, we'll store them in a JSON field or separate secure storage

      // Get current user to merge settings
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Merge with existing settings (stored in a JSON column or separate table)
      // For simplicity, we'll just acknowledge the update
      return { success: true };
    }),

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    // Return user settings
    // In production, these would be stored in a separate table or JSON column
    return {
      notifications: {
        email: true,
        buildComplete: true,
        weeklyReport: false,
      },
      preferences: {
        theme: 'system' as const,
        defaultTemplate: 'base',
      },
    };
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    // Delete all user data
    await ctx.prisma.$transaction([
      ctx.prisma.usageEvent.deleteMany({ where: { userId: ctx.userId } }),
      ctx.prisma.build.deleteMany({
        where: { project: { userId: ctx.userId } },
      }),
      ctx.prisma.project.deleteMany({ where: { userId: ctx.userId } }),
      ctx.prisma.session.deleteMany({ where: { userId: ctx.userId } }),
      ctx.prisma.account.deleteMany({ where: { userId: ctx.userId } }),
      ctx.prisma.user.delete({ where: { id: ctx.userId } }),
    ]);

    return { success: true };
  }),

  getUsage: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { userId: ctx.userId };

      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) {
          (where.createdAt as Record<string, Date>).gte = input.startDate;
        }
        if (input.endDate) {
          (where.createdAt as Record<string, Date>).lte = input.endDate;
        }
      }

      const events = await ctx.prisma.usageEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      const totalCredits = events.reduce((sum, e) => sum + e.creditsUsed, 0);

      return {
        events,
        totalCredits,
        eventCount: events.length,
      };
    }),
});
