import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { TestService } from './test-service.js';
import { ScreenshotService } from './screenshot-service.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// Redis connection for general use
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Redis connection for BullMQ workers (requires maxRetriesPerRequest: null)
const workerRedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Services
const testService = new TestService();
const screenshotService = new ScreenshotService();

// Test Queue
const testQueue = new Queue('device-tests', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// WebSocket connections for real-time updates
const clients = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const projectId = url.searchParams.get('projectId');

  if (projectId) {
    if (!clients.has(projectId)) {
      clients.set(projectId, new Set());
    }
    clients.get(projectId)!.add(ws as any);

    ws.on('close', () => {
      clients.get(projectId)?.delete(ws as any);
    });
  }
});

function broadcastToProject(projectId: string, message: object) {
  const projectClients = clients.get(projectId);
  if (projectClients) {
    const data = JSON.stringify(message);
    projectClients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(data);
      }
    });
  }
}

// Test Worker
const testWorker = new Worker(
  'device-tests',
  async (job) => {
    const { projectId, buildId, platform, testConfig } = job.data;

    broadcastToProject(projectId, {
      type: 'test:started',
      buildId,
      platform,
    });

    try {
      // Run device tests
      const results = await testService.runTests({
        buildId,
        platform,
        testConfig,
        onProgress: (progress) => {
          broadcastToProject(projectId, {
            type: 'test:progress',
            buildId,
            ...progress,
          });
        },
      });

      // Capture screenshots
      const screenshots = await screenshotService.captureScreenshots({
        buildId,
        platform,
        screens: testConfig.screens || [],
      });

      // Run visual regression
      const visualResults = await screenshotService.compareScreenshots({
        buildId,
        baselineId: testConfig.baselineId,
        screenshots,
      });

      broadcastToProject(projectId, {
        type: 'test:completed',
        buildId,
        results,
        screenshots,
        visualResults,
      });

      return { results, screenshots, visualResults };
    } catch (error) {
      broadcastToProject(projectId, {
        type: 'test:failed',
        buildId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
  { connection: workerRedis }
);

testWorker.on('failed', (job, err) => {
  console.error(`Test job ${job?.id} failed:`, err);
});

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'tester' });
});

// Queue a test run
app.post('/tests', async (req, res) => {
  try {
    const { projectId, buildId, platform, testConfig } = req.body;

    const job = await testQueue.add('run-tests', {
      projectId,
      buildId,
      platform,
      testConfig,
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Test queued successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get test status
app.get('/tests/:jobId', async (req, res) => {
  try {
    const job = await testQueue.getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: 'Test job not found' });
    }

    const state = await job.getState();
    const progress = job.progress;

    res.json({
      id: job.id,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get test results for a build
app.get('/tests/build/:buildId', async (req, res) => {
  try {
    const results = await testService.getTestResults(req.params.buildId);
    res.json(results);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get screenshots for a build
app.get('/screenshots/:buildId', async (req, res) => {
  try {
    const screenshots = await screenshotService.getScreenshots(req.params.buildId);
    res.json(screenshots);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Compare screenshots
app.post('/screenshots/compare', async (req, res) => {
  try {
    const { buildId, baselineId, threshold } = req.body;

    const results = await screenshotService.compareBuilds({
      buildId,
      baselineId,
      threshold: threshold || 0.1,
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Set baseline screenshots
app.post('/screenshots/:buildId/baseline', async (req, res) => {
  try {
    await screenshotService.setBaseline(req.params.buildId);
    res.json({ success: true, message: 'Baseline set successfully' });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const PORT = process.env.PORT || 6000;

server.listen(PORT, () => {
  console.log(`Tester service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down tester service...');
  await testWorker.close();
  await testQueue.close();
  await redis.quit();
  await workerRedis.quit();
  server.close();
  process.exit(0);
});
