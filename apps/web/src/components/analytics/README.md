# Mobigen Analytics Dashboard

Client-facing analytics dashboard for viewing mobile app metrics.

## Overview

The analytics dashboard provides app owners with insights into their app's usage, user behavior, and performance. It implements tier-based access control to encourage upgrades from Basic to Pro/Enterprise plans.

## Components

### OverviewMetrics
Displays key metrics in card format:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Sessions (7-day)
- 7-Day Retention

**Props:**
```typescript
{
  data?: {
    dau: number;
    mau: number;
    totalSessions: number;
    sessionsLast7Days: number;
    retention7Day: number;
    retention30Day: number;
  };
  isLoading?: boolean;
}
```

### TimeSeriesChart
Responsive line/area chart for time-series data using Recharts.

**Props:**
```typescript
{
  title: string;
  data?: Array<{ timestamp: string; value: number }>;
  isLoading?: boolean;
  type?: 'line' | 'area';
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}
```

### TopScreens
Ranked list of most-viewed screens with visual progress bars.

**Props:**
```typescript
{
  data?: Array<{
    name: string;
    views: number;
    uniqueUsers: number;
    avgDuration: number;
  }>;
  isLoading?: boolean;
  limit?: number;
}
```

### UserRetention
Cohort retention table with color-coded retention percentages.

**Props:**
```typescript
{
  data?: Array<{
    cohortStart: string;
    cohortSize: number;
    retention: number[];
  }>;
  isLoading?: boolean;
  isPro?: boolean; // Shows upgrade prompt if false
}
```

### RealTimeUsers
Live active user count with auto-refresh.

**Props:**
```typescript
{
  projectId: string;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}
```

### DateRangePicker
Date range selector with preset options and tier-based limits.

**Props:**
```typescript
{
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  maxDays?: number; // Tier-based limit
}
```

## Pages

### Main Analytics Page
`/projects/[projectId]/analytics`

**Tabs:**
- **Overview**: Metrics overview, sessions chart, real-time users, top screens, retention
- **Users**: DAU/MAU charts, user retention cohorts
- **Screens**: Top screens list, screen views chart
- **Events**: Custom events (Pro/Enterprise only)

## API Integration

### tRPC Queries

```typescript
// Dashboard metrics
trpc.analytics.getDashboardMetrics.useQuery({ projectId })

// Time series data
trpc.analytics.getTimeSeriesData.useQuery({
  projectId,
  metric: 'sessions' | 'users' | 'builds' | 'screenViews',
  dateRange: { start: Date, end: Date },
  granularity: 'hour' | 'day' | 'week' | 'month',
})

// Top screens
trpc.analytics.getTopScreens.useQuery({
  projectId,
  limit: 10,
  dateRange?: { start: Date, end: Date },
})

// User retention
trpc.analytics.getUserRetention.useQuery({
  projectId,
  cohortSize: 'day' | 'week' | 'month',
})

// Real-time users
trpc.analytics.getRealTimeUsers.useQuery({ projectId })

// Custom events (Pro/Enterprise)
trpc.analytics.getCustomEvents.useQuery({
  projectId,
  eventName?: string,
  dateRange?: { start: Date, end: Date },
})
```

### Mutations

```typescript
// Export data (Pro/Enterprise)
trpc.analytics.exportData.mutate({
  projectId,
  dataType: 'sessions' | 'users' | 'screens' | 'events',
  dateRange: { start: Date, end: Date },
  format: 'csv' | 'json',
})
```

## Tier-Based Access Control

### Basic Tier
- Overview metrics (DAU, MAU, sessions, retention)
- 7 days of historical data
- Sessions and screen views charts
- Top screens list
- No data export
- No custom events

### Pro Tier
- All Basic features
- 90 days of historical data
- Retention cohort analysis
- Custom events tracking
- Data export (CSV/JSON)
- Advanced analytics

### Enterprise Tier
- All Pro features
- 365 days of historical data
- Custom dashboards
- API access
- Raw data access

## Styling

Uses Tailwind CSS with dark mode support. Color scheme:
- Primary: `#3b82f6` (blue)
- Success: `#10b981` (green)
- Warning: `#f59e0b` (orange)
- Error: `#ef4444` (red)

## Dependencies

- `recharts`: ^2.10.3 - Charting library
- `date-fns`: ^3.0.6 - Date utilities
- `@mobigen/ui`: UI components (Card, etc.)
- `@trpc/react-query`: API queries

## Usage Example

```tsx
import { OverviewMetrics, TimeSeriesChart } from '@/components/analytics';

function AnalyticsDashboard({ projectId }) {
  const { data: metrics } = trpc.analytics.getDashboardMetrics.useQuery({ projectId });
  const { data: sessionsData } = trpc.analytics.getTimeSeriesData.useQuery({
    projectId,
    metric: 'sessions',
    dateRange: { start: sevenDaysAgo, end: today },
    granularity: 'day',
  });

  return (
    <div>
      <OverviewMetrics data={metrics?.overview} />
      <TimeSeriesChart
        title="Sessions Over Time"
        data={sessionsData?.data}
        granularity="day"
      />
    </div>
  );
}
```

## Future Enhancements

- [ ] Real-time WebSocket updates for live metrics
- [ ] Funnel analysis (conversion tracking)
- [ ] User path visualization
- [ ] A/B testing results
- [ ] Custom dashboard builder
- [ ] Scheduled email reports
- [ ] Slack/Discord integrations
- [ ] Anomaly detection alerts

## Notes

- Mock data is currently used for demonstration. In production, data will come from ClickHouse/TimescaleDB via the analytics service.
- Real-time data will be fetched from Redis for sub-second latency.
- The analytics SDK embedded in generated apps will send events to the analytics ingestion service.
