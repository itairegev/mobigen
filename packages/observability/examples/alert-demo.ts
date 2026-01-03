#!/usr/bin/env tsx
/**
 * Alert System Demo
 *
 * Demonstrates the alert system with simulated metrics.
 * Run: npx tsx examples/alert-demo.ts
 */

import {
  AlertManager,
  AlertSeverity,
  mobigenMetrics,
  defaultAlertRules,
  type NotificationChannel,
  type TriggeredAlert,
} from '../src';

// Console notification channel for demo
class ConsoleChannel implements NotificationChannel {
  async send(alert: TriggeredAlert): Promise<void> {
    const emoji = {
      [AlertSeverity.INFO]: 'ℹ️',
      [AlertSeverity.WARNING]: '⚠️',
      [AlertSeverity.CRITICAL]: '🔴',
    }[alert.rule.severity];

    console.log('\n' + '═'.repeat(70));
    console.log(`${emoji} ALERT: ${alert.rule.name}`);
    console.log('═'.repeat(70));
    console.log(`Severity:    ${alert.rule.severity.toUpperCase()}`);
    console.log(`Message:     ${alert.message}`);
    console.log(`Description: ${alert.rule.description}`);
    console.log(`Value:       ${alert.value.toFixed(4)}`);
    console.log(`Threshold:   ${alert.rule.threshold}`);
    console.log(`Time:        ${new Date(alert.timestamp).toISOString()}`);
    if (alert.rule.runbookUrl) {
      console.log(`Runbook:     ${alert.rule.runbookUrl}`);
    }
    console.log('═'.repeat(70));
  }

  async sendBatch(alerts: TriggeredAlert[]): Promise<void> {
    console.log('\n' + '═'.repeat(70));
    console.log(`📦 BATCH: ${alerts.length} alerts`);
    console.log('═'.repeat(70));
    for (const alert of alerts) {
      console.log(`  • ${alert.rule.name} (${alert.rule.severity})`);
    }
    console.log('═'.repeat(70));
  }
}

async function demo() {
  console.log('\n🚀 Mobigen Alert System Demo\n');

  // Create alert manager
  console.log('Creating alert manager with default rules...');
  const alertManager = new AlertManager({
    rules: defaultAlertRules,
    batchAlerts: false, // Disable batching for demo
    enableHistory: true,
  });

  // Add console channel
  alertManager.addChannel(new ConsoleChannel());

  console.log(`Loaded ${defaultAlertRules.length} alert rules:\n`);
  for (const rule of defaultAlertRules) {
    console.log(`  • ${rule.id} (${rule.severity})`);
  }

  console.log('\n' + '━'.repeat(70));
  console.log('SCENARIO 1: Normal Operations (No Alerts)');
  console.log('━'.repeat(70));

  // Simulate good metrics
  mobigenMetrics.validationTotal.inc({ tier: 'tier1', status: 'success' }, 95);
  mobigenMetrics.validationTotal.inc({ tier: 'tier1', status: 'failed' }, 5);
  mobigenMetrics.validationDuration.observe({ tier: 'tier1', status: 'success' }, 30);

  let alerts = await alertManager.manualCheck();
  console.log(`\n✓ Checked metrics: ${alerts.length} alerts triggered`);

  console.log('\n' + '━'.repeat(70));
  console.log('SCENARIO 2: Low Validation Success Rate');
  console.log('━'.repeat(70));

  // Simulate failing validations (success rate = 85%)
  mobigenMetrics.validationTotal.inc({ tier: 'tier1', status: 'success' }, 85);
  mobigenMetrics.validationTotal.inc({ tier: 'tier1', status: 'failed' }, 15);

  alerts = await alertManager.manualCheck();
  console.log(`\n✓ Checked metrics: ${alerts.length} alerts triggered`);

  console.log('\n' + '━'.repeat(70));
  console.log('SCENARIO 3: Slow Validations');
  console.log('━'.repeat(70));

  // Simulate slow validations
  for (let i = 0; i < 30; i++) {
    mobigenMetrics.validationDuration.observe({ tier: 'tier1', status: 'success' }, 70);
  }

  alerts = await alertManager.manualCheck();
  console.log(`\n✓ Checked metrics: ${alerts.length} alerts triggered`);

  console.log('\n' + '━'.repeat(70));
  console.log('SCENARIO 4: Alert History & Management');
  console.log('━'.repeat(70));

  const history = alertManager.getHistory();
  const allAlerts = history.query({});

  console.log(`\nTotal alerts in history: ${allAlerts.length}`);

  if (allAlerts.length > 0) {
    const firstAlert = allAlerts[0];

    // Acknowledge
    console.log(`\n✓ Acknowledging alert: ${firstAlert.alert.rule.name}`);
    alertManager.acknowledge(
      firstAlert.alert.id,
      'demo@mobigen.io',
      'Investigating the issue'
    );

    // Snooze
    console.log(`✓ Snoozing for 1 hour`);
    alertManager.snooze(
      firstAlert.alert.id,
      60 * 60 * 1000,
      'demo@mobigen.io'
    );

    // Resolve
    console.log(`✓ Resolving with fix description`);
    alertManager.resolve(
      firstAlert.alert.id,
      'Fixed by adjusting timeout values'
    );
  }

  console.log('\n' + '━'.repeat(70));
  console.log('SCENARIO 5: Statistics');
  console.log('━'.repeat(70));

  const stats = alertManager.getStatistics();
  if (stats) {
    console.log('\nAlert Statistics:');
    console.log(`  Total:    ${stats.total}`);
    console.log('\n  By Status:');
    for (const [status, count] of Object.entries(stats.byStatus)) {
      console.log(`    ${status.padEnd(15)} ${count}`);
    }
    console.log('\n  By Severity:');
    for (const [severity, count] of Object.entries(stats.bySeverity)) {
      console.log(`    ${severity.padEnd(15)} ${count}`);
    }
  }

  console.log('\n' + '━'.repeat(70));
  console.log('SCENARIO 6: Query History');
  console.log('━'.repeat(70));

  // Query critical alerts
  const criticalAlerts = history.query({
    severity: [AlertSeverity.CRITICAL],
  });

  console.log(`\nCritical alerts: ${criticalAlerts.length}`);
  for (const entry of criticalAlerts) {
    console.log(`  • ${entry.alert.rule.name} - ${entry.status}`);
  }

  // Query recent alerts
  const recentAlerts = history.getRecent(1); // Last hour
  console.log(`\nRecent alerts (1 hour): ${recentAlerts.length}`);

  // Query active alerts
  const activeAlerts = alertManager.getActiveAlerts();
  console.log(`Active alerts: ${activeAlerts.length}`);

  console.log('\n' + '━'.repeat(70));
  console.log('Demo Complete!');
  console.log('━'.repeat(70));
  console.log('\nThe alert system is working correctly.');
  console.log('\nKey Features Demonstrated:');
  console.log('  ✓ Rule evaluation against metrics');
  console.log('  ✓ Alert triggering with thresholds');
  console.log('  ✓ Notification channels');
  console.log('  ✓ Alert acknowledgment');
  console.log('  ✓ Alert snoozing');
  console.log('  ✓ Alert resolution');
  console.log('  ✓ History tracking');
  console.log('  ✓ Statistics and queries');
  console.log('\n');
}

// Run demo
demo().catch((error) => {
  console.error('Demo failed:', error);
  process.exit(1);
});
