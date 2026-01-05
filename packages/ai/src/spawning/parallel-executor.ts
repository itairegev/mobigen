/**
 * Parallel Executor - Execute multiple tasks in parallel
 */

import { AgentPool } from './agent-pool.js';
import type { AgentTask, ParallelExecutionConfig, ParallelExecutionResult, TaskResult } from './types.js';

export class ParallelExecutor {
  private pool: AgentPool;

  constructor(pool: AgentPool) {
    this.pool = pool;
  }

  async execute(
    tasks: Omit<AgentTask, 'id' | 'createdAt' | 'status' | 'attempts'>[],
    config: ParallelExecutionConfig
  ): Promise<ParallelExecutionResult> {
    const startTime = Date.now();
    const results: TaskResult[] = [];
    const errors: Error[] = [];

    const maxParallel = Math.min(config.maxParallel, tasks.length);
    let completed = 0;

    const executeTask = async (
      task: Omit<AgentTask, 'id' | 'createdAt' | 'status' | 'attempts'>
    ): Promise<TaskResult> => {
      const idleAgents = this.pool.getIdle();
      if (idleAgents.length === 0) {
        throw new Error('No idle agents available');
      }

      const agent = idleAgents[0];
      const fullTask: AgentTask = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        status: 'pending',
        attempts: 0,
      };

      return this.pool.execute(agent.id, fullTask);
    };

    if (config.mode === 'race') {
      // Return first completed result
      const result = await Promise.race(tasks.map(executeTask));
      results.push(result);
    } else if (config.mode === 'any') {
      // Return first successful result
      const promises = tasks.map(async (task) => {
        try {
          const result = await executeTask(task);
          if (result.success) return result;
          throw new Error(result.error || 'Task failed');
        } catch (e) {
          errors.push(e as Error);
          throw e;
        }
      });

      try {
        const result = await Promise.any(promises);
        results.push(result);
      } catch {
        // All failed
      }
    } else {
      // 'all' mode - execute all in parallel batches
      for (let i = 0; i < tasks.length; i += maxParallel) {
        const batch = tasks.slice(i, i + maxParallel);
        const batchResults = await Promise.allSettled(batch.map(executeTask));

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push(result.reason as Error);
            results.push({
              success: false,
              error: (result.reason as Error).message,
              duration: 0,
            });
          }
        }

        completed += batch.length;
        config.onProgress?.(completed, tasks.length);
      }
    }

    const successCount = results.filter(r => r.success).length;
    return {
      results,
      allSucceeded: successCount === tasks.length,
      successCount,
      failureCount: tasks.length - successCount,
      totalDuration: Date.now() - startTime,
      errors,
    };
  }

  async executeWithTimeout(
    tasks: Omit<AgentTask, 'id' | 'createdAt' | 'status' | 'attempts'>[],
    config: ParallelExecutionConfig
  ): Promise<ParallelExecutionResult> {
    if (!config.timeout) {
      return this.execute(tasks, config);
    }

    return Promise.race([
      this.execute(tasks, config),
      new Promise<ParallelExecutionResult>((_, reject) =>
        setTimeout(() => reject(new Error('Parallel execution timeout')), config.timeout)
      ),
    ]);
  }
}
