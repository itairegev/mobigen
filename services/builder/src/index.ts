import dotenv from 'dotenv';
import { startServer, createAPI } from './api';
import { createBuildWorker, BuildProcessor } from './queue';
import { getBuildService } from './build-service';
import { getStatusPoller } from './status-poller';
import { registerWebhookRoutes } from './webhooks';

// Load environment variables
dotenv.config();

// Configuration
const PORT = parseInt(process.env.PORT || '5000', 10);
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '3', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('Starting Mobigen Builder Service...');
console.log(`Environment: ${NODE_ENV}`);
console.log(`Port: ${PORT}`);
console.log(`Worker Concurrency: ${WORKER_CONCURRENCY}`);

// Build processor function
const processBuild: BuildProcessor = async (job) => {
  const { buildId, projectId, platform, version, profile } = job.data;

  console.log(`Processing build job ${buildId}`);

  try {
    // Update job progress
    await job.updateProgress(10);

    // Process the build
    const buildService = getBuildService();
    await buildService.processBuild(buildId, {
      projectId,
      platform,
      version,
      profile,
    });

    await job.updateProgress(50);

    // Start polling for build status
    const buildStatus = await buildService.getBuildStatus(buildId);

    if (buildStatus?.easBuildId) {
      const poller = getStatusPoller();
      await poller.startPolling(buildId, buildStatus.easBuildId);
    }

    await job.updateProgress(100);

    console.log(`Build job ${buildId} processed successfully`);
  } catch (error: any) {
    console.error(`Build job ${buildId} failed:`, error);
    throw error;
  }
};

// Initialize services
async function initialize() {
  try {
    // Create API and register webhook routes
    const app = createAPI();
    registerWebhookRoutes(app);

    // Start server
    app.listen(PORT, () => {
      console.log(`Builder API listening on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Webhooks: http://localhost:${PORT}/webhooks/eas`);
    });

    // Create build worker
    const worker = createBuildWorker(processBuild, WORKER_CONCURRENCY);

    console.log('Builder service initialized successfully');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);

      try {
        // Stop accepting new requests
        console.log('Closing API server...');

        // Close worker
        console.log('Closing build worker...');
        await worker.close();

        // Stop all active polling
        console.log('Stopping status polling...');
        const poller = getStatusPoller();
        poller.stopAll();

        console.log('Shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  } catch (error) {
    console.error('Failed to initialize builder service:', error);
    process.exit(1);
  }
}

// Start the service
initialize();

// Export for testing
export { initialize, processBuild };
