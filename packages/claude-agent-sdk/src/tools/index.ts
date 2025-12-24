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

// Command tool for slash commands
export {
  createCommandTool,
  createListCommandsTool,
  type CommandToolInput,
  type CommandToolConfig,
  type CommandDefinition as CommandToolDefinition,
  type CommandArgument as CommandToolArgument,
} from './command-tool.js';

// Skill tool for reusable capabilities
export {
  createSkillTool,
  createFindSkillsTool,
  type SkillToolInput,
  type SkillToolConfig,
  type SkillDefinition as SkillToolDefinition,
  type SkillInput as SkillToolInput_,
  type SkillOutput as SkillToolOutput,
} from './skill-tool.js';

// Memory tools for persistent context
export {
  createRememberTool,
  createRecallTool,
  createQueryMemoryTool,
  createForgetTool,
  createGetMemoryContextTool,
  createMemoryTools,
  type MemoryToolConfig,
  type MemoryEntry as MemoryToolEntry,
  type MemoryScope as MemoryToolScope,
} from './memory-tool.js';
