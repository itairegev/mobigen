import { Pool, type PoolClient, type QueryResult } from 'pg';
import type {
  TimescaleConfig,
  Event,
  BatchInsertResult,
  DailyMetrics,
  HourlyMetrics,
  RetentionRate,
} from './types';

/**
 * TimescaleDB client wrapper for Mobigen analytics
 * Optimized for time-series queries and continuous aggregates
 */
export class TimescaleAnalytics {
  private pool: Pool;

  constructor(config: TimescaleConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.max_connections ?? 20,
      idleTimeoutMillis: config.idle_timeout_ms ?? 30000,
      connectionTimeoutMillis: config.connection_timeout_ms ?? 10000,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WRITE OPERATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Insert a single event
   */
  async insertEvent(event: Event): Promise<void> {
    const sql = `
      INSERT INTO events (
        event_type, event_name, timestamp, project_id, app_version, bundle_id,
        user_id, anonymous_id, session_id, platform, os_version, device_model,
        app_build_number, country, region, city, properties, screen_name, duration_ms
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
    `;

    const values = [
      event.event_type,
      event.event_name,
      event.timestamp ?? new Date(),
      event.project_id,
      event.app_version,
      event.bundle_id,
      event.user_id,
      event.anonymous_id,
      event.session_id,
      event.platform,
      event.os_version,
      event.device_model,
      event.app_build_number,
      event.country,
      event.region,
      event.city,
      event.properties ? JSON.stringify(event.properties) : null,
      event.screen_name,
      event.duration_ms,
    ];

    await this.query(sql, values);
  }

  /**
   * Batch insert events using COPY for high performance
   */
  async batchInsertEvents(events: Event[]): Promise<BatchInsertResult> {
    if (events.length === 0) {
      return { inserted: 0, failed: 0 };
    }

    const client = await this.pool.connect();

    try {
      // Use COPY for bulk insert (much faster than individual INSERTs)
      const copySQL = `
        COPY events (
          event_type, event_name, timestamp, project_id, app_version, bundle_id,
          user_id, anonymous_id, session_id, platform, os_version, device_model,
          app_build_number, country, region, city, properties, screen_name, duration_ms
        ) FROM STDIN WITH (FORMAT csv)
      `;

      // Convert events to CSV rows
      const csvRows = events
        .map((e) => {
          const values = [
            e.event_type,
            e.event_name,
            (e.timestamp ?? new Date()).toISOString(),
            e.project_id,
            e.app_version || '',
            e.bundle_id || '',
            e.user_id || '',
            e.anonymous_id,
            e.session_id,
            e.platform,
            e.os_version || '',
            e.device_model || '',
            e.app_build_number || '',
            e.country || '',
            e.region || '',
            e.city || '',
            e.properties ? JSON.stringify(e.properties) : '',
            e.screen_name || '',
            e.duration_ms || '',
          ];

          // Escape and quote CSV values
          return values
            .map((v) => {
              const str = String(v);
              return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
            })
            .join(',');
        })
        .join('\n');

      await client.query(copySQL + '\n' + csvRows + '\n\\.');

      return { inserted: events.length, failed: 0 };
    } catch (error) {
      console.error('Batch insert failed:', error);
      return {
        inserted: 0,
        failed: events.length,
        errors: [{ index: 0, error: String(error) }],
      };
    } finally {
      client.release();
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // READ OPERATIONS - Continuous Aggregates
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get daily metrics
   */
  async getDailyMetrics(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyMetrics[]> {
    const sql = `
      SELECT
        day,
        project_id,
        total_events,
        daily_active_users,
        total_sessions,
        unique_screens_viewed,
        avg_event_duration_ms
      FROM daily_metrics
      WHERE project_id = $1
        AND day >= $2::date
        AND day <= $3::date
      ORDER BY day
    `;

    const result = await this.query(sql, [projectId, startDate, endDate]);
    return result.rows as DailyMetrics[];
  }

  /**
   * Get hourly metrics
   */
  async getHourlyMetrics(
    projectId: string,
    hours = 24
  ): Promise<HourlyMetrics[]> {
    const sql = `
      SELECT
        hour,
        project_id,
        event_type,
        event_count,
        unique_users,
        unique_sessions,
        avg_duration_ms,
        median_duration_ms,
        p95_duration_ms
      FROM hourly_metrics
      WHERE project_id = $1
        AND hour >= NOW() - INTERVAL '${hours} hours'
      ORDER BY hour
    `;

    const result = await this.query(sql, [projectId]);
    return result.rows as HourlyMetrics[];
  }

  /**
   * Get screen view metrics
   */
  async getScreenViewMetrics(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{
      day: Date;
      screen_name: string;
      view_count: number;
      unique_viewers: number;
      avg_time_on_screen_ms: number;
    }>
  > {
    const sql = `
      SELECT
        day,
        screen_name,
        view_count,
        unique_viewers,
        avg_time_on_screen_ms
      FROM daily_screen_views
      WHERE project_id = $1
        AND day >= $2::date
        AND day <= $3::date
      ORDER BY day DESC, view_count DESC
    `;

    const result = await this.query(sql, [projectId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Get platform breakdown
   */
  async getPlatformMetrics(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ platform: string; events: number; users: number; sessions: number }>> {
    const sql = `
      SELECT
        platform,
        SUM(events) AS events,
        SUM(users) AS users,
        SUM(sessions) AS sessions
      FROM daily_platform_metrics
      WHERE project_id = $1
        AND day >= $2::date
        AND day <= $3::date
      GROUP BY platform
      ORDER BY users DESC
    `;

    const result = await this.query(sql, [projectId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Get country breakdown
   */
  async getCountryMetrics(
    projectId: string,
    startDate: Date,
    endDate: Date,
    limit = 10
  ): Promise<Array<{ country: string; events: number; users: number }>> {
    const sql = `
      SELECT
        country,
        SUM(events) AS events,
        SUM(users) AS users
      FROM daily_country_metrics
      WHERE project_id = $1
        AND day >= $2::date
        AND day <= $3::date
      GROUP BY country
      ORDER BY users DESC
      LIMIT $4
    `;

    const result = await this.query(sql, [projectId, startDate, endDate, limit]);
    return result.rows;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ADVANCED ANALYTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get retention rate using the built-in function
   */
  async getRetentionRate(
    projectId: string,
    cohortDate: Date,
    days = 7
  ): Promise<RetentionRate[]> {
    const sql = `
      SELECT * FROM get_retention_rate($1::UUID, $2::DATE, $3)
    `;

    const result = await this.query(sql, [projectId, cohortDate, days]);
    return result.rows as RetentionRate[];
  }

  /**
   * Get MAU (Monthly Active Users)
   */
  async getMonthlyActiveUsers(projectId: string, month: Date): Promise<number> {
    const sql = `
      SELECT COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS mau
      FROM events
      WHERE project_id = $1
        AND timestamp >= date_trunc('month', $2::date)
        AND timestamp < date_trunc('month', $2::date) + INTERVAL '1 month'
    `;

    const result = await this.query(sql, [projectId, month]);
    return result.rows[0]?.mau ?? 0;
  }

  /**
   * Get session duration percentiles
   */
  async getSessionDurationPercentiles(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  }> {
    const sql = `
      SELECT
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms) AS p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY duration_ms) AS p75,
        PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY duration_ms) AS p90,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99
      FROM events
      WHERE project_id = $1
        AND timestamp >= $2::timestamptz
        AND timestamp <= $3::timestamptz
        AND duration_ms IS NOT NULL
    `;

    const result = await this.query(sql, [projectId, startDate, endDate]);
    return result.rows[0] ?? { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
  }

  /**
   * Get user path analysis (sequence of screens)
   */
  async getUserPaths(
    projectId: string,
    startDate: Date,
    endDate: Date,
    limit = 10
  ): Promise<Array<{ path: string[]; count: number }>> {
    const sql = `
      WITH user_sessions AS (
        SELECT
          session_id,
          ARRAY_AGG(screen_name ORDER BY timestamp) AS path
        FROM events
        WHERE project_id = $1
          AND timestamp >= $2::timestamptz
          AND timestamp <= $3::timestamptz
          AND screen_name IS NOT NULL
          AND event_type = 'screen_view'
        GROUP BY session_id
      )
      SELECT
        path,
        COUNT(*) AS count
      FROM user_sessions
      GROUP BY path
      ORDER BY count DESC
      LIMIT $4
    `;

    const result = await this.query(sql, [projectId, startDate, endDate, limit]);
    return result.rows;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UTILITY METHODS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Execute a raw SQL query
   */
  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    return this.pool.query(sql, params);
  }

  /**
   * Execute a query within a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Ping the database to check connection
   */
  async ping(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    hypertable_size: string;
    compression_ratio: number;
    chunk_count: number;
  }> {
    const sql = `
      SELECT
        pg_size_pretty(hypertable_size('events')) AS hypertable_size,
        (SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name = 'events') AS chunk_count
    `;

    const result = await this.query(sql);
    return {
      hypertable_size: result.rows[0]?.hypertable_size ?? '0 bytes',
      compression_ratio: 0, // Would need to calculate from compressed vs uncompressed
      chunk_count: result.rows[0]?.chunk_count ?? 0,
    };
  }
}

/**
 * Create a TimescaleDB analytics client
 */
export function createTimescaleClient(config: TimescaleConfig): TimescaleAnalytics {
  return new TimescaleAnalytics(config);
}
