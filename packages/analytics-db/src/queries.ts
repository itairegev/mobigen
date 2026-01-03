import type { ClickHouseAnalytics } from './clickhouse';
import type { TimescaleAnalytics } from './timescale';
import type { DashboardData, DateRangeQuery } from './types';

/**
 * Common analytics queries that work across both databases
 * Uses the most appropriate database for each query type
 */
export class AnalyticsQueries {
  constructor(
    private clickhouse: ClickHouseAnalytics,
    private timescale: TimescaleAnalytics
  ) {}

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DASHBOARD DATA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get complete dashboard data for a project
   */
  async getDashboardData(query: DateRangeQuery): Promise<DashboardData> {
    const { project_id, start_date, end_date } = query;

    // Run queries in parallel
    const [
      dauData,
      mau,
      dailyMetrics,
      platformBreakdown,
      topScreens,
      retention,
      hourlyMetrics,
    ] = await Promise.all([
      // DAU trend (ClickHouse - fast aggregations)
      this.clickhouse.getDailyActiveUsers(project_id, start_date, end_date),

      // MAU (TimescaleDB - has built-in time functions)
      this.timescale.getMonthlyActiveUsers(project_id, end_date),

      // Daily metrics (TimescaleDB - continuous aggregates)
      this.timescale.getDailyMetrics(project_id, start_date, end_date),

      // Platform breakdown (ClickHouse - materialized views)
      this.clickhouse.getPlatformBreakdown(project_id, start_date, end_date),

      // Top screens (ClickHouse - fast aggregations)
      this.clickhouse.getTopScreens(project_id, start_date, end_date, 10),

      // 7-day retention (TimescaleDB - has retention function)
      this.timescale.getRetentionRate(project_id, start_date, 7),

      // Recent hourly metrics (ClickHouse - real-time)
      this.clickhouse.getHourlyMetrics(project_id, 24),
    ]);

    // Calculate overview metrics
    const latestMetrics = dailyMetrics[dailyMetrics.length - 1];
    const dau = dauData[dauData.length - 1]?.active_users ?? 0;
    const totalSessions = dailyMetrics.reduce((sum, m) => sum + m.total_sessions, 0);
    const totalEvents = dailyMetrics.reduce((sum, m) => sum + m.total_events, 0);
    const avgSessionDuration = dailyMetrics.reduce(
      (sum, m) => sum + m.avg_event_duration_ms,
      0
    ) / dailyMetrics.length;

    // Calculate platform percentages
    const totalUsers = platformBreakdown.reduce((sum, p) => sum + p.users, 0);
    const platformBreakdownWithPercentages = platformBreakdown.map((p) => ({
      ...p,
      percentage: totalUsers > 0 ? Math.round((p.users / totalUsers) * 100) : 0,
    }));

    // Real-time metrics
    const activeNow = hourlyMetrics[hourlyMetrics.length - 1]?.active_users ?? 0;
    const eventsLastHour = hourlyMetrics[hourlyMetrics.length - 1]?.events ?? 0;

    return {
      overview: {
        dau,
        mau,
        total_sessions: totalSessions,
        avg_session_duration: Math.round(avgSessionDuration),
        total_events: totalEvents,
      },
      charts: {
        dau_trend: dauData.map((d) => ({
          date: d.date,
          users: d.active_users,
        })),
        platform_breakdown: platformBreakdownWithPercentages,
        top_screens: topScreens,
        retention,
      },
      real_time: {
        active_now: activeNow,
        events_last_hour: eventsLastHour,
      },
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPARISON QUERIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Compare metrics between two time periods
   */
  async compareTimePeriods(
    projectId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<{
    current: { dau: number; sessions: number; events: number };
    previous: { dau: number; sessions: number; events: number };
    change: { dau_pct: number; sessions_pct: number; events_pct: number };
  }> {
    const [currentMetrics, previousMetrics] = await Promise.all([
      this.timescale.getDailyMetrics(projectId, currentStart, currentEnd),
      this.timescale.getDailyMetrics(projectId, previousStart, previousEnd),
    ]);

    const current = {
      dau: currentMetrics.reduce((sum, m) => sum + m.daily_active_users, 0) / currentMetrics.length,
      sessions: currentMetrics.reduce((sum, m) => sum + m.total_sessions, 0),
      events: currentMetrics.reduce((sum, m) => sum + m.total_events, 0),
    };

    const previous = {
      dau: previousMetrics.reduce((sum, m) => sum + m.daily_active_users, 0) / previousMetrics.length,
      sessions: previousMetrics.reduce((sum, m) => sum + m.total_sessions, 0),
      events: previousMetrics.reduce((sum, m) => sum + m.total_events, 0),
    };

    const change = {
      dau_pct: previous.dau > 0 ? ((current.dau - previous.dau) / previous.dau) * 100 : 0,
      sessions_pct:
        previous.sessions > 0 ? ((current.sessions - previous.sessions) / previous.sessions) * 100 : 0,
      events_pct: previous.events > 0 ? ((current.events - previous.events) / previous.events) * 100 : 0,
    };

    return { current, previous, change };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FUNNEL ANALYSIS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Analyze conversion funnel
   */
  async analyzeFunnel(
    projectId: string,
    steps: string[],
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{
      step: string;
      count: number;
      conversion_rate: number;
      drop_off_rate: number;
    }>
  > {
    // Use ClickHouse for funnel analysis (better for this type of query)
    const funnelData = await this.clickhouse.getFunnelAnalysis(projectId, steps, startDate, endDate);

    // Calculate drop-off rates
    return funnelData.map((step, index) => {
      const dropOffRate =
        index > 0 ? 100 - step.conversion_rate : 0;

      return {
        step: step.step,
        count: step.count,
        conversion_rate: step.conversion_rate,
        drop_off_rate: Math.round(dropOffRate * 100) / 100,
      };
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COHORT ANALYSIS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get cohort retention matrix
   */
  async getCohortRetention(
    projectId: string,
    startDate: Date,
    endDate: Date,
    days = 7
  ): Promise<
    Array<{
      cohort_date: string;
      retention: Array<{ day: number; rate: number }>;
    }>
  > {
    const cohorts: Array<{
      cohort_date: string;
      retention: Array<{ day: number; rate: number }>;
    }> = [];

    // Calculate retention for each cohort (one per day in range)
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const retention = await this.timescale.getRetentionRate(
        projectId,
        currentDate,
        days
      );

      cohorts.push({
        cohort_date: currentDate.toISOString().split('T')[0],
        retention: retention.map((r) => ({
          day: r.day_offset,
          rate: r.retention_rate,
        })),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return cohorts;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PERFORMANCE METRICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get app performance metrics
   */
  async getPerformanceMetrics(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    session_duration: { p50: number; p75: number; p90: number; p95: number; p99: number };
    screen_load_times: Array<{ screen_name: string; avg_ms: number }>;
  }> {
    const [sessionDuration, screenMetrics] = await Promise.all([
      this.timescale.getSessionDurationPercentiles(projectId, startDate, endDate),
      this.timescale.getScreenViewMetrics(projectId, startDate, endDate),
    ]);

    // Aggregate screen load times
    const screenLoadTimes = screenMetrics.reduce((acc, metric) => {
      const existing = acc.find((s) => s.screen_name === metric.screen_name);
      if (existing) {
        existing.avg_ms =
          (existing.avg_ms + metric.avg_time_on_screen_ms) / 2;
      } else {
        acc.push({
          screen_name: metric.screen_name,
          avg_ms: metric.avg_time_on_screen_ms,
        });
      }
      return acc;
    }, [] as Array<{ screen_name: string; avg_ms: number }>);

    return {
      session_duration: sessionDuration,
      screen_load_times: screenLoadTimes.sort((a, b) => b.avg_ms - a.avg_ms).slice(0, 10),
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GEOGRAPHIC ANALYSIS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get geographic breakdown
   */
  async getGeographicBreakdown(
    projectId: string,
    startDate: Date,
    endDate: Date,
    limit = 20
  ): Promise<
    Array<{
      country: string;
      users: number;
      events: number;
      sessions: number;
    }>
  > {
    // Use TimescaleDB for geographic analysis
    const countryMetrics = await this.timescale.getCountryMetrics(
      projectId,
      startDate,
      endDate,
      limit
    );

    // Enhance with session data from ClickHouse (if needed)
    return countryMetrics.map((m) => ({
      country: m.country,
      users: m.users,
      events: m.events,
      sessions: 0, // Would need to join with sessions data
    }));
  }
}

/**
 * Create an analytics queries client
 */
export function createAnalyticsQueries(
  clickhouse: ClickHouseAnalytics,
  timescale: TimescaleAnalytics
): AnalyticsQueries {
  return new AnalyticsQueries(clickhouse, timescale);
}
