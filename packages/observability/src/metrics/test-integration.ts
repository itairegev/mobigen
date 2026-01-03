/**
 * Integration Test for Metrics System
 *
 * Tests the full metrics collection pipeline.
 */

import { metricsCollector, metricsStorage, metricsAggregator } from './index';
import { MetricType } from './schema';

// Simple assertion helper
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function testBasicCollection() {
  console.log('Test 1: Basic metric collection');

  // Reset state
  metricsCollector.reset();

  // Record some metrics
  metricsCollector.increment('test.counter', { type: 'a' }, 5);
  metricsCollector.increment('test.counter', { type: 'a' }, 3);
  metricsCollector.increment('test.counter', { type: 'b' }, 2);

  // Check counters
  const counterA = metricsCollector.getCounter('test.counter', { type: 'a' });
  const counterB = metricsCollector.getCounter('test.counter', { type: 'b' });

  assert(counterA === 8, `Expected counterA=8, got ${counterA}`);
  assert(counterB === 2, `Expected counterB=2, got ${counterB}`);

  console.log('✅ Basic collection works\n');
}

async function testHistograms() {
  console.log('Test 2: Histogram collection');

  metricsCollector.reset();

  // Observe some values
  metricsCollector.observe('test.duration', 0.5, { tier: 'tier1' });
  metricsCollector.observe('test.duration', 1.2, { tier: 'tier1' });
  metricsCollector.observe('test.duration', 2.8, { tier: 'tier1' });
  metricsCollector.observe('test.duration', 5.5, { tier: 'tier1' });

  const histogram = metricsCollector.getHistogram('test.duration', { tier: 'tier1' });

  assert(histogram !== null, 'Histogram should exist');
  assert(histogram!.count === 4, `Expected count=4, got ${histogram!.count}`);
  assert(
    Math.abs(histogram!.sum - 10.0) < 0.01,
    `Expected sum=10.0, got ${histogram!.sum}`
  );

  console.log('✅ Histogram collection works\n');
}

async function testBufferAndFlush() {
  console.log('Test 3: Buffer and flush');

  metricsCollector.reset();

  // Add some metrics
  for (let i = 0; i < 50; i++) {
    metricsCollector.increment('test.flush', { batch: '1' });
  }

  const bufferSize = metricsCollector.getBufferSize();
  assert(bufferSize === 50, `Expected buffer size=50, got ${bufferSize}`);

  // Flush
  const flushed = metricsCollector.flush();
  assert(flushed.length === 50, `Expected 50 flushed metrics, got ${flushed.length}`);
  assert(metricsCollector.getBufferSize() === 0, 'Buffer should be empty after flush');

  console.log('✅ Buffer and flush works\n');
}

async function testQualityMetrics() {
  console.log('Test 4: Quality-specific metrics');

  metricsCollector.reset();

  // Record validation metrics
  metricsCollector.recordValidation({
    tier: 'tier1',
    status: 'success',
    duration: 1500,
    errorCount: 0,
    warningCount: 2,
    value: 1,
    labels: {},
    timestamp: Date.now(),
  });

  metricsCollector.recordValidation({
    tier: 'tier1',
    status: 'failure',
    duration: 800,
    errorCount: 3,
    warningCount: 1,
    value: 1,
    labels: {},
    timestamp: Date.now(),
  });

  // Check counters
  const totalRuns = metricsCollector.getCounter('validation.runs', { tier: 'tier1' });
  const successRuns = metricsCollector.getCounter('validation.success', { tier: 'tier1' });

  assert(totalRuns === 2, `Expected 2 total runs, got ${totalRuns}`);
  assert(successRuns === 1, `Expected 1 success, got ${successRuns}`);

  console.log('✅ Quality metrics work\n');
}

async function testStorage() {
  console.log('Test 5: Storage and querying');

  // Write some metrics to storage
  const metrics = [
    {
      value: 1,
      labels: { tier: 'tier1', status: 'success' },
      timestamp: Date.now() - 60000,
    },
    {
      value: 1,
      labels: { tier: 'tier1', status: 'success' },
      timestamp: Date.now() - 30000,
    },
    {
      value: 1,
      labels: { tier: 'tier1', status: 'failure' },
      timestamp: Date.now() - 15000,
    },
  ];

  await metricsStorage.write(metrics);

  // Query back
  const timeRange = {
    start: Date.now() - 120000,
    end: Date.now(),
  };

  const series = await metricsStorage.query({
    metric: 'metric',
    timeRange,
    labels: { tier: 'tier1' },
  });

  assert(series.length > 0, 'Should have time series data');
  assert(series[0].points.length === 3, `Expected 3 points, got ${series[0].points.length}`);

  // Test stats
  const stats = await metricsStorage.stats('metric', timeRange, { tier: 'tier1' });
  assert(stats.count === 3, `Expected count=3, got ${stats.count}`);
  assert(stats.sum === 3, `Expected sum=3, got ${stats.sum}`);

  console.log('✅ Storage and querying works\n');
}

async function testAggregations() {
  console.log('Test 6: Aggregations');

  // Write test data for aggregations
  const now = Date.now();
  const testMetrics = [];

  // Create validation metrics: 8 success, 2 failures
  for (let i = 0; i < 10; i++) {
    const isSuccess = i < 8;
    testMetrics.push({
      value: 1,
      labels: {
        metric: 'mobigen.validation.runs',
        tier: 'tier1',
        status: isSuccess ? 'success' : 'failure',
      },
      timestamp: now - (10 - i) * 1000,
    });

    if (isSuccess) {
      testMetrics.push({
        value: 1,
        labels: {
          metric: 'mobigen.validation.success',
          tier: 'tier1',
        },
        timestamp: now - (10 - i) * 1000,
      });
    } else {
      testMetrics.push({
        value: 1,
        labels: {
          metric: 'mobigen.validation.failure',
          tier: 'tier1',
        },
        timestamp: now - (10 - i) * 1000,
      });
    }
  }

  await metricsStorage.write(testMetrics);

  const timeRange = { start: now - 60000, end: now };
  const successRate = await metricsAggregator.getSuccessRate(timeRange, 'tier1');

  assert(
    Math.abs(successRate - 80.0) < 1.0,
    `Expected ~80% success rate, got ${successRate.toFixed(2)}%`
  );

  console.log('✅ Aggregations work\n');
}

async function testStorageSize() {
  console.log('Test 7: Storage size tracking');

  const size = metricsStorage.getSize();
  console.log(`  Storage: ${size.metrics} metrics, ${size.dataPoints} data points`);

  assert(size.metrics > 0, 'Should have metrics stored');
  assert(size.dataPoints > 0, 'Should have data points stored');

  console.log('✅ Storage size tracking works\n');
}

async function runAllTests() {
  console.log('🧪 Running Metrics System Integration Tests\n');
  console.log('='.repeat(60));
  console.log();

  try {
    await testBasicCollection();
    await testHistograms();
    await testBufferAndFlush();
    await testQualityMetrics();
    await testStorage();
    await testAggregations();
    await testStorageSize();

    console.log('='.repeat(60));
    console.log('✅ All tests passed!\n');

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run tests if executed directly
const isMainModule =
  typeof process !== 'undefined' &&
  'argv' in process &&
  import.meta.url === `file://${(process as NodeJS.Process).argv[1]}`;

if (isMainModule) {
  runAllTests()
    .then((success) => {
      if (!success && typeof process !== 'undefined' && 'exit' in process) {
        (process as NodeJS.Process).exit(1);
      }
    })
    .catch(console.error);
}

export { runAllTests };
