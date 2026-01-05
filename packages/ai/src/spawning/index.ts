/**
 * Agent Spawning System
 *
 * Provides dynamic agent creation, parallel execution, and lifecycle management
 */

export * from './types.js';
export { AgentFactory, agentFactory } from './agent-factory.js';
export { AgentPool } from './agent-pool.js';
export { TaskQueue } from './task-queue.js';
export { ParallelExecutor } from './parallel-executor.js';
export { LifecycleManager, lifecycleManager } from './lifecycle-manager.js';
