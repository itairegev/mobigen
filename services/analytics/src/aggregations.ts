/**
 * Analytics Aggregation Service
 *
 * Computes analytics metrics with Redis caching for performance
 */

import Redis from 'ioredis';
import { prisma } from '@mobigen/db';
import {
  TimeRangeParams,
  MetricDataPoint,
  AnalyticsOverview,
  ScreenAnalytics,
  ScreenMetrics,
  UserAnalytics,
  RetentionData,
  RetentionCohort,
  FunnelAnalytics,
  FunnelStep,
  SessionAnalytics,
  AggregationResult,
  CacheOptions,
  InvalidDateRangeError,
  ProjectNotFoundError,
} from './dashboard-types';

const CACHE_PREFIX = 'analytics:dashboard';

export class AggregationService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // ==========================================================================
  // OVERVIEW METRICS
  // ==========================================================================

  async getOverview(
    projectId: string,
    timeRange: TimeRangeParams
  ): Promise<AggregationResult<AnalyticsOverview>> {
    const cacheKey = `${CACHE_PREFIX}:overview:${projectId}:${this.getTimeRangeKey(timeRange)}`;

    // Try cache first
    const cached = await this.getFromCache<AnalyticsOverview>(cacheKey);
    if (cached) {
      return {
        data: cached,
        cached: true,
        computedAt: new Date(),
      };
    }

    // Validate project exists
    await this.validateProject(projectId);

    const { start, end } = timeRange;
    const previousPeriodStart = new Date(start);
    previousPeriodStart.setTime(
      previousPeriodStart.getTime() - (end.getTime() - start.getTime())
    );

    // Get current period metrics
    const [dau, mau, sessions, screenViews] = await Promise.all([
      this.getDailyActiveUsers(projectId, { start, end }),
      this.getMonthlyActiveUsers(projectId, { start, end }),
      this.getSessionCount(projectId, { start, end }),
      this.getScreenViewCount(projectId, { start, end }),
    ]);

    // Get previous period metrics for trends
    const [prevDau, prevMau, prevSessions, prevScreenViews] = await Promise.all([
      this.getDailyActiveUsers(projectId, {
        start: previousPeriodStart,
        end: start,
      }),
      this.getMonthlyActiveUsers(projectId, {
        start: previousPeriodStart,
        end: start,
      }),
      this.getSessionCount(projectId, {
        start: previousPeriodStart,
        end: start,
      }),
      this.getScreenViewCount(projectId, {
        start: previousPeriodStart,
        end: start,
      }),
    ]);

    // Get additional metrics
    const [avgSessionDuration, retention7, retention30, topScreens, topEvents, deviceCounts] =
      await Promise.all([
        this.getAvgSessionDuration(projectId, { start, end }),
        this.getRetentionRate(projectId, 7),
        this.getRetentionRate(projectId, 30),
        this.getTopScreens(projectId, { start, end }, 5),
        this.getTopEvents(projectId, { start, end }, 5),
        this.getDeviceCounts(projectId, { start, end }),
      ]);

    const overview: AnalyticsOverview = {
      summary: {
        dailyActiveUsers: dau,
        monthlyActiveUsers: mau,
        totalSessions: sessions,
        totalScreenViews: screenViews,
        avgSessionDuration,
        retentionRate7Day: retention7,
        retentionRate30Day: retention30,
      },
      trends: {
        dauChange: this.calculatePercentChange(dau, prevDau),
        mauChange: this.calculatePercentChange(mau, prevMau),
        sessionsChange: this.calculatePercentChange(sessions, prevSessions),
        screenViewsChange: this.calculatePercentChange(screenViews, prevScreenViews),
      },
      insights: {
        topScreens,
        topEvents,
        activeDevices: deviceCounts,
      },
    };

    // Cache for 5 minutes
    await this.setCache(cacheKey, overview, 300);

    return {
      data: overview,
      cached: false,
      computedAt: new Date(),
    };
  }

  // ==========================================================================
  // DAILY ACTIVE USERS (DAU)
  // ==========================================================================

  async dailyActiveUsers(
    projectId: string,
    dateRange: TimeRangeParams
  ): Promise<MetricDataPoint[]> {
    const { start, end } = dateRange;
    const dataPoints: MetricDataPoint[] = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.getDailyActiveUsers(projectId, {
        start: currentDate,
        end: nextDate,
      });

      dataPoints.push({
        timestamp: currentDate.toISOString().split('T')[0],
        value: count,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dataPoints;
  }

  private async getDailyActiveUsers(
    projectId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    const count = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        timestamp: {
          gte: timeRange.start,
          lt: timeRange.end,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return count.length;
  }

  // ==========================================================================
  // MONTHLY ACTIVE USERS (MAU)
  // ==========================================================================

  async monthlyActiveUsers(
    projectId: string,
    dateRange: TimeRangeParams
  ): Promise<MetricDataPoint[]> {
    const { start, end } = dateRange;
    const dataPoints: MetricDataPoint[] = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const count = await this.getMonthlyActiveUsers(projectId, {
        start: currentDate,
        end: nextMonth,
      });

      dataPoints.push({
        timestamp: currentDate.toISOString().slice(0, 7), // YYYY-MM
        value: count,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return dataPoints;
  }

  private async getMonthlyActiveUsers(
    projectId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    const count = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        timestamp: {
          gte: timeRange.start,
          lt: timeRange.end,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return count.length;
  }

  // ==========================================================================
  // SESSION METRICS
  // ==========================================================================

  async sessionMetrics(
    projectId: string,
    dateRange: TimeRangeParams
  ): Promise<SessionAnalytics> {
    const cacheKey = `${CACHE_PREFIX}:sessions:${projectId}:${this.getTimeRangeKey(dateRange)}`;

    const cached = await this.getFromCache<SessionAnalytics>(cacheKey);
    if (cached) return cached;

    const { start, end } = dateRange;

    // Get session events (session_start events)
    const sessionEvents = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        event: 'session_start',
        timestamp: {
          gte: start,
          lt: end,
        },
      },
      select: {
        metadata: true,
        timestamp: true,
      },
    });

    const totalSessions = sessionEvents.length;

    // Calculate session durations
    const durations = sessionEvents
      .map((e: any) => (e.metadata as any)?.duration || 0)
      .filter((d: number) => d > 0);

    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Calculate median
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const medianDuration =
      sortedDurations.length > 0
        ? sortedDurations[Math.floor(sortedDurations.length / 2)]
        : 0;

    // Sessions per user
    const uniqueUsers = new Set(sessionEvents.map((e: any) => (e.metadata as any)?.userId)).size;
    const sessionsPerUser = uniqueUsers > 0 ? totalSessions / uniqueUsers : 0;

    // Sessions by hour
    const sessionsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: sessionEvents.filter((e) => new Date(e.timestamp).getHours() === hour).length,
    }));

    // Sessions by day
    const sessionsByDay: Record<string, number> = {};
    sessionEvents.forEach((e) => {
      const day = new Date(e.timestamp).toISOString().split('T')[0];
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
    });

    const result: SessionAnalytics = {
      totalSessions,
      avgSessionDuration: avgDuration,
      medianSessionDuration: medianDuration,
      sessionsPerUser,
      sessionsByHour,
      sessionsByDay: Object.entries(sessionsByDay).map(([day, count]) => ({ day, count })),
    };

    await this.setCache(cacheKey, result, 600); // 10 minutes
    return result;
  }

  private async getSessionCount(
    projectId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    return prisma.analyticsEvent.count({
      where: {
        projectId,
        event: 'session_start',
        timestamp: {
          gte: timeRange.start,
          lt: timeRange.end,
        },
      },
    });
  }

  private async getAvgSessionDuration(
    projectId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    const sessions = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        event: 'session_start',
        timestamp: {
          gte: timeRange.start,
          lt: timeRange.end,
        },
      },
      select: { metadata: true },
    });

    const durations = sessions
      .map((s: any) => (s.metadata as any)?.duration || 0)
      .filter((d: number) => d > 0);

    return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  }

  // ==========================================================================
  // SCREEN ANALYTICS
  // ==========================================================================

  async screenViewCounts(
    projectId: string,
    dateRange: TimeRangeParams
  ): Promise<ScreenAnalytics> {
    const cacheKey = `${CACHE_PREFIX}:screens:${projectId}:${this.getTimeRangeKey(dateRange)}`;

    const cached = await this.getFromCache<ScreenAnalytics>(cacheKey);
    if (cached) return cached;

    const { start, end } = dateRange;

    const screenEvents = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        event: 'screen_view',
        timestamp: {
          gte: start,
          lt: end,
        },
      },
      select: {
        userId: true,
        metadata: true,
      },
    });

    const screenMap: Map<string, ScreenMetrics> = new Map();

    screenEvents.forEach((event: any) => {
      const screen = (event.metadata as any)?.screen || 'unknown';
      const timeOnScreen = (event.metadata as any)?.timeOnScreen || 0;

      if (!screenMap.has(screen)) {
        screenMap.set(screen, {
          screen,
          views: 0,
          uniqueUsers: new Set<string>(),
          avgTimeOnScreen: 0,
          totalTime: 0,
          bounceRate: 0,
          entrances: 0,
          exits: 0,
        } as any);
      }

      const metrics = screenMap.get(screen)!;
      metrics.views++;
      (metrics as any).uniqueUsers.add(event.userId);
      (metrics as any).totalTime += timeOnScreen;
    });

    const screens: ScreenMetrics[] = Array.from(screenMap.values()).map((m: any) => ({
      screen: m.screen,
      views: m.views,
      uniqueUsers: m.uniqueUsers.size,
      avgTimeOnScreen: m.views > 0 ? m.totalTime / m.views : 0,
      bounceRate: 0, // TODO: Calculate based on navigation paths
      entrances: 0, // TODO: Calculate from session starts
      exits: 0, // TODO: Calculate from session ends
    }));

    const result: ScreenAnalytics = {
      screens: screens.sort((a, b) => b.views - a.views),
      totalViews: screenEvents.length,
      uniqueScreens: screenMap.size,
    };

    await this.setCache(cacheKey, result, 600); // 10 minutes
    return result;
  }

  private async getScreenViewCount(
    projectId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    return prisma.analyticsEvent.count({
      where: {
        projectId,
        event: 'screen_view',
        timestamp: {
          gte: timeRange.start,
          lt: timeRange.end,
        },
      },
    });
  }

  private async getTopScreens(
    projectId: string,
    timeRange: { start: Date; end: Date },
    limit: number
  ): Promise<Array<{ screen: string; views: number }>> {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        event: 'screen_view',
        timestamp: {
          gte: timeRange.start,
          lt: timeRange.end,
        },
      },
      select: { metadata: true },
    });

    const screenCounts: Record<string, number> = {};
    events.forEach((e: any) => {
      const screen = (e.metadata as any)?.screen || 'unknown';
      screenCounts[screen] = (screenCounts[screen] || 0) + 1;
    });

    return Object.entries(screenCounts)
      .map(([screen, views]) => ({ screen, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  // ==========================================================================
  // EVENT ANALYTICS
  // ==========================================================================

  async eventCounts(
    projectId: string,
    dateRange: TimeRangeParams
  ): Promise<MetricDataPoint[]> {
    const { start, end, granularity = 'day' } = dateRange;
    const dataPoints: MetricDataPoint[] = [];

    const events = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        timestamp: {
          gte: start,
          lt: end,
        },
      },
      select: { timestamp: true },
    });

    // Group by granularity
    const grouped = this.groupByGranularity(events, granularity);

    for (const [key, count] of Object.entries(grouped)) {
      dataPoints.push({
        timestamp: key,
        value: count,
      });
    }

    return dataPoints.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private async getTopEvents(
    projectId: string,
    timeRange: { start: Date; end: Date },
    limit: number
  ): Promise<Array<{ event: string; count: number }>> {
    const events = await prisma.analyticsEvent.groupBy({
      by: ['event'],
      where: {
        projectId,
        timestamp: {
          gte: timeRange.start,
          lt: timeRange.end,
        },
      },
      _count: true,
      orderBy: {
        _count: { event: 'desc' },
      },
      take: limit,
    });

    return events.map((e) => ({
      event: e.event,
      count: e._count,
    }));
  }

  // ==========================================================================
  // RETENTION COHORTS
  // ==========================================================================

  async retentionCohorts(
    projectId: string,
    cohortStartDate: Date,
    cohortEndDate: Date,
    retentionDays: number[] = [1, 7, 14, 30]
  ): Promise<RetentionData> {
    const cacheKey = `${CACHE_PREFIX}:retention:${projectId}:${cohortStartDate.toISOString()}:${cohortEndDate.toISOString()}`;

    const cached = await this.getFromCache<RetentionData>(cacheKey);
    if (cached) return cached;

    const cohorts: RetentionCohort[] = [];
    const currentDate = new Date(cohortStartDate);

    while (currentDate <= cohortEndDate) {
      const cohortDate = new Date(currentDate);
      const nextDay = new Date(cohortDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Get users who first used the app on this date
      const cohortUsers = await prisma.analyticsEvent.findMany({
        where: {
          projectId,
          timestamp: {
            gte: cohortDate,
            lt: nextDay,
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      const cohortUserIds = cohortUsers.map((u) => u.userId).filter((id): id is string => !!id);
      const cohortSize = cohortUserIds.length;

      if (cohortSize === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Calculate retention for each day
      const retention: any = { day0: 100 };

      for (const day of retentionDays) {
        const retentionDate = new Date(cohortDate);
        retentionDate.setDate(retentionDate.getDate() + day);

        const retentionNextDay = new Date(retentionDate);
        retentionNextDay.setDate(retentionNextDay.getDate() + 1);

        const returnedUsers = await prisma.analyticsEvent.findMany({
          where: {
            projectId,
            userId: { in: cohortUserIds },
            timestamp: {
              gte: retentionDate,
              lt: retentionNextDay,
            },
          },
          select: { userId: true },
          distinct: ['userId'],
        });

        const retentionRate = (returnedUsers.length / cohortSize) * 100;
        retention[`day${day}`] = Math.round(retentionRate * 100) / 100;
      }

      cohorts.push({
        cohortDate: cohortDate.toISOString().split('T')[0],
        cohortSize,
        retention,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate overall retention
    const overall: any = {};
    retentionDays.forEach((day) => {
      const avg =
        cohorts.reduce((sum, c) => sum + (c.retention as any)[`day${day}`] || 0, 0) /
        cohorts.length;
      overall[`day${day}`] = Math.round(avg * 100) / 100;
    });

    const result: RetentionData = { cohorts, overall };

    await this.setCache(cacheKey, result, 3600); // 1 hour
    return result;
  }

  private async getRetentionRate(projectId: string, days: number): Promise<number> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const cohortStart = new Date(startDate);
    cohortStart.setDate(cohortStart.getDate() - days);

    const cohortUsers = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        timestamp: {
          gte: cohortStart,
          lt: startDate,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const cohortUserIds = cohortUsers.map((u) => u.userId).filter((id): id is string => !!id);

    if (cohortUserIds.length === 0) return 0;

    const returnedUsers = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        userId: { in: cohortUserIds },
        timestamp: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return (returnedUsers.length / cohortUserIds.length) * 100;
  }

  // ==========================================================================
  // FUNNEL ANALYSIS
  // ==========================================================================

  async funnelAnalysis(
    projectId: string,
    funnelSteps: string[],
    timeRange: TimeRangeParams,
    timeWindowHours: number = 24
  ): Promise<FunnelAnalytics> {
    const { start, end } = timeRange;

    // Get all events in the time range for the funnel steps
    const events = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        event: { in: funnelSteps },
        timestamp: {
          gte: start,
          lt: end,
        },
      },
      select: {
        userId: true,
        event: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group events by user
    const userEvents: Map<string, Array<{ event: string; timestamp: Date }>> = new Map();
    events.forEach((e) => {
      if (!e.userId) return;
      if (!userEvents.has(e.userId)) {
        userEvents.set(e.userId, []);
      }
      userEvents.get(e.userId)!.push({ event: e.event, timestamp: e.timestamp });
    });

    // Calculate funnel steps
    const steps: FunnelStep[] = [];
    let previousStepUsers = new Set<string>();

    funnelSteps.forEach((stepEvent, index) => {
      const usersInStep = new Set<string>();
      const timeFromPrevious: number[] = [];

      userEvents.forEach((userEventList, userId) => {
        // Check if user completed this step
        const stepIndex = userEventList.findIndex((e) => e.event === stepEvent);
        if (stepIndex === -1) return;

        // Check if previous step was completed within time window (if not first step)
        if (index > 0) {
          const prevStepEvent = funnelSteps[index - 1];
          const prevStepIndex = userEventList.findIndex((e) => e.event === prevStepEvent);

          if (prevStepIndex === -1) return;

          const timeDiff =
            userEventList[stepIndex].timestamp.getTime() -
            userEventList[prevStepIndex].timestamp.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          if (hoursDiff > timeWindowHours) return;

          timeFromPrevious.push(timeDiff / 1000); // Convert to seconds
        }

        usersInStep.add(userId);
      });

      const users = usersInStep.size;
      const prevUsers = index === 0 ? users : previousStepUsers.size;
      const conversionRate = prevUsers > 0 ? (users / prevUsers) * 100 : 0;
      const dropoffRate = prevUsers > 0 ? ((prevUsers - users) / prevUsers) * 100 : 0;
      const avgTimeFromPrevious =
        timeFromPrevious.length > 0
          ? timeFromPrevious.reduce((a, b) => a + b, 0) / timeFromPrevious.length
          : 0;

      steps.push({
        step: `Step ${index + 1}`,
        eventName: stepEvent,
        users,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dropoffRate: Math.round(dropoffRate * 100) / 100,
        avgTimeFromPrevious: Math.round(avgTimeFromPrevious),
      });

      previousStepUsers = usersInStep;
    });

    const totalEntries = steps[0]?.users || 0;
    const finalStepUsers = steps[steps.length - 1]?.users || 0;
    const overallConversion = totalEntries > 0 ? (finalStepUsers / totalEntries) * 100 : 0;

    const dropoffPoints = steps.slice(0, -1).map((step, index) => ({
      fromStep: step.eventName,
      toStep: steps[index + 1].eventName,
      dropoffRate: step.dropoffRate,
    }));

    const avgTimeToComplete = steps.reduce((sum, step) => sum + step.avgTimeFromPrevious, 0);

    return {
      funnel: steps,
      totalEntries,
      conversionRate: Math.round(overallConversion * 100) / 100,
      avgTimeToComplete,
      dropoffPoints,
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async getDeviceCounts(
    projectId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{ ios: number; android: number }> {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        projectId,
        timestamp: {
          gte: timeRange.start,
          lt: timeRange.end,
        },
      },
      select: {
        userId: true,
        metadata: true,
      },
      distinct: ['userId'],
    });

    let ios = 0;
    let android = 0;

    events.forEach((e: any) => {
      const platform = (e.metadata as any)?.platform?.toLowerCase();
      if (platform === 'ios') ios++;
      else if (platform === 'android') android++;
    });

    return { ios, android };
  }

  private calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change * 100) / 100;
  }

  private groupByGranularity(
    events: Array<{ timestamp: Date }>,
    granularity: 'hour' | 'day' | 'week' | 'month'
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    events.forEach((event) => {
      let key: string;
      const date = new Date(event.timestamp);

      switch (granularity) {
        case 'hour':
          key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
          break;
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = date.toISOString().slice(0, 7); // YYYY-MM
          break;
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return grouped;
  }

  private getTimeRangeKey(timeRange: TimeRangeParams): string {
    return `${timeRange.start.toISOString()}_${timeRange.end.toISOString()}_${timeRange.granularity || 'day'}`;
  }

  private async validateProject(projectId: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new ProjectNotFoundError(projectId);
    }
  }

  // ==========================================================================
  // CACHE HELPERS
  // ==========================================================================

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  private async setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }
}
