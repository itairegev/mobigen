/**
 * Tools Module - Claude Agent SDK
 *
 * Exports all tool-related functionality for the SDK.
 */

// Core types
export type {
  ToolParameterSchema,
  ToolDefinition,
  ToolHandler,
  ToolResult,
  Tool,
  ToolUseBlock,
  ToolResultBlock,
  CustomToolConfig,
} from './types.js';

// Built-in tools
export {
  ReadTool,
  WriteTool,
  EditTool,
  BashTool,
  GlobTool,
  GrepTool,
  builtinTools,
  getToolDefinitions,
  executeTool,
} from './builtin-tools.js';

// Parallel execution
export {
  ParallelExecutionManager,
  type TaskResult,
  type TaskOptions,
  type TaskExecutor,
  type ExecutionEvents,
} from './parallel-execution.js';

// Task tool for spawning subagents
export {
  createTaskTool,
  createTaskOutputTool,
  createTaskTools,
  type TaskToolInput,
  type TaskToolOutput,
  type TaskToolConfig,
  type AgentDefinition as TaskAgentDefinition,
  type AgentExecutor,
} from './task-tool.js';
