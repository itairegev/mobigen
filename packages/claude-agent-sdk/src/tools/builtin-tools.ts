/**
 * Built-in Tools for Claude Agent SDK
 *
 * Standard tools available to all agents: Read, Write, Edit, Bash, Glob, Grep
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import type { Tool, ToolDefinition, ToolHandler, ToolResult } from './types.js';

// Dynamic import for glob to avoid type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let glob: (pattern: string, options: Record<string, unknown>) => Promise<string[]>;

// Initialize glob lazily
async function getGlob(): Promise<typeof glob> {
  if (!glob) {
    const globModule = await import('glob');
    glob = globModule.glob;
  }
  return glob;
}

// ============================================================================
// READ TOOL
// ============================================================================

const readDefinition: ToolDefinition = {
  name: 'Read',
  description: 'Read contents of a file from the filesystem',
  input_schema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute path to the file to read'
      },
      offset: {
        type: 'number',
        description: 'Line number to start reading from (1-indexed)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of lines to read'
      }
    },
    required: ['file_path']
  }
};

const readHandler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
  const filePath = input.file_path as string;
  const offset = (input.offset as number) || 1;
  const limit = (input.limit as number) || 2000;

  try {
    const content = await fsPromises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Apply offset and limit
    const startLine = Math.max(0, offset - 1);
    const endLine = Math.min(lines.length, startLine + limit);
    const selectedLines = lines.slice(startLine, endLine);

    // Format with line numbers
    const formatted = selectedLines
      .map((line, i) => `${(startLine + i + 1).toString().padStart(6)}\t${line}`)
      .join('\n');

    return {
      success: true,
      output: formatted
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export const ReadTool: Tool = {
  definition: readDefinition,
  handler: readHandler
};

// ============================================================================
// WRITE TOOL
// ============================================================================

const writeDefinition: ToolDefinition = {
  name: 'Write',
  description: 'Write content to a file, creating directories as needed',
  input_schema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute path to the file to write'
      },
      content: {
        type: 'string',
        description: 'Content to write to the file'
      }
    },
    required: ['file_path', 'content']
  }
};

const writeHandler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
  const filePath = input.file_path as string;
  const content = input.content as string;

  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    await fsPromises.mkdir(dir, { recursive: true });

    await fsPromises.writeFile(filePath, content, 'utf-8');

    return {
      success: true,
      output: `File written successfully: ${filePath}`
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to write file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export const WriteTool: Tool = {
  definition: writeDefinition,
  handler: writeHandler
};

// ============================================================================
// EDIT TOOL
// ============================================================================

const editDefinition: ToolDefinition = {
  name: 'Edit',
  description: 'Replace a specific string in a file with a new string',
  input_schema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute path to the file to edit'
      },
      old_string: {
        type: 'string',
        description: 'The exact string to find and replace'
      },
      new_string: {
        type: 'string',
        description: 'The string to replace it with'
      },
      replace_all: {
        type: 'boolean',
        description: 'Replace all occurrences instead of just the first',
        default: false
      }
    },
    required: ['file_path', 'old_string', 'new_string']
  }
};

const editHandler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
  const filePath = input.file_path as string;
  const oldString = input.old_string as string;
  const newString = input.new_string as string;
  const replaceAll = (input.replace_all as boolean) || false;

  try {
    const content = await fsPromises.readFile(filePath, 'utf-8');

    // Check if old_string exists
    if (!content.includes(oldString)) {
      return {
        success: false,
        error: `String not found in file: "${oldString.substring(0, 50)}..."`
      };
    }

    // Check for uniqueness if not replacing all
    if (!replaceAll) {
      const count = content.split(oldString).length - 1;
      if (count > 1) {
        return {
          success: false,
          error: `String found ${count} times. Use replace_all: true or provide more context to make it unique.`
        };
      }
    }

    // Perform replacement
    const newContent = replaceAll
      ? content.split(oldString).join(newString)
      : content.replace(oldString, newString);

    await fsPromises.writeFile(filePath, newContent, 'utf-8');

    return {
      success: true,
      output: `File edited successfully: ${filePath}`
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to edit file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export const EditTool: Tool = {
  definition: editDefinition,
  handler: editHandler
};

// ============================================================================
// BASH TOOL
// ============================================================================

const bashDefinition: ToolDefinition = {
  name: 'Bash',
  description: 'Execute a bash command and return the output',
  input_schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The bash command to execute'
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 120000)',
        default: 120000
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the command'
      }
    },
    required: ['command']
  }
};

const bashHandler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
  const command = input.command as string;
  const timeout = (input.timeout as number) || 120000;
  const cwd = input.cwd as string | undefined;

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout,
      cwd,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return {
      success: true,
      output: output.trim()
    };
  } catch (error: unknown) {
    const err = error as { message?: string; stderr?: Buffer; stdout?: Buffer; status?: number };
    const stderr = err.stderr?.toString() || '';
    const stdout = err.stdout?.toString() || '';
    const exitCode = err.status || 1;

    return {
      success: false,
      error: `Command failed (exit code ${exitCode}):\n${stderr || stdout || err.message || 'Unknown error'}`
    };
  }
};

export const BashTool: Tool = {
  definition: bashDefinition,
  handler: bashHandler
};

// ============================================================================
// GLOB TOOL
// ============================================================================

const globDefinition: ToolDefinition = {
  name: 'Glob',
  description: 'Find files matching a glob pattern',
  input_schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Glob pattern to match files (e.g., "**/*.ts")'
      },
      path: {
        type: 'string',
        description: 'Directory to search in (defaults to current working directory)'
      }
    },
    required: ['pattern']
  }
};

const globHandler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
  const pattern = input.pattern as string;
  const searchPath = (input.path as string) || process.cwd();

  try {
    const globFn = await getGlob();
    const files = await globFn(pattern, {
      cwd: searchPath,
      absolute: true,
      nodir: true,
      ignore: ['**/node_modules/**', '**/.git/**']
    });

    if (files.length === 0) {
      return {
        success: true,
        output: 'No files found matching pattern'
      };
    }

    return {
      success: true,
      output: files.join('\n')
    };
  } catch (error) {
    return {
      success: false,
      error: `Glob failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export const GlobTool: Tool = {
  definition: globDefinition,
  handler: globHandler
};

// ============================================================================
// GREP TOOL
// ============================================================================

const grepDefinition: ToolDefinition = {
  name: 'Grep',
  description: 'Search for a pattern in files using ripgrep',
  input_schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Regular expression pattern to search for'
      },
      path: {
        type: 'string',
        description: 'File or directory to search in'
      },
      glob: {
        type: 'string',
        description: 'Glob pattern to filter files (e.g., "*.ts")'
      },
      output_mode: {
        type: 'string',
        description: 'Output mode: "content" for matching lines, "files_with_matches" for file paths only',
        enum: ['content', 'files_with_matches', 'count'],
        default: 'files_with_matches'
      },
      '-i': {
        type: 'boolean',
        description: 'Case insensitive search'
      },
      '-C': {
        type: 'number',
        description: 'Number of context lines before and after match'
      }
    },
    required: ['pattern']
  }
};

const grepHandler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
  const pattern = input.pattern as string;
  const searchPath = (input.path as string) || '.';
  const globPattern = input.glob as string | undefined;
  const outputMode = (input.output_mode as string) || 'files_with_matches';
  const caseInsensitive = input['-i'] as boolean;
  const context = input['-C'] as number | undefined;

  // Build rg command
  const args = ['rg', '--no-heading'];

  if (caseInsensitive) args.push('-i');
  if (globPattern) args.push('--glob', globPattern);

  if (outputMode === 'files_with_matches') {
    args.push('-l');
  } else if (outputMode === 'count') {
    args.push('-c');
  } else {
    args.push('-n');
    if (context) args.push('-C', context.toString());
  }

  args.push(pattern, searchPath);

  try {
    const output = execSync(args.join(' '), {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return {
      success: true,
      output: output.trim() || 'No matches found'
    };
  } catch (error: unknown) {
    const err = error as { status?: number; stdout?: Buffer };
    // Exit code 1 means no matches (not an error)
    if (err.status === 1) {
      return {
        success: true,
        output: 'No matches found'
      };
    }

    return {
      success: false,
      error: `Grep failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export const GrepTool: Tool = {
  definition: grepDefinition,
  handler: grepHandler
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All built-in tools
 */
export const builtinTools: Record<string, Tool> = {
  Read: ReadTool,
  Write: WriteTool,
  Edit: EditTool,
  Bash: BashTool,
  Glob: GlobTool,
  Grep: GrepTool
};

/**
 * Get tool definitions for API calls
 */
export function getToolDefinitions(allowedTools?: string[]): ToolDefinition[] {
  const tools = Object.values(builtinTools);

  if (!allowedTools) {
    return tools.map(t => t.definition);
  }

  return tools
    .filter(t => allowedTools.includes(t.definition.name))
    .map(t => t.definition);
}

/**
 * Execute a tool by name
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  customTools?: Record<string, Tool>
): Promise<ToolResult> {
  // Check custom tools first
  if (customTools && customTools[name]) {
    return customTools[name].handler(input);
  }

  // Then check built-in tools
  const tool = builtinTools[name];
  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${name}`
    };
  }

  return tool.handler(input);
}
