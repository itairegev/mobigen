/**
 * Task Queue - Priority-based task queuing with dependency resolution
 */

import { randomUUID } from 'crypto';
import type { AgentTask, TaskPriority, TaskStatus, TaskQueueConfig } from './types.js';

export class TaskQueue {
  private tasks: Map<string, AgentTask> = new Map();
  private config: Required<TaskQueueConfig>;

  constructor(config?: TaskQueueConfig) {
    this.config = {
      maxSize: config?.maxSize || 1000,
      enablePriority: config?.enablePriority ?? true,
      enableDependencies: config?.enableDependencies ?? true,
      taskTimeout: config?.taskTimeout || 300000,
    };
  }

  enqueue(task: Omit<AgentTask, 'id' | 'createdAt' | 'status' | 'attempts'>): AgentTask {
    if (this.tasks.size >= this.config.maxSize) {
      throw new Error(`Task queue is full (max: ${this.config.maxSize})`);
    }

    const fullTask: AgentTask = {
      id: randomUUID(),
      createdAt: new Date(),
      status: 'pending',
      attempts: 0,
      ...task,
    };

    this.tasks.set(fullTask.id, fullTask);
    return fullTask;
  }

  dequeue(): AgentTask | null {
    const pending = Array.from(this.tasks.values()).filter(t => t.status === 'pending');
    if (pending.length === 0) return null;

    let available = this.config.enableDependencies
      ? pending.filter(t => this.canExecute(t))
      : pending;

    if (available.length === 0) return null;

    if (this.config.enablePriority) {
      const priorityOrder: Record<TaskPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
      available.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    return available[0];
  }

  private canExecute(task: AgentTask): boolean {
    if (!task.dependencies?.length) return true;
    return task.dependencies.every(depId => {
      const dep = this.tasks.get(depId);
      return dep && dep.status === 'completed';
    });
  }

  updateStatus(taskId: string, status: TaskStatus): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      if (status === 'running' && !task.startedAt) task.startedAt = new Date();
      if ((status === 'completed' || status === 'failed') && !task.completedAt) {
        task.completedAt = new Date();
      }
    }
  }

  get(taskId: string): AgentTask | undefined { return this.tasks.get(taskId); }
  getAll(): AgentTask[] { return Array.from(this.tasks.values()); }
  getByStatus(status: TaskStatus): AgentTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  cleanup(): number {
    const before = this.tasks.size;
    const toRemove = this.getAll().filter(
      t => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled'
    );
    toRemove.forEach(t => this.tasks.delete(t.id));
    return before - this.tasks.size;
  }

  getStats() {
    const tasks = this.getAll();
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
    };
  }

  clear(): void { this.tasks.clear(); }
}
