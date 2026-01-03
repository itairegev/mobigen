/**
 * Analytics Dashboard API
 *
 * REST endpoints for analytics dashboard queries
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Redis from 'ioredis';
import { prisma } from '@mobigen/db';
import { AggregationService } from './aggregations';
import {
  AnalyticsError,
  InvalidDateRangeError,
  TimeGranularity,
  EventFilter,
  EventAnalytics,
  UserAnalytics,
  AnalyticsQueryParams,
  FunnelQueryParams,
  RetentionQueryParams,
} from './dashboard-types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const timeRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional(),
});

const paginationSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  pageSize: z.string().optional().transform(val => (val ? parseInt(val, 10) : 50)),
});

const eventFilterSchema = z.object({
  eventType: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 100)),
  offset: z.string().optional().transform(val => (val ? parseInt(val, 10) : 0)),
});

const funnelQuerySchema = z.object({
  steps: z.string().transform(val => val.split(',')),
  timeWindow: z.string().optional().transform(val => (val ? parseInt(val, 10) : 24)),
});

const retentionQuerySchema = z.object({
  cohortStartDate: z.string().datetime(),
  cohortEndDate: z.string().datetime(),
  retentionDays: z.string().optional().transform(val =>
    val ? val.split(',').map(d => parseInt(d, 10)) : [1, 7, 14, 30]
  ),
});

// ============================================================================
// DASHBOARD API ROUTER
// ============================================================================

export function createDashboardRouter(redis: Redis): express.Router {
  const router = express.Router();
  const aggregationService = new AggregationService(redis);

  // Error handler middleware
  const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (error instanceof AnalyticsError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }

    console.error('Dashboard API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  };

  // ==========================================================================
  // GET /api/projects/:projectId/analytics/overview
  // Get high-level summary metrics for a project
  // ==========================================================================

  router.get(
    '/projects/:projectId/analytics/overview',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const query = timeRangeSchema.parse(req.query);

        const start = new Date(query.start);
        const end = new Date(query.end);

        if (start >= end) {
          throw new InvalidDateRangeError('Start date must be before end date');
        }

        const result = await aggregationService.getOverview(projectId, {
          start,
          end,
          granularity: query.granularity,
        });

        res.json({
          success: true,
          data: result.data,
          cached: result.cached,
          computedAt: result.computedAt,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==========================================================================
  // GET /api/projects/:projectId/analytics/events
  // Get event list with filtering and pagination
  // ==========================================================================

  router.get(
    '/projects/:projectId/analytics/events',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const filter = eventFilterSchema.parse(req.query);

        const where: any = { projectId };

        if (filter.eventType) {
          where.event = filter.eventType;
        }

        if (filter.userId) {
          where.userId = filter.userId;
        }

        if (filter.startDate || filter.endDate) {
          where.timestamp = {};
          if (filter.startDate) {
            where.timestamp.gte = new Date(filter.startDate);
          }
          if (filter.endDate) {
            where.timestamp.lt = new Date(filter.endDate);
          }
        }

        const [events, totalCount, uniqueUsers] = await Promise.all([
          prisma.analyticsEvent.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: filter.limit,
            skip: filter.offset,
          }),
          prisma.analyticsEvent.count({ where }),
          prisma.analyticsEvent.findMany({
            where,
            select: { userId: true },
            distinct: ['userId'],
          }),
        ]);

        const pageSize = filter.limit || 100;
        const page = Math.floor((filter.offset || 0) / pageSize) + 1;

        const result: EventAnalytics = {
          events: events.map(e => ({
            id: e.id,
            event: e.event,
            userId: e.userId || undefined,
            projectId: e.projectId || undefined,
            metadata: e.metadata as Record<string, any>,
            timestamp: e.timestamp,
          })),
          totalCount,
          uniqueUsers: uniqueUsers.length,
          pagination: {
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        };

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==========================================================================
  // GET /api/projects/:projectId/analytics/screens
  // Get screen view analytics
  // ==========================================================================

  router.get(
    '/projects/:projectId/analytics/screens',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const query = timeRangeSchema.parse(req.query);

        const start = new Date(query.start);
        const end = new Date(query.end);

        if (start >= end) {
          throw new InvalidDateRangeError('Start date must be before end date');
        }

        const result = await aggregationService.screenViewCounts(projectId, {
          start,
          end,
          granularity: query.granularity,
        });

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==========================================================================
  // GET /api/projects/:projectId/analytics/users
  // Get user analytics
  // ==========================================================================

  router.get(
    '/projects/:projectId/analytics/users',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const query = timeRangeSchema.parse(req.query);

        const start = new Date(query.start);
        const end = new Date(query.end);

        if (start >= end) {
          throw new InvalidDateRangeError('Start date must be before end date');
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // Get user counts
        const [
          totalUsers,
          dailyActiveUsers,
          weeklyActiveUsers,
          monthlyActiveUsers,
          newUsersToday,
          newUsersThisWeek,
          newUsersThisMonth,
          allEvents,
        ] = await Promise.all([
          prisma.analyticsEvent.findMany({
            where: { projectId },
            select: { userId: true },
            distinct: ['userId'],
          }),
          prisma.analyticsEvent.findMany({
            where: {
              projectId,
              timestamp: { gte: today, lt: tomorrow },
            },
            select: { userId: true },
            distinct: ['userId'],
          }),
          prisma.analyticsEvent.findMany({
            where: {
              projectId,
              timestamp: { gte: weekAgo, lt: tomorrow },
            },
            select: { userId: true },
            distinct: ['userId'],
          }),
          prisma.analyticsEvent.findMany({
            where: {
              projectId,
              timestamp: { gte: monthAgo, lt: tomorrow },
            },
            select: { userId: true },
            distinct: ['userId'],
          }),
          // For new users, we'd need first_seen tracking. Using created date as proxy
          prisma.analyticsEvent.findMany({
            where: {
              projectId,
              timestamp: { gte: today, lt: tomorrow },
            },
            select: { userId: true },
            distinct: ['userId'],
          }),
          prisma.analyticsEvent.findMany({
            where: {
              projectId,
              timestamp: { gte: weekAgo, lt: tomorrow },
            },
            select: { userId: true },
            distinct: ['userId'],
          }),
          prisma.analyticsEvent.findMany({
            where: {
              projectId,
              timestamp: { gte: monthAgo, lt: tomorrow },
            },
            select: { userId: true },
            distinct: ['userId'],
          }),
          prisma.analyticsEvent.findMany({
            where: {
              projectId,
              timestamp: { gte: start, lt: end },
            },
            select: { userId: true, metadata: true },
          }),
        ]);

        // Get device distribution
        let ios = 0;
        let android = 0;
        const platformVersions: Map<string, Map<string, number>> = new Map();

        allEvents.forEach((e: any) => {
          const platform = (e.metadata as any)?.platform?.toLowerCase();
          const version = (e.metadata as any)?.platformVersion || 'unknown';

          if (platform === 'ios') {
            ios++;
            if (!platformVersions.has('iOS')) {
              platformVersions.set('iOS', new Map());
            }
            const versionMap = platformVersions.get('iOS')!;
            versionMap.set(version, (versionMap.get(version) || 0) + 1);
          } else if (platform === 'android') {
            android++;
            if (!platformVersions.has('Android')) {
              platformVersions.set('Android', new Map());
            }
            const versionMap = platformVersions.get('Android')!;
            versionMap.set(version, (versionMap.get(version) || 0) + 1);
          }
        });

        const platformVersionsArray: Array<{
          platform: string;
          version: string;
          count: number;
        }> = [];

        platformVersions.forEach((versions, platform) => {
          versions.forEach((count, version) => {
            platformVersionsArray.push({ platform, version, count });
          });
        });

        const result: UserAnalytics = {
          totalUsers: totalUsers.length,
          activeUsers: {
            daily: dailyActiveUsers.length,
            weekly: weeklyActiveUsers.length,
            monthly: monthlyActiveUsers.length,
          },
          newUsers: {
            today: newUsersToday.length,
            thisWeek: newUsersThisWeek.length,
            thisMonth: newUsersThisMonth.length,
          },
          userSegments: [
            {
              name: 'Active',
              count: dailyActiveUsers.length,
              percentage: totalUsers.length > 0
                ? (dailyActiveUsers.length / totalUsers.length) * 100
                : 0,
              description: 'Users active in the last 24 hours',
            },
            {
              name: 'Inactive',
              count: totalUsers.length - dailyActiveUsers.length,
              percentage: totalUsers.length > 0
                ? ((totalUsers.length - dailyActiveUsers.length) / totalUsers.length) * 100
                : 0,
              description: 'Users not active in the last 24 hours',
            },
          ],
          deviceDistribution: { ios, android },
          platformVersions: platformVersionsArray
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
        };

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==========================================================================
  // GET /api/projects/:projectId/analytics/retention
  // Get retention cohort analysis
  // ==========================================================================

  router.get(
    '/projects/:projectId/analytics/retention',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const query = retentionQuerySchema.parse(req.query);

        const cohortStartDate = new Date(query.cohortStartDate);
        const cohortEndDate = new Date(query.cohortEndDate);

        if (cohortStartDate >= cohortEndDate) {
          throw new InvalidDateRangeError('Cohort start date must be before end date');
        }

        const result = await aggregationService.retentionCohorts(
          projectId,
          cohortStartDate,
          cohortEndDate,
          query.retentionDays
        );

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==========================================================================
  // GET /api/projects/:projectId/analytics/funnel
  // Get funnel analysis
  // ==========================================================================

  router.get(
    '/projects/:projectId/analytics/funnel',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const timeQuery = timeRangeSchema.parse(req.query);
        const funnelQuery = funnelQuerySchema.parse(req.query);

        const start = new Date(timeQuery.start);
        const end = new Date(timeQuery.end);

        if (start >= end) {
          throw new InvalidDateRangeError('Start date must be before end date');
        }

        if (!funnelQuery.steps || funnelQuery.steps.length < 2) {
          throw new InvalidDateRangeError('Funnel must have at least 2 steps');
        }

        const result = await aggregationService.funnelAnalysis(
          projectId,
          funnelQuery.steps,
          { start, end, granularity: timeQuery.granularity },
          funnelQuery.timeWindow
        );

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==========================================================================
  // GET /api/projects/:projectId/analytics/sessions
  // Get session analytics
  // ==========================================================================

  router.get(
    '/projects/:projectId/analytics/sessions',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const query = timeRangeSchema.parse(req.query);

        const start = new Date(query.start);
        const end = new Date(query.end);

        if (start >= end) {
          throw new InvalidDateRangeError('Start date must be before end date');
        }

        const result = await aggregationService.sessionMetrics(projectId, {
          start,
          end,
          granularity: query.granularity,
        });

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==========================================================================
  // GET /api/projects/:projectId/analytics/metrics/dau
  // Get daily active users time series
  // ==========================================================================

  router.get(
    '/projects/:projectId/analytics/metrics/dau',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const query = timeRangeSchema.parse(req.query);

        const start = new Date(query.start);
        const end = new Date(query.end);

        if (start >= end) {
          throw new InvalidDateRangeError('Start date must be before end date');
        }

        const result = await aggregationService.dailyActiveUsers(projectId, {
          start,
          end,
          granularity: 'day',
        });

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==========================================================================
  // GET /api/projects/:projectId/analytics/metrics/mau
  // Get monthly active users time series
  // ==========================================================================

  router.get(
    '/projects/:projectId/analytics/metrics/mau',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const query = timeRangeSchema.parse(req.query);

        const start = new Date(query.start);
        const end = new Date(query.end);

        if (start >= end) {
          throw new InvalidDateRangeError('Start date must be before end date');
        }

        const result = await aggregationService.monthlyActiveUsers(projectId, {
          start,
          end,
          granularity: 'month',
        });

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==========================================================================
  // GET /api/projects/:projectId/analytics/metrics/events
  // Get event count time series
  // ==========================================================================

  router.get(
    '/projects/:projectId/analytics/metrics/events',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const query = timeRangeSchema.parse(req.query);

        const start = new Date(query.start);
        const end = new Date(query.end);

        if (start >= end) {
          throw new InvalidDateRangeError('Start date must be before end date');
        }

        const result = await aggregationService.eventCounts(projectId, {
          start,
          end,
          granularity: query.granularity || 'day',
        });

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Apply error handler
  router.use(errorHandler);

  return router;
}
