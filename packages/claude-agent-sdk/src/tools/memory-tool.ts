/**
 * Memory Tool - Persistent context management
 *
 * Allows the AI orchestrator to remember and recall information
 * across sessions and conversations.
 */

import type { Tool, ToolDefinition, ToolHandler, ToolResult, ToolParameterSchema } from './types.js';

/**
 * Memory entry interface
 */
export interface MemoryEntry {
  key: string;
  value: unknown;
  type: 'fact' | 'preference' | 'context' | 'instruction' | 'history';
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  tags?: string[];
  source?: string;
  priority?: number;
}

/**
 * Memory scope
 */
export type MemoryScope = 'session' | 'project' | 'global';

/**
 * Memory Tool Configuration
 */
export interface MemoryToolConfig {
  /** Remember something */
  remember: (
    key: string,
    value: unknown,
    options?: {
      scope?: MemoryScope;
      type?: MemoryEntry['type'];
      tags?: string[];
      source?: string;
      priority?: number;
      expiresIn?: number;
    }
  ) => Promise<void>;

  /** Recall a memory */
  recall: <T = unknown>(key: string, scope?: MemoryScope) => T | undefined;

  /** Query memories */
  query: (
    scope: MemoryScope,
    options?: {
      type?: MemoryEntry['type'];
      tags?: string[];
      source?: string;
      limit?: number;
    }
  ) => MemoryEntry[];

  /** Forget a memory */
  forget: (key: string, scope?: MemoryScope) => Promise<boolean>;

  /** Get context string for prompts */
  getContextString: (options?: {
    scopes?: MemoryScope[];
    types?: MemoryEntry['type'][];
    maxEntries?: number;
  }) => string;
}

/**
 * Create a Remember tool
 */
export function createRememberTool(config: MemoryToolConfig): Tool {
  const definition: ToolDefinition = {
    name: 'Remember',
    description: `Store information in memory for later recall. Use this to remember:
- Important facts about the project
- User preferences and decisions
- Context that should persist across sessions
- Instructions to follow

Memory scopes:
- session: Only for current conversation (ephemeral)
- project: Persists for this project
- global: Persists across all projects`,
    input_schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'A unique key to identify this memory',
        },
        value: {
          type: 'string',
          description: 'The value to remember (can be any JSON-serializable type, will be stored as-is)',
        },
        scope: {
          type: 'string',
          enum: ['session', 'project', 'global'],
          description: 'Where to store the memory (default: session)',
          default: 'session',
        },
        type: {
          type: 'string',
          enum: ['fact', 'preference', 'context', 'instruction', 'history'],
          description: 'Type of memory for categorization',
          default: 'context',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization and querying',
        },
        priority: {
          type: 'number',
          description: 'Priority (higher = more important)',
        },
        expires_in_ms: {
          type: 'number',
          description: 'Auto-expire after this many milliseconds',
        },
      },
      required: ['key', 'value'],
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const key = input.key as string;
    const value = input.value;
    const scope = (input.scope as MemoryScope) || 'session';
    const type = (input.type as MemoryEntry['type']) || 'context';
    const tags = input.tags as string[] | undefined;
    const priority = input.priority as number | undefined;
    const expiresIn = input.expires_in_ms as number | undefined;

    try {
      await config.remember(key, value, {
        scope,
        type,
        tags,
        priority,
        expiresIn,
        source: 'ai',
      });

      return {
        success: true,
        output: {
          key,
          scope,
          type,
          message: `Remembered "${key}" in ${scope} memory`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remember: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  return { definition, handler };
}

/**
 * Create a Recall tool
 */
export function createRecallTool(config: MemoryToolConfig): Tool {
  const definition: ToolDefinition = {
    name: 'Recall',
    description: `Retrieve a specific memory by key. Searches across scopes if not specified.`,
    input_schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'The key of the memory to recall',
        },
        scope: {
          type: 'string',
          enum: ['session', 'project', 'global'],
          description: 'Specific scope to search (optional)',
        },
      },
      required: ['key'],
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const key = input.key as string;
    const scope = input.scope as MemoryScope | undefined;

    const value = config.recall(key, scope);

    if (value === undefined) {
      return {
        success: false,
        error: `Memory "${key}" not found`,
      };
    }

    return {
      success: true,
      output: {
        key,
        value,
        found: true,
      },
    };
  };

  return { definition, handler };
}

/**
 * Create a QueryMemory tool
 */
export function createQueryMemoryTool(config: MemoryToolConfig): Tool {
  const definition: ToolDefinition = {
    name: 'QueryMemory',
    description: `Query memories by type, tags, or other criteria.`,
    input_schema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['session', 'project', 'global'],
          description: 'Scope to query',
          default: 'session',
        },
        type: {
          type: 'string',
          enum: ['fact', 'preference', 'context', 'instruction', 'history'],
          description: 'Filter by type',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags (any match)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return',
          default: 20,
        },
      },
      required: ['scope'],
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const scope = input.scope as MemoryScope;
    const type = input.type as MemoryEntry['type'] | undefined;
    const tags = input.tags as string[] | undefined;
    const limit = (input.limit as number) || 20;

    try {
      const entries = config.query(scope, { type, tags, limit });

      return {
        success: true,
        output: {
          scope,
          count: entries.length,
          entries: entries.map(e => ({
            key: e.key,
            value: e.value,
            type: e.type,
            tags: e.tags,
            priority: e.priority,
            updatedAt: e.updatedAt.toISOString(),
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to query memory: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  return { definition, handler };
}

/**
 * Create a Forget tool
 */
export function createForgetTool(config: MemoryToolConfig): Tool {
  const definition: ToolDefinition = {
    name: 'Forget',
    description: `Remove a memory by key.`,
    input_schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'The key of the memory to forget',
        },
        scope: {
          type: 'string',
          enum: ['session', 'project', 'global'],
          description: 'Specific scope (optional, removes from all if not specified)',
        },
      },
      required: ['key'],
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const key = input.key as string;
    const scope = input.scope as MemoryScope | undefined;

    try {
      const forgotten = await config.forget(key, scope);

      if (forgotten) {
        return {
          success: true,
          output: {
            key,
            forgotten: true,
            message: `Forgot "${key}"`,
          },
        };
      } else {
        return {
          success: false,
          error: `Memory "${key}" not found`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to forget: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  return { definition, handler };
}

/**
 * Create a GetMemoryContext tool
 */
export function createGetMemoryContextTool(config: MemoryToolConfig): Tool {
  const definition: ToolDefinition = {
    name: 'GetMemoryContext',
    description: `Get a formatted string of relevant memories for context.
    This is useful at the start of tasks to understand what has been learned.`,
    input_schema: {
      type: 'object',
      properties: {
        scopes: {
          type: 'array',
          items: { type: 'string', enum: ['session', 'project', 'global'] },
          description: 'Scopes to include (default: project, session)',
        },
        types: {
          type: 'array',
          items: { type: 'string', enum: ['fact', 'preference', 'context', 'instruction', 'history'] },
          description: 'Types to include (default: context, instruction, fact)',
        },
        max_entries: {
          type: 'number',
          description: 'Maximum entries to include (default: 20)',
        },
      },
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const scopes = input.scopes as MemoryScope[] | undefined;
    const types = input.types as MemoryEntry['type'][] | undefined;
    const maxEntries = input.max_entries as number | undefined;

    const context = config.getContextString({
      scopes,
      types,
      maxEntries,
    });

    return {
      success: true,
      output: {
        context: context || 'No relevant memories found.',
        hasMemories: !!context,
      },
    };
  };

  return { definition, handler };
}

/**
 * Create all memory tools
 */
export function createMemoryTools(config: MemoryToolConfig): {
  rememberTool: Tool;
  recallTool: Tool;
  queryMemoryTool: Tool;
  forgetTool: Tool;
  getMemoryContextTool: Tool;
} {
  return {
    rememberTool: createRememberTool(config),
    recallTool: createRecallTool(config),
    queryMemoryTool: createQueryMemoryTool(config),
    forgetTool: createForgetTool(config),
    getMemoryContextTool: createGetMemoryContextTool(config),
  };
}
