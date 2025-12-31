# Sprint 4: Scaling & Resilience

**Duration:** 5 days
**Goal:** Enable horizontal scaling and improve system resilience
**Depends on:** Sprint 1, 2, 3 completion

---

## Task 4.1: Move Generation to Queue

**Priority:** P0 - Critical
**Estimate:** 6 hours
**Assignee:** Developer

### Description
Move generation from synchronous request handling to queue-based async processing.

### Files to Create
- `services/generator/src/queue/generation-queue.ts`
- `services/generator/src/queue/generation-worker.ts`
- `services/generator/src/queue/types.ts`

### Files to Modify
- `services/generator/src/api.ts`
- `services/generator/src/index.ts`

### Implementation

#### queue/types.ts
```typescript
export interface GenerationJobData {
  jobId: string;
  projectId: string;
  prompt: string;
  config: Record<string, unknown>;
  userId: string;
  priority: 'low' | 'normal' | 'high';
}

export interface GenerationJobResult {
  success: boolean;
  filesModified: string[];
  errors: Array<{ code: string; message: string }>;
  duration: number;
}
```

#### queue/generation-queue.ts
```typescript
import { Queue, QueueEvents, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { GenerationJobData, GenerationJobResult } from './types';

const QUEUE_NAME = 'generation';

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Create queue
export const generationQueue = new Queue<GenerationJobData, GenerationJobResult>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 5000,
      age: 7 * 24 * 3600, // Keep failed for 7 days
    },
  },
});

// Queue events for monitoring
export const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redis });

/**
 * Add a generation job to the queue
 */
export async function enqueueGeneration(
  data: GenerationJobData,
  options?: {
    priority?: number;
    delay?: number;
  }
): Promise<Job<GenerationJobData, GenerationJobResult>> {
  const job = await generationQueue.add('generate', data, {
    priority: getPriorityValue(data.priority),
    delay: options?.delay,
    jobId: data.jobId,
  });

  console.log(`[queue] Enqueued generation job ${job.id}`);
  return job;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<{
  state: string;
  progress: number;
  result?: GenerationJobResult;
  failedReason?: string;
} | null> {
  const job = await generationQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress as number || 0;

  return {
    state,
    progress,
    result: job.returnvalue as GenerationJobResult | undefined,
    failedReason: job.failedReason,
  };
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const job = await generationQueue.getJob(jobId);
  if (!job) return false;

  const state = await job.getState();
  if (state === 'waiting' || state === 'delayed') {
    await job.remove();
    return true;
  }

  // Can't cancel active jobs directly, but we can mark for cancellation
  await job.updateData({ ...job.data, cancelled: true });
  return true;
}

function getPriorityValue(priority: 'low' | 'normal' | 'high'): number {
  const priorities = { low: 10, normal: 5, high: 1 };
  return priorities[priority] || 5;
}

// Graceful shutdown
export async function closeQueue(): Promise<void> {
  await generationQueue.close();
  await queueEvents.close();
  await redis.quit();
}
```

#### queue/generation-worker.ts
```typescript
import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { GenerationJobData, GenerationJobResult } from './types';
import { runPipeline } from '../pipeline-executor';
import { emitProgress } from '../api';
import { TaskTracker } from '../task-tracker';

const QUEUE_NAME = 'generation';

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

let worker: Worker<GenerationJobData, GenerationJobResult> | null = null;

/**
 * Start the generation worker
 */
export function startWorker(concurrency: number = 2): Worker<GenerationJobData, GenerationJobResult> {
  worker = new Worker<GenerationJobData, GenerationJobResult>(
    QUEUE_NAME,
    async (job: Job<GenerationJobData, GenerationJobResult>) => {
      const { jobId, projectId, prompt, config } = job.data;

      console.log(`[worker] Processing job ${jobId} for project ${projectId}`);

      // Check if cancelled
      if ((job.data as any).cancelled) {
        throw new Error('Job was cancelled');
      }

      try {
        // Update progress
        await job.updateProgress(5);
        await emitProgress(projectId, 'generation:started', { jobId });

        // Get project path
        const projectPath = await getProjectPath(projectId);
        const mobigenRoot = process.env.MOBIGEN_ROOT || process.cwd();

        // Run pipeline
        const result = await runPipeline(
          projectId,
          projectPath,
          { ...config, prompt },
          mobigenRoot,
          undefined,
          {
            onProgress: async (progress: number) => {
              await job.updateProgress(progress);
            },
          }
        );

        await job.updateProgress(100);

        await emitProgress(projectId, 'generation:complete', {
          jobId,
          success: result.success,
          filesModified: result.filesModified.length,
        });

        return {
          success: result.success,
          filesModified: result.filesModified,
          errors: result.errors,
          duration: Date.now() - job.timestamp,
        };

      } catch (error: any) {
        console.error(`[worker] Job ${jobId} failed:`, error);

        await emitProgress(projectId, 'generation:failed', {
          jobId,
          error: error.message,
        });

        throw error;
      }
    },
    {
      connection: redis,
      concurrency,
      limiter: {
        max: 10,
        duration: 60000, // Max 10 jobs per minute
      },
    }
  );

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`[worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[worker] Job ${job?.id} failed:`, error.message);
  });

  worker.on('progress', (job, progress) => {
    console.log(`[worker] Job ${job.id} progress: ${progress}%`);
  });

  console.log(`[worker] Generation worker started with concurrency ${concurrency}`);
  return worker;
}

/**
 * Stop the worker
 */
export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await redis.quit();
}

async function getProjectPath(projectId: string): Promise<string> {
  const projectsRoot = process.env.PROJECTS_ROOT || './projects';
  return `${projectsRoot}/${projectId}`;
}
```

#### Update api.ts
```typescript
import { enqueueGeneration, getJobStatus, cancelJob } from './queue/generation-queue';

// Replace synchronous generation with queue
app.post('/api/generate', async (req, res) => {
  const { projectId, prompt, config, priority = 'normal' } = req.body;

  if (!projectId || !prompt) {
    return res.status(400).json({
      success: false,
      error: 'projectId and prompt are required',
    });
  }

  try {
    // Create job ID
    const jobId = `gen-${projectId}-${Date.now()}`;

    // Enqueue generation
    await enqueueGeneration({
      jobId,
      projectId,
      prompt,
      config,
      userId: req.user?.id || 'anonymous',
      priority,
    });

    res.json({
      success: true,
      jobId,
      message: 'Generation queued',
      status: 'queued',
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get generation status
app.get('/api/generate/:jobId/status', async (req, res) => {
  const { jobId } = req.params;

  const status = await getJobStatus(jobId);
  if (!status) {
    return res.status(404).json({
      success: false,
      error: 'Job not found',
    });
  }

  res.json({
    success: true,
    ...status,
  });
});

// Cancel generation
app.post('/api/generate/:jobId/cancel', async (req, res) => {
  const { jobId } = req.params;

  const cancelled = await cancelJob(jobId);
  res.json({
    success: cancelled,
    message: cancelled ? 'Job cancelled' : 'Could not cancel job',
  });
});
```

### Acceptance Criteria
- [ ] Generation jobs go through queue
- [ ] Worker processes jobs with concurrency
- [ ] Job status is trackable
- [ ] Jobs can be cancelled
- [ ] Progress updates via WebSocket work

### Tests Required
```typescript
// tests/queue/generation-queue.test.ts
describe('Generation Queue', () => {
  it('should enqueue generation job', async () => {
    const job = await enqueueGeneration({
      jobId: 'test-job',
      projectId: 'test-project',
      prompt: 'Test prompt',
      config: {},
      userId: 'test-user',
      priority: 'normal',
    });

    expect(job.id).toBe('test-job');
    expect(await job.getState()).toBe('waiting');
  });

  it('should process job through worker', async () => {
    // Start worker
    const worker = startWorker(1);

    // Enqueue job
    const job = await enqueueGeneration({...});

    // Wait for completion
    await job.waitUntilFinished(queueEvents, 60000);

    const status = await getJobStatus(job.id!);
    expect(status?.state).toBe('completed');

    await worker.close();
  });
});
```

### Build Verification
```bash
cd services/generator && npm run build && npm test
```

---

## Task 4.2: Add Circuit Breakers

**Priority:** P0 - Critical
**Estimate:** 4 hours
**Assignee:** Developer

### Description
Add circuit breakers to protect against cascading failures from external services.

### Files to Create
- `packages/resilience/src/circuit-breaker.ts`
- `packages/resilience/src/index.ts`
- `packages/resilience/package.json`

### Implementation

#### packages/resilience/package.json
```json
{
  "name": "@mobigen/resilience",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "opossum": "^8.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

#### packages/resilience/src/circuit-breaker.ts
```typescript
import CircuitBreaker from 'opossum';

export interface CircuitBreakerOptions {
  name: string;
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

const DEFAULT_OPTIONS = {
  timeout: 30000, // 30 seconds
  errorThresholdPercentage: 50, // Open circuit when 50% fail
  resetTimeout: 30000, // Try again after 30 seconds
  volumeThreshold: 5, // Minimum calls before opening
};

// Store all breakers for monitoring
const breakers = new Map<string, CircuitBreaker>();

/**
 * Create a circuit breaker for a function
 */
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CircuitBreakerOptions
): CircuitBreaker {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const breaker = new CircuitBreaker(fn, {
    timeout: opts.timeout,
    errorThresholdPercentage: opts.errorThresholdPercentage,
    resetTimeout: opts.resetTimeout,
    volumeThreshold: opts.volumeThreshold,
    name: opts.name,
  });

  // Event handlers
  breaker.on('success', (result) => {
    console.log(`[circuit:${opts.name}] Success`);
  });

  breaker.on('timeout', () => {
    console.warn(`[circuit:${opts.name}] Timeout`);
  });

  breaker.on('reject', () => {
    console.warn(`[circuit:${opts.name}] Rejected (circuit open)`);
  });

  breaker.on('open', () => {
    console.error(`[circuit:${opts.name}] Circuit OPENED`);
  });

  breaker.on('halfOpen', () => {
    console.info(`[circuit:${opts.name}] Circuit half-open, testing...`);
  });

  breaker.on('close', () => {
    console.info(`[circuit:${opts.name}] Circuit CLOSED`);
  });

  breaker.on('fallback', (result) => {
    console.info(`[circuit:${opts.name}] Fallback executed`);
  });

  breakers.set(opts.name, breaker);
  return breaker;
}

/**
 * Get circuit breaker stats
 */
export function getCircuitBreakerStats(): Record<string, {
  state: string;
  stats: {
    successes: number;
    failures: number;
    timeouts: number;
    cacheHits: number;
    cacheSize: number;
  };
}> {
  const stats: Record<string, any> = {};

  for (const [name, breaker] of breakers) {
    stats[name] = {
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: breaker.stats,
    };
  }

  return stats;
}

/**
 * Pre-configured breakers for common services
 */
export const ClaudeAPIBreaker = {
  create: (fn: Function) => createCircuitBreaker(fn as any, {
    name: 'claude-api',
    timeout: 120000, // 2 minutes for AI calls
    errorThresholdPercentage: 30,
    resetTimeout: 60000,
    volumeThreshold: 3,
  }),
};

export const EASAPIBreaker = {
  create: (fn: Function) => createCircuitBreaker(fn as any, {
    name: 'eas-api',
    timeout: 30000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  }),
};

export const S3Breaker = {
  create: (fn: Function) => createCircuitBreaker(fn as any, {
    name: 's3',
    timeout: 30000,
    errorThresholdPercentage: 50,
    resetTimeout: 15000,
  }),
};
```

#### packages/resilience/src/index.ts
```typescript
export * from './circuit-breaker';
export * from './retry';
export * from './rate-limiter';
```

### Apply to Generator Service
```typescript
// services/generator/src/ai-orchestrator.ts
import { ClaudeAPIBreaker } from '@mobigen/resilience';
import { query } from '@anthropic-ai/claude-agent-sdk';

// Wrap Claude API calls
const protectedQuery = ClaudeAPIBreaker.create(query);

export async function runAgentQuery(prompt: string, options: any) {
  try {
    return await protectedQuery.fire(prompt, options);
  } catch (error: any) {
    if (error.message === 'Breaker is open') {
      throw new Error('AI service temporarily unavailable, please try again later');
    }
    throw error;
  }
}
```

### Acceptance Criteria
- [ ] Circuit breaker opens after threshold failures
- [ ] Circuit breaker closes after reset timeout
- [ ] Fallback is executed when circuit is open
- [ ] Stats are accessible for monitoring
- [ ] Pre-configured breakers for Claude, EAS, S3

### Tests Required
```typescript
// packages/resilience/tests/circuit-breaker.test.ts
describe('CircuitBreaker', () => {
  it('should open after error threshold', async () => {
    let callCount = 0;
    const failingFn = async () => {
      callCount++;
      throw new Error('Service unavailable');
    };

    const breaker = createCircuitBreaker(failingFn, {
      name: 'test',
      volumeThreshold: 3,
      errorThresholdPercentage: 50,
    });

    // Make failing calls
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.fire();
      } catch {}
    }

    // Circuit should be open
    expect(breaker.opened).toBe(true);

    // Next call should be rejected
    await expect(breaker.fire()).rejects.toThrow('Breaker is open');
  });

  it('should close after reset timeout', async () => {
    const breaker = createCircuitBreaker(async () => 'success', {
      name: 'test-reset',
      resetTimeout: 100,
    });

    // Force open
    breaker.open();
    expect(breaker.opened).toBe(true);

    // Wait for reset
    await new Promise(r => setTimeout(r, 150));

    // Should be half-open and allow test call
    const result = await breaker.fire();
    expect(result).toBe('success');
    expect(breaker.opened).toBe(false);
  });
});
```

### Build Verification
```bash
cd packages/resilience && npm run build && npm test
```

---

## Task 4.3: Implement Retry Logic

**Priority:** P1 - High
**Estimate:** 3 hours
**Assignee:** Developer

### Description
Add configurable retry logic with exponential backoff.

### Files to Create
- `packages/resilience/src/retry.ts`

### Implementation

#### packages/resilience/src/retry.ts
```typescript
export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase?: number;
  jitter?: boolean;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBase: 2,
  jitter: true,
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      if (attempt > opts.maxRetries) {
        throw error;
      }

      if (opts.retryCondition && !opts.retryCondition(error)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, opts);

      // Notify retry handler
      if (opts.onRetry) {
        opts.onRetry(error, attempt);
      }

      console.log(`[retry] Attempt ${attempt} failed, retrying in ${delay}ms...`);

      // Wait before retry
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const base = options.exponentialBase || 2;
  let delay = options.baseDelay * Math.pow(base, attempt - 1);

  // Cap at max delay
  delay = Math.min(delay, options.maxDelay);

  // Add jitter (±25%)
  if (options.jitter) {
    const jitterRange = delay * 0.25;
    delay = delay - jitterRange + Math.random() * jitterRange * 2;
  }

  return Math.round(delay);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const retryableMessages = [
    'timeout',
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'rate limit',
    'too many requests',
    'service unavailable',
    '503',
    '429',
    '500',
  ];

  const message = error.message.toLowerCase();
  return retryableMessages.some(m => message.includes(m.toLowerCase()));
}

/**
 * Decorator for retry
 */
export function Retryable(options: Partial<RetryOptions> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), {
        ...options,
        retryCondition: options.retryCondition || isRetryableError,
      });
    };

    return descriptor;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Usage Example
```typescript
// In generator service
import { withRetry, isRetryableError } from '@mobigen/resilience';

async function callClaudeAPI(prompt: string) {
  return withRetry(
    () => query({ prompt, options: {...} }),
    {
      maxRetries: 3,
      baseDelay: 5000,
      maxDelay: 60000,
      retryCondition: isRetryableError,
      onRetry: (error, attempt) => {
        console.log(`Claude API call failed (attempt ${attempt}): ${error.message}`);
      },
    }
  );
}
```

### Acceptance Criteria
- [ ] Retry with exponential backoff works
- [ ] Jitter prevents thundering herd
- [ ] Retry condition filters non-retryable errors
- [ ] Max retries is respected
- [ ] onRetry callback is called

### Tests Required
```typescript
// packages/resilience/tests/retry.test.ts
describe('withRetry', () => {
  it('should retry on failure', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('timeout');
      return 'success';
    };

    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10 });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should fail after max retries', async () => {
    const fn = async () => {
      throw new Error('always fails');
    };

    await expect(withRetry(fn, { maxRetries: 2, baseDelay: 10 }))
      .rejects.toThrow('always fails');
  });

  it('should not retry non-retryable errors', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new Error('invalid input');
    };

    await expect(withRetry(fn, {
      maxRetries: 3,
      retryCondition: isRetryableError,
    })).rejects.toThrow();

    expect(attempts).toBe(1);
  });
});
```

### Build Verification
```bash
cd packages/resilience && npm run build && npm test
```

---

## Task 4.4: Add Health Checks

**Priority:** P1 - High
**Estimate:** 3 hours
**Assignee:** Developer

### Description
Add comprehensive health checks to all services.

### Files to Create
- `packages/resilience/src/health.ts`

### Files to Modify
- `services/generator/src/api.ts`
- `services/builder/src/api.ts`
- `services/tester/src/index.ts`

### Implementation

#### packages/resilience/src/health.ts
```typescript
export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  critical?: boolean; // If true, service is unhealthy when this fails
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  latency?: number;
  details?: Record<string, unknown>;
}

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: Record<string, HealthCheckResult>;
}

const startTime = Date.now();
const healthChecks: HealthCheck[] = [];

/**
 * Register a health check
 */
export function registerHealthCheck(check: HealthCheck): void {
  healthChecks.push(check);
}

/**
 * Run all health checks
 */
export async function runHealthChecks(): Promise<HealthReport> {
  const results: Record<string, HealthCheckResult> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  await Promise.all(
    healthChecks.map(async (check) => {
      const start = Date.now();
      try {
        const result = await Promise.race([
          check.check(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          ),
        ]);

        results[check.name] = {
          ...result,
          latency: Date.now() - start,
        };

        if (result.status === 'unhealthy' && check.critical) {
          overallStatus = 'unhealthy';
        } else if (result.status === 'degraded' && overallStatus !== 'unhealthy') {
          overallStatus = 'degraded';
        }
      } catch (error: any) {
        results[check.name] = {
          status: check.critical ? 'unhealthy' : 'degraded',
          message: error.message,
          latency: Date.now() - start,
        };

        if (check.critical) {
          overallStatus = 'unhealthy';
        } else if (overallStatus !== 'unhealthy') {
          overallStatus = 'degraded';
        }
      }
    })
  );

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    checks: results,
  };
}

// Common health checks
export const databaseHealthCheck: HealthCheck = {
  name: 'database',
  critical: true,
  check: async () => {
    const { prisma } = await import('@mobigen/db');
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy' };
  },
};

export const redisHealthCheck: HealthCheck = {
  name: 'redis',
  critical: true,
  check: async () => {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    await redis.ping();
    await redis.quit();
    return { status: 'healthy' };
  },
};

export const storageHealthCheck: HealthCheck = {
  name: 'storage',
  critical: false,
  check: async () => {
    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({});
    await s3.send(new HeadBucketCommand({
      Bucket: process.env.S3_BUCKET || 'mobigen-storage',
    }));
    return { status: 'healthy' };
  },
};
```

#### Update services to use health checks
```typescript
// services/generator/src/api.ts
import {
  registerHealthCheck,
  runHealthChecks,
  databaseHealthCheck,
  redisHealthCheck,
} from '@mobigen/resilience';

// Register health checks
registerHealthCheck(databaseHealthCheck);
registerHealthCheck(redisHealthCheck);
registerHealthCheck({
  name: 'generation-queue',
  critical: true,
  check: async () => {
    const { generationQueue } = await import('./queue/generation-queue');
    const isPaused = await generationQueue.isPaused();
    return {
      status: isPaused ? 'degraded' : 'healthy',
      details: {
        paused: isPaused,
        waiting: await generationQueue.getWaitingCount(),
        active: await generationQueue.getActiveCount(),
      },
    };
  },
});

// Health endpoint
app.get('/health', async (req, res) => {
  const report = await runHealthChecks();

  const statusCode = report.status === 'healthy' ? 200 :
                     report.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(report);
});

// Liveness probe (for k8s)
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe (for k8s)
app.get('/health/ready', async (req, res) => {
  const report = await runHealthChecks();
  const ready = report.status !== 'unhealthy';

  res.status(ready ? 200 : 503).json({
    ready,
    checks: report.checks,
  });
});
```

### Acceptance Criteria
- [ ] /health returns overall status
- [ ] /health/live returns alive status
- [ ] /health/ready returns readiness
- [ ] Database health check works
- [ ] Redis health check works
- [ ] Storage health check works

### Tests Required
```typescript
// packages/resilience/tests/health.test.ts
describe('Health Checks', () => {
  it('should report healthy when all checks pass', async () => {
    registerHealthCheck({
      name: 'test',
      check: async () => ({ status: 'healthy' }),
    });

    const report = await runHealthChecks();
    expect(report.status).toBe('healthy');
  });

  it('should report unhealthy when critical check fails', async () => {
    registerHealthCheck({
      name: 'critical-test',
      critical: true,
      check: async () => ({ status: 'unhealthy' }),
    });

    const report = await runHealthChecks();
    expect(report.status).toBe('unhealthy');
  });
});
```

### Build Verification
```bash
cd packages/resilience && npm run build && npm test
```

---

## Task 4.5: Add Metrics

**Priority:** P2 - Medium
**Estimate:** 4 hours
**Assignee:** Developer

### Description
Add application metrics for monitoring.

### Files to Create
- `packages/observability/src/metrics.ts`
- `packages/observability/src/index.ts`
- `packages/observability/package.json`

### Implementation

#### packages/observability/src/metrics.ts
```typescript
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create registry
export const registry = new Registry();

// Collect default metrics
collectDefaultMetrics({ register: registry });

// Generation metrics
export const generationDuration = new Histogram({
  name: 'mobigen_generation_duration_seconds',
  help: 'Duration of app generation in seconds',
  labelNames: ['template', 'status'],
  buckets: [30, 60, 120, 300, 600, 900, 1200],
  registers: [registry],
});

export const generationsTotal = new Counter({
  name: 'mobigen_generations_total',
  help: 'Total number of generations',
  labelNames: ['template', 'status'],
  registers: [registry],
});

export const activeGenerations = new Gauge({
  name: 'mobigen_active_generations',
  help: 'Number of currently active generations',
  registers: [registry],
});

// Build metrics
export const buildDuration = new Histogram({
  name: 'mobigen_build_duration_seconds',
  help: 'Duration of builds in seconds',
  labelNames: ['platform', 'status'],
  buckets: [60, 120, 300, 600, 900, 1200, 1800],
  registers: [registry],
});

export const buildsTotal = new Counter({
  name: 'mobigen_builds_total',
  help: 'Total number of builds',
  labelNames: ['platform', 'status'],
  registers: [registry],
});

// API metrics
export const httpRequestDuration = new Histogram({
  name: 'mobigen_http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [registry],
});

export const httpRequestsTotal = new Counter({
  name: 'mobigen_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

// AI metrics
export const aiTokensUsed = new Counter({
  name: 'mobigen_ai_tokens_total',
  help: 'Total AI tokens used',
  labelNames: ['model', 'type'], // type: input/output
  registers: [registry],
});

export const aiRequestDuration = new Histogram({
  name: 'mobigen_ai_request_duration_seconds',
  help: 'Duration of AI API requests',
  labelNames: ['model', 'agent'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [registry],
});

// Queue metrics
export const queueSize = new Gauge({
  name: 'mobigen_queue_size',
  help: 'Number of jobs in queue',
  labelNames: ['queue', 'state'], // state: waiting/active/delayed
  registers: [registry],
});

/**
 * Express middleware for request metrics
 */
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';

    httpRequestDuration.observe(
      { method: req.method, route, status: res.statusCode },
      duration
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode,
    });
  });

  next();
}

/**
 * Get metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return registry.metrics();
}
```

### Add metrics endpoint
```typescript
// services/generator/src/api.ts
import { getMetrics, metricsMiddleware } from '@mobigen/observability';

app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await getMetrics());
});
```

### Acceptance Criteria
- [ ] /metrics returns Prometheus format
- [ ] Generation duration tracked
- [ ] Build duration tracked
- [ ] API request duration tracked
- [ ] Queue size tracked

### Tests Required
```typescript
// packages/observability/tests/metrics.test.ts
describe('Metrics', () => {
  it('should record generation duration', () => {
    const end = generationDuration.startTimer({ template: 'ecommerce' });
    end({ status: 'success' });

    const metrics = registry.getMetricsAsJSON();
    expect(metrics.find(m => m.name === 'mobigen_generation_duration_seconds')).toBeDefined();
  });
});
```

### Build Verification
```bash
cd packages/observability && npm run build && npm test
```

---

## Sprint 4 Completion Checklist

- [ ] Task 4.1: Queue-based generation implemented
- [ ] Task 4.2: Circuit breakers added
- [ ] Task 4.3: Retry logic implemented
- [ ] Task 4.4: Health checks added
- [ ] Task 4.5: Metrics implemented
- [ ] All builds succeed
- [ ] All tests pass
- [ ] Load testing passed
- [ ] Code reviewed and merged

---

## Build Commands Summary

```bash
# Resilience package
cd packages/resilience && npm run build && npm test

# Observability package
cd packages/observability && npm run build && npm test

# Generator service
cd services/generator && npm run build && npm test

# Full build
npm run build && npm run test

# Load testing (optional)
npm run test:load
```
