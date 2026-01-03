# Quality Metrics Collection

Comprehensive metrics collection system for tracking quality operations in Mobigen.

## Features

- **Thread-safe collection** - Metrics can be recorded from multiple concurrent operations
- **Buffering & batching** - Metrics are buffered in memory and flushed periodically
- **Time-series storage** - Store and query metrics over time
- **Rich aggregations** - Calculate success rates, percentiles, trends, and more
- **Quality-specific metrics** - Purpose-built for validation, auto-fix, retry, and rollback tracking

## Quick Start

### Recording Metrics

```typescript
import { metricsCollector } from '@mobigen/observability/metrics';

// Record a validation
metricsCollector.recordValidation({
  tier: 'tier1',
  status: 'success',
  duration: 1500,
  errorCount: 0,
  warningCount: 2,
  stage: 'typescript',
  projectId: 'proj_123',
  value: 1,
  labels: {},
  timestamp: Date.now(),
});

// Record an auto-fix attempt
metricsCollector.recordAutoFix({
  tier: 'tier1',
  status: 'success',
  duration: 800,
  errorsAttempted: 3,
  errorsFixed: 3,
  strategy: 'import-resolver',
  value: 1,
  labels: {},
  timestamp: Date.now(),
});

// Record a retry
metricsCollector.recordRetry({
  tier: 'tier2',
  status: 'success',
  operation: 'validation',
  attempt: 2,
  totalAttempts: 3,
  succeeded: true,
  value: 1,
  labels: {},
  timestamp: Date.now(),
});

// Record a rollback
metricsCollector.recordRollback({
  tier: 'tier3',
  status: 'success',
  reason: 'validation_failed',
  duration: 500,
  filesAffected: 15,
  fromVersion: 5,
  toVersion: 4,
  value: 1,
  labels: {},
  timestamp: Date.now(),
});
```

### Convenience Functions

```typescript
import { recordValidation, recordAutoFix } from '@mobigen/observability/metrics';

// Simpler API for common operations
recordValidation('tier1', 'success', 1500, {
  errorCount: 0,
  warningCount: 2,
  stage: 'typescript',
  projectId: 'proj_123',
});

recordAutoFix('tier1', 'success', 800, {
  errorsAttempted: 3,
  errorsFixed: 3,
  strategy: 'import-resolver',
});
```

### Querying Metrics

```typescript
import { metricsAggregator } from '@mobigen/observability/metrics';

const timeRange = {
  start: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
  end: Date.now(),
};

// Get validation success rate
const successRate = await metricsAggregator.getSuccessRate(timeRange, 'tier1');
console.log(`Success rate: ${successRate.toFixed(2)}%`);

// Get auto-fix success rate
const autoFixRate = await metricsAggregator.getAutoFixRate(timeRange);
console.log(`Auto-fix rate: ${autoFixRate.toFixed(2)}%`);

// Get retry statistics
const retryStats = await metricsAggregator.getRetryStats(timeRange);
console.log(`Retries: ${retryStats.totalAttempts}, Success: ${retryStats.successRate.toFixed(2)}%`);

// Get comprehensive quality summary
const summary = await metricsAggregator.getQualitySummary(timeRange);
console.log(JSON.stringify(summary, null, 2));
```

### Performance Metrics

```typescript
// Get validation duration percentiles
const duration = await metricsAggregator.getValidationDuration(timeRange, 'tier1');
console.log(`P95: ${duration.p95.toFixed(2)}s, P99: ${duration.p99.toFixed(2)}s`);

// Get trend over time
const trend = await metricsAggregator.getTrend(
  'mobigen.validation.duration',
  timeRange,
  60 * 60 * 1000, // 1 hour windows
  { tier: 'tier1' }
);

// Compare time periods
const comparison = await metricsAggregator.compareTimePeriods(
  'mobigen.validation.success',
  { start: Date.now() - 24 * 60 * 60 * 1000, end: Date.now() },
  { start: Date.now() - 48 * 60 * 60 * 1000, end: Date.now() - 24 * 60 * 60 * 1000 }
);
console.log(`Change: ${comparison.changePercent.toFixed(2)}%`);
```

## Metrics Reference

### Validation Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `validation.runs` | Counter | tier, status, stage, projectId | Total validation runs |
| `validation.success` | Counter | tier, stage, projectId | Successful validations |
| `validation.failure` | Counter | tier, stage, projectId | Failed validations |
| `validation.duration` | Histogram | tier, status, stage, projectId | Validation duration in seconds |
| `validation.errors` | Gauge | tier, stage, projectId | Number of errors found |
| `validation.warnings` | Gauge | tier, stage, projectId | Number of warnings found |

### Auto-Fix Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `autofix.attempts` | Counter | tier, strategy, projectId | Auto-fix attempts |
| `autofix.success` | Counter | tier, strategy, projectId | Successful fixes |
| `autofix.duration` | Histogram | tier, status, strategy, projectId | Fix duration in seconds |
| `autofix.errors_attempted` | Gauge | tier, strategy, projectId | Errors attempted to fix |
| `autofix.errors_fixed` | Gauge | tier, strategy, projectId | Errors successfully fixed |

### Retry Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `retry.attempts` | Counter | tier, operation, projectId | Retry attempts |
| `retry.success` | Counter | tier, operation, projectId | Successful retries |
| `retry.attempt_number` | Gauge | tier, operation, projectId | Current attempt number |

### Rollback Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `rollback.executions` | Counter | tier, reason, projectId | Rollback executions |
| `rollback.duration` | Histogram | tier, reason, projectId | Rollback duration in seconds |
| `rollback.files_affected` | Gauge | tier, reason, projectId | Files affected by rollback |
| `rollback.version_delta` | Gauge | tier, projectId | Version difference |

## Architecture

### Components

1. **MetricsCollector** - Thread-safe collection with buffering
2. **MetricsStorage** - Time-series storage interface
3. **QualityMetricsAggregator** - Query and aggregation engine

### Data Flow

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Your Code      │─────▶│ MetricsCollector │─────▶│ MetricsStorage  │
│  (record calls) │      │  (buffer/flush)  │      │  (time-series)  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │   Aggregator    │
                                                    │  (queries)      │
                                                    └─────────────────┘
```

### Storage

**Development:** In-memory storage (default)
- Fast, no external dependencies
- Limited to 100,000 data points
- Data lost on restart

**Production:** ClickHouse or TimescaleDB (planned)
- Scalable time-series storage
- Long-term data retention
- High-performance queries

## Configuration

### Custom Collector

```typescript
import { createCollector } from '@mobigen/observability/metrics';

const collector = createCollector({
  bufferSize: 5000,        // Buffer up to 5000 metrics
  flushInterval: 5000,     // Flush every 5 seconds
  threadSafe: true,        // Enable locking
  prefix: 'myapp',         // Metric prefix
  defaultLabels: {         // Applied to all metrics
    environment: 'production',
    service: 'generator',
  },
});

// Use custom collector
collector.increment('custom.metric', { tier: 'tier1' });
```

### Custom Storage

```typescript
import { createInMemoryStorage } from '@mobigen/observability/metrics';

const storage = createInMemoryStorage({
  maxDataPoints: 500000,  // Increase limit
});

// Connect collector to storage
collector.on('flush', async (metrics) => {
  await storage.write(metrics);
});
```

## Best Practices

1. **Use labels wisely** - Labels create dimensions but increase cardinality
2. **Buffer metrics** - Don't flush on every metric, use batching
3. **Choose appropriate types** - Counter for totals, Histogram for durations
4. **Set reasonable retention** - Don't store metrics forever
5. **Monitor storage size** - Watch for unbounded growth

## Example: Validation Hook

```typescript
import { recordValidation } from '@mobigen/observability/metrics';

export async function validateProject(
  projectId: string,
  tier: 'tier1' | 'tier2' | 'tier3'
): Promise<ValidationResult> {
  const startTime = Date.now();

  try {
    const result = await runValidation(projectId, tier);

    recordValidation(tier, result.passed ? 'success' : 'failure', Date.now() - startTime, {
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      stage: result.stage,
      projectId,
    });

    return result;
  } catch (error) {
    recordValidation(tier, 'error', Date.now() - startTime, {
      errorCount: 1,
      projectId,
    });
    throw error;
  }
}
```

## Metrics Dashboard

The collected metrics can be visualized using:
- **Prometheus + Grafana** - Classic monitoring stack
- **Custom dashboard** - Query via aggregator API
- **Time-series database UI** - ClickHouse or TimescaleDB built-in tools

## API Reference

See TypeScript definitions in:
- `schema.ts` - Metric types and interfaces
- `collector.ts` - Collection API
- `storage.ts` - Storage interface
- `aggregations.ts` - Query and aggregation functions
