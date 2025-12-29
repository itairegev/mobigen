import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Types for analytics data
const dateRangeSchema = z.object({
  start: z.date().or(z.string().transform((str) => new Date(str))),
  end: z.date().or(z.string().transform((str) => new Date(str))),
});

const granularitySchema = z.enum(['hour', 'day', 'week', 'month']);

// Helper function to check tier access
function checkTierAccess(tier: string, requiredTier: string[]): boolean {
  const tierHierarchy = ['basic', 'pro', 'enterprise'];
  const userTierLevel = tierHierarchy.indexOf(tier);
  const requiredLevel = Math.min(...requiredTier.map(t => tierHierarchy.indexOf(t)));
  return userTierLevel >= requiredLevel;
}

// Helper function to get date range limits based on tier
function getDateRangeLimit(tier: string): number {
  switch (tier) {
    case 'basic':
      return 7; // 7 days
    case 'pro':
      return 90; // 90 days
    case 'enterprise':
      return 365; // 1 year
    default:
      return 7;
  }
}

export const analyticsRouter = router({
  // Get dashboard overview metrics
  getDashboardMetrics: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { user: true },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const tier = project.user?.tier || 'basic';
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // DAU (Daily Active Users) - mock for now, would come from app analytics
      const dau = Math.floor(Math.random() * 1000);
      const mau = Math.floor(Math.random() * 5000);

      // Session count
      const totalSessions = await ctx.prisma.projectSession.count({
        where: { projectId: input.projectId },
      });

      const sessionsLast7Days = await ctx.prisma.projectSession.count({
        where: {
          projectId: input.projectId,
          createdAt: { gte: sevenDaysAgo },
        },
      });

      // Build count
      const totalBuilds = await ctx.prisma.build.count({
        where: { projectId: input.projectId },
      });

      const buildsLast7Days = await ctx.prisma.build.count({
        where: {
          projectId: input.projectId,
          createdAt: { gte: sevenDaysAgo },
        },
      });

      // Retention (mock - would come from app analytics)
      const retention7Day = 0.45; // 45%
      const retention30Day = 0.28; // 28%

      return {
        overview: {
          dau,
          mau,
          totalSessions,
          sessionsLast7Days,
          totalBuilds,
          retention7Day,
          retention30Day,
        },
        tier,
        limits: {
          historyDays: getDateRangeLimit(tier),
          canExport: checkTierAccess(tier, ['pro', 'enterprise']),
          canViewCustomEvents: checkTierAccess(tier, ['pro', 'enterprise']),
          canViewFunnels: checkTierAccess(tier, ['pro', 'enterprise']),
        },
      };
    }),

  // Get time series data for charts
  getTimeSeriesData: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        metric: z.enum(['sessions', 'users', 'builds', 'screenViews']),
        dateRange: dateRangeSchema,
        granularity: granularitySchema,
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { user: true },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const tier = project.user?.tier || 'basic';
      const maxDays = getDateRangeLimit(tier);
      const daysDiff = Math.ceil(
        (input.dateRange.end.getTime() - input.dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysDiff > maxDays) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Your tier allows ${maxDays} days of history. Upgrade to access more.`,
        });
      }

      // Generate mock time series data
      // In production, this would query from ClickHouse/TimescaleDB or analytics service
      const dataPoints = [];
      const intervals = getTimeIntervals(
        input.dateRange.start,
        input.dateRange.end,
        input.granularity
      );

      for (const timestamp of intervals) {
        dataPoints.push({
          timestamp: timestamp.toISOString(),
          value: Math.floor(Math.random() * 500) + 100,
        });
      }

      return {
        metric: input.metric,
        data: dataPoints,
        granularity: input.granularity,
      };
    }),

  // Get top screens by views
  getTopScreens: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().min(1).max(20).default(10),
        dateRange: dateRangeSchema.optional(),
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

      // Mock data - in production would come from analytics events
      const screens = [
        { name: 'Home', views: 45230, uniqueUsers: 12500, avgDuration: 45 },
        { name: 'Products', views: 32100, uniqueUsers: 9800, avgDuration: 120 },
        { name: 'ProductDetail', views: 28900, uniqueUsers: 8500, avgDuration: 90 },
        { name: 'Cart', views: 15600, uniqueUsers: 5200, avgDuration: 60 },
        { name: 'Checkout', views: 8900, uniqueUsers: 3100, avgDuration: 180 },
        { name: 'Profile', views: 7800, uniqueUsers: 4200, avgDuration: 50 },
        { name: 'Settings', views: 3200, uniqueUsers: 2100, avgDuration: 40 },
      ];

      return screens.slice(0, input.limit);
    }),

  // Get user retention cohorts
  getUserRetention: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        cohortSize: z.enum(['day', 'week', 'month']).default('week'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project ownership and tier
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { user: true },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const tier = project.user?.tier || 'basic';
      if (!checkTierAccess(tier, ['pro', 'enterprise'])) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Retention cohorts are available in Pro and Enterprise tiers',
        });
      }

      // Mock retention cohort data
      const cohorts = [
        {
          cohortStart: '2024-01-01',
          cohortSize: 1000,
          retention: [100, 65, 48, 42, 38, 35, 32, 30, 28, 27],
        },
        {
          cohortStart: '2024-01-08',
          cohortSize: 1200,
          retention: [100, 68, 52, 45, 40, 37, 34, 32, 30],
        },
        {
          cohortStart: '2024-01-15',
          cohortSize: 980,
          retention: [100, 62, 46, 40, 36, 33, 31, 29],
        },
        {
          cohortStart: '2024-01-22',
          cohortSize: 1100,
          retention: [100, 70, 54, 47, 42, 38, 35],
        },
      ];

      return cohorts;
    }),

  // Get real-time active users
  getRealTimeUsers: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
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

      // Mock real-time data - in production would come from Redis or live analytics
      const activeNow = Math.floor(Math.random() * 50) + 10;
      const activeLast5Min = Math.floor(Math.random() * 100) + 20;
      const activeLast15Min = Math.floor(Math.random() * 200) + 50;

      return {
        activeNow,
        activeLast5Min,
        activeLast15Min,
        timestamp: new Date().toISOString(),
      };
    }),

  // Get custom events (Pro/Enterprise only)
  getCustomEvents: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        eventName: z.string().optional(),
        dateRange: dateRangeSchema.optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project ownership and tier
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { user: true },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const tier = project.user?.tier || 'basic';
      if (!checkTierAccess(tier, ['pro', 'enterprise'])) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Custom events are available in Pro and Enterprise tiers',
        });
      }

      // Mock custom events data
      const events = [
        {
          name: 'purchase_completed',
          count: 450,
          uniqueUsers: 320,
          avgValue: 89.99,
        },
        {
          name: 'add_to_cart',
          count: 1200,
          uniqueUsers: 780,
          avgValue: 45.5,
        },
        {
          name: 'share_product',
          count: 280,
          uniqueUsers: 210,
          avgValue: null,
        },
      ];

      return events.slice(0, input.limit);
    }),

  // Export analytics data (Pro/Enterprise only)
  exportData: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        dataType: z.enum(['sessions', 'users', 'screens', 'events']),
        dateRange: dateRangeSchema,
        format: z.enum(['csv', 'json']).default('csv'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership and tier
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { user: true },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const tier = project.user?.tier || 'basic';
      if (!checkTierAccess(tier, ['pro', 'enterprise'])) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Data export is available in Pro and Enterprise tiers',
        });
      }

      // In production, this would generate a downloadable file
      // For now, return a mock URL
      const exportId = crypto.randomUUID();
      const downloadUrl = `/api/analytics/exports/${exportId}.${input.format}`;

      return {
        exportId,
        downloadUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        format: input.format,
      };
    }),
});

// Helper function to generate time intervals
function getTimeIntervals(
  start: Date,
  end: Date,
  granularity: 'hour' | 'day' | 'week' | 'month'
): Date[] {
  const intervals: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    intervals.push(new Date(current));

    switch (granularity) {
      case 'hour':
        current.setHours(current.getHours() + 1);
        break;
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return intervals;
}
