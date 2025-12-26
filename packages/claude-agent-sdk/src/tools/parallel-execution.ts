/**
 * Parallel Execution Manager
 *
 * Manages concurrent execution of agent tasks with:
 * - Configurable concurrency limit
 * - Task queuing when limit is reached
 * - Timeout handling
 * - Dependency tracking
 * - Event emission for progress tracking
 */

import { EventEmitter } from 'events';

/**
 * Result from a task execution
 */
export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'timeout';
  result?: string;
  error?: string;
  agentId: string;
  filesModified?: string[];
  durationMs: number;
}

/**
 * Options for submitting a task
 */
export interface TaskOptions {
  agentId: string;
  timeoutMs?: number;
  priority?: number;
}

/**
 * Task executor function
 */
export type TaskExecutor = () => Promise<Omit<TaskResult, 'taskId' | 'durationMs'>>;

/**
 * Internal representation of a running task
 */
interface RunningTask {
  taskId: string;
  agentId: string;
  promise: Promise<TaskResult>;
  startedAt: number;
  timeoutHandle?: NodeJS.Timeout;
  abortController: AbortController;
}

/**
 * Queued task waiting to be executed
 */
interface QueuedTask {
  taskId: string;
  executor: TaskExecutor;
  options: TaskOptions;
  resolve: (result: TaskResult) => void;
  reject: (error: Error) => void;
}

/**
 * Events emitted by the execution manager
 */
export interface ExecutionEvents {
  'task:started': { taskId: string; agentId: string };
  'task:completed': TaskResult;
  'task:failed': TaskResult;
  'task:cancelled': { taskId: string; reason: string };
  'queue:full': { queueSize: number; maxConcurrent: number };
}

/**
 * Parallel Execution Manager
 */
export class ParallelExecutionManager extends EventEmitter {
  private maxConcurrent: number;
  private runningTasks: Map<string, RunningTask> = new Map();
  private completedTasks: Map<string, TaskResult> = new Map();
  private taskQueue: QueuedTask[] = [];
  private taskCounter: number = 0;
  private defaultTimeoutMs: number;

  constructor(options: { maxConcurrent?: number; defaultTimeoutMs?: number } = {}) {
    super();
    this.maxConcurrent = options.maxConcurrent || 5;
    // 15 minutes default (increased from 5 minutes for complex agent tasks)
    this.defaultTimeoutMs = options.defaultTimeoutMs || 900000;
  }

  /**
   * Submit a task for execution
   * Returns immediately with a task ID
   */
  submitTask(executor: TaskExecutor, options: TaskOptions): string {
    const taskId = this.generateTaskId(options.agentId);

    // Check if we can run immediately or need to queue
    if (this.runningTasks.size < this.maxConcurrent) {
      this.startTask(taskId, executor, options);
    } else {
      // Queue the task
      this.queueTask(taskId, executor, options);
      console.log(`[ParallelExecutionManager] Task ${taskId} queued (${this.taskQueue.length} in queue)`);
      this.emit('queue:full', {
        queueSize: this.taskQueue.length,
        maxConcurrent: this.maxConcurrent
      });
    }

    return taskId;
  }

  /**
   * Start executing a task immediately
   */
  private startTask(taskId: string, executor: TaskExecutor, options: TaskOptions): void {
    const startTime = Date.now();
    const abortController = new AbortController();

    console.log(`[ParallelExecutionManager] Starting task ${taskId} (agent: ${options.agentId})`);

    // Set up timeout
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const timeoutHandle = setTimeout(() => {
      this.handleTaskTimeout(taskId);
    }, timeoutMs);

    // Execute the task
    const promise = this.executeWithTracking(taskId, executor, startTime);

    // Store the running task
    this.runningTasks.set(taskId, {
      taskId,
      agentId: options.agentId,
      promise,
      startedAt: startTime,
      timeoutHandle,
      abortController
    });

    this.emit('task:started', { taskId, agentId: options.agentId });

    // Handle completion
    promise.then(result => {
      this.handleTaskComplete(taskId, result);
    }).catch(error => {
      const result: TaskResult = {
        taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        agentId: options.agentId,
        durationMs: Date.now() - startTime
      };
      this.handleTaskComplete(taskId, result);
    });
  }

  /**
   * Execute a task with tracking
   */
  private async executeWithTracking(
    taskId: string,
    executor: TaskExecutor,
    startTime: number
  ): Promise<TaskResult> {
    try {
      const partialResult = await executor();
      return {
        ...partialResult,
        taskId,
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      const running = this.runningTasks.get(taskId);
      return {
        taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        agentId: running?.agentId || 'unknown',
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Queue a task when concurrency limit is reached
   */
  private queueTask(taskId: string, executor: TaskExecutor, options: TaskOptions): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        taskId,
        executor,
        options,
        resolve,
        reject
      });
    });
  }

  /**
   * Handle task completion
   */
  private handleTaskComplete(taskId: string, result: TaskResult): void {
    const task = this.runningTasks.get(taskId);

    if (task?.timeoutHandle) {
      clearTimeout(task.timeoutHandle);
    }

    this.runningTasks.delete(taskId);
    this.completedTasks.set(taskId, result);

    console.log(`[ParallelExecutionManager] Task ${taskId} completed: ${result.status} (${result.durationMs}ms)`);

    if (result.status === 'completed') {
      this.emit('task:completed', result);
    } else {
      this.emit('task:failed', result);
    }

    // Process next queued task if any
    this.processQueue();
  }

  /**
   * Handle task timeout
   */
  private handleTaskTimeout(taskId: string): void {
    const task = this.runningTasks.get(taskId);
    if (!task) return;

    console.log(`[ParallelExecutionManager] Task ${taskId} timed out`);

    // Abort the task
    task.abortController.abort();

    const result: TaskResult = {
      taskId,
      status: 'timeout',
      error: 'Task execution timed out',
      agentId: task.agentId,
      durationMs: Date.now() - task.startedAt
    };

    this.handleTaskComplete(taskId, result);
  }

  /**
   * Process the next task in the queue
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) return;
    if (this.runningTasks.size >= this.maxConcurrent) return;

    const queued = this.taskQueue.shift();
    if (!queued) return;

    console.log(`[ParallelExecutionManager] Dequeuing task ${queued.taskId}`);

    this.startTask(queued.taskId, queued.executor, queued.options);

    // The promise will resolve when the task completes
    this.waitForTask(queued.taskId)
      .then(queued.resolve)
      .catch(queued.reject);
  }

  /**
   * Cancel a running task
   */
  cancelTask(taskId: string, reason: string = 'Cancelled by user'): boolean {
    const task = this.runningTasks.get(taskId);

    if (!task) {
      // Check if it's in the queue
      const queueIndex = this.taskQueue.findIndex(t => t.taskId === taskId);
      if (queueIndex !== -1) {
        const queued = this.taskQueue.splice(queueIndex, 1)[0];
        const result: TaskResult = {
          taskId,
          status: 'cancelled',
          error: reason,
          agentId: queued.options.agentId,
          durationMs: 0
        };
        queued.resolve(result);
        this.emit('task:cancelled', { taskId, reason });
        return true;
      }
      return false;
    }

    // Abort the running task
    task.abortController.abort();

    const result: TaskResult = {
      taskId,
      status: 'cancelled',
      error: reason,
      agentId: task.agentId,
      durationMs: Date.now() - task.startedAt
    };

    this.handleTaskComplete(taskId, result);
    this.emit('task:cancelled', { taskId, reason });

    return true;
  }

  /**
   * Wait for a specific task to complete
   */
  async waitForTask(taskId: string): Promise<TaskResult> {
    // Check if already completed
    const completed = this.completedTasks.get(taskId);
    if (completed) {
      return completed;
    }

    // Check if running
    const running = this.runningTasks.get(taskId);
    if (running) {
      return running.promise;
    }

    // Check if queued
    const queued = this.taskQueue.find(t => t.taskId === taskId);
    if (queued) {
      return new Promise((resolve) => {
        const originalResolve = queued.resolve;
        queued.resolve = (result) => {
          originalResolve(result);
          resolve(result);
        };
      });
    }

    throw new Error(`Task '${taskId}' not found`);
  }

  /**
   * Wait for multiple tasks to complete
   */
  async waitForTasks(taskIds: string[]): Promise<TaskResult[]> {
    return Promise.all(taskIds.map(id => this.waitForTask(id)));
  }

  /**
   * Wait for all running and queued tasks to complete
   */
  async waitForAll(): Promise<TaskResult[]> {
    const allTaskIds = [
      ...Array.from(this.runningTasks.keys()),
      ...this.taskQueue.map(t => t.taskId)
    ];

    if (allTaskIds.length === 0) {
      return [];
    }

    return this.waitForTasks(allTaskIds);
  }

  /**
   * Get the status of a task
   */
  getTaskStatus(taskId: string): TaskResult | { taskId: string; status: 'running' | 'queued'; agentId: string } | undefined {
    // Check completed
    const completed = this.completedTasks.get(taskId);
    if (completed) return completed;

    // Check running
    const running = this.runningTasks.get(taskId);
    if (running) {
      return { taskId, status: 'running', agentId: running.agentId };
    }

    // Check queued
    const queued = this.taskQueue.find(t => t.taskId === taskId);
    if (queued) {
      return { taskId, status: 'queued', agentId: queued.options.agentId };
    }

    return undefined;
  }

  /**
   * Get all running task IDs
   */
  getRunningTasks(): string[] {
    return Array.from(this.runningTasks.keys());
  }

  /**
   * Get all queued task IDs
   */
  getQueuedTasks(): string[] {
    return this.taskQueue.map(t => t.taskId);
  }

  /**
   * Get statistics about the execution manager
   */
  getStats(): {
    running: number;
    queued: number;
    completed: number;
    maxConcurrent: number;
  } {
    return {
      running: this.runningTasks.size,
      queued: this.taskQueue.length,
      completed: this.completedTasks.size,
      maxConcurrent: this.maxConcurrent
    };
  }

  /**
   * Clear completed tasks from memory
   */
  clearCompleted(): void {
    this.completedTasks.clear();
  }

  /**
   * Generate a unique task ID
   */
  private generateTaskId(agentId: string): string {
    return `task_${agentId}_${++this.taskCounter}_${Date.now()}`;
  }
}
