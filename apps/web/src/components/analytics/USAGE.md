# Analytics Components Usage Guide

This directory contains reusable analytics components for displaying metrics, charts, and retention data.

## Individual Components

### MetricCard

Display a single metric with optional trend indicator.

```tsx
import { MetricCard } from '@/components/analytics';

<MetricCard
  title="Daily Active Users"
  value={1234}
  subtitle="Active users today"
  icon="👥"
  change={12.5} // Optional: percentage change, positive = green, negative = red
/>
```

### LineChart

Display time-series data as a line chart.

```tsx
import { LineChart } from '@/components/analytics';

<LineChart
  title="Sessions Over Time"
  data={[
    { timestamp: '2024-01-01', value: 100 },
    { timestamp: '2024-01-02', value: 150 },
    { timestamp: '2024-01-03', value: 130 },
  ]}
  color="#3b82f6"
  height={350}
  granularity="day"
  formatValue={(value) => value.toLocaleString()}
/>
```

### BarChart

Display categorical or time-series data as bars.

```tsx
import { BarChart } from '@/components/analytics';

// Categorical data
<BarChart
  title="Screen Views by Screen"
  data={[
    { label: 'Home', value: 1500 },
    { label: 'Products', value: 1200 },
    { label: 'Cart', value: 800 },
  ]}
  colors={['#3b82f6', '#10b981', '#f59e0b']}
  height={300}
/>

// Time-series data
<BarChart
  title="Daily Sessions"
  data={[
    { timestamp: '2024-01-01', label: 'Jan 1', value: 100 },
    { timestamp: '2024-01-02', label: 'Jan 2', value: 150 },
  ]}
  color="#3b82f6"
  granularity="day"
/>

// Horizontal bars
<BarChart
  title="Top Features"
  data={[...]}
  horizontal={true}
/>
```

### RetentionGrid

Display cohort retention analysis as a heatmap grid.

```tsx
import { RetentionGrid } from '@/components/analytics';

<RetentionGrid
  data={[
    {
      cohortStart: '2024-01-01',
      cohortSize: 1000,
      retention: [100, 75, 60, 55, 50, 45, 42], // Week 0-6 retention %
    },
    {
      cohortStart: '2024-01-08',
      cohortSize: 1200,
      retention: [100, 80, 68, 62, 58],
    },
  ]}
  isPro={true}
  periodLabel="Week" // or "Day", "Month"
/>
```

## Composite Components

### OverviewMetrics

Display multiple metrics in a grid layout.

```tsx
import { OverviewMetrics } from '@/components/analytics';

<OverviewMetrics
  data={{
    dau: 1234,
    mau: 45678,
    totalSessions: 100000,
    sessionsLast7Days: 15000,
    totalBuilds: 25,
    retention7Day: 0.65,
    retention30Day: 0.42,
  }}
  isLoading={false}
/>
```

### TimeSeriesChart

Extended version with area chart support.

```tsx
import { TimeSeriesChart } from '@/components/analytics';

<TimeSeriesChart
  title="Sessions Over Time"
  data={[...]}
  type="area" // or "line"
  color="#3b82f6"
  granularity="day"
/>
```

### TopScreens

Display ranked list of top screens.

```tsx
import { TopScreens } from '@/components/analytics';

<TopScreens
  data={[
    {
      name: 'Home',
      views: 15000,
      uniqueUsers: 5000,
      avgDuration: 45, // seconds
    },
    // ...
  ]}
  limit={10}
  isLoading={false}
/>
```

### UserRetention

Wrapper around RetentionGrid with Pro feature gate.

```tsx
import { UserRetention } from '@/components/analytics';

<UserRetention
  data={[...]}
  isPro={true}
  isLoading={false}
/>
```

### RealTimeUsers

Display live active user count with auto-refresh.

```tsx
import { RealTimeUsers } from '@/components/analytics';

<RealTimeUsers
  projectId="project-123"
  autoRefresh={true}
  refreshInterval={30} // seconds
/>
```

### DateRangePicker

Date range selector with tier-based limits.

```tsx
import { DateRangePicker } from '@/components/analytics';

<DateRangePicker
  value={{
    start: new Date('2024-01-01'),
    end: new Date('2024-01-07'),
  }}
  onChange={(range) => console.log(range)}
  maxDays={30} // Tier-based limit
/>
```

## Complete Dashboard Example

```tsx
'use client';

import { useState } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import {
  MetricCard,
  LineChart,
  BarChart,
  RetentionGrid,
  TopScreens,
  DateRangePicker,
} from '@/components/analytics';

export default function AnalyticsDashboard({ projectId }: { projectId: string }) {
  const [dateRange, setDateRange] = useState({
    start: startOfDay(subDays(new Date(), 6)),
    end: endOfDay(new Date()),
  });

  // Fetch data using tRPC or your API
  const metrics = {
    dau: 1234,
    mau: 45678,
    weeklyChange: 12.5,
  };

  const sessionsData = [
    { timestamp: '2024-01-01', value: 100 },
    { timestamp: '2024-01-02', value: 150 },
    // ...
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header with date picker */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Active Users"
          value={metrics.dau}
          change={metrics.weeklyChange}
          icon="👥"
        />
        <MetricCard
          title="Monthly Active Users"
          value={metrics.mau}
          icon="📊"
        />
        {/* More metrics... */}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          title="Sessions Over Time"
          data={sessionsData}
          granularity="day"
          height={300}
        />
        <BarChart
          title="Top Screens"
          data={[
            { label: 'Home', value: 1500 },
            { label: 'Products', value: 1200 },
          ]}
          height={300}
        />
      </div>

      {/* Retention */}
      <RetentionGrid
        data={[
          {
            cohortStart: '2024-01-01',
            cohortSize: 1000,
            retention: [100, 75, 60, 55, 50],
          },
        ]}
        isPro={true}
      />
    </div>
  );
}
```

## Styling

All components use Tailwind CSS with dark mode support. They automatically adapt to the parent theme.

## Loading States

All components support an `isLoading` prop that displays skeleton loaders:

```tsx
<LineChart
  title="Loading..."
  data={[]}
  isLoading={true}
/>
```

## Empty States

Components gracefully handle empty data arrays with helpful messages:

```tsx
<LineChart
  title="No Data"
  data={[]}
  isLoading={false}
/>
// Displays: "No data available for this time range"
```

## Accessibility

- All charts use semantic colors
- Proper aria labels
- Keyboard navigable tooltips
- Screen reader friendly

## Dependencies

- `recharts`: Chart rendering
- `date-fns`: Date formatting
- `@mobigen/ui`: Base UI components (Card, etc.)
