/**
 * Skill Registry - Central registry for all skills
 *
 * Provides a unified interface for accessing skills from:
 * 1. File-based definitions (via SkillLoader)
 * 2. Programmatically registered skills
 *
 * Skills are reusable capabilities that can be composed and invoked by agents.
 */

import * as path from 'path';
import { EventEmitter } from 'events';
import { SkillLoader, type SkillDefinition, type SkillInput, type SkillOutput } from './skill-loader';

export type { SkillDefinition, SkillInput, SkillOutput } from './skill-loader';

/**
 * Options for creating the registry
 */
export interface SkillRegistryOptions {
  /** Directories to load skills from */
  skillsDirs: string[];
  /** Enable file watching for hot-reload */
  watch?: boolean;
  /** Base path for resolving relative directories */
  basePath?: string;
}

/**
 * SkillRegistry - Central skill management
 */
export class SkillRegistry extends EventEmitter {
  private loader: SkillLoader;
  private runtimeSkills: Map<string, SkillDefinition> = new Map();
  private options: SkillRegistryOptions;
  private initialized: boolean = false;

  constructor(options: SkillRegistryOptions) {
    super();
    this.options = options;

    // Resolve directories relative to basePath if provided
    const resolvedDirs = options.skillsDirs.map(dir =>
      options.basePath ? path.resolve(options.basePath, dir) : dir
    );

    this.loader = new SkillLoader(resolvedDirs);

    // Forward change events from loader
    this.loader.on('change', () => {
      this.emit('change', this.list());
    });
  }

  /**
   * Initialize the registry - load all skills from files
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[SkillRegistry] Already initialized');
      return;
    }

    await this.loader.loadAll();

    if (this.options.watch) {
      this.loader.watch();
    }

    this.initialized = true;
    console.log(`[SkillRegistry] Initialized with ${this.count()} skills`);
  }

  /**
   * Register a skill programmatically (runtime registration)
   * File-based skills cannot be overwritten this way
   */
  register(skill: Omit<SkillDefinition, 'filePath'>): void {
    if (!skill.id) {
      throw new Error('Skill must have an id');
    }

    if (!skill.description) {
      throw new Error('Skill must have a description');
    }

    if (!skill.prompt) {
      throw new Error('Skill must have a prompt');
    }

    // Check if this would override a file-based skill
    const fileSkill = this.loader.get(skill.id);
    if (fileSkill) {
      throw new Error(`Cannot override file-based skill '${skill.id}'. Modify the file instead: ${fileSkill.filePath}`);
    }

    const fullSkill: SkillDefinition = {
      ...skill,
      filePath: 'runtime'
    };

    this.runtimeSkills.set(skill.id, fullSkill);
    console.log(`[SkillRegistry] Registered runtime skill: ${skill.id}`);

    this.emit('change', this.list());
  }

  /**
   * Unregister a runtime skill
   * File-based skills cannot be unregistered
   */
  unregister(skillId: string): boolean {
    // Check if it's a file-based skill
    const fileSkill = this.loader.get(skillId);
    if (fileSkill) {
      throw new Error(`Cannot unregister file-based skill '${skillId}'. Delete the file instead: ${fileSkill.filePath}`);
    }

    const removed = this.runtimeSkills.delete(skillId);

    if (removed) {
      console.log(`[SkillRegistry] Unregistered skill: ${skillId}`);
      this.emit('change', this.list());
    }

    return removed;
  }

  /**
   * Get a skill by ID
   * Checks file-based skills first, then runtime skills
   */
  get(skillId: string): SkillDefinition | undefined {
    // File-based skills take precedence
    const fileSkill = this.loader.get(skillId);
    if (fileSkill) {
      return fileSkill;
    }

    return this.runtimeSkills.get(skillId);
  }

  /**
   * List all skills (file-based + runtime)
   */
  list(): SkillDefinition[] {
    const fileSkills = this.loader.list();
    const runtimeSkills = Array.from(this.runtimeSkills.values());

    // Combine, with file-based taking precedence
    const skillMap = new Map<string, SkillDefinition>();

    for (const skill of runtimeSkills) {
      skillMap.set(skill.id, skill);
    }

    for (const skill of fileSkills) {
      skillMap.set(skill.id, skill);
    }

    return Array.from(skillMap.values());
  }

  /**
   * Find skills by capability
   */
  findByCapability(capability: string): SkillDefinition[] {
    return this.list().filter(skill =>
      skill.capabilities?.includes(capability)
    );
  }

  /**
   * Find skills by category
   */
  findByCategory(category: string): SkillDefinition[] {
    return this.list().filter(skill => skill.category === category);
  }

  /**
   * Find skills compatible with an agent
   */
  findCompatibleSkills(agentId: string): SkillDefinition[] {
    return this.list()
      .filter(skill =>
        !skill.compatibleAgents || skill.compatibleAgents.includes(agentId)
      )
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Find skills that can run in parallel
   */
  findParallelizable(): SkillDefinition[] {
    return this.list().filter(skill => skill.parallelizable !== false);
  }

  /**
   * Check if a skill exists
   */
  has(skillId: string): boolean {
    return this.get(skillId) !== undefined;
  }

  /**
   * Get the count of all skills
   */
  count(): number {
    return this.list().length;
  }

  /**
   * Generate catalog for AI context
   */
  generateCatalog(): string {
    return this.loader.generateCatalog();
  }

  /**
   * Get all skill IDs
   */
  getSkillIds(): string[] {
    return this.list().map(s => s.id);
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
   * Reload all skills from files
   */
  async reload(): Promise<void> {
    await this.loader.loadAll();
    this.emit('change', this.list());
  }

  /**
   * Get skills that require specific tools
   */
  findRequiringTools(tools: string[]): SkillDefinition[] {
    return this.list().filter(skill =>
      skill.tools?.some(t => tools.includes(t))
    );
  }

  /**
   * Get skills sorted by priority
   */
  listByPriority(): SkillDefinition[] {
    return this.list().sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
}

/**
 * Default registry instance
 */
let defaultSkillRegistry: SkillRegistry | null = null;

/**
 * Get or create the default skill registry instance
 */
export function getDefaultSkillRegistry(basePath?: string): SkillRegistry {
  if (!defaultSkillRegistry) {
    defaultSkillRegistry = new SkillRegistry({
      skillsDirs: ['skills/builtin', 'skills/custom'],
      basePath: basePath || process.cwd(),
      watch: process.env.NODE_ENV !== 'production'
    });
  }
  return defaultSkillRegistry;
}

/**
 * Create a custom skill registry instance
 */
export function createSkillRegistry(options: SkillRegistryOptions): SkillRegistry {
  return new SkillRegistry(options);
}
