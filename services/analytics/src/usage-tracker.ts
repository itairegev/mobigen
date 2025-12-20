import Redis from 'ioredis';
import { prisma } from '@mobigen/db';

export interface TrackEventParams {
  event: string;
  userId?: string;
  projectId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface TrackAPIUsageParams {
  userId: string;
  projectId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  requestId?: string;
  timestamp: Date;
}

export interface UsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  uniqueProjects: number;
  eventCounts: Record<string, number>;
  byModel: Record<string, {
    requests: number;
    inputTokens: number;
    outputTokens: number;
  }>;
  byDay: Array<{
    date: string;
    requests: number;
    tokens: number;
  }>;
}

export class UsageTracker {
  private redis: Redis;
  private readonly EVENT_PREFIX = 'analytics:events';
  private readonly USAGE_PREFIX = 'analytics:usage';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async trackEvent(params: TrackEventParams): Promise<void> {
    const { event, userId, projectId, metadata, timestamp } = params;

    // Store event in Redis for real-time counting
    const dayKey = this.getDayKey(timestamp);
    const eventKey = `${this.EVENT_PREFIX}:${dayKey}:${event}`;

    await this.redis.incr(eventKey);
    await this.redis.expire(eventKey, 60 * 60 * 24 * 90); // 90 days TTL

    // Store detailed event in Redis list (for recent events)
    const eventData = JSON.stringify({
      event,
      userId,
      projectId,
      metadata,
      timestamp: timestamp.toISOString(),
    });

    await this.redis.lpush(`${this.EVENT_PREFIX}:recent`, eventData);
    await this.redis.ltrim(`${this.EVENT_PREFIX}:recent`, 0, 9999); // Keep last 10k events

    // Also store in database for persistence
    try {
      await prisma.analyticsEvent.create({
        data: {
          event,
          userId,
          projectId,
          metadata: metadata || {},
          timestamp,
        },
      });
    } catch (error) {
      // Log but don't fail if DB write fails
      console.error('Failed to persist event to database:', error);
    }
  }

  async trackAPIUsage(params: TrackAPIUsageParams): Promise<void> {
    const {
      userId,
      projectId,
      model,
      inputTokens,
      outputTokens,
      requestId,
      timestamp,
    } = params;

    const dayKey = this.getDayKey(timestamp);
    const hourKey = this.getHourKey(timestamp);

    // Increment counters in Redis
    const pipeline = this.redis.pipeline();

    // Daily user stats
    const userDayKey = `${this.USAGE_PREFIX}:user:${userId}:${dayKey}`;
    pipeline.hincrby(userDayKey, 'requests', 1);
    pipeline.hincrby(userDayKey, 'inputTokens', inputTokens);
    pipeline.hincrby(userDayKey, 'outputTokens', outputTokens);
    pipeline.expire(userDayKey, 60 * 60 * 24 * 90);

    // Daily model stats
    const modelDayKey = `${this.USAGE_PREFIX}:model:${model}:${dayKey}`;
    pipeline.hincrby(modelDayKey, 'requests', 1);
    pipeline.hincrby(modelDayKey, 'inputTokens', inputTokens);
    pipeline.hincrby(modelDayKey, 'outputTokens', outputTokens);
    pipeline.expire(modelDayKey, 60 * 60 * 24 * 90);

    // Hourly global stats (for real-time dashboard)
    const hourlyKey = `${this.USAGE_PREFIX}:hourly:${hourKey}`;
    pipeline.hincrby(hourlyKey, 'requests', 1);
    pipeline.hincrby(hourlyKey, 'tokens', inputTokens + outputTokens);
    pipeline.expire(hourlyKey, 60 * 60 * 48); // 48 hours

    // Project stats
    if (projectId) {
      const projectDayKey = `${this.USAGE_PREFIX}:project:${projectId}:${dayKey}`;
      pipeline.hincrby(projectDayKey, 'requests', 1);
      pipeline.hincrby(projectDayKey, 'inputTokens', inputTokens);
      pipeline.hincrby(projectDayKey, 'outputTokens', outputTokens);
      pipeline.expire(projectDayKey, 60 * 60 * 24 * 90);
    }

    await pipeline.exec();

    // Store detailed usage in database
    try {
      await prisma.apiUsage.create({
        data: {
          userId,
          projectId,
          model,
          inputTokens,
          outputTokens,
          requestId,
          timestamp,
        },
      });
    } catch (error) {
      console.error('Failed to persist API usage to database:', error);
    }
  }

  async getUserStats(userId: string, period: string): Promise<UsageStats> {
    const days = this.getPeriodDays(period);
    const stats: UsageStats = {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      uniqueProjects: 0,
      eventCounts: {},
      byModel: {},
      byDay: [],
    };

    // Get stats for each day in the period
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = this.getDayKey(date);

      const userDayKey = `${this.USAGE_PREFIX}:user:${userId}:${dayKey}`;
      const dayStats = await this.redis.hgetall(userDayKey);

      if (dayStats.requests) {
        const requests = parseInt(dayStats.requests) || 0;
        const inputTokens = parseInt(dayStats.inputTokens) || 0;
        const outputTokens = parseInt(dayStats.outputTokens) || 0;

        stats.totalRequests += requests;
        stats.totalInputTokens += inputTokens;
        stats.totalOutputTokens += outputTokens;

        stats.byDay.push({
          date: dayKey,
          requests,
          tokens: inputTokens + outputTokens,
        });
      }
    }

    stats.totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
    stats.byDay.reverse(); // Chronological order

    // Get model breakdown from database
    try {
      const modelStats = await prisma.apiUsage.groupBy({
        by: ['model'],
        where: {
          userId,
          timestamp: {
            gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
          },
        },
        _count: { id: true },
        _sum: {
          inputTokens: true,
          outputTokens: true,
        },
      });

      for (const stat of modelStats) {
        stats.byModel[stat.model] = {
          requests: stat._count.id,
          inputTokens: stat._sum.inputTokens || 0,
          outputTokens: stat._sum.outputTokens || 0,
        };
      }

      // Get unique projects count
      const projectCount = await prisma.apiUsage.findMany({
        where: {
          userId,
          projectId: { not: null },
          timestamp: {
            gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
          },
        },
        distinct: ['projectId'],
        select: { projectId: true },
      });
      stats.uniqueProjects = projectCount.length;
    } catch (error) {
      console.error('Failed to get model stats from database:', error);
    }

    return stats;
  }

  async getProjectStats(projectId: string, period: string): Promise<UsageStats> {
    const days = this.getPeriodDays(period);
    const stats: UsageStats = {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      uniqueProjects: 1,
      eventCounts: {},
      byModel: {},
      byDay: [],
    };

    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = this.getDayKey(date);

      const projectDayKey = `${this.USAGE_PREFIX}:project:${projectId}:${dayKey}`;
      const dayStats = await this.redis.hgetall(projectDayKey);

      if (dayStats.requests) {
        const requests = parseInt(dayStats.requests) || 0;
        const inputTokens = parseInt(dayStats.inputTokens) || 0;
        const outputTokens = parseInt(dayStats.outputTokens) || 0;

        stats.totalRequests += requests;
        stats.totalInputTokens += inputTokens;
        stats.totalOutputTokens += outputTokens;

        stats.byDay.push({
          date: dayKey,
          requests,
          tokens: inputTokens + outputTokens,
        });
      }
    }

    stats.totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
    stats.byDay.reverse();

    return stats;
  }

  private getDayKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getHourKey(date: Date): string {
    return date.toISOString().slice(0, 13).replace('T', '-');
  }

  private getPeriodDays(period: string): number {
    switch (period) {
      case 'day':
        return 1;
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'quarter':
        return 90;
      case 'year':
        return 365;
      default:
        return 30;
    }
  }
}
