import express from 'express';
import cron from 'node-cron';
import Redis from 'ioredis';
import { UsageTracker } from './usage-tracker';
import { CostMonitor } from './cost-monitor';
import { MetricsAggregator } from './metrics-aggregator';

const app = express();
app.use(express.json());

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Services
const usageTracker = new UsageTracker(redis);
const costMonitor = new CostMonitor(redis);
const metricsAggregator = new MetricsAggregator(redis);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics' });
});

// Track event
app.post('/events', async (req, res) => {
  try {
    const { event, userId, projectId, metadata } = req.body;

    await usageTracker.trackEvent({
      event,
      userId,
      projectId,
      metadata,
      timestamp: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Track API usage (tokens, requests)
app.post('/usage/api', async (req, res) => {
  try {
    const { userId, projectId, model, inputTokens, outputTokens, requestId } = req.body;

    await usageTracker.trackAPIUsage({
      userId,
      projectId,
      model,
      inputTokens,
      outputTokens,
      requestId,
      timestamp: new Date(),
    });

    // Calculate and track cost
    await costMonitor.trackCost({
      userId,
      projectId,
      model,
      inputTokens,
      outputTokens,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get user usage stats
app.get('/usage/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query;

    const stats = await usageTracker.getUserStats(
      userId,
      (period as string) || 'month'
    );

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get project usage stats
app.get('/usage/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { period } = req.query;

    const stats = await usageTracker.getProjectStats(
      projectId,
      (period as string) || 'month'
    );

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get cost breakdown
app.get('/costs/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query;

    const costs = await costMonitor.getUserCosts(
      userId,
      (period as string) || 'month'
    );

    res.json(costs);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get cost breakdown by project
app.get('/costs/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { period } = req.query;

    const costs = await costMonitor.getProjectCosts(
      projectId,
      (period as string) || 'month'
    );

    res.json(costs);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get aggregated metrics (for dashboard)
app.get('/metrics/dashboard', async (req, res) => {
  try {
    const metrics = await metricsAggregator.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get metrics for a specific time range
app.get('/metrics/range', async (req, res) => {
  try {
    const { start, end, granularity } = req.query;

    const metrics = await metricsAggregator.getMetricsRange({
      start: new Date(start as string),
      end: new Date(end as string),
      granularity: (granularity as string) || 'day',
    });

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Scheduled jobs
// Aggregate hourly metrics every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running hourly metrics aggregation...');
  await metricsAggregator.aggregateHourly();
});

// Aggregate daily metrics at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily metrics aggregation...');
  await metricsAggregator.aggregateDaily();
});

// Generate usage reports weekly
cron.schedule('0 0 * * 0', async () => {
  console.log('Generating weekly usage reports...');
  await metricsAggregator.generateWeeklyReports();
});

// Clean up old data monthly
cron.schedule('0 0 1 * *', async () => {
  console.log('Cleaning up old analytics data...');
  await metricsAggregator.cleanupOldData(90); // Keep 90 days
});

const PORT = process.env.PORT || 7001;

app.listen(PORT, () => {
  console.log(`Analytics service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down analytics service...');
  await redis.quit();
  process.exit(0);
});
