/**
 * Command Tool - Execute slash commands
 *
 * Allows the AI orchestrator to execute predefined slash commands
 * loaded from the command registry.
 */

import type { Tool, ToolDefinition, ToolHandler, ToolResult, ToolParameterSchema } from './types.js';

/**
 * Command definition interface (matches registry format)
 */
export interface CommandDefinition {
  id: string;
  description: string;
  prompt: string;
  arguments?: CommandArgument[];
  category?: string;
  agents?: string[];
  tools?: string[];
  filePath: string;
}

export interface CommandArgument {
  name: string;
  description: string;
  required?: boolean;
  default?: string;
}

/**
 * Input for the Command tool
 */
export interface CommandToolInput {
  /** Command ID to execute (without leading /) */
  command_id: string;
  /** Arguments to pass to the command */
  arguments?: Record<string, string>;
}

/**
 * Command Tool Configuration
 */
export interface CommandToolConfig {
  /** Get a command by ID */
  getCommand: (commandId: string) => CommandDefinition | undefined;
  /** List all available commands */
  listCommands: () => CommandDefinition[];
  /** Expand a command with arguments */
  expandCommand: (commandId: string, args?: Record<string, string>) => string | null;
}

/**
 * Create a Command tool instance
 */
export function createCommandTool(config: CommandToolConfig): Tool {
  const commands = config.listCommands();

  const definition: ToolDefinition = {
    name: 'SlashCommand',
    description: `Execute a predefined slash command. Commands are reusable workflows for common tasks.

Available commands:
${commands.map(c => {
  const args = c.arguments?.map(a => `${a.name}${a.required ? '' : '?'}`).join(', ') || '';
  return `- /${c.id}${args ? ` (${args})` : ''}: ${c.description}`;
}).join('\n')}

Usage:
- Provide the command_id (without leading /)
- Provide any required arguments`,
    input_schema: {
      type: 'object',
      properties: {
        command_id: {
          type: 'string',
          description: 'The command ID to execute (without leading /)',
          enum: commands.map(c => c.id),
        },
        arguments: {
          type: 'object',
          description: 'Arguments to pass to the command',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['command_id'],
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const commandInput = input as unknown as CommandToolInput;
    const { command_id, arguments: args } = commandInput;

    // Get command
    const command = config.getCommand(command_id);
    if (!command) {
      const available = config.listCommands().map(c => c.id).join(', ');
      return {
        success: false,
        error: `Command '${command_id}' not found. Available: ${available}`,
      };
    }

    // Validate required arguments
    if (command.arguments) {
      for (const arg of command.arguments) {
        if (arg.required && (!args || !args[arg.name])) {
          return {
            success: false,
            error: `Missing required argument '${arg.name}' for command /${command_id}`,
          };
        }
      }
    }

    // Expand the command prompt with arguments
    const expandedPrompt = config.expandCommand(command_id, args);
    if (!expandedPrompt) {
      return {
        success: false,
        error: `Failed to expand command /${command_id}`,
      };
    }

    // Return the expanded prompt for the orchestrator to execute
    return {
      success: true,
      output: {
        command_id,
        expanded_prompt: expandedPrompt,
        agents: command.agents,
        tools: command.tools,
        category: command.category,
      },
    };
  };

  return { definition, handler };
}

/**
 * Create a ListCommands tool for discovery
 */
export function createListCommandsTool(config: CommandToolConfig): Tool {
  const definition: ToolDefinition = {
    name: 'ListCommands',
    description: 'List all available slash commands with their descriptions and arguments',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category (optional)',
        },
      },
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const category = input.category as string | undefined;
    let commands = config.listCommands();

    if (category) {
      commands = commands.filter(c => c.category === category);
    }

    const formatted = commands.map(c => ({
      id: c.id,
      description: c.description,
      category: c.category,
      arguments: c.arguments?.map(a => ({
        name: a.name,
        description: a.description,
        required: a.required ?? false,
        default: a.default,
      })),
    }));

    return {
      success: true,
      output: {
        count: formatted.length,
        commands: formatted,
      },
    };
  };

  return { definition, handler };
}
