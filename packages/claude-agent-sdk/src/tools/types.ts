/**
 * Tool Types for Claude Agent SDK
 *
 * Defines the interface for tools that can be used by agents.
 */

/**
 * JSON Schema for tool parameters
 */
export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description?: string;
    enum?: string[];
    items?: Record<string, unknown>;
    default?: unknown;
    [key: string]: unknown;
  }>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Tool definition for Anthropic API
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: ToolParameterSchema;
}

/**
 * Tool handler function type
 */
export type ToolHandler = (input: Record<string, unknown>) => Promise<ToolResult>;

/**
 * Result from a tool execution
 */
export interface ToolResult {
  success: boolean;
  output?: string | Record<string, unknown>;
  error?: string;
}

/**
 * Tool with both definition and handler
 */
export interface Tool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

/**
 * Tool use request from the model
 */
export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result to send back to the model
 */
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/**
 * Custom tool configuration for query options
 */
export interface CustomToolConfig {
  schema: ToolParameterSchema;
  handler: ToolHandler;
  description?: string;
}
