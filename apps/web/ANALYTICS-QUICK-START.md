# Analytics Dashboard - Quick Start Guide

## Installation

1. **Install dependencies:**
   ```bash
   cd apps/web
   pnpm install
   ```

2. **Build the API package:**
   ```bash
   cd ../../packages/api
   pnpm build
   ```

3. **Start the dev server:**
   ```bash
   cd ../../apps/web
   pnpm dev
   ```

## Accessing the Dashboard

### For Users
Navigate to: `http://localhost:3333/projects/{projectId}/analytics`

Or click the "Analytics" link from the project page.

### URL Structure
- Main dashboard: `/projects/[projectId]/analytics`
- Direct tab access: Add `?tab=users` or `?tab=screens` (optional)

## Available Views

### Overview Tab (All Tiers)
Shows high-level metrics and charts:
- DAU/MAU cards
- Sessions chart (7 days for Basic, 90 for Pro)
- Real-time active users
- Top screens
- Retention cohorts (Pro/Enterprise only)

### Users Tab (All Tiers)
User-focused analytics:
- Daily Active Users trend
- New users trend
- Retention cohorts (Pro/Enterprise only)

### Screens Tab (All Tiers)
Screen performance metrics:
- Top 20 most-viewed screens
- Screen views over time
- Average session duration per screen

### Events Tab (Pro/Enterprise Only)
Custom event tracking:
- Event counts and trends
- User engagement metrics
- Custom event properties

## Tier Features

### Basic (Free)
- ✅ 7 days of historical data
- ✅ Overview metrics (DAU, MAU, sessions)
- ✅ Sessions chart
- ✅ Top screens
- ❌ Retention cohorts
- ❌ Custom events
- ❌ Data export

### Pro ($49/month)
- ✅ 90 days of historical data
- ✅ All Basic features
- ✅ Retention cohort analysis
- ✅ Custom events tracking
- ✅ Data export (CSV/JSON)
- ✅ Advanced analytics

### Enterprise (Custom Pricing)
- ✅ 365 days of historical data
- ✅ All Pro features
- ✅ Custom dashboards
- ✅ API access
- ✅ Raw data access
- ✅ Priority support

## Using the Components

### Import Components
```typescript
import {
  OverviewMetrics,
  TimeSeriesChart,
  TopScreens,
  UserRetention,
  RealTimeUsers,
  DateRangePicker,
} from '@/components/analytics';
```

### Example: Overview Metrics
```typescript
const { data } = trpc.analytics.getDashboardMetrics.useQuery({
  projectId: 'your-project-id',
});

<OverviewMetrics data={data?.overview} isLoading={!data} />
```

### Example: Time Series Chart
```typescript
const { data: sessionsData } = trpc.analytics.getTimeSeriesData.useQuery({
  projectId: 'your-project-id',
  metric: 'sessions',
  dateRange: {
    start: subDays(new Date(), 7),
    end: new Date(),
  },
  granularity: 'day',
});

<TimeSeriesChart
  title="Sessions Over Time"
  data={sessionsData?.data}
  granularity="day"
  height={300}
/>
```

### Example: Top Screens
```typescript
const { data: screens } = trpc.analytics.getTopScreens.useQuery({
  projectId: 'your-project-id',
  limit: 10,
});

<TopScreens data={screens} limit={10} />
```

## Customization

### Change Date Range
Use the DateRangePicker component:
```typescript
const [dateRange, setDateRange] = useState({
  start: startOfDay(subDays(new Date(), 7)),
  end: endOfDay(new Date()),
});

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  maxDays={7} // Tier-based limit
/>
```

### Change Chart Granularity
```typescript
const [granularity, setGranularity] = useState<'day'>('day');

// Options: 'hour', 'day', 'week', 'month'
```

### Export Data (Pro/Enterprise)
```typescript
const exportMutation = trpc.analytics.exportData.useMutation();

const handleExport = async () => {
  const result = await exportMutation.mutateAsync({
    projectId,
    dataType: 'sessions',
    dateRange,
    format: 'csv',
  });

  window.open(result.downloadUrl, '_blank');
};
```

## Testing with Mock Data

The analytics dashboard currently uses mock data. To test:

1. Create a project
2. Navigate to `/projects/{projectId}/analytics`
3. Explore different tabs and date ranges
4. Test tier restrictions (change user tier in database)

## Connecting to Real Analytics Service

To connect to the real analytics backend:

1. **Update analytics router:**
   ```typescript
   // packages/api/src/routers/analytics.ts

   // Replace mock data with actual service calls
   const response = await fetch('http://localhost:7001/metrics/dashboard');
   const data = await response.json();
   ```

2. **Configure analytics service URL:**
   ```bash
   # .env
   ANALYTICS_SERVICE_URL=http://localhost:7001
   ```

3. **Start analytics service:**
   ```bash
   cd services/analytics
   pnpm dev
   ```

## Troubleshooting

### "Project not found" error
- Ensure the project exists in the database
- Verify the project belongs to the authenticated user

### "Forbidden" error on Pro features
- Check user's tier in the database
- Ensure tier check is correct in analytics router

### Charts not rendering
- Check browser console for errors
- Verify recharts is installed: `pnpm list recharts`
- Ensure data is in correct format

### Date range picker shows locked options
- This is expected for Basic tier users
- Upgrade prompt should appear

## Next Steps

1. **Connect to real analytics service**
2. **Add navigation link from project page**
3. **Test with production data**
4. **Add E2E tests**
5. **Implement real-time WebSocket updates**

## Support

For issues or questions:
- Check component documentation: `apps/web/src/components/analytics/README.md`
- Review implementation summary: `ANALYTICS-DASHBOARD-IMPLEMENTATION.md`
- Check tRPC router: `packages/api/src/routers/analytics.ts`
