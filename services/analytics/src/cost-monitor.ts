import Redis from 'ioredis';
import { prisma } from '@mobigen/db';

// Pricing per 1M tokens (as of late 2024)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-opus': { input: 15.0, output: 75.0 },
  'claude-3-sonnet': { input: 3.0, output: 15.0 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'claude-3.5-haiku': { input: 0.8, output: 4.0 },
  // Default for unknown models
  default: { input: 3.0, output: 15.0 },
};

export interface TrackCostParams {
  userId: string;
  projectId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface CostBreakdown {
  totalCost: number;
  inputCost: number;
  outputCost: number;
  byModel: Record<string, {
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
  }>;
  byDay: Array<{
    date: string;
    cost: number;
    tokens: number;
  }>;
  projectedMonthly: number;
}

export class CostMonitor {
  private redis: Redis;
  private readonly COST_PREFIX = 'analytics:costs';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async trackCost(params: TrackCostParams): Promise<number> {
    const { userId, projectId, model, inputTokens, outputTokens } = params;

    const pricing = MODEL_PRICING[model] || MODEL_PRICING.default;
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;

    // Store in cents for precision
    const costCents = Math.round(totalCost * 100);

    const dayKey = this.getDayKey(new Date());
    const pipeline = this.redis.pipeline();

    // User daily costs
    const userCostKey = `${this.COST_PREFIX}:user:${userId}:${dayKey}`;
    pipeline.hincrby(userCostKey, 'totalCents', costCents);
    pipeline.hincrby(userCostKey, 'inputCents', Math.round(inputCost * 100));
    pipeline.hincrby(userCostKey, 'outputCents', Math.round(outputCost * 100));
    pipeline.hincrby(userCostKey, `model:${model}:cents`, costCents);
    pipeline.expire(userCostKey, 60 * 60 * 24 * 90);

    // Project costs
    if (projectId) {
      const projectCostKey = `${this.COST_PREFIX}:project:${projectId}:${dayKey}`;
      pipeline.hincrby(projectCostKey, 'totalCents', costCents);
      pipeline.hincrby(projectCostKey, 'inputCents', Math.round(inputCost * 100));
      pipeline.hincrby(projectCostKey, 'outputCents', Math.round(outputCost * 100));
      pipeline.expire(projectCostKey, 60 * 60 * 24 * 90);
    }

    // Global daily costs
    const globalCostKey = `${this.COST_PREFIX}:global:${dayKey}`;
    pipeline.hincrby(globalCostKey, 'totalCents', costCents);
    pipeline.expire(globalCostKey, 60 * 60 * 24 * 90);

    await pipeline.exec();

    return totalCost;
  }

  async getUserCosts(userId: string, period: string): Promise<CostBreakdown> {
    const days = this.getPeriodDays(period);
    const breakdown: CostBreakdown = {
      totalCost: 0,
      inputCost: 0,
      outputCost: 0,
      byModel: {},
      byDay: [],
      projectedMonthly: 0,
    };

    const now = new Date();
    let totalDaysWithData = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = this.getDayKey(date);

      const userCostKey = `${this.COST_PREFIX}:user:${userId}:${dayKey}`;
      const dayCosts = await this.redis.hgetall(userCostKey);

      if (dayCosts.totalCents) {
        totalDaysWithData++;
        const totalCents = parseInt(dayCosts.totalCents) || 0;
        const inputCents = parseInt(dayCosts.inputCents) || 0;
        const outputCents = parseInt(dayCosts.outputCents) || 0;

        breakdown.totalCost += totalCents / 100;
        breakdown.inputCost += inputCents / 100;
        breakdown.outputCost += outputCents / 100;

        breakdown.byDay.push({
          date: dayKey,
          cost: totalCents / 100,
          tokens: 0, // Would need to store this separately
        });

        // Extract model costs
        for (const [key, value] of Object.entries(dayCosts)) {
          const match = key.match(/^model:(.+):cents$/);
          if (match) {
            const model = match[1];
            if (!breakdown.byModel[model]) {
              breakdown.byModel[model] = {
                inputTokens: 0,
                outputTokens: 0,
                inputCost: 0,
                outputCost: 0,
                totalCost: 0,
              };
            }
            breakdown.byModel[model].totalCost += parseInt(value) / 100;
          }
        }
      }
    }

    breakdown.byDay.reverse();

    // Calculate projected monthly cost
    if (totalDaysWithData > 0) {
      const avgDailyCost = breakdown.totalCost / totalDaysWithData;
      breakdown.projectedMonthly = avgDailyCost * 30;
    }

    return breakdown;
  }

  async getProjectCosts(projectId: string, period: string): Promise<CostBreakdown> {
    const days = this.getPeriodDays(period);
    const breakdown: CostBreakdown = {
      totalCost: 0,
      inputCost: 0,
      outputCost: 0,
      byModel: {},
      byDay: [],
      projectedMonthly: 0,
    };

    const now = new Date();
    let totalDaysWithData = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = this.getDayKey(date);

      const projectCostKey = `${this.COST_PREFIX}:project:${projectId}:${dayKey}`;
      const dayCosts = await this.redis.hgetall(projectCostKey);

      if (dayCosts.totalCents) {
        totalDaysWithData++;
        const totalCents = parseInt(dayCosts.totalCents) || 0;
        const inputCents = parseInt(dayCosts.inputCents) || 0;
        const outputCents = parseInt(dayCosts.outputCents) || 0;

        breakdown.totalCost += totalCents / 100;
        breakdown.inputCost += inputCents / 100;
        breakdown.outputCost += outputCents / 100;

        breakdown.byDay.push({
          date: dayKey,
          cost: totalCents / 100,
          tokens: 0,
        });
      }
    }

    breakdown.byDay.reverse();

    if (totalDaysWithData > 0) {
      const avgDailyCost = breakdown.totalCost / totalDaysWithData;
      breakdown.projectedMonthly = avgDailyCost * 30;
    }

    return breakdown;
  }

  async getGlobalCosts(period: string): Promise<CostBreakdown> {
    const days = this.getPeriodDays(period);
    const breakdown: CostBreakdown = {
      totalCost: 0,
      inputCost: 0,
      outputCost: 0,
      byModel: {},
      byDay: [],
      projectedMonthly: 0,
    };

    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = this.getDayKey(date);

      const globalCostKey = `${this.COST_PREFIX}:global:${dayKey}`;
      const dayCosts = await this.redis.hgetall(globalCostKey);

      if (dayCosts.totalCents) {
        const totalCents = parseInt(dayCosts.totalCents) || 0;
        breakdown.totalCost += totalCents / 100;

        breakdown.byDay.push({
          date: dayKey,
          cost: totalCents / 100,
          tokens: 0,
        });
      }
    }

    breakdown.byDay.reverse();

    return breakdown;
  }

  async checkBudgetAlert(userId: string, budget: number): Promise<{
    exceeded: boolean;
    current: number;
    percentage: number;
  }> {
    const costs = await this.getUserCosts(userId, 'month');

    return {
      exceeded: costs.totalCost >= budget,
      current: costs.totalCost,
      percentage: (costs.totalCost / budget) * 100,
    };
  }

  private getDayKey(date: Date): string {
    return date.toISOString().split('T')[0];
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
