/**
 * Agent Pool - Manages a pool of agent instances
 */

import { AgentFactory, agentFactory } from './agent-factory.js';
import { TaskQueue } from './task-queue.js';
import type {
  AgentConfig, AgentInstance, AgentPoolConfig, AgentTask, TaskResult,
  AgentLifecycleEvent, AgentLifecycleEventData, LifecycleEventListener
} from './types.js';

export class AgentPool {
  private agents: Map<string, AgentInstance> = new Map();
  private taskQueue: TaskQueue;
  private config: Required<AgentPoolConfig>;
  private factory: AgentFactory;
  private listeners: LifecycleEventListener[] = [];
  private healthCheckInterval?: ReturnType<typeof setInterval>;

  constructor(config: AgentPoolConfig) {
    this.config = {
      minAgents: config.minAgents || 0,
      maxAgents: config.maxAgents,
      maxConcurrentTasks: config.maxConcurrentTasks || config.maxAgents,
      agentIdleTimeout: config.agentIdleTimeout || 300000,
      defaultTaskTimeout: config.defaultTaskTimeout || 300000,
      enableHealthMonitoring: config.enableHealthMonitoring ?? true,
      healthCheckInterval: config.healthCheckInterval || 30000,
      autoRestartFailedAgents: config.autoRestartFailedAgents ?? true,
      maxTaskRetries: config.maxTaskRetries || 3,
    };
    this.factory = agentFactory;
    this.taskQueue = new TaskQueue();

    if (this.config.enableHealthMonitoring) {
      this.startHealthMonitoring();
    }
  }

  async spawn(config: AgentConfig): Promise<AgentInstance> {
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Agent pool is full (max: ${this.config.maxAgents})`);
    }

    const result = await this.factory.spawn({ config });
    if (!result.success) throw result.error;

    this.agents.set(result.agent.id, result.agent);
    this.emit('created', result.agent);
    return result.agent;
  }

  async execute(agentId: string, task: AgentTask): Promise<TaskResult> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    const startTime = Date.now();
    agent.state = 'running';
    agent.currentTask = task;
    agent.startedAt = new Date();

    this.emit('task-started', agent, task.id);

    try {
      // Simulated task execution - in real implementation would invoke Claude/OpenAI
      const result: TaskResult = {
        success: true,
        duration: Date.now() - startTime,
        data: { message: 'Task completed' },
      };

      agent.tasksCompleted++;
      agent.totalExecutionTime += result.duration;
      agent.state = 'idle';
      agent.currentTask = undefined;
      agent.lastActivityAt = new Date();

      this.emit('task-completed', agent, task.id);
      return result;
    } catch (error) {
      agent.tasksFailed++;
      agent.health.consecutiveFailures++;
      agent.state = 'error';

      this.emit('task-failed', agent, task.id, error as Error);
      return {
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  stop(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.state = 'stopped';
      this.emit('stopped', agent);
      this.agents.delete(agentId);
    }
  }

  stopAll(): void {
    for (const agent of this.agents.values()) {
      agent.state = 'stopped';
      this.emit('stopped', agent);
    }
    this.agents.clear();
  }

  get(agentId: string): AgentInstance | undefined { return this.agents.get(agentId); }
  getAll(): AgentInstance[] { return Array.from(this.agents.values()); }
  getIdle(): AgentInstance[] { return this.getAll().filter(a => a.state === 'idle'); }
  getRunning(): AgentInstance[] { return this.getAll().filter(a => a.state === 'running'); }

  getStats() {
    const agents = this.getAll();
    return {
      total: agents.length,
      idle: agents.filter(a => a.state === 'idle').length,
      running: agents.filter(a => a.state === 'running').length,
      error: agents.filter(a => a.state === 'error').length,
      healthy: agents.filter(a => a.health.healthy).length,
    };
  }

  onLifecycleEvent(listener: LifecycleEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private emit(event: AgentLifecycleEvent, agent: AgentInstance, taskId?: string, error?: Error): void {
    const eventData: AgentLifecycleEventData = {
      event,
      agentId: agent.id,
      role: agent.role,
      timestamp: new Date(),
      taskId,
      error,
    };
    this.listeners.forEach(l => l(eventData));
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      for (const agent of this.agents.values()) {
        agent.health.lastCheckedAt = new Date();
        agent.health.healthy = agent.health.consecutiveFailures < 3;

        if (!agent.health.healthy && this.config.autoRestartFailedAgents) {
          this.stop(agent.id);
          this.spawn(agent.config).catch(console.error);
        }
      }
    }, this.config.healthCheckInterval);
  }

  destroy(): void {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    this.stopAll();
  }
}
