import { createClient, type ClickHouseClient } from '@clickhouse/client';
import type { ClickHouseConfig, Event, BatchInsertResult } from './types';

/**
 * ClickHouse client wrapper for Mobigen analytics
 * Optimized for OLAP queries and aggregations
 */
export class ClickHouseAnalytics {
  private client: ClickHouseClient;
  private database: string;

  constructor(config: ClickHouseConfig) {
    this.database = config.database;
    this.client = createClient({
      url: config.url,
      username: config.username,
      password: config.password,
      database: config.database,
      request_timeout: config.request_timeout ?? 60000,
      max_open_connections: config.max_open_connections ?? 10,
      compression: {
        request: config.compression?.request ?? true,
        response: config.compression?.response ?? true,
      },
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WRITE OPERATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Insert a single event
   */
  async insertEvent(event: Event): Promise<void> {
    await this.client.insert({
      table: `${this.database}.events`,
      values: [this.prepareEvent(event)],
      format: 'JSONEachRow',
    });
  }

  /**
   * Batch insert events (optimized for high throughput)
   */
  async batchInsertEvents(events: Event[]): Promise<BatchInsertResult> {
    if (events.length === 0) {
      return { inserted: 0, failed: 0 };
    }

    try {
      const preparedEvents = events.map((e) => this.prepareEvent(e));

      await this.client.insert({
        table: `${this.database}.events`,
        values: preparedEvents,
        format: 'JSONEachRow',
      });

      return { inserted: events.length, failed: 0 };
    } catch (error) {
      console.error('Batch insert failed:', error);
      return {
        inserted: 0,
        failed: events.length,
        errors: [{ index: 0, error: String(error) }],
      };
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // READ OPERATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Execute a raw SQL query
   */
  async query<T = unknown>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    const resultSet = await this.client.query({
      query: sql,
      format: 'JSONEachRow',
      query_params: params,
    });

    return (await resultSet.json()) as T[];
  }

  /**
   * Get Daily Active Users (DAU) for a date range
   */
  async getDailyActiveUsers(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; active_users: number }>> {
    const sql = `
      SELECT
        date,
        active_users
      FROM ${this.database}.daily_active_users
      WHERE project_id = {projectId:UUID}
        AND date >= {startDate:Date}
        AND date <= {endDate:Date}
      ORDER BY date
    `;

    return this.query(sql, {
      projectId,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    });
  }

  /**
   * Get top screens by view count
   */
  async getTopScreens(
    projectId: string,
    startDate: Date,
    endDate: Date,
    limit = 10
  ): Promise<Array<{ screen_name: string; total_views: number; unique_viewers: number }>> {
    const sql = `
      SELECT
        screen_name,
        SUM(view_count) AS total_views,
        AVG(unique_viewers) AS unique_viewers
      FROM ${this.database}.screen_views_by_day
      WHERE project_id = {projectId:UUID}
        AND date >= {startDate:Date}
        AND date <= {endDate:Date}
      GROUP BY screen_name
      ORDER BY total_views DESC
      LIMIT {limit:UInt32}
    `;

    return this.query(sql, {
      projectId,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      limit,
    });
  }

  /**
   * Get event breakdown by type
   */
  async getEventBreakdown(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{
      event_type: string;
      event_name: string;
      total_count: number;
      unique_users: number;
    }>
  > {
    const sql = `
      SELECT
        event_type,
        event_name,
        SUM(event_count) AS total_count,
        AVG(unique_users) AS unique_users
      FROM ${this.database}.events_by_type
      WHERE project_id = {projectId:UUID}
        AND date >= {startDate:Date}
        AND date <= {endDate:Date}
      GROUP BY event_type, event_name
      ORDER BY total_count DESC
    `;

    return this.query(sql, {
      projectId,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    });
  }

  /**
   * Get platform breakdown
   */
  async getPlatformBreakdown(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ platform: string; users: number; sessions: number; events: number }>> {
    const sql = `
      SELECT
        platform,
        SUM(users) AS users,
        SUM(sessions) AS sessions,
        SUM(events) AS events
      FROM ${this.database}.platform_metrics
      WHERE project_id = {projectId:UUID}
        AND date >= {startDate:Date}
        AND date <= {endDate:Date}
      GROUP BY platform
      ORDER BY users DESC
    `;

    return this.query(sql, {
      projectId,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    });
  }

  /**
   * Get hourly metrics for real-time dashboard
   */
  async getHourlyMetrics(
    projectId: string,
    hours = 24
  ): Promise<
    Array<{
      hour: string;
      active_users: number;
      sessions: number;
      events: number;
    }>
  > {
    const sql = `
      SELECT
        hour,
        SUM(active_users) AS active_users,
        SUM(sessions) AS sessions,
        SUM(events) AS events
      FROM ${this.database}.hourly_metrics
      WHERE project_id = {projectId:UUID}
        AND hour >= now() - INTERVAL {hours:UInt32} HOUR
      GROUP BY hour
      ORDER BY hour
    `;

    return this.query(sql, { projectId, hours });
  }

  /**
   * Get funnel conversion rates
   */
  async getFunnelAnalysis(
    projectId: string,
    steps: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ step: string; count: number; conversion_rate: number }>> {
    const stepFilters = steps.map((s, i) => `'${s}'`).join(', ');

    const sql = `
      WITH funnel_data AS (
        SELECT
          event_name,
          COUNT(*) AS count
        FROM ${this.database}.events
        WHERE project_id = {projectId:UUID}
          AND date >= {startDate:Date}
          AND date <= {endDate:Date}
          AND event_name IN (${stepFilters})
        GROUP BY event_name
      )
      SELECT
        event_name AS step,
        count,
        ROUND(count * 100.0 / FIRST_VALUE(count) OVER (ORDER BY count DESC), 2) AS conversion_rate
      FROM funnel_data
      ORDER BY count DESC
    `;

    return this.query(sql, {
      projectId,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UTILITY METHODS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Prepare event for insertion (convert properties to JSON string)
   */
  private prepareEvent(event: Event): Record<string, unknown> {
    return {
      ...event,
      properties: event.properties ? JSON.stringify(event.properties) : '{}',
      timestamp: event.timestamp ?? new Date(),
      ingested_at: new Date(),
    };
  }

  /**
   * Format date for ClickHouse
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Close the client connection
   */
  async close(): Promise<void> {
    await this.client.close();
  }

  /**
   * Ping the database to check connection
   */
  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create a ClickHouse analytics client
 */
export function createClickHouseClient(config: ClickHouseConfig): ClickHouseAnalytics {
  return new ClickHouseAnalytics(config);
}
