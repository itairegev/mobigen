# Quality Dashboard Components

This directory contains the admin quality dashboard components for Mobigen, providing real-time monitoring and visualization of generation quality metrics.

## Overview

The quality dashboard implements the monitoring system described in the Mobigen Technical Design Document, tracking the 3-tier validation pipeline and ensuring the 99% success rate target.

## Components

### QualityOverview

Main dashboard component that combines all quality monitoring widgets.

**Features:**
- Real-time metrics overview (success rate, auto-fix rate, avg duration, active alerts)
- Success rate trend chart with target thresholds
- Active alerts feed with acknowledge/snooze actions
- Template certification status table
- Validation error breakdown with pie chart
- Auto-refresh with configurable polling

**Usage:**
```tsx
import { QualityOverview } from '@/components/quality';

export default function QualityDashboardPage() {
  return (
    <QualityOverview
      defaultPeriod="7d"
      enablePolling={true}
      pollInterval={30000}
    />
  );
}
```

### MetricCard

Reusable metric display card with trend indicators and color-coded thresholds.

**Props:**
- `title`: Metric title
- `value`: Numeric or string value
- `unit`: Optional unit suffix
- `trend`: Trend data with historical points
- `threshold`: Target/warning/critical thresholds
- `format`: 'number' | 'percentage' | 'duration'

**Usage:**
```tsx
<MetricCard
  title="Success Rate"
  value={98.5}
  format="percentage"
  trend={successRateTrend}
  threshold={{
    target: 99,
    warning: 95,
    critical: 90,
  }}
/>
```

### SuccessRateChart

Line chart displaying success rate over time with target threshold line.

**Features:**
- Recharts line chart
- 99% target and 95% warning threshold lines
- Time range selector (24h, 7d, 30d)
- Custom tooltip with detailed stats
- Summary statistics (highest, lowest, total)

**Usage:**
```tsx
<SuccessRateChart
  data={successRateTrend}
  targetRate={99}
  warningRate={95}
  onPeriodChange={(period) => setPeriod(period)}
/>
```

### AlertFeed

Real-time feed of quality alerts with severity-based filtering.

**Features:**
- Color-coded severity badges (critical, warning, info)
- Acknowledge and snooze actions
- Filter by severity
- Links to related projects/templates
- Auto-refresh support

**Usage:**
```tsx
<AlertFeed
  alerts={alerts}
  onAcknowledge={(id) => handleAcknowledge(id)}
  onSnooze={(id, hours) => handleSnooze(id, hours)}
  maxItems={10}
/>
```

### TemplateStatus

Table displaying certification status for all templates.

**Features:**
- Sortable columns
- Filter by certification level (gold, silver, bronze, uncertified)
- Certification badges
- Issue indicators
- Links to template details

**Usage:**
```tsx
<TemplateStatus templates={templateCertifications} />
```

### ValidationDetails

Detailed view of validation results with error categorization.

**Features:**
- Tier-by-tier performance breakdown
- Error category pie chart
- File-level error list with expandable details
- Auto-fix indicators

**Usage:**
```tsx
<ValidationDetails
  errorBreakdown={errorBreakdown}
  tierStats={{
    tier1: { passed: 95, failed: 5 },
    tier2: { passed: 88, failed: 12 },
    tier3: { passed: 82, failed: 18 },
  }}
/>
```

## Hooks

### useQualityMetrics

Custom hook for fetching and managing quality metrics data.

**Features:**
- Automatic polling with configurable interval
- Refetch on window focus
- Error handling
- Stale data detection
- Request cancellation

**Usage:**
```tsx
const { data, isLoading, error, refetch, lastUpdated, isStale } = useQualityMetrics({
  period: '7d',
  templateId: 'ecommerce',
  enablePolling: true,
  pollInterval: 30000,
  refetchOnFocus: true,
});
```

## Types

All TypeScript types are defined in `types.ts`:

- `QualityMetrics`: Overall quality metrics
- `MetricTrend`: Time-series data points
- `Alert`: Quality alert definition
- `ValidationResult`: Validation check results
- `ErrorBreakdown`: Error categorization
- `TemplateCertification`: Template quality certification
- `TimePeriod`: Time range options
- `MetricThresholds`: Threshold configurations

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Quality Dashboard Flow                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. useQualityMetrics hook                                  │
│     ├─ Fetch data from API (or mock)                       │
│     ├─ Poll every 30s (configurable)                       │
│     └─ Return metrics + state                              │
│                                                              │
│  2. QualityOverview component                               │
│     ├─ Display MetricCards                                  │
│     ├─ Render SuccessRateChart                             │
│     ├─ Show AlertFeed                                       │
│     ├─ Display ValidationDetails                            │
│     └─ Show TemplateStatus                                  │
│                                                              │
│  3. User interactions                                        │
│     ├─ Acknowledge/snooze alerts                           │
│     ├─ Filter templates                                     │
│     ├─ Change time period                                   │
│     └─ Manual refresh                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Validation Tiers

The dashboard monitors the 3-tier validation pipeline:

**Tier 1: Instant** (< 30 seconds)
- TypeScript check
- ESLint critical rules
- Import resolution
- Navigation graph validation

**Tier 2: Fast** (< 2 minutes)
- Full ESLint + Prettier
- Metro bundler check
- Expo Doctor
- Component smoke render

**Tier 3: Thorough** (< 10 minutes)
- Expo prebuild
- Maestro E2E tests
- Visual snapshot tests
- Bundle size analysis

## Quality Metrics

### Success Rate
- **Target**: 99%
- **Warning**: 95%
- **Critical**: 90%

### Auto-Fix Rate
- **Target**: 80%
- **Warning**: 60%
- **Critical**: 40%

### Average Duration
- **Target**: 120s (2 minutes)
- **Warning**: 300s (5 minutes)
- **Critical**: 600s (10 minutes)

## Mock Data

The `useQualityMetrics` hook currently uses mock data for development. When the backend API is ready, replace the mock data generator with actual API calls:

```typescript
// In useQualityMetrics.ts
const response = await fetch(`${API_BASE_URL}/quality/metrics`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(filter),
  signal: abortControllerRef.current.signal,
});

const dashboardData = await response.json() as QualityDashboardData;
```

## Styling

All components use Tailwind CSS with custom color classes defined in `tailwind.config.js`. The design follows the Mobigen admin panel design system.

## Testing

Each component exports a skeleton loading state for testing and optimistic UI:

```tsx
import {
  MetricCardSkeleton,
  SuccessRateChartSkeleton,
  AlertFeedSkeleton,
  TemplateStatusSkeleton,
  ValidationDetailsSkeleton,
} from '@/components/quality';
```

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Export dashboard data to CSV/PDF
- [ ] Custom date range selector
- [ ] Drill-down to individual project validations
- [ ] Alert rules configuration UI
- [ ] Trend analysis and predictions
- [ ] Comparison between time periods
- [ ] Template health score calculation

## Dependencies

- `react` ^18.3.1
- `recharts` ^2.15.4 (for charts)
- `date-fns` ^3.6.0 (for date formatting)
- `lucide-react` ^0.562.0 (for icons)
- `tailwindcss` ^3.4.3
- `clsx` ^2.1.1
- `tailwind-merge` ^2.3.0

## Related Documentation

- [PRD-mobigen.md](../../../../../docs/PRD-mobigen.md)
- [TECHNICAL-DESIGN-mobigen.md](../../../../../docs/TECHNICAL-DESIGN-mobigen.md)
- Section 5: Testing Automation Framework (validation tiers)
- Section 7: Analytics System
