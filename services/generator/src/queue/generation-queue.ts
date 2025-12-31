/**
 * Generation Queue
 *
 * Queue-based generation system for scaling.
 * Uses BullMQ patterns but with in-memory fallback for development.
 */

import { EventEmitter } from 'events';

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

export interface GenerationJob {
  id: string;
  projectId: string;
  userId: string;
  prompt: string;
  options: {
    templateId?: string;
    sessionId?: string;
    priority?: 'low' | 'normal' | 'high';
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: JobStatus;
  progress: number;
  result?: unknown;
  error?: string;
  attempts: number;
  maxAttempts: number;
}

export interface QueueOptions {
  /** Redis URL for distributed queue (optional - uses in-memory if not provided) */
  redisUrl?: string;
  /** Default number of retry attempts */
  defaultMaxAttempts?: number;
  /** Job timeout in ms */
  jobTimeout?: number;
  /** Concurrency limit */
  concurrency?: number;
}

export interface AddJobOptions {
  priority?: 'low' | 'normal' | 'high';
  delay?: number;
  maxAttempts?: number;
}

type QueueEvents = {
  jobAdded: [job: GenerationJob];
  jobStarted: [job: GenerationJob];
  jobProgress: [job: GenerationJob, progress: number];
  jobCompleted: [job: GenerationJob, result: unknown];
  jobFailed: [job: GenerationJob, error: Error];
};

/**
 * In-memory queue implementation (for development/single-node)
 * In production, this would be backed by Redis/BullMQ
 */
export class GenerationQueue extends EventEmitter {
  private jobs: Map<string, GenerationJob> = new Map();
  private waitingJobs: string[] = [];
  private activeJobs: Set<string> = new Set();
  private options: Required<QueueOptions>;
  private isProcessing = false;
  private processor?: (job: GenerationJob) => Promise<unknown>;

  constructor(options: QueueOptions = {}) {
    super();
    this.options = {
      redisUrl: options.redisUrl || '',
      defaultMaxAttempts: options.defaultMaxAttempts ?? 3,
      jobTimeout: options.jobTimeout ?? 600000, // 10 minutes
      concurrency: options.concurrency ?? 2,
    };
  }

  /**
   * Add a job to the queue
   */
  async add(
    projectId: string,
    userId: string,
    prompt: string,
    options: AddJobOptions = {}
  ): Promise<GenerationJob> {
    const job: GenerationJob = {
      id: this.generateJobId(),
      projectId,
      userId,
      prompt,
      options: {
        priority: options.priority ?? 'normal',
      },
      createdAt: new Date(),
      status: options.delay ? 'delayed' : 'waiting',
      progress: 0,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.options.defaultMaxAttempts,
    };

    this.jobs.set(job.id, job);

    if (options.delay) {
      setTimeout(() => {
        job.status = 'waiting';
        this.waitingJobs.push(job.id);
        this.processNext();
      }, options.delay);
    } else {
      // Insert based on priority
      this.insertByPriority(job.id, job.options.priority || 'normal');
    }

    this.emit('jobAdded', job);
    this.processNext();

    return job;
  }

  /**
   * Insert job into waiting queue based on priority
   */
  private insertByPriority(jobId: string, priority: 'low' | 'normal' | 'high'): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    if (priority === 'high') {
      // Insert at front
      this.waitingJobs.unshift(jobId);
    } else if (priority === 'low') {
      // Insert at back
      this.waitingJobs.push(jobId);
    } else {
      // Insert after high priority jobs
      const firstNonHigh = this.waitingJobs.findIndex(id => {
        const j = this.jobs.get(id);
        return j?.options.priority !== 'high';
      });
      if (firstNonHigh === -1) {
        this.waitingJobs.push(jobId);
      } else {
        this.waitingJobs.splice(firstNonHigh, 0, jobId);
      }
    }
  }

  /**
   * Set the job processor function
   */
  process(processor: (job: GenerationJob) => Promise<unknown>): void {
    this.processor = processor;
    this.processNext();
  }

  /**
   * Process next job in queue
   */
  private async processNext(): Promise<void> {
    if (!this.processor) return;
    if (this.activeJobs.size >= this.options.concurrency) return;
    if (this.waitingJobs.length === 0) return;

    const jobId = this.waitingJobs.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'active';
    job.startedAt = new Date();
    job.attempts++;
    this.activeJobs.add(jobId);

    this.emit('jobStarted', job);

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Job timed out after ${this.options.jobTimeout}ms`));
        }, this.options.jobTimeout);
      });

      // Race between processor and timeout
      const result = await Promise.race([
        this.processor(job),
        timeoutPromise,
      ]);

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      job.progress = 100;

      this.emit('jobCompleted', job, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (job.attempts < job.maxAttempts) {
        // Retry
        job.status = 'waiting';
        this.waitingJobs.push(jobId);
      } else {
        job.status = 'failed';
        job.completedAt = new Date();
        job.error = errorMessage;
        this.emit('jobFailed', job, error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      this.activeJobs.delete(jobId);
      // Process next job
      setImmediate(() => this.processNext());
    }
  }

  /**
   * Update job progress
   */
  updateProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = Math.min(100, Math.max(0, progress));
      this.emit('jobProgress', job, job.progress);
    }
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): GenerationJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get jobs by project ID
   */
  getJobsByProject(projectId: string): GenerationJob[] {
    return Array.from(this.jobs.values()).filter(j => j.projectId === projectId);
  }

  /**
   * Get jobs by user ID
   */
  getJobsByUser(userId: string): GenerationJob[] {
    return Array.from(this.jobs.values()).filter(j => j.userId === userId);
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      waiting: jobs.filter(j => j.status === 'waiting').length,
      active: jobs.filter(j => j.status === 'active').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      total: jobs.length,
    };
  }

  /**
   * Cancel a job
   */
  cancel(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'waiting' || job.status === 'delayed') {
      this.waitingJobs = this.waitingJobs.filter(id => id !== jobId);
      job.status = 'failed';
      job.error = 'Cancelled';
      return true;
    }

    return false;
  }

  /**
   * Clear completed and failed jobs older than given age
   */
  cleanup(maxAgeMs: number = 86400000): number {
    const cutoff = Date.now() - maxAgeMs;
    let removed = 0;

    for (const [id, job] of this.jobs) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt.getTime() < cutoff
      ) {
        this.jobs.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Pause the queue
   */
  pause(): void {
    this.isProcessing = false;
  }

  /**
   * Resume the queue
   */
  resume(): void {
    this.isProcessing = true;
    this.processNext();
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Singleton queue instance
 */
let queueInstance: GenerationQueue | null = null;

export function getGenerationQueue(options?: QueueOptions): GenerationQueue {
  if (!queueInstance) {
    queueInstance = new GenerationQueue(options);
  }
  return queueInstance;
}
