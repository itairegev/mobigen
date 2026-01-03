/**
 * Metrics Usage Example
 *
 * Demonstrates how to use the metrics collection system.
 * Run with: npx tsx src/metrics/example.ts
 */

import {
  metricsCollector,
  metricsAggregator,
  recordValidation,
  recordAutoFix,
  recordRetry,
  recordRollback,
} from './index';

/**
 * Simulate validation operations and collect metrics
 */
async function simulateValidations() {
  console.log('📊 Simulating validation operations...\n');

  // Simulate 100 validation runs across different tiers
  for (let i = 0; i < 100; i++) {
    const tier = ['tier1', 'tier2', 'tier3'][i % 3] as 'tier1' | 'tier2' | 'tier3';
    const duration = Math.random() * 5000 + 500; // 500-5500ms
    const success = Math.random() > 0.1; // 90% success rate

    recordValidation(tier, success ? 'success' : 'failure', duration, {
      errorCount: success ? 0 : Math.floor(Math.random() * 5) + 1,
      warningCount: Math.floor(Math.random() * 3),
      stage: ['typescript', 'eslint', 'build'][i % 3],
      projectId: `proj_${Math.floor(i / 10)}`,
    });

    // Simulate some auto-fix attempts on failures
    if (!success) {
      const fixDuration = Math.random() * 2000 + 300;
      const errorsAttempted = Math.floor(Math.random() * 5) + 1;
      const fixSuccess = Math.random() > 0.3; // 70% auto-fix success

      recordAutoFix(tier, fixSuccess ? 'success' : 'failure', fixDuration, {
        errorsAttempted,
        errorsFixed: fixSuccess ? errorsAttempted : Math.floor(errorsAttempted / 2),
        strategy: ['import-resolver', 'type-fixer', 'lint-auto-fix'][i % 3],
        projectId: `proj_${Math.floor(i / 10)}`,
      });
    }

    // Small delay to spread timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  console.log('✅ Generated 100 validation metrics\n');
}

/**
 * Simulate retry operations
 */
async function simulateRetries() {
  console.log('🔄 Simulating retry operations...\n');

  // Simulate 30 retry scenarios
  for (let i = 0; i < 30; i++) {
    const tier = ['tier1', 'tier2', 'tier3'][i % 3] as 'tier1' | 'tier2' | 'tier3';
    const operation = ['validation', 'build', 'deploy'][i % 3];
    const maxAttempts = 3;

    // Simulate progressive retries
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const succeeded = attempt === maxAttempts || Math.random() > 0.5;

      recordRetry(tier, operation, attempt, maxAttempts, succeeded, {
        projectId: `proj_${Math.floor(i / 10)}`,
      });

      if (succeeded) break;
    }

    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  console.log('✅ Generated 30 retry scenarios\n');
}

/**
 * Simulate rollback operations
 */
async function simulateRollbacks() {
  console.log('↩️  Simulating rollback operations...\n');

  // Simulate 10 rollback scenarios
  for (let i = 0; i < 10; i++) {
    const tier = ['tier1', 'tier2', 'tier3'][i % 3] as 'tier1' | 'tier2' | 'tier3';
    const duration = Math.random() * 1000 + 200;
    const filesAffected = Math.floor(Math.random() * 20) + 5;
    const reason = ['validation_failed', 'build_error', 'user_requested'][i % 3];

    recordRollback(tier, reason, duration, filesAffected, {
      fromVersion: 5 + i,
      toVersion: 4 + i,
      projectId: `proj_${i}`,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  console.log('✅ Generated 10 rollback metrics\n');
}

/**
 * Query and display metrics
 */
async function queryMetrics() {
  console.log('📈 Querying metrics...\n');

  const timeRange = {
    start: Date.now() - 60 * 60 * 1000, // Last hour
    end: Date.now(),
  };

  // Overall success rate
  const successRate = await metricsAggregator.getSuccessRate(timeRange);
  console.log(`Overall Validation Success Rate: ${successRate.toFixed(2)}%`);

  // Success rate by tier
  for (const tier of ['tier1', 'tier2', 'tier3'] as const) {
    const tierSuccessRate = await metricsAggregator.getSuccessRate(timeRange, tier);
    console.log(`  ${tier}: ${tierSuccessRate.toFixed(2)}%`);
  }
  console.log();

  // Auto-fix success rate
  const autoFixRate = await metricsAggregator.getAutoFixRate(timeRange);
  console.log(`Auto-Fix Success Rate: ${autoFixRate.toFixed(2)}%\n`);

  // Retry statistics
  const retryStats = await metricsAggregator.getRetryStats(timeRange);
  console.log('Retry Statistics:');
  console.log(`  Total Attempts: ${retryStats.totalAttempts}`);
  console.log(`  Success Rate: ${retryStats.successRate.toFixed(2)}%`);
  console.log(`  Avg Attempts/Operation: ${retryStats.avgAttemptsPerOperation.toFixed(2)}\n`);

  // Validation duration
  const duration = await metricsAggregator.getValidationDuration(timeRange);
  console.log('Validation Duration (seconds):');
  console.log(`  Average: ${duration.avg.toFixed(2)}s`);
  console.log(`  Median: ${duration.median.toFixed(2)}s`);
  console.log(`  P95: ${duration.p95.toFixed(2)}s`);
  console.log(`  P99: ${duration.p99.toFixed(2)}s\n`);

  // Error breakdown
  const errorsByTier = await metricsAggregator.getErrorsByTier(timeRange);
  console.log('Errors by Tier:');
  for (const [tier, count] of Object.entries(errorsByTier)) {
    console.log(`  ${tier}: ${count}`);
  }
  console.log();

  // Rollback statistics
  const rollbackStats = await metricsAggregator.getRollbackStats(timeRange);
  console.log('Rollback Statistics:');
  console.log(`  Total Rollbacks: ${rollbackStats.totalRollbacks}`);
  console.log(`  Avg Files Affected: ${rollbackStats.avgFilesAffected.toFixed(2)}`);
  console.log(`  Avg Duration: ${rollbackStats.avgDuration.toFixed(2)}s`);
  console.log('  Reasons:');
  for (const [reason, count] of Object.entries(rollbackStats.reasonBreakdown)) {
    console.log(`    ${reason}: ${count}`);
  }
  console.log();

  // Comprehensive quality summary
  const summary = await metricsAggregator.getQualitySummary(timeRange);
  console.log('📊 Quality Summary:');
  console.log(JSON.stringify(summary, null, 2));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Mobigen Quality Metrics Example\n');
  console.log('='.repeat(60));
  console.log();

  try {
    // Generate sample metrics
    await simulateValidations();
    await simulateRetries();
    await simulateRollbacks();

    // Wait for auto-flush
    console.log('⏳ Waiting for metrics to flush...\n');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Query and display results
    await queryMetrics();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Example completed successfully!');

    // Show buffer status
    const bufferSize = metricsCollector.getBufferSize();
    console.log(`\n📦 Remaining buffer size: ${bufferSize} metrics`);
  } catch (error) {
    console.error('❌ Error:', error);
    if (typeof process !== 'undefined' && 'exit' in process) {
      (process as NodeJS.Process).exit(1);
    }
  }
}

// Run if executed directly
const isMainModule =
  typeof process !== 'undefined' &&
  'argv' in process &&
  import.meta.url === `file://${(process as NodeJS.Process).argv[1]}`;

if (isMainModule) {
  main().catch(console.error);
}

export { main };
