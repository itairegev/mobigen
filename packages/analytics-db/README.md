# @mobigen/analytics-db

Database clients and queries for Mobigen analytics infrastructure.

## Overview

This package provides TypeScript clients for both ClickHouse and TimescaleDB, optimized for different types of analytics queries:

- **ClickHouse**: OLAP queries, aggregations, fast analytics
- **TimescaleDB**: Time-series data, continuous aggregates, retention analysis

## Installation

```bash
pnpm add @mobigen/analytics-db
```

## Usage

### Initialize Clients

```typescript
import {
  createClickHouseClient,
  createTimescaleClient,
  createAnalyticsQueries,
} from '@mobigen/analytics-db';

// ClickHouse client for OLAP queries
const clickhouse = createClickHouseClient({
  url: 'http://localhost:8123',
  database: 'mobigen_analytics',
  username: 'mobigen',
  password: 'your_password',
});

// TimescaleDB client for time-series queries
const timescale = createTimescaleClient({
  host: 'localhost',
  port: 5433,
  database: 'mobigen_analytics',
  user: 'mobigen',
  password: 'your_password',
});

// Combined queries (uses both databases optimally)
const queries = createAnalyticsQueries(clickhouse, timescale);
```

### Insert Events

```typescript
import { Event } from '@mobigen/analytics-db';

// Single event
await clickhouse.insertEvent({
  event_type: 'screen_view',
  event_name: 'HomeScreen',
  project_id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: 'user_123',
  anonymous_id: 'device_abc',
  session_id: 'session_xyz',
  platform: 'ios',
  os_version: 'iOS 17.1',
  device_model: 'iPhone 15 Pro',
  app_version: '1.0.0',
  country: 'US',
  screen_name: 'HomeScreen',
  duration_ms: 5000,
});

// Batch insert (recommended for high throughput)
const events: Event[] = [...];
await clickhouse.batchInsertEvents(events);
```

### Query Analytics

```typescript
// Get Daily Active Users
const dau = await clickhouse.getDailyActiveUsers(
  projectId,
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Get top screens
const topScreens = await clickhouse.getTopScreens(
  projectId,
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  10 // limit
);

// Get retention rate (TimescaleDB has built-in function)
const retention = await timescale.getRetentionRate(
  projectId,
  new Date('2024-01-01'),
  7 // days
);

// Get complete dashboard data
const dashboardData = await queries.getDashboardData({
  project_id: projectId,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31'),
});
```

### Funnel Analysis

```typescript
const funnel = await queries.analyzeFunnel(
  projectId,
  ['view_product', 'add_to_cart', 'checkout', 'purchase'],
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Result:
// [
//   { step: 'view_product', count: 1000, conversion_rate: 100, drop_off_rate: 0 },
//   { step: 'add_to_cart', count: 500, conversion_rate: 50, drop_off_rate: 50 },
//   { step: 'checkout', count: 300, conversion_rate: 30, drop_off_rate: 20 },
//   { step: 'purchase', count: 200, conversion_rate: 20, drop_off_rate: 10 },
// ]
```

### Cohort Analysis

```typescript
const cohorts = await queries.getCohortRetention(
  projectId,
  new Date('2024-01-01'),
  new Date('2024-01-07'),
  7 // days to track
);

// Result:
// [
//   {
//     cohort_date: '2024-01-01',
//     retention: [
//       { day: 0, rate: 100 },
//       { day: 1, rate: 45 },
//       { day: 7, rate: 20 },
//     ]
//   }
// ]
```

## API Reference

### ClickHouseAnalytics

Methods:
- `insertEvent(event: Event): Promise<void>`
- `batchInsertEvents(events: Event[]): Promise<BatchInsertResult>`
- `getDailyActiveUsers(projectId, startDate, endDate): Promise<...>`
- `getTopScreens(projectId, startDate, endDate, limit?): Promise<...>`
- `getEventBreakdown(projectId, startDate, endDate): Promise<...>`
- `getPlatformBreakdown(projectId, startDate, endDate): Promise<...>`
- `getHourlyMetrics(projectId, hours?): Promise<...>`
- `getFunnelAnalysis(projectId, steps, startDate, endDate): Promise<...>`
- `query<T>(sql, params?): Promise<T[]>` - Raw SQL query
- `ping(): Promise<boolean>`
- `close(): Promise<void>`

### TimescaleAnalytics

Methods:
- `insertEvent(event: Event): Promise<void>`
- `batchInsertEvents(events: Event[]): Promise<BatchInsertResult>`
- `getDailyMetrics(projectId, startDate, endDate): Promise<DailyMetrics[]>`
- `getHourlyMetrics(projectId, hours?): Promise<HourlyMetrics[]>`
- `getScreenViewMetrics(projectId, startDate, endDate): Promise<...>`
- `getPlatformMetrics(projectId, startDate, endDate): Promise<...>`
- `getCountryMetrics(projectId, startDate, endDate, limit?): Promise<...>`
- `getRetentionRate(projectId, cohortDate, days): Promise<RetentionRate[]>`
- `getMonthlyActiveUsers(projectId, month): Promise<number>`
- `getSessionDurationPercentiles(projectId, startDate, endDate): Promise<...>`
- `getUserPaths(projectId, startDate, endDate, limit?): Promise<...>`
- `query(sql, params?): Promise<QueryResult>` - Raw SQL query
- `transaction<T>(callback): Promise<T>` - Execute in transaction
- `ping(): Promise<boolean>`
- `close(): Promise<void>`

### AnalyticsQueries

High-level queries that use both databases optimally:

- `getDashboardData(query: DateRangeQuery): Promise<DashboardData>`
- `compareTimePeriods(projectId, currentStart, currentEnd, previousStart, previousEnd): Promise<...>`
- `analyzeFunnel(projectId, steps, startDate, endDate): Promise<...>`
- `getCohortRetention(projectId, startDate, endDate, days): Promise<...>`
- `getPerformanceMetrics(projectId, startDate, endDate): Promise<...>`
- `getGeographicBreakdown(projectId, startDate, endDate, limit?): Promise<...>`

## Types

All TypeScript types are exported:

```typescript
import type {
  Event,
  Session,
  DailyMetrics,
  HourlyMetrics,
  RetentionRate,
  DashboardData,
  ClickHouseConfig,
  TimescaleConfig,
} from '@mobigen/analytics-db';
```

## Configuration

Use `@mobigen/config` for centralized configuration:

```typescript
import { CONFIG } from '@mobigen/config';

const clickhouse = createClickHouseClient(CONFIG.analyticsDb.clickhouse);
const timescale = createTimescaleClient(CONFIG.analyticsDb.timescale);
```

## Best Practices

### When to Use ClickHouse

- Aggregations (SUM, COUNT, AVG)
- Filtering on multiple dimensions
- Funnel analysis
- Real-time dashboards (materialized views)
- Large-scale OLAP queries

### When to Use TimescaleDB

- Time-series queries with continuous aggregates
- Retention analysis (built-in functions)
- JSONB property queries
- Complex SQL joins
- Transaction support

### Performance Tips

1. **Use batch inserts**: Always batch events for better throughput
2. **Leverage materialized views**: Pre-aggregated data is much faster
3. **Set appropriate time ranges**: Don't query unbounded date ranges
4. **Use the right database**: ClickHouse for aggregations, TimescaleDB for time-series
5. **Enable caching**: Cache frequently-accessed queries
6. **Monitor compression**: Both databases compress old data automatically

## Error Handling

```typescript
try {
  await clickhouse.insertEvent(event);
} catch (error) {
  console.error('Failed to insert event:', error);
  // Handle error (retry, log, etc.)
}

// Batch insert returns detailed errors
const result = await clickhouse.batchInsertEvents(events);
if (result.failed > 0) {
  console.error('Some events failed:', result.errors);
}
```

## Development

```bash
# Build
pnpm build

# Type check
pnpm typecheck

# Watch mode
pnpm dev
```

## See Also

- [ClickHouse Documentation](https://clickhouse.com/docs)
- [TimescaleDB Documentation](https://docs.timescale.com)
- Infrastructure setup: `/infrastructure/analytics/README.md`
