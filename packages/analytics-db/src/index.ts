/**
 * @mobigen/analytics-db
 *
 * Database clients and queries for Mobigen analytics
 * Supports both ClickHouse (OLAP) and TimescaleDB (time-series)
 */

// Client exports
export {
  ClickHouseAnalytics,
  createClickHouseClient,
} from './clickhouse';

export {
  TimescaleAnalytics,
  createTimescaleClient,
} from './timescale';

export {
  AnalyticsQueries,
  createAnalyticsQueries,
} from './queries';

// Type exports
export type {
  Event,
  Session,
  DailyMetrics,
  HourlyMetrics,
  ScreenViewMetrics,
  PlatformMetrics,
  CountryMetrics,
  RetentionRate,
  DateRangeQuery,
  EventQuery,
  FunnelQuery,
  FunnelStep,
  ClickHouseConfig,
  TimescaleConfig,
  BatchInsertResult,
  DashboardData,
} from './types';

export { EventSchema } from './types';
