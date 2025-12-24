/**
 * Command Loader - File-based command discovery
 *
 * Loads command definitions from markdown files with YAML frontmatter.
 * Commands are slash-command style prompts that can be invoked by name.
 * Similar to Claude Code's .claude/commands/ system.
 *
 * Supports hot-reloading when files change.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Command definition loaded from a markdown file
 */
export interface CommandDefinition {
  /** Unique command identifier (without leading /) */
  id: string;
  /** Human-readable description */
  description: string;
  /** The prompt template (body of markdown) */
  prompt: string;
  /** Arguments the command accepts */
  arguments?: CommandArgument[];
  /** Category for grouping commands */
  category?: string;
  /** Whether this command is hidden from help */
  hidden?: boolean;
  /** Agents this command should use */
  agents?: string[];
  /** Tools this command needs access to */
  tools?: string[];
  /** Path to the source file */
  filePath: string;
}

/**
 * Command argument definition
 */
export interface CommandArgument {
  name: string;
  description: string;
  required?: boolean;
  default?: string;
}

/**
 * Frontmatter parsed from command markdown file
 */
interface CommandFrontmatter {
  id: string;
  description: string;
  arguments?: CommandArgument[];
  category?: string;
  hidden?: boolean;
  agents?: string[];
  tools?: string[];
}

/**
 * Parse YAML-like frontmatter from markdown content
 * Reuses the same simple YAML parser as agent-loader
 */
function parseFrontmatter(content: string): { frontmatter: CommandFrontmatter; body: string } | null {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  const yamlContent = match[1];
  const body = match[2].trim();

  // Simple YAML parser for our specific format
  const frontmatter: Record<string, unknown> = {};
  const lines = yamlContent.split('\n');
  let currentKey: string | null = null;
  let currentArray: unknown[] | null = null;
  let inArgumentBlock = false;
  let currentArgument: Record<string, unknown> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Check for array item with object (for arguments)
    if (trimmed.startsWith('- ') && currentKey === 'arguments') {
      // Start a new argument object
      if (currentArgument && currentArray) {
        currentArray.push(currentArgument);
      }
      currentArgument = {};
      inArgumentBlock = true;

      // Parse the first property on the same line if present
      const firstProp = trimmed.slice(2).trim();
      if (firstProp.includes(':')) {
        const [key, ...valueParts] = firstProp.split(':');
        const value = valueParts.join(':').trim();
        if (key && value) {
          currentArgument[key.trim()] = parseValue(value);
        }
      }
      continue;
    }

    // Check for property within argument block (indented)
    if (inArgumentBlock && line.startsWith('    ') && currentArgument) {
      const propMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (propMatch) {
        currentArgument[propMatch[1]] = parseValue(propMatch[2]);
      }
      continue;
    }

    // Check for simple array item
    if (trimmed.startsWith('- ') && currentKey && currentArray !== null && !inArgumentBlock) {
      currentArray.push(trimmed.slice(2).trim());
      continue;
    }

    // Check for key-value pair
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      // Save previous array if exists
      if (currentKey && currentArray !== null) {
        if (currentKey === 'arguments' && currentArgument) {
          currentArray.push(currentArgument);
        }
        frontmatter[currentKey] = currentArray;
      }

      inArgumentBlock = false;
      currentArgument = null;
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      // Check if this is the start of an array
      if (value === '' || value === '[]') {
        currentArray = [];
      } else {
        currentArray = null;
        frontmatter[currentKey] = parseValue(value);
      }
    }
  }

  // Save final array if exists
  if (currentKey && currentArray !== null) {
    if (currentKey === 'arguments' && currentArgument) {
      currentArray.push(currentArgument);
    }
    frontmatter[currentKey] = currentArray;
  }

  return {
    frontmatter: frontmatter as unknown as CommandFrontmatter,
    body
  };
}

/**
 * Parse a YAML value
 */
function parseValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(Number(value)) && value !== '') return Number(value);
  return value.replace(/^["']|["']$/g, '');
}

/**
 * CommandLoader - Loads and watches command definition files
 */
export class CommandLoader extends EventEmitter {
  private commandsDirs: string[];
  private commands: Map<string, CommandDefinition> = new Map();
  private watchers: fs.FSWatcher[] = [];
  private initialized: boolean = false;

  constructor(commandsDirs: string[]) {
    super();
    this.commandsDirs = commandsDirs;
  }

  /**
   * Load all commands from the configured directories
   */
  async loadAll(): Promise<Map<string, CommandDefinition>> {
    this.commands.clear();

    for (const dir of this.commandsDirs) {
      if (!fs.existsSync(dir)) {
        console.log(`[CommandLoader] Directory not found, skipping: ${dir}`);
        continue;
      }

      await this.loadDirectory(dir);
    }

    this.initialized = true;
    console.log(`[CommandLoader] Loaded ${this.commands.size} commands`);

    return this.commands;
  }

  /**
   * Load commands from a single directory
   */
  private async loadDirectory(dir: string): Promise<void> {
    try {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively load subdirectories
          await this.loadDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          await this.loadCommandFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`[CommandLoader] Error loading directory ${dir}:`, error);
    }
  }

  /**
   * Load a single command file
   */
  private async loadCommandFile(filePath: string): Promise<CommandDefinition | null> {
    try {
      const content = await fsPromises.readFile(filePath, 'utf-8');
      const parsed = parseFrontmatter(content);

      if (!parsed) {
        console.warn(`[CommandLoader] No frontmatter found in ${filePath}`);
        return null;
      }

      const { frontmatter, body } = parsed;

      // If no id, derive from filename
      const id = frontmatter.id || path.basename(filePath, '.md');

      if (!frontmatter.description) {
        console.warn(`[CommandLoader] No description in frontmatter of ${filePath}`);
        return null;
      }

      const command: CommandDefinition = {
        id,
        description: frontmatter.description,
        prompt: body,
        arguments: frontmatter.arguments,
        category: frontmatter.category,
        hidden: frontmatter.hidden,
        agents: frontmatter.agents,
        tools: frontmatter.tools,
        filePath
      };

      this.commands.set(command.id, command);
      console.log(`[CommandLoader] Loaded command: /${command.id} from ${filePath}`);

      return command;
    } catch (error) {
      console.error(`[CommandLoader] Error loading command file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Watch for changes in command directories
   */
  watch(callback?: (commands: Map<string, CommandDefinition>) => void): void {
    this.stopWatching();

    for (const dir of this.commandsDirs) {
      if (!fs.existsSync(dir)) {
        continue;
      }

      try {
        const watcher = fs.watch(dir, { recursive: true }, async (eventType, filename) => {
          if (!filename || !filename.endsWith('.md')) {
            return;
          }

          const fullPath = path.join(dir, filename);
          console.log(`[CommandLoader] File ${eventType}: ${fullPath}`);

          if (eventType === 'rename') {
            if (fs.existsSync(fullPath)) {
              await this.loadCommandFile(fullPath);
            } else {
              // File removed - find and remove command by filePath
              for (const [id, command] of this.commands) {
                if (command.filePath === fullPath) {
                  this.commands.delete(id);
                  console.log(`[CommandLoader] Removed command: /${id}`);
                  break;
                }
              }
            }
          } else if (eventType === 'change') {
            await this.loadCommandFile(fullPath);
          }

          this.emit('change', this.commands);

          if (callback) {
            callback(this.commands);
          }
        });

        this.watchers.push(watcher);
        console.log(`[CommandLoader] Watching directory: ${dir}`);
      } catch (error) {
        console.error(`[CommandLoader] Error watching directory ${dir}:`, error);
      }
    }
  }

  /**
   * Stop watching for changes
   */
  stopWatching(): void {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
  }

  /**
   * Get a command by ID
   */
  get(commandId: string): CommandDefinition | undefined {
    // Support both with and without leading /
    const id = commandId.startsWith('/') ? commandId.slice(1) : commandId;
    return this.commands.get(id);
  }

  /**
   * List all loaded commands
   */
  list(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * List visible commands (not hidden)
   */
  listVisible(): CommandDefinition[] {
    return this.list().filter(cmd => !cmd.hidden);
  }

  /**
   * Find commands by category
   */
  findByCategory(category: string): CommandDefinition[] {
    return this.list().filter(cmd => cmd.category === category);
  }

  /**
   * Generate a help catalog string
   */
  generateCatalog(): string {
    const commands = this.listVisible();

    if (commands.length === 0) {
      return 'No commands available.';
    }

    // Group by category
    const byCategory = new Map<string, CommandDefinition[]>();
    for (const cmd of commands) {
      const category = cmd.category || 'General';
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(cmd);
    }

    const sections: string[] = [];

    for (const [category, cmds] of byCategory) {
      const lines = [`## ${category}\n`];
      for (const cmd of cmds) {
        lines.push(`### /${cmd.id}`);
        lines.push(`${cmd.description}`);
        if (cmd.arguments?.length) {
          lines.push('**Arguments:**');
          for (const arg of cmd.arguments) {
            const required = arg.required ? ' (required)' : '';
            const defaultVal = arg.default ? ` [default: ${arg.default}]` : '';
            lines.push(`- \`${arg.name}\`${required}${defaultVal}: ${arg.description}`);
          }
        }
        lines.push('');
      }
      sections.push(lines.join('\n'));
    }

    return sections.join('\n');
  }

  /**
   * Check if the loader is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the count of loaded commands
   */
  count(): number {
    return this.commands.size;
  }

  /**
   * Execute a command with arguments
   * Returns the expanded prompt with arguments substituted
   */
  expandCommand(commandId: string, args: Record<string, string> = {}): string | null {
    const command = this.get(commandId);
    if (!command) return null;

    let prompt = command.prompt;

    // Substitute arguments in the prompt
    // Format: {{argName}} or $argName
    for (const [key, value] of Object.entries(args)) {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      prompt = prompt.replace(new RegExp(`\\$${key}\\b`, 'g'), value);
    }

    // Fill in defaults for missing arguments
    if (command.arguments) {
      for (const arg of command.arguments) {
        if (arg.default && !args[arg.name]) {
          prompt = prompt.replace(new RegExp(`\\{\\{${arg.name}\\}\\}`, 'g'), arg.default);
          prompt = prompt.replace(new RegExp(`\\$${arg.name}\\b`, 'g'), arg.default);
        }
      }
    }

    return prompt;
  }
}
