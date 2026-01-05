/**
 * Agent Spawning System - Type Definitions
 */

import type { AgentRole, AgentDefinition, SDKMessage } from '../types.js';

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';

export type AgentState =
  | 'idle' | 'starting' | 'running' | 'paused' | 'stopping' | 'stopped' | 'error';

export type TaskStatus =
  | 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentConfig {
  role: AgentRole;
  definition?: AgentDefinition;
  model?: 'sonnet' | 'opus' | 'haiku';
  tools?: string[];
  permissionMode?: 'ask' | 'acceptEdits' | 'acceptTools';
  maxTurns?: number;
  timeout?: number;
  cwd?: string;
  resumeSessionId?: string;
  systemPromptAdditions?: string;
  canSpawn?: boolean;
  maxConcurrentSubAgents?: number;
}

export interface AgentTask {
  id: string;
  type: string;
  description: string;
  prompt: string;
  priority: TaskPriority;
  dependencies?: string[];
  requiredRole?: AgentRole;
  config?: Record<string, unknown>;
  context?: Record<string, unknown>;
  timeout?: number;
  maxRetries?: number;
  createdAt: Date;
  status: TaskStatus;
  assignedAgentId?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
  result?: TaskResult;
  attempts: number;
}

export interface TaskResult {
  success: boolean;
  data?: unknown;
  files?: string[];
  messages?: SDKMessage[];
  sessionId?: string;
  error?: string;
  duration: number;
}

export interface AgentHealth {
  healthy: boolean;
  lastCheckedAt: Date;
  consecutiveFailures: number;
  averageTaskDuration: number;
  memoryUsage?: number;
  cpuUsage?: number;
  issues: string[];
}

export interface AgentInstance {
  id: string;
  role: AgentRole;
  config: AgentConfig;
  state: AgentState;
  currentTask?: AgentTask;
  sessionId?: string;
  createdAt: Date;
  startedAt?: Date;
  lastActivityAt?: Date;
  tasksCompleted: number;
  tasksFailed: number;
  totalExecutionTime: number;
  parentAgentId?: string;
  childAgentIds: string[];
  health: AgentHealth;
}

export interface AgentPoolConfig {
  minAgents?: number;
  maxAgents: number;
  maxConcurrentTasks?: number;
  agentIdleTimeout?: number;
  defaultTaskTimeout?: number;
  enableHealthMonitoring?: boolean;
  healthCheckInterval?: number;
  autoRestartFailedAgents?: boolean;
  maxTaskRetries?: number;
}

export interface TaskQueueConfig {
  maxSize?: number;
  enablePriority?: boolean;
  enableDependencies?: boolean;
  taskTimeout?: number;
}

export interface ParallelExecutionConfig {
  maxParallel: number;
  roles?: AgentRole[];
  sharedContext?: Record<string, unknown>;
  mode: 'all' | 'race' | 'any';
  timeout?: number;
  onProgress?: (completed: number, total: number) => void;
}

export interface ParallelExecutionResult {
  results: TaskResult[];
  allSucceeded: boolean;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  errors: Error[];
}

export type AgentLifecycleEvent =
  | 'created' | 'started' | 'task-assigned' | 'task-started' | 'task-progress'
  | 'task-completed' | 'task-failed' | 'paused' | 'resumed' | 'stopping' | 'stopped' | 'error';

export interface AgentLifecycleEventData {
  event: AgentLifecycleEvent;
  agentId: string;
  role: AgentRole;
  timestamp: Date;
  data?: unknown;
  taskId?: string;
  error?: Error;
}

export interface AgentSpawnRequest {
  config: AgentConfig;
  initialTask?: AgentTask;
  parentAgentId?: string;
}

export interface AgentSpawnResult {
  agent: AgentInstance;
  success: boolean;
  error?: Error;
}

export type LifecycleEventListener = (event: AgentLifecycleEventData) => void | Promise<void>;

export interface AgentExecutionContext {
  agent: AgentInstance;
  task: AgentTask;
  signal: AbortSignal;
  onProgress?: (progress: number, message?: string) => void;
  onMessage?: (message: SDKMessage) => void;
}
