/**
 * Alert System Usage Example
 *
 * Demonstrates how to use the Mobigen alert system for monitoring
 * quality metrics.
 */

import {
  AlertManager,
  SlackChannel,
  EmailChannel,
  AlertSeverity,
  type AlertRule,
  defaultAlertRules,
  mobigenMetrics,
} from '../src';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 1: Basic Alert Manager Setup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function basicSetup() {
  // Create alert manager with default rules
  const alertManager = new AlertManager({
    rules: defaultAlertRules,
    evaluationIntervalMs: 60000, // Check every minute
    batchAlerts: true,
    batchWindowMs: 5000, // Batch alerts within 5 seconds
  });

  // Add Slack notification channel
  const slackChannel = new SlackChannel({
    webhookUrl: process.env.SLACK_WEBHOOK_URL!,
    channel: '#alerts-quality',
    username: 'Mobigen QA Bot',
    iconEmoji: ':warning:',
    mentions: {
      critical: ['@oncall', '@platform-team'],
      warning: ['@platform-team'],
    },
  });

  alertManager.addChannel(slackChannel);

  // Add Email notification channel
  const emailChannel = new EmailChannel({
    smtp: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    },
    from: 'alerts@mobigen.io',
    to: ['oncall@mobigen.io', 'platform@mobigen.io'],
    subjectPrefix: '[Mobigen Alert]',
  });

  alertManager.addChannel(emailChannel);

  // Start continuous monitoring
  alertManager.startMonitoring();

  console.log('Alert system started');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 2: Custom Alert Rules
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function customRules() {
  const alertManager = new AlertManager();

  // Add a custom rule for memory usage
  const memoryRule: AlertRule = {
    id: 'high_memory_usage',
    name: 'High Memory Usage',
    description: 'Alert when memory usage exceeds 90%',
    metricName: 'process_memory_usage_bytes',
    condition: 'gt',
    threshold: 0.9,
    severity: AlertSeverity.WARNING,
    windowMs: 5 * 60 * 1000, // 5 minutes
    minSamples: 3,
    runbookUrl: 'https://docs.mobigen.io/runbooks/high-memory',
    tags: ['infrastructure', 'memory'],
  };

  alertManager.addRule(memoryRule);

  // Add a custom rule for API latency
  const latencyRule: AlertRule = {
    id: 'api_latency_high',
    name: 'High API Latency',
    description: 'Alert when P95 API latency exceeds 2 seconds',
    metricName: 'mobigen_api_request_duration_seconds',
    condition: 'gt',
    threshold: 2,
    severity: AlertSeverity.CRITICAL,
    windowMs: 5 * 60 * 1000,
    minSamples: 50,
    runbookUrl: 'https://docs.mobigen.io/runbooks/api-latency-high',
    tags: ['api', 'performance'],
  };

  alertManager.addRule(latencyRule);

  console.log('Added custom alert rules');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 3: Manual Alert Check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function manualCheck() {
  const alertManager = new AlertManager({
    rules: defaultAlertRules,
  });

  // Add notification channel
  const slackChannel = new SlackChannel({
    webhookUrl: process.env.SLACK_WEBHOOK_URL!,
  });
  alertManager.addChannel(slackChannel);

  // Perform manual check
  const triggeredAlerts = await alertManager.manualCheck();

  if (triggeredAlerts.length > 0) {
    console.log(`Triggered ${triggeredAlerts.length} alerts:`);
    for (const alert of triggeredAlerts) {
      console.log(`  - ${alert.rule.name}: ${alert.message}`);
    }
  } else {
    console.log('No alerts triggered');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 4: Alert Acknowledgment & Snoozing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function acknowledgementExample() {
  const alertManager = new AlertManager({
    enableHistory: true,
  });

  // Simulate some alerts
  await alertManager.manualCheck();

  // Get active alerts
  const activeAlerts = alertManager.getActiveAlerts();

  if (activeAlerts.length > 0) {
    const firstAlert = activeAlerts[0];

    // Acknowledge an alert
    alertManager.acknowledge(
      firstAlert.alert.id,
      'john@example.com',
      'Investigating the issue'
    );

    console.log(`Acknowledged alert: ${firstAlert.alert.rule.name}`);

    // Snooze an alert for 1 hour
    alertManager.snooze(
      firstAlert.alert.id,
      60 * 60 * 1000, // 1 hour
      'john@example.com'
    );

    console.log(`Snoozed alert for 1 hour`);

    // Resolve an alert
    alertManager.resolve(
      firstAlert.alert.id,
      'Fixed by restarting the service'
    );

    console.log(`Resolved alert`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 5: Query Alert History
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function historyQuery() {
  const alertManager = new AlertManager({
    enableHistory: true,
  });

  // Get alert history
  const history = alertManager.getHistory();

  // Get recent alerts (last 24 hours)
  const recentAlerts = history.getRecent(24);
  console.log(`Recent alerts (24h): ${recentAlerts.length}`);

  // Get critical alerts
  const criticalAlerts = history.query({
    severity: [AlertSeverity.CRITICAL],
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
  });
  console.log(`Critical alerts (7d): ${criticalAlerts.length}`);

  // Get statistics
  const stats = alertManager.getStatistics();
  if (stats) {
    console.log('Alert Statistics:');
    console.log('  Total:', stats.total);
    console.log('  By Status:', stats.byStatus);
    console.log('  By Severity:', stats.bySeverity);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 6: Integration with Metrics
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function metricsIntegration() {
  // Simulate some validation metrics
  mobigenMetrics.validationTotal.inc({ tier: 'tier1', status: 'success' }, 90);
  mobigenMetrics.validationTotal.inc({ tier: 'tier1', status: 'failed' }, 15);

  mobigenMetrics.validationDuration.observe(
    { tier: 'tier1', status: 'success' },
    45
  );

  // Create alert manager
  const alertManager = new AlertManager({
    rules: defaultAlertRules,
  });

  // Add Slack channel
  const slackChannel = new SlackChannel({
    webhookUrl: process.env.SLACK_WEBHOOK_URL!,
  });
  alertManager.addChannel(slackChannel);

  // Check if validation success rate triggers alert
  const triggeredAlerts = await alertManager.manualCheck();

  console.log(`Triggered ${triggeredAlerts.length} alerts based on metrics`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 7: Testing Notification Channels
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function testChannels() {
  const alertManager = new AlertManager();

  // Add channels
  const slackChannel = new SlackChannel({
    webhookUrl: process.env.SLACK_WEBHOOK_URL!,
  });

  const emailChannel = new EmailChannel({
    smtp: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    },
    from: 'alerts@mobigen.io',
    to: ['test@example.com'],
  });

  alertManager.addChannel(slackChannel);
  alertManager.addChannel(emailChannel);

  // Test all channels
  const results = await alertManager.testChannels();

  console.log('Channel Test Results:');
  for (const [index, result] of Object.entries(results)) {
    console.log(`  Channel ${index}: ${result ? '✓ PASS' : '✗ FAIL'}`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 8: Production Setup (Express API)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function productionSetup() {
  // Create alert manager with production config
  const alertManager = new AlertManager({
    rules: defaultAlertRules,
    evaluationIntervalMs: 60000, // Check every minute
    batchAlerts: true,
    batchWindowMs: 10000, // 10 second batch window
    cleanupIntervalMs: 3600000, // Clean up old alerts every hour
    enableHistory: true,
  });

  // Configure Slack for critical alerts
  if (process.env.SLACK_WEBHOOK_URL) {
    alertManager.addChannel(
      new SlackChannel({
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: '#alerts-production',
        username: 'Mobigen Alerts',
        iconEmoji: ':rotating_light:',
        mentions: {
          critical: ['@oncall', '<!channel>'],
          warning: ['@platform-team'],
        },
      })
    );
  }

  // Configure email for all alerts
  if (process.env.SMTP_HOST) {
    alertManager.addChannel(
      new EmailChannel({
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: true,
          auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
          },
        },
        from: process.env.ALERT_EMAIL_FROM || 'alerts@mobigen.io',
        to: (process.env.ALERT_EMAIL_TO || '').split(','),
        subjectPrefix: '[Mobigen Production Alert]',
      })
    );
  }

  // Start monitoring
  alertManager.startMonitoring();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down alert system...');
    alertManager.stopMonitoring();
  });

  process.on('SIGINT', () => {
    console.log('Shutting down alert system...');
    alertManager.stopMonitoring();
    process.exit(0);
  });

  console.log('Production alert system started');
  console.log(`  Rules: ${defaultAlertRules.length}`);
  console.log(`  Channels: ${alertManager['channels'].length}`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Run Examples
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (require.main === module) {
  const example = process.argv[2] || 'basic';

  const examples: Record<string, () => Promise<void>> = {
    basic: basicSetup,
    custom: customRules,
    manual: manualCheck,
    ack: acknowledgementExample,
    history: historyQuery,
    metrics: metricsIntegration,
    test: testChannels,
    production: productionSetup,
  };

  const exampleFn = examples[example];
  if (!exampleFn) {
    console.error(`Unknown example: ${example}`);
    console.log('Available examples:', Object.keys(examples).join(', '));
    process.exit(1);
  }

  exampleFn().catch((error) => {
    console.error('Example failed:', error);
    process.exit(1);
  });
}
