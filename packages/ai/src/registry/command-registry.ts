/**
 * Command Registry - Central registry for all commands
 *
 * Provides a unified interface for accessing commands from:
 * 1. File-based definitions (via CommandLoader)
 * 2. Programmatically registered commands
 *
 * Similar to Claude Code's slash command system.
 */

import * as path from 'path';
import { EventEmitter } from 'events';
import { CommandLoader, type CommandDefinition, type CommandArgument } from './command-loader';

export type { CommandDefinition, CommandArgument } from './command-loader';

/**
 * Options for creating the registry
 */
export interface CommandRegistryOptions {
  /** Directories to load commands from */
  commandsDirs: string[];
  /** Enable file watching for hot-reload */
  watch?: boolean;
  /** Base path for resolving relative directories */
  basePath?: string;
}

/**
 * CommandRegistry - Central command management
 */
export class CommandRegistry extends EventEmitter {
  private loader: CommandLoader;
  private runtimeCommands: Map<string, CommandDefinition> = new Map();
  private options: CommandRegistryOptions;
  private initialized: boolean = false;

  constructor(options: CommandRegistryOptions) {
    super();
    this.options = options;

    // Resolve directories relative to basePath if provided
    const resolvedDirs = options.commandsDirs.map(dir =>
      options.basePath ? path.resolve(options.basePath, dir) : dir
    );

    this.loader = new CommandLoader(resolvedDirs);

    // Forward change events from loader
    this.loader.on('change', () => {
      this.emit('change', this.list());
    });
  }

  /**
   * Initialize the registry - load all commands from files
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[CommandRegistry] Already initialized');
      return;
    }

    await this.loader.loadAll();

    if (this.options.watch) {
      this.loader.watch();
    }

    this.initialized = true;
    console.log(`[CommandRegistry] Initialized with ${this.count()} commands`);
  }

  /**
   * Register a command programmatically (runtime registration)
   * File-based commands cannot be overwritten this way
   */
  register(command: Omit<CommandDefinition, 'filePath'>): void {
    if (!command.id) {
      throw new Error('Command must have an id');
    }

    if (!command.description) {
      throw new Error('Command must have a description');
    }

    if (!command.prompt) {
      throw new Error('Command must have a prompt');
    }

    // Check if this would override a file-based command
    const fileCommand = this.loader.get(command.id);
    if (fileCommand) {
      throw new Error(`Cannot override file-based command '${command.id}'. Modify the file instead: ${fileCommand.filePath}`);
    }

    const fullCommand: CommandDefinition = {
      ...command,
      filePath: 'runtime'
    };

    this.runtimeCommands.set(command.id, fullCommand);
    console.log(`[CommandRegistry] Registered runtime command: /${command.id}`);

    this.emit('change', this.list());
  }

  /**
   * Unregister a runtime command
   * File-based commands cannot be unregistered
   */
  unregister(commandId: string): boolean {
    const id = commandId.startsWith('/') ? commandId.slice(1) : commandId;

    // Check if it's a file-based command
    const fileCommand = this.loader.get(id);
    if (fileCommand) {
      throw new Error(`Cannot unregister file-based command '${id}'. Delete the file instead: ${fileCommand.filePath}`);
    }

    const removed = this.runtimeCommands.delete(id);

    if (removed) {
      console.log(`[CommandRegistry] Unregistered command: /${id}`);
      this.emit('change', this.list());
    }

    return removed;
  }

  /**
   * Get a command by ID
   * Checks file-based commands first, then runtime commands
   */
  get(commandId: string): CommandDefinition | undefined {
    const id = commandId.startsWith('/') ? commandId.slice(1) : commandId;

    // File-based commands take precedence
    const fileCommand = this.loader.get(id);
    if (fileCommand) {
      return fileCommand;
    }

    return this.runtimeCommands.get(id);
  }

  /**
   * List all commands (file-based + runtime)
   */
  list(): CommandDefinition[] {
    const fileCommands = this.loader.list();
    const runtimeCommands = Array.from(this.runtimeCommands.values());

    // Combine, with file-based taking precedence
    const commandMap = new Map<string, CommandDefinition>();

    for (const cmd of runtimeCommands) {
      commandMap.set(cmd.id, cmd);
    }

    for (const cmd of fileCommands) {
      commandMap.set(cmd.id, cmd);
    }

    return Array.from(commandMap.values());
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
   * Check if a command exists
   */
  has(commandId: string): boolean {
    return this.get(commandId) !== undefined;
  }

  /**
   * Get the count of all commands
   */
  count(): number {
    return this.list().length;
  }

  /**
   * Generate help catalog for display
   */
  generateCatalog(): string {
    return this.loader.generateCatalog();
  }

  /**
   * Get all command IDs
   */
  getCommandIds(): string[] {
    return this.list().map(c => c.id);
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Stop watching for file changes
   */
  stopWatching(): void {
    this.loader.stopWatching();
  }

  /**
   * Reload all commands from files
   */
  async reload(): Promise<void> {
    await this.loader.loadAll();
    this.emit('change', this.list());
  }

  /**
   * Execute a command with arguments
   * Returns the expanded prompt with arguments substituted
   */
  expandCommand(commandId: string, args: Record<string, string> = {}): string | null {
    return this.loader.expandCommand(commandId, args);
  }

  /**
   * Parse command invocation string
   * e.g., "/generate-app my-app ecommerce" -> { commandId: "generate-app", args: { name: "my-app", template: "ecommerce" } }
   */
  parseInvocation(input: string): { commandId: string; args: Record<string, string> } | null {
    if (!input.startsWith('/')) return null;

    const parts = input.slice(1).split(/\s+/);
    const commandId = parts[0];
    const argValues = parts.slice(1);

    const command = this.get(commandId);
    if (!command) return null;

    const args: Record<string, string> = {};

    // Map positional arguments to named arguments
    if (command.arguments) {
      for (let i = 0; i < command.arguments.length && i < argValues.length; i++) {
        args[command.arguments[i].name] = argValues[i];
      }
    }

    return { commandId, args };
  }
}

/**
 * Default registry instance
 */
let defaultCommandRegistry: CommandRegistry | null = null;

/**
 * Get or create the default command registry instance
 */
export function getDefaultCommandRegistry(basePath?: string): CommandRegistry {
  if (!defaultCommandRegistry) {
    defaultCommandRegistry = new CommandRegistry({
      commandsDirs: ['commands/builtin', 'commands/custom'],
      basePath: basePath || process.cwd(),
      watch: process.env.NODE_ENV !== 'production'
    });
  }
  return defaultCommandRegistry;
}

/**
 * Create a custom command registry instance
 */
export function createCommandRegistry(options: CommandRegistryOptions): CommandRegistry {
  return new CommandRegistry(options);
}
