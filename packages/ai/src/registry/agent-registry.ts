/**
 * Agent Registry - Central registry for all agents
 *
 * Provides a unified interface for accessing agents from:
 * 1. File-based definitions (via AgentLoader)
 * 2. Programmatically registered agents
 *
 * Features:
 * - Automatic loading from agents/ directories
 * - Hot-reload support for file changes
 * - Runtime registration/unregistration
 * - Agent discovery by capability
 */

import * as path from 'path';
import { EventEmitter } from 'events';
import { AgentLoader, type AgentDefinition } from './agent-loader';

export type { AgentDefinition } from './agent-loader';

/**
 * Options for creating the registry
 */
export interface RegistryOptions {
  /** Directories to load agents from */
  agentsDirs: string[];
  /** Enable file watching for hot-reload */
  watch?: boolean;
  /** Base path for resolving relative directories */
  basePath?: string;
}

/**
 * AgentRegistry - Central agent management
 */
export class AgentRegistry extends EventEmitter {
  private loader: AgentLoader;
  private runtimeAgents: Map<string, AgentDefinition> = new Map();
  private options: RegistryOptions;
  private initialized: boolean = false;

  constructor(options: RegistryOptions) {
    super();
    this.options = options;

    // Resolve directories relative to basePath if provided
    const resolvedDirs = options.agentsDirs.map(dir =>
      options.basePath ? path.resolve(options.basePath, dir) : dir
    );

    this.loader = new AgentLoader(resolvedDirs);

    // Forward change events from loader
    this.loader.on('change', () => {
      this.emit('change', this.list());
    });
  }

  /**
   * Initialize the registry - load all agents from files
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[AgentRegistry] Already initialized');
      return;
    }

    await this.loader.loadAll();

    if (this.options.watch) {
      this.loader.watch();
    }

    this.initialized = true;
    console.log(`[AgentRegistry] Initialized with ${this.count()} agents`);
  }

  /**
   * Register an agent programmatically (runtime registration)
   * File-based agents cannot be overwritten this way
   */
  register(agent: Omit<AgentDefinition, 'filePath'>): void {
    if (!agent.id) {
      throw new Error('Agent must have an id');
    }

    if (!agent.description) {
      throw new Error('Agent must have a description');
    }

    if (!agent.prompt) {
      throw new Error('Agent must have a prompt');
    }

    // Check if this would override a file-based agent
    const fileAgent = this.loader.get(agent.id);
    if (fileAgent) {
      throw new Error(`Cannot override file-based agent '${agent.id}'. Modify the file instead: ${fileAgent.filePath}`);
    }

    const fullAgent: AgentDefinition = {
      ...agent,
      filePath: 'runtime' // Mark as runtime-registered
    };

    this.runtimeAgents.set(agent.id, fullAgent);
    console.log(`[AgentRegistry] Registered runtime agent: ${agent.id}`);

    this.emit('change', this.list());
  }

  /**
   * Unregister a runtime agent
   * File-based agents cannot be unregistered
   */
  unregister(agentId: string): boolean {
    // Check if it's a file-based agent
    const fileAgent = this.loader.get(agentId);
    if (fileAgent) {
      throw new Error(`Cannot unregister file-based agent '${agentId}'. Delete the file instead: ${fileAgent.filePath}`);
    }

    const removed = this.runtimeAgents.delete(agentId);

    if (removed) {
      console.log(`[AgentRegistry] Unregistered agent: ${agentId}`);
      this.emit('change', this.list());
    }

    return removed;
  }

  /**
   * Get an agent by ID
   * Checks file-based agents first, then runtime agents
   */
  get(agentId: string): AgentDefinition | undefined {
    // File-based agents take precedence
    const fileAgent = this.loader.get(agentId);
    if (fileAgent) {
      return fileAgent;
    }

    return this.runtimeAgents.get(agentId);
  }

  /**
   * List all agents (file-based + runtime)
   */
  list(): AgentDefinition[] {
    const fileAgents = this.loader.list();
    const runtimeAgents = Array.from(this.runtimeAgents.values());

    // Combine, with file-based taking precedence
    const agentMap = new Map<string, AgentDefinition>();

    for (const agent of runtimeAgents) {
      agentMap.set(agent.id, agent);
    }

    for (const agent of fileAgents) {
      agentMap.set(agent.id, agent);
    }

    return Array.from(agentMap.values());
  }

  /**
   * Find agents by capability
   */
  findByCapability(capability: string): AgentDefinition[] {
    return this.list().filter(agent =>
      agent.capabilities?.includes(capability)
    );
  }

  /**
   * Find agents that can be delegated to by a specific agent
   */
  findDelegatable(agentId: string): AgentDefinition[] {
    const agent = this.get(agentId);
    if (!agent || !agent.canDelegate?.length) {
      return [];
    }

    return agent.canDelegate
      .map(id => this.get(id))
      .filter((a): a is AgentDefinition => a !== undefined);
  }

  /**
   * Check if an agent exists
   */
  has(agentId: string): boolean {
    return this.get(agentId) !== undefined;
  }

  /**
   * Get the count of all agents
   */
  count(): number {
    return this.list().length;
  }

  /**
   * Generate catalog for AI orchestrator
   */
  generateCatalog(): string {
    return this.loader.generateCatalog();
  }

  /**
   * Get all agent IDs
   */
  getAgentIds(): string[] {
    return this.list().map(a => a.id);
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
   * Reload all agents from files
   */
  async reload(): Promise<void> {
    await this.loader.loadAll();
    this.emit('change', this.list());
  }
}

/**
 * Default registry instance
 * Uses standard paths relative to mobigen root
 */
let defaultRegistry: AgentRegistry | null = null;

/**
 * Get or create the default registry instance
 */
export function getDefaultRegistry(basePath?: string): AgentRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new AgentRegistry({
      agentsDirs: ['agents/builtin', 'agents/custom'],
      basePath: basePath || process.cwd(),
      watch: process.env.NODE_ENV !== 'production'
    });
  }
  return defaultRegistry;
}

/**
 * Create a custom registry instance
 */
export function createRegistry(options: RegistryOptions): AgentRegistry {
  return new AgentRegistry(options);
}
