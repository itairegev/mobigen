import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { BuildRequest, BuildStatus } from './types';

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Build job data
export interface BuildJobData extends BuildRequest {
  buildId: string;
}

// Build queue
export const buildQueue = new Queue<BuildJobData>('builds', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 3600, // 7 days
    },
  },
});

// Queue events for monitoring
export const buildQueueEvents = new QueueEvents('builds', { connection });

// Add a build job to the queue
export async function enqueueBuild(
  buildId: string,
  request: BuildRequest
): Promise<Job<BuildJobData>> {
  const job = await buildQueue.add(
    'build',
    {
      buildId,
      ...request,
    },
    {
      jobId: buildId,
      priority: request.profile === 'production' ? 1 : 2,
    }
  );

  return job;
}

// Get job status
export async function getBuildJobStatus(
  buildId: string
): Promise<{ state: string; progress?: number; data?: any } | null> {
  const job = await buildQueue.getJob(buildId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    state,
    progress: typeof progress === 'number' ? progress : undefined,
    data: job.data,
  };
}

// Cancel a build job
export async function cancelBuildJob(buildId: string): Promise<boolean> {
  const job = await buildQueue.getJob(buildId);

  if (!job) {
    return false;
  }

  await job.remove();
  return true;
}

// Get queue metrics
export async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    buildQueue.getWaitingCount(),
    buildQueue.getActiveCount(),
    buildQueue.getCompletedCount(),
    buildQueue.getFailedCount(),
    buildQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

// Worker process function type
export type BuildProcessor = (job: Job<BuildJobData>) => Promise<void>;

// Create a worker for processing build jobs
export function createBuildWorker(
  processor: BuildProcessor,
  concurrency: number = 3
): Worker<BuildJobData> {
  const worker = new Worker<BuildJobData>(
    'builds',
    async (job: Job<BuildJobData>) => {
      console.log(`Processing build job ${job.id} for project ${job.data.projectId}`);

      try {
        await processor(job);
        console.log(`Build job ${job.id} completed successfully`);
      } catch (error: any) {
        console.error(`Build job ${job.id} failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency,
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000, // per minute
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  return worker;
}

// Graceful shutdown
export async function closeQueue(): Promise<void> {
  await buildQueue.close();
  await connection.quit();
}

// Event listeners for monitoring
buildQueueEvents.on('completed', ({ jobId }) => {
  console.log(`Build job ${jobId} completed event received`);
});

buildQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.log(`Build job ${jobId} failed: ${failedReason}`);
});

buildQueueEvents.on('progress', ({ jobId, data }) => {
  console.log(`Build job ${jobId} progress:`, data);
});

// Clean up old jobs periodically
export async function cleanOldJobs(): Promise<void> {
  const gracePeriod = 7 * 24 * 3600 * 1000; // 7 days
  await buildQueue.clean(gracePeriod, 1000, 'completed');
  await buildQueue.clean(gracePeriod * 2, 1000, 'failed'); // Keep failed jobs longer
}

// Schedule periodic cleanup
setInterval(
  () => {
    cleanOldJobs().catch((err) => console.error('Failed to clean old jobs:', err));
  },
  24 * 3600 * 1000 // Run daily
);
