# Mobigen Admin Dashboard

Admin dashboard for monitoring Mobigen's quality metrics, validation pipeline, and template certification status.

## Features

### Quality Dashboard (QP1-014)

Real-time monitoring dashboard for generation quality metrics:

- **Metrics Overview**: Success rate, auto-fix rate, avg duration, active alerts
- **Success Rate Trends**: Line chart with 99% target threshold
- **Alert Feed**: Real-time alerts with acknowledge/snooze actions
- **Template Status**: Certification levels (gold, silver, bronze) for all templates
- **Validation Details**: Error breakdown by category and validation tier
- **Auto-refresh**: Configurable polling (default: 30 seconds)

## Getting Started

### Installation

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Run admin dashboard in development
cd apps/admin
pnpm dev
```

The admin dashboard will be available at `http://localhost:3334`

### Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── quality/          # Quality dashboard page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   └── components/
│       └── quality/          # Quality dashboard components
│           ├── QualityOverview.tsx      # Main dashboard
│           ├── MetricCard.tsx           # Metric display cards
│           ├── SuccessRateChart.tsx     # Success rate chart
│           ├── AlertFeed.tsx            # Alerts feed
│           ├── TemplateStatus.tsx       # Template certification table
│           ├── ValidationDetails.tsx    # Error breakdown
│           ├── hooks/
│           │   └── useQualityMetrics.ts # Data fetching hook
│           ├── types.ts                 # TypeScript types
│           ├── index.ts                 # Exports
│           └── README.md                # Component documentation
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Usage

### Quality Dashboard Page

The quality dashboard is available at `/quality`:

```tsx
// src/app/quality/page.tsx
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

### Using Individual Components

```tsx
import {
  MetricCard,
  SuccessRateChart,
  AlertFeed,
  TemplateStatus,
  ValidationDetails,
  useQualityMetrics,
} from '@/components/quality';

export function CustomDashboard() {
  const { data, isLoading, error, refetch } = useQualityMetrics({
    period: '7d',
    enablePolling: true,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <MetricCard
        title="Success Rate"
        value={data.metrics.successRate}
        format="percentage"
        trend={data.trends.successRate}
      />

      <SuccessRateChart data={data.trends.successRate} />

      <AlertFeed alerts={data.alerts} />

      <TemplateStatus templates={data.templates} />

      <ValidationDetails errorBreakdown={data.errorBreakdown} />
    </div>
  );
}
```

## Components

See [src/components/quality/README.md](src/components/quality/README.md) for detailed component documentation.

### QualityOverview

Main dashboard component combining all quality monitoring widgets.

**Props:**
- `defaultPeriod`: Initial time period ('24h' | '7d' | '30d')
- `enablePolling`: Enable auto-refresh (default: true)
- `pollInterval`: Refresh interval in ms (default: 30000)

### MetricCard

Reusable metric display with trend indicators and color-coded thresholds.

### SuccessRateChart

Line chart with target threshold lines and time range selector.

### AlertFeed

Real-time alerts with severity filtering and actions.

### TemplateStatus

Sortable table of template certification status.

### ValidationDetails

Error breakdown by category and validation tier.

## Data Flow

The dashboard uses the `useQualityMetrics` hook for data fetching:

```typescript
const { data, isLoading, error, refetch, lastUpdated, isStale } = useQualityMetrics({
  period: '7d',
  templateId: 'ecommerce', // optional filter
  enablePolling: true,
  pollInterval: 30000,
  refetchOnFocus: true,
});
```

**Current State**: Uses mock data for development.

**Production**: Replace mock data with API calls in `useQualityMetrics.ts`:

```typescript
const response = await fetch(`${API_BASE_URL}/quality/metrics`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(filter),
});
const dashboardData = await response.json();
```

## Quality Metrics

### Success Rate
- **Target**: ≥99%
- **Warning**: ≥95%
- **Critical**: <95%

### Auto-Fix Rate
- **Target**: ≥80%
- **Warning**: ≥60%
- **Critical**: <60%

### Average Duration
- **Target**: ≤120s
- **Warning**: ≤300s
- **Critical**: >300s

## Validation Tiers

The dashboard monitors the 3-tier validation pipeline:

**Tier 1: Instant** (< 30s)
- TypeScript, ESLint, imports, navigation

**Tier 2: Fast** (< 2m)
- Full linting, bundler, rendering, Expo Doctor

**Tier 3: Thorough** (< 10m)
- Prebuild, E2E tests, visual snapshots, bundle size

## Technologies

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Development

```bash
# Run development server
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build
pnpm build
```

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Export to CSV/PDF
- [ ] Custom date range picker
- [ ] Drill-down to project validations
- [ ] Alert rules configuration
- [ ] Trend predictions
- [ ] Period comparisons
- [ ] Template health scores

## Related Documentation

- [Quality Dashboard Components](src/components/quality/README.md)
- [PRD-mobigen.md](../../docs/PRD-mobigen.md)
- [TECHNICAL-DESIGN-mobigen.md](../../docs/TECHNICAL-DESIGN-mobigen.md)

## License

Private - Mobigen Internal Use Only
