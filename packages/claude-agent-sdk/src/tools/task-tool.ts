/**
 * Task Tool - Spawns subagents for parallel execution
 *
 * This is the core tool that allows the AI orchestrator to dynamically
 * spawn subagents, similar to Claude Code's Task tool.
 *
 * Features:
 * - Spawn agents from the registry
 * - Run agents in background for parallel execution
 * - Wait for specific agents to complete
 * - Dependency tracking (wait_for)
 */

import type { Tool, ToolDefinition, ToolHandler, ToolResult, ToolParameterSchema } from './types.js';
import { ParallelExecutionManager, type TaskResult as ExecTaskResult, type TaskOptions } from './parallel-execution.js';

/**
 * Input for the Task tool
 */
export interface TaskToolInput {
  /** ID of the agent to invoke (from registry) */
  agent_id: string;
  /** Task instructions/prompt for the agent */
  prompt: string;
  /** Optional context to pass to the agent */
  context?: Record<string, unknown>;
  /** Run in background for parallel execution */
  run_in_background?: boolean;
  /** Task IDs to wait for before starting */
  wait_for?: string[];
  /** Timeout in milliseconds */
  timeout_ms?: number;
}

/**
 * Output from the Task tool
 */
export interface TaskToolOutput {
  /** Task ID for tracking */
  task_id: string;
  /** Current status */
  status: 'completed' | 'running' | 'failed' | 'queued' | 'cancelled' | 'timeout';
  /** Result from the agent (if completed) */
  result?: string;
  /** Agent ID that handled the task */
  agent_id: string;
  /** Files modified by the agent */
  files_modified?: string[];
  /** Error message if failed */
  error?: string;
}

/**
 * Agent definition interface (matches registry format)
 */
export interface AgentDefinition {
  id: string;
  description: string;
  prompt: string;
  model?: 'opus' | 'sonnet' | 'haiku';
  tools?: string[];
  capabilities?: string[];
  canDelegate?: string[];
  filePath: string;
}

/**
 * Agent executor function type
 */
export type AgentExecutor = (
  agent: AgentDefinition,
  prompt: string,
  context?: Record<string, unknown>
) => Promise<{
  result: string;
  filesModified?: string[];
  error?: string;
}>;

/**
 * Task Tool Configuration
 */
export interface TaskToolConfig {
  /** Agent registry for looking up agents */
  getAgent: (agentId: string) => AgentDefinition | undefined;
  /** List all available agents */
  listAgents: () => AgentDefinition[];
  /** Function to execute an agent */
  executeAgent: AgentExecutor;
  /** Parallel execution manager */
  executionManager: ParallelExecutionManager;
}

/**
 * Create a Task tool instance
 */
export function createTaskTool(config: TaskToolConfig): Tool {
  const definition: ToolDefinition = {
    name: 'Task',
    description: `Launch a subagent to handle a specific task. Use this to delegate work to specialized agents.

Available agents:
${config.listAgents().map(a => `- ${a.id}: ${a.description}`).join('\n')}

Usage:
- Set run_in_background=true for parallel execution
- Use wait_for to specify dependencies
- Check task status with TaskOutput tool`,
    input_schema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'The ID of the agent to invoke',
        },
        prompt: {
          type: 'string',
          description: 'Task instructions for the agent',
        },
        context: {
          type: 'object',
          description: 'Optional context data to pass to the agent',
        },
        run_in_background: {
          type: 'boolean',
          description: 'Run in background for parallel execution (default: false)',
          default: false,
        },
        wait_for: {
          type: 'array',
          items: { type: 'string' },
          description: 'Task IDs to wait for before starting',
        },
        timeout_ms: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 300000 = 5 minutes)',
          default: 300000,
        },
      },
      required: ['agent_id', 'prompt'],
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const taskInput = input as unknown as TaskToolInput;
    const { agent_id, prompt, context, run_in_background, wait_for, timeout_ms } = taskInput;

    // Validate agent exists
    const agent = config.getAgent(agent_id);
    if (!agent) {
      const availableAgents = config.listAgents().map(a => a.id).join(', ');
      return {
        success: false,
        error: `Agent '${agent_id}' not found. Available agents: ${availableAgents}`,
      };
    }

    // Wait for dependencies if specified
    if (wait_for && wait_for.length > 0) {
      console.log(`[TaskTool] Waiting for dependencies: ${wait_for.join(', ')}`);
      try {
        await config.executionManager.waitForTasks(wait_for);
        console.log(`[TaskTool] Dependencies completed`);
      } catch (error) {
        return {
          success: false,
          error: `Failed waiting for dependencies: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    // Create task executor
    const executor = async (): Promise<Omit<ExecTaskResult, 'taskId' | 'durationMs'>> => {
      try {
        const result = await config.executeAgent(agent, prompt, context);
        return {
          status: result.error ? 'failed' : 'completed',
          result: result.result,
          error: result.error,
          agentId: agent_id,
          filesModified: result.filesModified,
        };
      } catch (error) {
        return {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          agentId: agent_id,
        };
      }
    };

    // Submit task
    const taskId = config.executionManager.submitTask(executor, {
      agentId: agent_id,
      timeoutMs: timeout_ms,
    });

    console.log(`[TaskTool] Task ${taskId} submitted (agent: ${agent_id}, background: ${run_in_background})`);

    // If running in foreground, wait for completion
    if (!run_in_background) {
      try {
        const result = await config.executionManager.waitForTask(taskId);
        const output: TaskToolOutput = {
          task_id: taskId,
          status: result.status,
          result: result.result,
          agent_id: result.agentId,
          files_modified: result.filesModified,
          error: result.error,
        };

        return {
          success: result.status === 'completed',
          output: output as unknown as Record<string, unknown>,
          error: result.error,
        };
      } catch (error) {
        return {
          success: false,
          error: `Task failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    // Running in background - return immediately with task ID
    const output: TaskToolOutput = {
      task_id: taskId,
      status: 'running',
      agent_id: agent_id,
    };

    return {
      success: true,
      output: output as unknown as Record<string, unknown>,
    };
  };

  return { definition, handler };
}

/**
 * TaskOutput Tool - Check status of background tasks
 */
export function createTaskOutputTool(config: {
  executionManager: ParallelExecutionManager;
}): Tool {
  const definition: ToolDefinition = {
    name: 'TaskOutput',
    description: 'Get the output from a running or completed background task',
    input_schema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID to check',
        },
        block: {
          type: 'boolean',
          description: 'Wait for task completion (default: true)',
          default: true,
        },
        timeout_ms: {
          type: 'number',
          description: 'Maximum time to wait in milliseconds (default: 30000)',
          default: 30000,
        },
      },
      required: ['task_id'],
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const taskId = input.task_id as string;
    const block = input.block !== false;
    const timeoutMs = (input.timeout_ms as number) || 30000;

    // Get current status
    const status = config.executionManager.getTaskStatus(taskId);

    if (!status) {
      return {
        success: false,
        error: `Task '${taskId}' not found`,
      };
    }

    // If already completed, return immediately
    if ('status' in status && (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled' || status.status === 'timeout')) {
      const result = status as ExecTaskResult;
      return {
        success: result.status === 'completed',
        output: {
          task_id: taskId,
          status: result.status,
          result: result.result,
          agent_id: result.agentId,
          files_modified: result.filesModified,
          error: result.error,
          duration_ms: result.durationMs,
        },
        error: result.error,
      };
    }

    // If not blocking, return current status
    if (!block) {
      return {
        success: true,
        output: {
          task_id: taskId,
          status: 'running' in status ? status.status : 'running',
          agent_id: 'agentId' in status ? status.agentId : undefined,
        },
      };
    }

    // Wait for completion with timeout
    try {
      const result = await Promise.race([
        config.executionManager.waitForTask(taskId),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout waiting for task ${taskId}`)), timeoutMs);
        }),
      ]);

      return {
        success: result.status === 'completed',
        output: {
          task_id: taskId,
          status: result.status,
          result: result.result,
          agent_id: result.agentId,
          files_modified: result.filesModified,
          error: result.error,
          duration_ms: result.durationMs,
        },
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  return { definition, handler };
}

/**
 * Create both Task and TaskOutput tools
 */
export function createTaskTools(config: TaskToolConfig): {
  taskTool: Tool;
  taskOutputTool: Tool;
} {
  return {
    taskTool: createTaskTool(config),
    taskOutputTool: createTaskOutputTool({
      executionManager: config.executionManager,
    }),
  };
}
