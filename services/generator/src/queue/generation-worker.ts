/**
 * Generation Worker
 *
 * Processes generation jobs from the queue.
 * Handles the actual app generation pipeline.
 */

import { GenerationQueue, GenerationJob, getGenerationQueue } from './generation-queue';

// Inline simplified resilience utilities (avoiding package dependency for now)

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly requestTimeout: number;
  private nextAttempt = 0;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  constructor(options: { name: string; failureThreshold?: number; resetTimeout?: number; requestTimeout?: number }) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000;
    this.requestTimeout = options.requestTimeout ?? 10000;
  }

  on(event: string, listener: (...args: unknown[]) => void): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return this;
  }

  private emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(l => l(...args));
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN' && Date.now() < this.nextAttempt) {
      throw new Error('Circuit breaker is OPEN');
    }
    if (this.state === 'OPEN') this.state = 'HALF_OPEN';

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') this.state = 'CLOSED';
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.resetTimeout;
        this.emit('stateChange', 'OPEN', 'CLOSED');
      }
      throw error;
    }
  }

  getState(): CircuitState { return this.state; }
}

function createCircuitBreaker(name: string, options?: { failureThreshold?: number; resetTimeout?: number; requestTimeout?: number }) {
  return new CircuitBreaker({ name, ...options });
}

async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; isRetryable?: (e: unknown) => boolean; onRetry?: (e: unknown, attempt: number) => void } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  let lastError: unknown;
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < maxAttempts && (!options.isRetryable || options.isRetryable(e))) {
        options.onRetry?.(e, i);
        await new Promise(r => setTimeout(r, 1000 * i));
      }
    }
  }
  throw lastError;
}

const retryStrategies = { standard: { maxAttempts: 3 }, fast: { maxAttempts: 2 } };
const retryPredicates = { transientErrors: () => true };

export interface WorkerOptions {
  /** Worker ID for logging */
  workerId?: string;
  /** Queue instance (uses singleton if not provided) */
  queue?: GenerationQueue;
  /** Enable circuit breaker for AI calls */
  useCircuitBreaker?: boolean;
  /** Enable retry logic */
  useRetry?: boolean;
}

export interface GenerationContext {
  job: GenerationJob;
  workerId: string;
  updateProgress: (progress: number, message?: string) => void;
  signal: AbortSignal;
}

export interface GenerationResult {
  success: boolean;
  projectPath?: string;
  filesGenerated?: string[];
  previewUrl?: string;
  error?: string;
  duration: number;
}

export class GenerationWorker {
  private workerId: string;
  private queue: GenerationQueue;
  private isRunning = false;
  private abortController: AbortController | null = null;
  private claudeCircuitBreaker: CircuitBreaker;
  private options: Required<WorkerOptions>;

  constructor(options: WorkerOptions = {}) {
    this.workerId = options.workerId || `worker_${Date.now()}`;
    this.queue = options.queue || getGenerationQueue();
    this.options = {
      workerId: this.workerId,
      queue: this.queue,
      useCircuitBreaker: options.useCircuitBreaker ?? true,
      useRetry: options.useRetry ?? true,
    };

    // Initialize circuit breaker for Claude API
    this.claudeCircuitBreaker = createCircuitBreaker('claude-api', {
      failureThreshold: 3,
      resetTimeout: 60000,
      requestTimeout: 120000,
    });

    // Log circuit breaker state changes
    this.claudeCircuitBreaker.on('stateChange', (state, prev) => {
      console.log(`[${this.workerId}] Claude circuit breaker: ${prev} -> ${state}`);
    });
  }

  /**
   * Start processing jobs
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.abortController = new AbortController();

    this.queue.process(async (job) => {
      return this.processJob(job);
    });

    console.log(`[${this.workerId}] Worker started`);
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.abortController?.abort();
    this.queue.pause();

    console.log(`[${this.workerId}] Worker stopped`);
  }

  /**
   * Process a single generation job
   */
  private async processJob(job: GenerationJob): Promise<GenerationResult> {
    const startTime = Date.now();
    console.log(`[${this.workerId}] Processing job ${job.id} for project ${job.projectId}`);

    const context: GenerationContext = {
      job,
      workerId: this.workerId,
      updateProgress: (progress, message) => {
        this.queue.updateProgress(job.id, progress);
        if (message) {
          console.log(`[${this.workerId}] Job ${job.id}: ${message} (${progress}%)`);
        }
      },
      signal: this.abortController?.signal || new AbortController().signal,
    };

    try {
      // Phase 1: Analyze (10%)
      context.updateProgress(5, 'Analyzing request');
      await this.runPhase('analyze', job, context);
      context.updateProgress(10, 'Analysis complete');

      // Phase 2: Design (30%)
      context.updateProgress(15, 'Designing UI');
      await this.runPhase('design', job, context);
      context.updateProgress(30, 'Design complete');

      // Phase 3: Generate (70%)
      context.updateProgress(35, 'Generating code');
      await this.runPhase('generate', job, context);
      context.updateProgress(70, 'Code generation complete');

      // Phase 4: Validate (90%)
      context.updateProgress(75, 'Validating code');
      await this.runPhase('validate', job, context);
      context.updateProgress(90, 'Validation complete');

      // Phase 5: Finalize (100%)
      context.updateProgress(95, 'Finalizing');
      const result = await this.runPhase('finalize', job, context);
      context.updateProgress(100, 'Complete');

      return {
        success: true,
        projectPath: `/projects/${job.projectId}`,
        filesGenerated: result?.files || [],
        previewUrl: result?.previewUrl,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${this.workerId}] Job ${job.id} failed:`, errorMessage);

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run a generation phase with resilience patterns
   */
  private async runPhase(
    phase: string,
    job: GenerationJob,
    context: GenerationContext
  ): Promise<{ files?: string[]; previewUrl?: string } | void> {
    const executePhase = async () => {
      // Simulate phase execution
      // In production, this would call the actual generation pipeline
      switch (phase) {
        case 'analyze':
          return this.analyzePhase(job, context);
        case 'design':
          return this.designPhase(job, context);
        case 'generate':
          return this.generatePhase(job, context);
        case 'validate':
          return this.validatePhase(job, context);
        case 'finalize':
          return this.finalizePhase(job, context);
        default:
          throw new Error(`Unknown phase: ${phase}`);
      }
    };

    // Apply circuit breaker if enabled
    if (this.options.useCircuitBreaker && phase === 'generate') {
      return this.claudeCircuitBreaker.execute(async () => {
        if (this.options.useRetry) {
          return retry(executePhase, {
            ...retryStrategies.standard,
            isRetryable: retryPredicates.transientErrors,
            onRetry: (error, attempt) => {
              console.log(`[${this.workerId}] Retrying ${phase} (attempt ${attempt}):`, error);
            },
          });
        }
        return executePhase();
      });
    }

    // Apply retry if enabled
    if (this.options.useRetry) {
      return retry(executePhase, {
        ...retryStrategies.fast,
        isRetryable: retryPredicates.transientErrors,
        onRetry: (error, attempt) => {
          console.log(`[${this.workerId}] Retrying ${phase} (attempt ${attempt}):`, error);
        },
      });
    }

    return executePhase();
  }

  /**
   * Analyze phase - parse intent and select template
   */
  private async analyzePhase(
    job: GenerationJob,
    context: GenerationContext
  ): Promise<void> {
    // Simulated delay for now
    await this.delay(100);
    console.log(`[${this.workerId}] Analyzed: ${job.prompt.substring(0, 50)}...`);
  }

  /**
   * Design phase - generate theme and UI specs
   */
  private async designPhase(
    job: GenerationJob,
    context: GenerationContext
  ): Promise<void> {
    await this.delay(100);
    console.log(`[${this.workerId}] Designed UI for project ${job.projectId}`);
  }

  /**
   * Generate phase - write code
   */
  private async generatePhase(
    job: GenerationJob,
    context: GenerationContext
  ): Promise<void> {
    await this.delay(200);
    console.log(`[${this.workerId}] Generated code for project ${job.projectId}`);
  }

  /**
   * Validate phase - run tests
   */
  private async validatePhase(
    job: GenerationJob,
    context: GenerationContext
  ): Promise<void> {
    await this.delay(100);
    console.log(`[${this.workerId}] Validated project ${job.projectId}`);
  }

  /**
   * Finalize phase - prepare outputs
   */
  private async finalizePhase(
    job: GenerationJob,
    context: GenerationContext
  ): Promise<{ files: string[]; previewUrl?: string }> {
    await this.delay(50);
    console.log(`[${this.workerId}] Finalized project ${job.projectId}`);

    return {
      files: ['app.json', 'src/App.tsx', 'src/screens/Home.tsx'],
      previewUrl: `https://preview.mobigen.io/${job.projectId}`,
    };
  }

  /**
   * Helper for simulated delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get worker status
   */
  getStatus(): {
    workerId: string;
    isRunning: boolean;
    circuitBreakerState: string;
  } {
    return {
      workerId: this.workerId,
      isRunning: this.isRunning,
      circuitBreakerState: this.claudeCircuitBreaker.getState(),
    };
  }
}

/**
 * Create and start a worker
 */
export function createWorker(options?: WorkerOptions): GenerationWorker {
  const worker = new GenerationWorker(options);
  worker.start();
  return worker;
}
