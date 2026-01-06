# Mobigen Alert System

Comprehensive alerting system for monitoring quality metrics and service health in Mobigen.

## Overview

The alert system provides:

- **Rule-based alerting**: Define alert rules with conditions and thresholds
- **Multiple notification channels**: Slack, Email, Webhook, Console
- **Alert history**: Track, acknowledge, snooze, and resolve alerts
- **Batch notifications**: Group alerts by severity to reduce noise
- **Automatic evaluation**: Continuous monitoring with configurable intervals
- **Built-in quality rules**: Pre-defined rules for validation, builds, and API health

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ALERT SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │   Metrics    │─────▶│  Evaluator   │─────▶│  Triggered   │      │
│  │  Registry    │      │   (Rules)    │      │   Alerts     │      │
│  └──────────────┘      └──────────────┘      └──────────────┘      │
│                                                       │              │
│                                                       ▼              │
│                                              ┌──────────────┐       │
│                                              │   History    │       │
│                                              │  (Track &    │       │
│                                              │   Manage)    │       │
│                                              └──────────────┘       │
│                                                       │              │
│                                                       ▼              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │    Slack     │      │    Email     │      │   Webhook    │      │
│  │   Channel    │◀─────│  Channels    │◀─────│   Channel    │      │
│  └──────────────┘      └──────────────┘      └──────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start

```typescript
import {
  AlertManager,
  SlackChannel,
  defaultAlertRules,
} from '@mobigen/observability';

// 1. Create alert manager
const alertManager = new AlertManager({
  rules: defaultAlertRules,
  evaluationIntervalMs: 60000, // Check every minute
});

// 2. Add notification channel
const slackChannel = new SlackChannel({
  webhookUrl: process.env.SLACK_WEBHOOK_URL!,
  channel: '#alerts',
  mentions: {
    critical: ['@oncall'],
  },
});

alertManager.addChannel(slackChannel);

// 3. Start monitoring
alertManager.startMonitoring();
```

## Alert Rules

### Rule Definition

```typescript
interface AlertRule {
  id: string;                     // Unique identifier
  name: string;                   // Human-readable name
  description: string;            // What this rule monitors
  metricName: string;             // Metric to monitor
  metricLabels?: Record<string, string>; // Filter by labels
  condition: ComparisonOperator;  // 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'
  threshold: number;              // Threshold value
  severity: AlertSeverity;        // INFO | WARNING | CRITICAL
  windowMs?: number;              // Time window for evaluation
  minSamples?: number;            // Minimum samples required
  runbookUrl?: string;            // Link to resolution steps
  tags?: string[];                // Categorization tags
}
```

### Pre-defined Rules

The system includes these default rules:

| Rule ID | Description | Threshold | Severity |
|---------|-------------|-----------|----------|
| `validation_success_low` | Validation success rate < 95% | 0.95 | CRITICAL |
| `autofix_failure_high` | Auto-fix failure rate > 20% | 0.2 | WARNING |
| `validation_slow` | P95 validation duration > 60s | 60 | WARNING |
| `retry_exhausted` | Retry exhaustion rate > 5% | 0.05 | CRITICAL |
| `generation_success_low` | Generation success rate < 90% | 0.9 | CRITICAL |
| `build_success_low` | Build success rate < 99% | 0.99 | CRITICAL |
| `api_error_rate_high` | API error rate > 1% | 0.01 | WARNING |
| `queue_size_high` | Queue size > 100 pending | 100 | WARNING |
| `circuit_breaker_open` | Circuit breaker is open | 2 | CRITICAL |

### Custom Rules

```typescript
const customRule: AlertRule = {
  id: 'custom_metric_high',
  name: 'Custom Metric Too High',
  description: 'Alert when custom metric exceeds threshold',
  metricName: 'my_custom_metric',
  condition: 'gt',
  threshold: 100,
  severity: AlertSeverity.WARNING,
  windowMs: 5 * 60 * 1000, // 5 minutes
  minSamples: 10,
  runbookUrl: 'https://docs.example.com/runbook',
  tags: ['custom', 'monitoring'],
};

alertManager.addRule(customRule);
```

## Notification Channels

### Slack Channel

```typescript
import { SlackChannel } from '@mobigen/observability';

const slack = new SlackChannel({
  webhookUrl: process.env.SLACK_WEBHOOK_URL, // Set in environment
  channel: '#alerts-production',
  username: 'Mobigen Alerts',
  iconEmoji: ':warning:',
  mentions: {
    critical: ['@oncall', '<!channel>'],
    warning: ['@platform-team'],
    info: [],
  },
});

// Test connection
const isWorking = await slack.test();
```

**Features:**
- Color-coded messages by severity
- Rich attachments with alert details
- Configurable mentions per severity
- Batch support for multiple alerts
- Runbook links

### Email Channel

```typescript
import { EmailChannel } from '@mobigen/observability';

// Using SMTP
const email = new EmailChannel({
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: true,
    auth: {
      user: 'alerts@example.com',
      pass: process.env.SMTP_PASSWORD!,
    },
  },
  from: 'alerts@example.com',
  to: ['oncall@example.com', 'team@example.com'],
  cc: ['manager@example.com'],
  subjectPrefix: '[Mobigen Alert]',
});

// Using AWS SES (coming soon)
const emailSES = new EmailChannel({
  ses: {
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  from: 'alerts@example.com',
  to: ['oncall@example.com'],
});
```

**Features:**
- HTML and plain text formats
- Batch support
- Color-coded severity
- Runbook links
- Alert metadata

### Custom Channels

Implement the `NotificationChannel` interface:

```typescript
import { NotificationChannel, TriggeredAlert } from '@mobigen/observability';

class CustomChannel implements NotificationChannel {
  async send(alert: TriggeredAlert): Promise<void> {
    // Your notification logic
    await fetch('https://api.example.com/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  async sendBatch(alerts: TriggeredAlert[]): Promise<void> {
    // Batch notification logic
  }

  async test(): Promise<boolean> {
    // Test connection
    return true;
  }
}
```

## Alert History & Management

### Recording Alerts

Alerts are automatically recorded when triggered:

```typescript
const history = alertManager.getHistory();
const recentAlerts = history.getRecent(24); // Last 24 hours
```

### Acknowledging Alerts

```typescript
// Acknowledge an alert
alertManager.acknowledge(
  alertId,
  'john@example.com',
  'Investigating root cause'
);

// Get acknowledged alerts
const acknowledged = history.query({
  status: [AlertStatus.ACKNOWLEDGED],
});
```

### Snoozing Alerts

```typescript
// Snooze for 1 hour
alertManager.snooze(
  alertId,
  60 * 60 * 1000,
  'john@example.com'
);

// Snoozed alerts auto-wake when duration expires
```

### Resolving Alerts

```typescript
// Resolve an alert
alertManager.resolve(
  alertId,
  'Fixed by restarting the service'
);

// Get resolved alerts
const resolved = history.query({
  status: [AlertStatus.RESOLVED],
});
```

### Querying History

```typescript
// Query with filters
const criticalAlerts = history.query({
  severity: [AlertSeverity.CRITICAL],
  status: [AlertStatus.ACTIVE],
  startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
  limit: 50,
  sortOrder: 'desc',
});

// Get statistics
const stats = alertManager.getStatistics();
console.log(stats);
// {
//   total: 150,
//   byStatus: { active: 5, acknowledged: 10, snoozed: 2, resolved: 133 },
//   bySeverity: { critical: 20, warning: 80, info: 50 }
// }
```

## Evaluation & Monitoring

### Continuous Monitoring

```typescript
// Start monitoring with custom interval
alertManager.startMonitoring(30000); // Check every 30 seconds

// Stop monitoring
alertManager.stopMonitoring();
```

### Manual Checks

```typescript
// Run evaluation on-demand
const triggeredAlerts = await alertManager.manualCheck();

if (triggeredAlerts.length > 0) {
  console.log(`${triggeredAlerts.length} alerts triggered`);
}
```

### Batch Alerts

Reduce notification noise by batching alerts:

```typescript
const alertManager = new AlertManager({
  batchAlerts: true,
  batchWindowMs: 10000, // Wait 10 seconds before sending
});

// Alerts within the window are grouped by severity
```

## Integration with Metrics

The alert system automatically pulls metrics from the Metrics Registry:

```typescript
import { mobigenMetrics } from '@mobigen/observability';

// Simulate validation metrics
mobigenMetrics.validationTotal.inc({ tier: 'tier1', status: 'success' }, 85);
mobigenMetrics.validationTotal.inc({ tier: 'tier1', status: 'failed' }, 20);

// Alert manager will evaluate these metrics
const triggeredAlerts = await alertManager.manualCheck();
// Will trigger 'validation_success_low' if rate < 95%
```

## Production Setup

```typescript
import { AlertManager, SlackChannel, EmailChannel } from '@mobigen/observability';

// Create alert manager
const alertManager = new AlertManager({
  rules: defaultAlertRules,
  evaluationIntervalMs: 60000,
  batchAlerts: true,
  batchWindowMs: 10000,
  cleanupIntervalMs: 3600000, // Clean up old alerts hourly
  enableHistory: true,
});

// Add Slack for critical alerts
alertManager.addChannel(new SlackChannel({
  webhookUrl: process.env.SLACK_WEBHOOK_URL!,
  mentions: {
    critical: ['@oncall', '<!channel>'],
    warning: ['@platform-team'],
  },
}));

// Add email for all alerts
alertManager.addChannel(new EmailChannel({
  smtp: { /* ... */ },
  from: 'alerts@mobigen.io',
  to: ['oncall@mobigen.io'],
}));

// Start monitoring
alertManager.startMonitoring();

// Graceful shutdown
process.on('SIGTERM', () => {
  alertManager.stopMonitoring();
});
```

## API Reference

### AlertManager

```typescript
class AlertManager {
  constructor(config?: AlertManagerConfig)

  addChannel(channel: NotificationChannel): void
  removeChannel(channel: NotificationChannel): void

  addRule(rule: AlertRule): void
  removeRule(ruleId: string): void

  startMonitoring(intervalMs?: number): void
  stopMonitoring(): void

  manualCheck(): Promise<TriggeredAlert[]>

  acknowledge(alertId: string, acknowledgedBy: string, note?: string): boolean
  snooze(alertId: string, durationMs: number, snoozedBy: string): boolean
  resolve(alertId: string, resolution?: string): boolean

  getHistory(): AlertHistory
  getActiveAlerts(): AlertHistoryEntry[]
  getStatistics(): { total: number; byStatus: Record<AlertStatus, number>; bySeverity: Record<AlertSeverity, number> }

  testChannels(): Promise<Record<number, boolean>>
}
```

### AlertEvaluator

```typescript
class AlertEvaluator {
  evaluate(rules: AlertRule[], metrics: MetricsData): AlertResult[]
  checkThreshold(value: number, operator: ComparisonOperator, threshold: number): boolean
  getHistory(ruleId: string): number[]
  clearHistory(): void
}
```

### AlertHistory

```typescript
class AlertHistory {
  record(alert: TriggeredAlert): AlertHistoryEntry
  acknowledge(alertId: string, acknowledgedBy: string, note?: string): AlertHistoryEntry | undefined
  snooze(alertId: string, durationMs: number, snoozedBy: string): AlertHistoryEntry | undefined
  resolve(alertId: string, resolution?: string): AlertHistoryEntry | undefined

  get(alertId: string): AlertHistoryEntry | undefined
  query(options: AlertQueryOptions): AlertHistoryEntry[]
  getRecent(hours: number): AlertHistoryEntry[]
  getActive(): AlertHistoryEntry[]

  cleanup(olderThanMs: number): number
  export(): AlertHistoryEntry[]
  import(entries: AlertHistoryEntry[]): void
}
```

## Best Practices

### 1. Set Appropriate Thresholds

```typescript
// Too sensitive - will create noise
{ threshold: 0.99, severity: AlertSeverity.CRITICAL }

// Better - allows some margin
{ threshold: 0.95, severity: AlertSeverity.CRITICAL }
{ threshold: 0.98, severity: AlertSeverity.WARNING }
```

### 2. Use Time Windows

```typescript
// Avoid alerting on single data points
{
  windowMs: 5 * 60 * 1000, // 5 minutes
  minSamples: 10,          // Need 10 samples
}
```

### 3. Configure Runbooks

```typescript
{
  runbookUrl: 'https://docs.mobigen.io/runbooks/validation-failure',
  // Include resolution steps in your runbook
}
```

### 4. Use Severity Appropriately

- **CRITICAL**: Immediate action required, user-facing impact
- **WARNING**: Should investigate, no immediate impact
- **INFO**: Informational, no action needed

### 5. Batch Alerts

```typescript
{
  batchAlerts: true,
  batchWindowMs: 10000, // Reduce notification spam
}
```

### 6. Monitor Alert Volume

```typescript
// Regularly check statistics
const stats = alertManager.getStatistics();
if (stats.byStatus.active > 50) {
  console.warn('Too many active alerts - review thresholds');
}
```

## Troubleshooting

### Alerts Not Triggering

1. Check metrics are being collected:
   ```typescript
   const metrics = defaultRegistry.exportJson();
   console.log(metrics);
   ```

2. Check rule evaluation:
   ```typescript
   const results = evaluator.evaluate(rules, metrics);
   console.log(results);
   ```

3. Verify thresholds are correct

### Notifications Not Sending

1. Test channels:
   ```typescript
   const results = await alertManager.testChannels();
   console.log(results);
   ```

2. Check channel configuration
3. Verify webhook URLs / SMTP credentials

### Too Many Alerts

1. Adjust thresholds
2. Increase time windows
3. Enable batch mode
4. Review rule sensitivity

## License

MIT
