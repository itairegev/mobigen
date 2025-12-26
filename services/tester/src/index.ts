import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { TestService } from './test-service';
import { ScreenshotService } from './screenshot-service';
import { DeviceCloudService, DEFAULT_DEVICE_MATRIX } from './device-cloud-service';
import { createMaestroGenerator } from './maestro-generator';
import type { DeviceProvider, DeviceTestConfig } from '@mobigen/ai';

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
const deviceCloudService = new DeviceCloudService();

// Register cloud providers from environment
if (process.env.AWS_DEVICE_FARM_PROJECT_ARN) {
  deviceCloudService.registerProvider({
    provider: 'aws-device-farm',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-west-2',
      projectArn: process.env.AWS_DEVICE_FARM_PROJECT_ARN,
    },
  });
}

if (process.env.BROWSERSTACK_USERNAME && process.env.BROWSERSTACK_ACCESS_KEY) {
  deviceCloudService.registerProvider({
    provider: 'browserstack',
    credentials: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
    },
  });
}

if (process.env.MAESTRO_CLOUD_API_KEY) {
  deviceCloudService.registerProvider({
    provider: 'maestro-cloud',
    credentials: {
      apiKey: process.env.MAESTRO_CLOUD_API_KEY,
    },
  });
}

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_SERVICE_ACCOUNT) {
  deviceCloudService.registerProvider({
    provider: 'firebase-test-lab',
    credentials: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT,
    },
  });
}

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

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE CLOUD TESTING ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Get available cloud providers
app.get('/device-cloud/providers', (req, res) => {
  res.json({
    available: ['aws-device-farm', 'browserstack', 'maestro-cloud', 'firebase-test-lab', 'local'],
    configured: [
      ...(process.env.AWS_DEVICE_FARM_PROJECT_ARN ? ['aws-device-farm'] : []),
      ...(process.env.BROWSERSTACK_USERNAME ? ['browserstack'] : []),
      ...(process.env.MAESTRO_CLOUD_API_KEY ? ['maestro-cloud'] : []),
      ...(process.env.FIREBASE_PROJECT_ID ? ['firebase-test-lab'] : []),
      'local',
    ],
  });
});

// Get available device matrices
app.get('/device-cloud/devices', async (req, res) => {
  try {
    const { tier = 'standard', platforms } = req.query;

    const devices = deviceCloudService.getRecommendedDevices({
      tier: tier as 'minimal' | 'standard' | 'comprehensive',
      platforms: platforms ? (platforms as string).split(',') as ('ios' | 'android')[] : undefined,
    });

    res.json({
      tier,
      devices,
      matrices: {
        minimal: DEFAULT_DEVICE_MATRIX.minimal.length,
        standard: DEFAULT_DEVICE_MATRIX.standard.length,
        comprehensive: DEFAULT_DEVICE_MATRIX.comprehensive.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start device cloud test session
app.post('/device-cloud/sessions', async (req, res) => {
  try {
    const { projectId, buildId, appPath, testPath, config } = req.body;

    // Start test session
    const session = await deviceCloudService.startTestSession({
      projectId,
      buildId,
      appPath,
      testPath,
      config,
      onProgress: (session) => {
        broadcastToProject(projectId, {
          type: 'device-test:progress',
          session,
        });
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      status: session.status,
      summary: session.summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get device cloud session status
app.get('/device-cloud/sessions/:sessionId', async (req, res) => {
  try {
    const session = deviceCloudService.getSession(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Cancel device cloud session
app.delete('/device-cloud/sessions/:sessionId', async (req, res) => {
  try {
    await deviceCloudService.cancelSession(req.params.sessionId);
    res.json({ success: true, message: 'Session cancelled' });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MAESTRO TEST GENERATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Generate Maestro tests for a project
app.post('/maestro/generate', async (req, res) => {
  try {
    const { projectPath, bundleId, appStructure } = req.body;

    const generator = createMaestroGenerator(projectPath, bundleId);
    const testSuite = await generator.generateTestSuite(appStructure);

    res.json({
      success: true,
      testSuite,
      filesCreated: testSuite.tests.map((t: { file: string }) => t.file).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
      coverage: testSuite.coverage,
      missingTestIds: testSuite.missingTestIds.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get Maestro test templates for a specific app template
app.get('/maestro/templates/:templateType', (req, res) => {
  const { templateType } = req.params;

  // Return critical paths for the template
  const criticalPaths: Record<string, object[]> = {
    ecommerce: [
      { name: 'Browse and Purchase', priority: 'critical' },
      { name: 'Search and Filter', priority: 'high' },
      { name: 'Cart Management', priority: 'high' },
      { name: 'User Authentication', priority: 'critical' },
    ],
    loyalty: [
      { name: 'View Points and Rewards', priority: 'critical' },
      { name: 'Scan and Earn', priority: 'critical' },
      { name: 'Redeem Reward', priority: 'high' },
    ],
    news: [
      { name: 'Browse and Read Articles', priority: 'critical' },
      { name: 'Save and Bookmark', priority: 'high' },
      { name: 'Search and Filter', priority: 'medium' },
    ],
    'ai-assistant': [
      { name: 'Chat Interaction', priority: 'critical' },
      { name: 'View Chat History', priority: 'high' },
      { name: 'Settings Management', priority: 'medium' },
    ],
  };

  res.json({
    template: templateType,
    criticalPaths: criticalPaths[templateType] || criticalPaths['ecommerce'],
    testTypes: ['navigation', 'critical-path', 'form', 'smoke'],
  });
});

// Run Maestro tests locally
app.post('/maestro/run', async (req, res) => {
  try {
    const { projectPath, flowPath, platform } = req.body;

    // This would execute: maestro test <flowPath>
    // For now, queue the test job
    const job = await testQueue.add('maestro-test', {
      type: 'maestro',
      projectPath,
      flowPath,
      platform,
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Maestro test queued',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Run Maestro tests in cloud
app.post('/maestro/cloud', async (req, res) => {
  try {
    const { projectId, buildId, appPath, flowsPath, devices } = req.body;

    // Use Maestro Cloud provider
    const session = await deviceCloudService.startTestSession({
      projectId,
      buildId,
      appPath,
      testPath: flowsPath,
      config: {
        provider: 'maestro-cloud',
        platforms: ['ios', 'android'],
        devices: devices || DEFAULT_DEVICE_MATRIX.minimal,
        parallel: true,
        timeout: 600000,
        retries: 2,
      },
      onProgress: (session) => {
        broadcastToProject(projectId, {
          type: 'maestro-cloud:progress',
          session,
        });
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      status: session.status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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
