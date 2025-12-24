/**
 * Memory Manager - Persistent context and memory across sessions
 *
 * Provides multi-level memory storage for maintaining context:
 * 1. Session Memory - Ephemeral, within a single conversation
 * 2. Project Memory - Persists for a specific project
 * 3. Global Memory - User preferences and cross-project context
 *
 * Similar to Claude Code's memory and CLAUDE.md system.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Memory entry with metadata
 */
export interface MemoryEntry {
  /** Unique key for this memory */
  key: string;
  /** The actual content/value */
  value: unknown;
  /** Type of memory */
  type: 'fact' | 'preference' | 'context' | 'instruction' | 'history';
  /** When this was created */
  createdAt: Date;
  /** When this was last updated */
  updatedAt: Date;
  /** Optional expiration time */
  expiresAt?: Date;
  /** Tags for categorization */
  tags?: string[];
  /** Source of this memory (agent, user, system) */
  source?: string;
  /** Priority (higher = more important) */
  priority?: number;
}

/**
 * Memory scope
 */
export type MemoryScope = 'session' | 'project' | 'global';

/**
 * Memory query options
 */
export interface MemoryQuery {
  /** Filter by type */
  type?: MemoryEntry['type'];
  /** Filter by tags (any match) */
  tags?: string[];
  /** Filter by source */
  source?: string;
  /** Maximum number of results */
  limit?: number;
  /** Include expired entries */
  includeExpired?: boolean;
}

/**
 * Memory storage interface
 */
interface MemoryStorage {
  entries: Map<string, MemoryEntry>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
  };
}

/**
 * MemoryManager - Central memory management
 */
export class MemoryManager extends EventEmitter {
  private sessionMemory: MemoryStorage;
  private projectMemory: Map<string, MemoryStorage> = new Map();
  private globalMemory: MemoryStorage;
  private basePath: string;
  private currentProjectId: string | null = null;
  private autoSave: boolean;
  private initialized: boolean = false;

  constructor(options: {
    basePath?: string;
    autoSave?: boolean;
  } = {}) {
    super();
    this.basePath = options.basePath || process.cwd();
    this.autoSave = options.autoSave ?? true;

    // Initialize session memory (ephemeral)
    this.sessionMemory = this.createEmptyStorage();

    // Initialize global memory (will be loaded from file)
    this.globalMemory = this.createEmptyStorage();
  }

  /**
   * Create empty storage structure
   */
  private createEmptyStorage(): MemoryStorage {
    return {
      entries: new Map(),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      }
    };
  }

  /**
   * Initialize the memory manager
   */
  async initialize(projectId?: string): Promise<void> {
    if (this.initialized && this.currentProjectId === projectId) {
      return;
    }

    // Load global memory
    await this.loadGlobalMemory();

    // Load project memory if projectId provided
    if (projectId) {
      this.currentProjectId = projectId;
      await this.loadProjectMemory(projectId);
    }

    this.initialized = true;
    console.log(`[MemoryManager] Initialized${projectId ? ` for project: ${projectId}` : ''}`);
  }

  /**
   * Set the current project context
   */
  async setProject(projectId: string): Promise<void> {
    if (this.currentProjectId === projectId) return;

    // Save current project memory if any
    if (this.currentProjectId && this.autoSave) {
      await this.saveProjectMemory(this.currentProjectId);
    }

    this.currentProjectId = projectId;
    await this.loadProjectMemory(projectId);
  }

  /**
   * Get memory file path
   */
  private getMemoryPath(scope: MemoryScope, projectId?: string): string {
    switch (scope) {
      case 'global':
        return path.join(this.basePath, '.mobigen', 'memory', 'global.json');
      case 'project':
        if (!projectId) throw new Error('Project ID required for project memory');
        return path.join(this.basePath, 'projects', projectId, '.memory.json');
      case 'session':
        return ''; // Session memory is not persisted
    }
  }

  /**
   * Load global memory from file
   */
  private async loadGlobalMemory(): Promise<void> {
    const filePath = this.getMemoryPath('global');

    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        await fsPromises.mkdir(dir, { recursive: true });
      }

      if (fs.existsSync(filePath)) {
        const content = await fsPromises.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        this.globalMemory = this.deserializeStorage(data);
        console.log(`[MemoryManager] Loaded global memory: ${this.globalMemory.entries.size} entries`);
      }
    } catch (error) {
      console.warn('[MemoryManager] Failed to load global memory:', error);
    }
  }

  /**
   * Load project memory from file
   */
  private async loadProjectMemory(projectId: string): Promise<void> {
    const filePath = this.getMemoryPath('project', projectId);

    try {
      if (fs.existsSync(filePath)) {
        const content = await fsPromises.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        this.projectMemory.set(projectId, this.deserializeStorage(data));
        console.log(`[MemoryManager] Loaded project memory: ${this.projectMemory.get(projectId)!.entries.size} entries`);
      } else {
        this.projectMemory.set(projectId, this.createEmptyStorage());
      }
    } catch (error) {
      console.warn(`[MemoryManager] Failed to load project memory for ${projectId}:`, error);
      this.projectMemory.set(projectId, this.createEmptyStorage());
    }
  }

  /**
   * Save global memory to file
   */
  async saveGlobalMemory(): Promise<void> {
    const filePath = this.getMemoryPath('global');

    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        await fsPromises.mkdir(dir, { recursive: true });
      }

      const data = this.serializeStorage(this.globalMemory);
      await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log('[MemoryManager] Saved global memory');
    } catch (error) {
      console.error('[MemoryManager] Failed to save global memory:', error);
    }
  }

  /**
   * Save project memory to file
   */
  async saveProjectMemory(projectId: string): Promise<void> {
    const storage = this.projectMemory.get(projectId);
    if (!storage) return;

    const filePath = this.getMemoryPath('project', projectId);

    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        await fsPromises.mkdir(dir, { recursive: true });
      }

      const data = this.serializeStorage(storage);
      await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`[MemoryManager] Saved project memory for ${projectId}`);
    } catch (error) {
      console.error(`[MemoryManager] Failed to save project memory for ${projectId}:`, error);
    }
  }

  /**
   * Serialize storage for JSON
   */
  private serializeStorage(storage: MemoryStorage): unknown {
    return {
      entries: Array.from(storage.entries.entries()).map(([entryKey, entry]) => {
        const { key: _key, ...rest } = entry;
        return {
          key: entryKey,
          ...rest,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
          expiresAt: entry.expiresAt?.toISOString()
        };
      }),
      metadata: {
        ...storage.metadata,
        createdAt: storage.metadata.createdAt.toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Deserialize storage from JSON
   */
  private deserializeStorage(data: unknown): MemoryStorage {
    const obj = data as {
      entries: Array<{
        key: string;
        value: unknown;
        type: MemoryEntry['type'];
        createdAt: string;
        updatedAt: string;
        expiresAt?: string;
        tags?: string[];
        source?: string;
        priority?: number;
      }>;
      metadata: {
        createdAt: string;
        updatedAt: string;
        version: number;
      };
    };

    const entries = new Map<string, MemoryEntry>();
    for (const entry of obj.entries) {
      entries.set(entry.key, {
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
        expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : undefined
      });
    }

    return {
      entries,
      metadata: {
        createdAt: new Date(obj.metadata.createdAt),
        updatedAt: new Date(obj.metadata.updatedAt),
        version: obj.metadata.version
      }
    };
  }

  /**
   * Get storage for a scope
   */
  private getStorage(scope: MemoryScope): MemoryStorage {
    switch (scope) {
      case 'session':
        return this.sessionMemory;
      case 'project':
        if (!this.currentProjectId) {
          throw new Error('No project selected');
        }
        return this.projectMemory.get(this.currentProjectId) || this.createEmptyStorage();
      case 'global':
        return this.globalMemory;
    }
  }

  /**
   * Remember something
   */
  async remember(
    key: string,
    value: unknown,
    options: {
      scope?: MemoryScope;
      type?: MemoryEntry['type'];
      tags?: string[];
      source?: string;
      priority?: number;
      expiresIn?: number; // milliseconds
    } = {}
  ): Promise<void> {
    const scope = options.scope || 'session';
    const storage = this.getStorage(scope);

    const existing = storage.entries.get(key);
    const now = new Date();

    const entry: MemoryEntry = {
      key,
      value,
      type: options.type || 'context',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      expiresAt: options.expiresIn ? new Date(now.getTime() + options.expiresIn) : undefined,
      tags: options.tags,
      source: options.source,
      priority: options.priority
    };

    storage.entries.set(key, entry);
    storage.metadata.updatedAt = now;

    // Auto-save for persistent scopes
    if (this.autoSave && scope !== 'session') {
      if (scope === 'global') {
        await this.saveGlobalMemory();
      } else if (scope === 'project' && this.currentProjectId) {
        await this.saveProjectMemory(this.currentProjectId);
      }
    }

    this.emit('remember', { scope, key, entry });
    console.log(`[MemoryManager] Remembered [${scope}]: ${key}`);
  }

  /**
   * Recall a specific memory
   */
  recall<T = unknown>(key: string, scope?: MemoryScope): T | undefined {
    const scopes: MemoryScope[] = scope ? [scope] : ['session', 'project', 'global'];

    for (const s of scopes) {
      try {
        const storage = this.getStorage(s);
        const entry = storage.entries.get(key);

        if (entry) {
          // Check expiration
          if (entry.expiresAt && entry.expiresAt < new Date()) {
            storage.entries.delete(key);
            continue;
          }
          return entry.value as T;
        }
      } catch {
        continue;
      }
    }

    return undefined;
  }

  /**
   * Query memories
   */
  query(scope: MemoryScope, options: MemoryQuery = {}): MemoryEntry[] {
    const storage = this.getStorage(scope);
    const now = new Date();

    let results = Array.from(storage.entries.values());

    // Filter expired
    if (!options.includeExpired) {
      results = results.filter(e => !e.expiresAt || e.expiresAt > now);
    }

    // Filter by type
    if (options.type) {
      results = results.filter(e => e.type === options.type);
    }

    // Filter by tags
    if (options.tags?.length) {
      results = results.filter(e =>
        e.tags?.some(t => options.tags!.includes(t))
      );
    }

    // Filter by source
    if (options.source) {
      results = results.filter(e => e.source === options.source);
    }

    // Sort by priority (desc) then by updatedAt (desc)
    results.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    // Limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Forget a specific memory
   */
  async forget(key: string, scope?: MemoryScope): Promise<boolean> {
    const scopes: MemoryScope[] = scope ? [scope] : ['session', 'project', 'global'];
    let forgotten = false;

    for (const s of scopes) {
      try {
        const storage = this.getStorage(s);
        if (storage.entries.delete(key)) {
          forgotten = true;
          storage.metadata.updatedAt = new Date();

          // Auto-save for persistent scopes
          if (this.autoSave && s !== 'session') {
            if (s === 'global') {
              await this.saveGlobalMemory();
            } else if (s === 'project' && this.currentProjectId) {
              await this.saveProjectMemory(this.currentProjectId);
            }
          }
        }
      } catch {
        continue;
      }
    }

    if (forgotten) {
      this.emit('forget', { key });
      console.log(`[MemoryManager] Forgot: ${key}`);
    }

    return forgotten;
  }

  /**
   * Clear all memories in a scope
   */
  async clear(scope: MemoryScope): Promise<void> {
    const storage = this.getStorage(scope);
    storage.entries.clear();
    storage.metadata.updatedAt = new Date();

    if (this.autoSave && scope !== 'session') {
      if (scope === 'global') {
        await this.saveGlobalMemory();
      } else if (scope === 'project' && this.currentProjectId) {
        await this.saveProjectMemory(this.currentProjectId);
      }
    }

    this.emit('clear', { scope });
    console.log(`[MemoryManager] Cleared ${scope} memory`);
  }

  /**
   * Get context string for AI prompts
   * Combines relevant memories into a formatted context block
   */
  getContextString(options: {
    scopes?: MemoryScope[];
    types?: MemoryEntry['type'][];
    maxEntries?: number;
    maxLength?: number;
  } = {}): string {
    const scopes = options.scopes || ['project', 'session'];
    const types = options.types || ['context', 'instruction', 'fact'];
    const maxEntries = options.maxEntries || 20;
    const maxLength = options.maxLength || 4000;

    const allEntries: MemoryEntry[] = [];

    for (const scope of scopes) {
      try {
        const entries = this.query(scope, { limit: maxEntries });
        allEntries.push(...entries.filter(e => types.includes(e.type)));
      } catch {
        continue;
      }
    }

    // Sort by priority and deduplicate by key
    const seen = new Set<string>();
    const uniqueEntries = allEntries
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .filter(e => {
        if (seen.has(e.key)) return false;
        seen.add(e.key);
        return true;
      })
      .slice(0, maxEntries);

    if (uniqueEntries.length === 0) {
      return '';
    }

    // Build context string
    const lines: string[] = ['## Memory Context\n'];

    // Group by type
    const byType = new Map<string, MemoryEntry[]>();
    for (const entry of uniqueEntries) {
      if (!byType.has(entry.type)) {
        byType.set(entry.type, []);
      }
      byType.get(entry.type)!.push(entry);
    }

    const typeLabels: Record<string, string> = {
      'instruction': 'Instructions',
      'fact': 'Known Facts',
      'context': 'Context',
      'preference': 'Preferences',
      'history': 'History'
    };

    for (const [type, entries] of byType) {
      lines.push(`### ${typeLabels[type] || type}`);
      for (const entry of entries) {
        const value = typeof entry.value === 'string'
          ? entry.value
          : JSON.stringify(entry.value);
        lines.push(`- **${entry.key}**: ${value}`);
      }
      lines.push('');
    }

    let result = lines.join('\n');

    // Truncate if too long
    if (result.length > maxLength) {
      result = result.slice(0, maxLength - 100) + '\n\n[Memory truncated due to length...]';
    }

    return result;
  }

  /**
   * Export all memories for debugging/backup
   */
  exportAll(): Record<MemoryScope, MemoryEntry[]> {
    const result: Record<MemoryScope, MemoryEntry[]> = {
      session: Array.from(this.sessionMemory.entries.values()),
      project: this.currentProjectId
        ? Array.from((this.projectMemory.get(this.currentProjectId) || this.createEmptyStorage()).entries.values())
        : [],
      global: Array.from(this.globalMemory.entries.values())
    };
    return result;
  }

  /**
   * Get count of memories in a scope
   */
  count(scope: MemoryScope): number {
    return this.getStorage(scope).entries.size;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Save all memories
   */
  async saveAll(): Promise<void> {
    await this.saveGlobalMemory();
    if (this.currentProjectId) {
      await this.saveProjectMemory(this.currentProjectId);
    }
  }

  /**
   * Clear session memory (called when conversation ends)
   */
  clearSession(): void {
    this.sessionMemory = this.createEmptyStorage();
    console.log('[MemoryManager] Session memory cleared');
  }
}

/**
 * Default memory manager instance
 */
let defaultMemoryManager: MemoryManager | null = null;

/**
 * Get or create the default memory manager instance
 */
export function getDefaultMemoryManager(basePath?: string): MemoryManager {
  if (!defaultMemoryManager) {
    defaultMemoryManager = new MemoryManager({
      basePath: basePath || process.cwd(),
      autoSave: true
    });
  }
  return defaultMemoryManager;
}

/**
 * Create a custom memory manager instance
 */
export function createMemoryManager(options: {
  basePath?: string;
  autoSave?: boolean;
}): MemoryManager {
  return new MemoryManager(options);
}
