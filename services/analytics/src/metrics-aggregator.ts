import Redis from 'ioredis';
import { prisma } from '@mobigen/db';

export interface DashboardMetrics {
  overview: {
    totalProjects: number;
    totalGenerations: number;
    totalBuilds: number;
    totalTokensUsed: number;
    totalCost: number;
  };
  recentActivity: {
    generationsLast24h: number;
    buildsLast24h: number;
    tokensLast24h: number;
  };
  trends: {
    generationsChange: number; // Percentage change vs previous period
    buildsChange: number;
    tokensChange: number;
  };
  topProjects: Array<{
    id: string;
    name: string;
    generations: number;
    lastActivity: Date;
  }>;
}

export interface MetricsRangeParams {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface TimeSeriesMetric {
  timestamp: string;
  generations: number;
  builds: number;
  tokens: number;
  cost: number;
}

export class MetricsAggregator {
  private redis: Redis;
  private readonly METRICS_PREFIX = 'analytics:metrics';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Get totals from database
    const [
      totalProjects,
      totalGenerations,
      totalBuilds,
      generationsLast24h,
      generationsPrevious24h,
      buildsLast24h,
      buildsPrevious24h,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.generation.count(),
      prisma.build.count(),
      prisma.generation.count({
        where: { createdAt: { gte: yesterday } },
      }),
      prisma.generation.count({
        where: {
          createdAt: { gte: twoDaysAgo, lt: yesterday },
        },
      }),
      prisma.build.count({
        where: { createdAt: { gte: yesterday } },
      }),
      prisma.build.count({
        where: {
          createdAt: { gte: twoDaysAgo, lt: yesterday },
        },
      }),
    ]);

    // Get token usage from Redis
    const hourlyKeys = await this.redis.keys(`analytics:usage:hourly:*`);
    let tokensLast24h = 0;
    let tokensPrevious24h = 0;

    for (const key of hourlyKeys) {
      const hour = key.split(':').pop() || '';
      const hourDate = new Date(hour.replace('-', 'T') + ':00:00Z');

      const data = await this.redis.hgetall(key);
      const tokens = parseInt(data.tokens) || 0;

      if (hourDate >= yesterday) {
        tokensLast24h += tokens;
      } else if (hourDate >= twoDaysAgo) {
        tokensPrevious24h += tokens;
      }
    }

    // Calculate percentage changes
    const generationsChange = this.calculateChange(generationsLast24h, generationsPrevious24h);
    const buildsChange = this.calculateChange(buildsLast24h, buildsPrevious24h);
    const tokensChange = this.calculateChange(tokensLast24h, tokensPrevious24h);

    // Get top projects
    const topProjects = await prisma.project.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        _count: {
          select: { generations: true },
        },
      },
    });

    // Get total tokens and cost from aggregated data
    const totalTokensData = await this.redis.get(`${this.METRICS_PREFIX}:total:tokens`);
    const totalCostData = await this.redis.get(`${this.METRICS_PREFIX}:total:cost`);

    return {
      overview: {
        totalProjects,
        totalGenerations,
        totalBuilds,
        totalTokensUsed: parseInt(totalTokensData || '0'),
        totalCost: parseFloat(totalCostData || '0'),
      },
      recentActivity: {
        generationsLast24h,
        buildsLast24h,
        tokensLast24h,
      },
      trends: {
        generationsChange,
        buildsChange,
        tokensChange,
      },
      topProjects: topProjects.map((p) => ({
        id: p.id,
        name: p.name,
        generations: p._count.generations,
        lastActivity: p.updatedAt,
      })),
    };
  }

  async getMetricsRange(params: MetricsRangeParams): Promise<TimeSeriesMetric[]> {
    const { start, end, granularity } = params;
    const metrics: TimeSeriesMetric[] = [];

    const intervals = this.getIntervals(start, end, granularity);

    for (const interval of intervals) {
      const key = `${this.METRICS_PREFIX}:${granularity}:${interval}`;
      const data = await this.redis.hgetall(key);

      metrics.push({
        timestamp: interval,
        generations: parseInt(data.generations) || 0,
        builds: parseInt(data.builds) || 0,
        tokens: parseInt(data.tokens) || 0,
        cost: parseFloat(data.cost) || 0,
      });
    }

    return metrics;
  }

  async aggregateHourly(): Promise<void> {
    const now = new Date();
    const hourKey = this.getHourKey(now);
    const prevHourKey = this.getHourKey(new Date(now.getTime() - 60 * 60 * 1000));

    // Aggregate from raw data
    const startOfHour = new Date(now);
    startOfHour.setMinutes(0, 0, 0);

    const endOfHour = new Date(startOfHour);
    endOfHour.setHours(endOfHour.getHours() + 1);

    const [generations, builds] = await Promise.all([
      prisma.generation.count({
        where: {
          createdAt: { gte: startOfHour, lt: endOfHour },
        },
      }),
      prisma.build.count({
        where: {
          createdAt: { gte: startOfHour, lt: endOfHour },
        },
      }),
    ]);

    // Get token usage from Redis
    const usageKey = `analytics:usage:hourly:${hourKey}`;
    const usageData = await this.redis.hgetall(usageKey);
    const tokens = parseInt(usageData.tokens) || 0;

    // Get cost from Redis
    const costKey = `analytics:costs:global:${this.getDayKey(now)}`;
    const costData = await this.redis.hgetall(costKey);
    const cost = (parseInt(costData.totalCents) || 0) / 100;

    // Store aggregated metrics
    const metricsKey = `${this.METRICS_PREFIX}:hour:${hourKey}`;
    await this.redis.hmset(metricsKey, {
      generations: generations.toString(),
      builds: builds.toString(),
      tokens: tokens.toString(),
      cost: cost.toString(),
    });
    await this.redis.expire(metricsKey, 60 * 60 * 24 * 7); // 7 days

    console.log(`Aggregated hourly metrics for ${hourKey}`);
  }

  async aggregateDaily(): Promise<void> {
    const now = new Date();
    const dayKey = this.getDayKey(now);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [generations, builds] = await Promise.all([
      prisma.generation.count({
        where: {
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
      }),
      prisma.build.count({
        where: {
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
      }),
    ]);

    // Sum up hourly tokens
    let totalTokens = 0;
    for (let hour = 0; hour < 24; hour++) {
      const hourDate = new Date(startOfDay);
      hourDate.setHours(hour);
      const hourKey = this.getHourKey(hourDate);
      const usageKey = `analytics:usage:hourly:${hourKey}`;
      const data = await this.redis.hgetall(usageKey);
      totalTokens += parseInt(data.tokens) || 0;
    }

    // Get cost
    const costKey = `analytics:costs:global:${dayKey}`;
    const costData = await this.redis.hgetall(costKey);
    const cost = (parseInt(costData.totalCents) || 0) / 100;

    // Store daily metrics
    const metricsKey = `${this.METRICS_PREFIX}:day:${dayKey}`;
    await this.redis.hmset(metricsKey, {
      generations: generations.toString(),
      builds: builds.toString(),
      tokens: totalTokens.toString(),
      cost: cost.toString(),
    });
    await this.redis.expire(metricsKey, 60 * 60 * 24 * 90); // 90 days

    // Update totals
    await this.redis.incrby(`${this.METRICS_PREFIX}:total:tokens`, totalTokens);
    await this.redis.incrbyfloat(`${this.METRICS_PREFIX}:total:cost`, cost);

    console.log(`Aggregated daily metrics for ${dayKey}`);
  }

  async generateWeeklyReports(): Promise<void> {
    // Get all users with activity this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const activeUsers = await prisma.user.findMany({
      where: {
        projects: {
          some: {
            updatedAt: { gte: oneWeekAgo },
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`Generating weekly reports for ${activeUsers.length} users`);

    // In production, this would send emails with usage summaries
    for (const user of activeUsers) {
      console.log(`Would send weekly report to ${user.email}`);
    }
  }

  async cleanupOldData(daysToKeep: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Clean up old events from database
    const deletedEvents = await prisma.analyticsEvent.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    // Clean up old API usage from database
    const deletedUsage = await prisma.apiUsage.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    console.log(`Cleaned up ${deletedEvents.count} events and ${deletedUsage.count} usage records`);

    // Redis keys are auto-expired, but we can manually clean if needed
    const oldKeys = await this.redis.keys(`analytics:*:${this.getDayKey(cutoffDate)}:*`);
    if (oldKeys.length > 0) {
      await this.redis.del(...oldKeys);
      console.log(`Cleaned up ${oldKeys.length} Redis keys`);
    }
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private getIntervals(start: Date, end: Date, granularity: string): string[] {
    const intervals: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      switch (granularity) {
        case 'hour':
          intervals.push(this.getHourKey(current));
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          intervals.push(this.getDayKey(current));
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          intervals.push(this.getWeekKey(current));
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          intervals.push(this.getMonthKey(current));
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return intervals;
  }

  private getDayKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getHourKey(date: Date): string {
    return date.toISOString().slice(0, 13).replace('T', '-');
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getMonthKey(date: Date): string {
    return date.toISOString().slice(0, 7);
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
