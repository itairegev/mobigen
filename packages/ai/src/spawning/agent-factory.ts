/**
 * Agent Factory - Creates agent instances with custom configurations
 */

import { randomUUID } from 'crypto';
import { mobigenAgents } from '../agents/definitions.js';
import type { AgentConfig, AgentInstance, AgentSpawnRequest, AgentSpawnResult, AgentHealth } from './types.js';

export class AgentFactory {
  create(config: AgentConfig, parentAgentId?: string): AgentInstance {
    const agentId = randomUUID();
    const definition = config.definition || mobigenAgents[config.role];

    if (!definition) {
      throw new Error(`Unknown agent role: ${config.role}`);
    }

    const health: AgentHealth = {
      healthy: true,
      lastCheckedAt: new Date(),
      consecutiveFailures: 0,
      averageTaskDuration: 0,
      issues: [],
    };

    return {
      id: agentId,
      role: config.role,
      config,
      state: 'idle',
      createdAt: new Date(),
      tasksCompleted: 0,
      tasksFailed: 0,
      totalExecutionTime: 0,
      parentAgentId,
      childAgentIds: [],
      health,
    };
  }

  async spawn(request: AgentSpawnRequest): Promise<AgentSpawnResult> {
    try {
      const agent = this.create(request.config, request.parentAgentId);
      return { agent, success: true };
    } catch (error) {
      return { agent: null as unknown as AgentInstance, success: false, error: error as Error };
    }
  }

  createConfig(role: string, overrides?: Partial<AgentConfig>): AgentConfig {
    const definition = mobigenAgents[role];
    if (!definition) {
      throw new Error(`Unknown agent role: ${role}`);
    }

    return {
      role: definition.role,
      definition,
      model: overrides?.model || (definition.model === 'inherit' ? 'sonnet' : definition.model) || 'sonnet',
      tools: overrides?.tools || definition.tools,
      permissionMode: overrides?.permissionMode || 'acceptEdits',
      maxTurns: overrides?.maxTurns || 50,
      timeout: overrides?.timeout || 180000,
      cwd: overrides?.cwd || process.cwd(),
      canSpawn: overrides?.canSpawn ?? true,
      maxConcurrentSubAgents: overrides?.maxConcurrentSubAgents || 3,
      ...overrides,
    };
  }

  validateConfig(config: AgentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.role) errors.push('Agent role is required');
    if (!mobigenAgents[config.role] && !config.definition) {
      errors.push(`Unknown agent role: ${config.role}`);
    }
    if (config.maxTurns && config.maxTurns < 1) errors.push('maxTurns must be at least 1');
    if (config.timeout && config.timeout < 1000) errors.push('timeout must be at least 1000ms');
    return { valid: errors.length === 0, errors };
  }
}

export const agentFactory = new AgentFactory();
