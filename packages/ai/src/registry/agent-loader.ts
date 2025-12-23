/**
 * Agent Loader - File-based agent discovery
 *
 * Loads agent definitions from markdown files with YAML frontmatter.
 * Supports hot-reloading when files change.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Agent definition loaded from a markdown file
 */
export interface AgentDefinition {
  id: string;
  description: string;
  prompt: string;
  model?: 'opus' | 'sonnet' | 'haiku';
  tools?: string[];
  capabilities?: string[];
  canDelegate?: string[];
  outputSchema?: Record<string, unknown>;
  filePath: string;
}

/**
 * Frontmatter parsed from agent markdown file
 */
interface AgentFrontmatter {
  id: string;
  description: string;
  model?: 'opus' | 'sonnet' | 'haiku';
  tools?: string[];
  capabilities?: string[];
  canDelegate?: string[];
  outputSchema?: Record<string, unknown>;
}

/**
 * Parse YAML-like frontmatter from markdown content
 * Simple parser that handles basic YAML structures
 */
function parseFrontmatter(content: string): { frontmatter: AgentFrontmatter; body: string } | null {
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
  let currentArray: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Check for array item
    if (trimmed.startsWith('- ') && currentKey && currentArray !== null) {
      currentArray.push(trimmed.slice(2).trim());
      continue;
    }

    // Check for key-value pair
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      // Save previous array if exists
      if (currentKey && currentArray !== null) {
        frontmatter[currentKey] = currentArray;
      }

      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      // Check if this is the start of an array
      if (value === '' || value === '[]') {
        currentArray = [];
      } else {
        currentArray = null;
        // Parse the value
        if (value === 'true') {
          frontmatter[currentKey] = true;
        } else if (value === 'false') {
          frontmatter[currentKey] = false;
        } else if (!isNaN(Number(value))) {
          frontmatter[currentKey] = Number(value);
        } else {
          // Remove quotes if present
          frontmatter[currentKey] = value.replace(/^["']|["']$/g, '');
        }
      }
    }
  }

  // Save final array if exists
  if (currentKey && currentArray !== null) {
    frontmatter[currentKey] = currentArray;
  }

  return {
    frontmatter: frontmatter as AgentFrontmatter,
    body
  };
}

/**
 * AgentLoader - Loads and watches agent definition files
 */
export class AgentLoader extends EventEmitter {
  private agentsDirs: string[];
  private agents: Map<string, AgentDefinition> = new Map();
  private watchers: fs.FSWatcher[] = [];
  private initialized: boolean = false;

  constructor(agentsDirs: string[]) {
    super();
    this.agentsDirs = agentsDirs;
  }

  /**
   * Load all agents from the configured directories
   */
  async loadAll(): Promise<Map<string, AgentDefinition>> {
    this.agents.clear();

    for (const dir of this.agentsDirs) {
      if (!fs.existsSync(dir)) {
        console.log(`[AgentLoader] Directory not found, skipping: ${dir}`);
        continue;
      }

      await this.loadDirectory(dir);
    }

    this.initialized = true;
    console.log(`[AgentLoader] Loaded ${this.agents.size} agents`);

    return this.agents;
  }

  /**
   * Load agents from a single directory
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
          await this.loadAgentFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`[AgentLoader] Error loading directory ${dir}:`, error);
    }
  }

  /**
   * Load a single agent file
   */
  private async loadAgentFile(filePath: string): Promise<AgentDefinition | null> {
    try {
      const content = await fsPromises.readFile(filePath, 'utf-8');
      const parsed = parseFrontmatter(content);

      if (!parsed) {
        console.warn(`[AgentLoader] No frontmatter found in ${filePath}`);
        return null;
      }

      const { frontmatter, body } = parsed;

      if (!frontmatter.id) {
        console.warn(`[AgentLoader] No id in frontmatter of ${filePath}`);
        return null;
      }

      if (!frontmatter.description) {
        console.warn(`[AgentLoader] No description in frontmatter of ${filePath}`);
        return null;
      }

      const agent: AgentDefinition = {
        id: frontmatter.id,
        description: frontmatter.description,
        prompt: body,
        model: frontmatter.model,
        tools: frontmatter.tools,
        capabilities: frontmatter.capabilities,
        canDelegate: frontmatter.canDelegate,
        outputSchema: frontmatter.outputSchema,
        filePath
      };

      this.agents.set(agent.id, agent);
      console.log(`[AgentLoader] Loaded agent: ${agent.id} from ${filePath}`);

      return agent;
    } catch (error) {
      console.error(`[AgentLoader] Error loading agent file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Watch for changes in agent directories
   */
  watch(callback?: (agents: Map<string, AgentDefinition>) => void): void {
    // Close existing watchers
    this.stopWatching();

    for (const dir of this.agentsDirs) {
      if (!fs.existsSync(dir)) {
        continue;
      }

      try {
        const watcher = fs.watch(dir, { recursive: true }, async (eventType, filename) => {
          if (!filename || !filename.endsWith('.md')) {
            return;
          }

          const fullPath = path.join(dir, filename);

          console.log(`[AgentLoader] File ${eventType}: ${fullPath}`);

          if (eventType === 'rename') {
            // File added or removed
            if (fs.existsSync(fullPath)) {
              // File added
              await this.loadAgentFile(fullPath);
            } else {
              // File removed - find and remove agent by filePath
              for (const [id, agent] of this.agents) {
                if (agent.filePath === fullPath) {
                  this.agents.delete(id);
                  console.log(`[AgentLoader] Removed agent: ${id}`);
                  break;
                }
              }
            }
          } else if (eventType === 'change') {
            // File modified
            await this.loadAgentFile(fullPath);
          }

          // Emit change event
          this.emit('change', this.agents);

          if (callback) {
            callback(this.agents);
          }
        });

        this.watchers.push(watcher);
        console.log(`[AgentLoader] Watching directory: ${dir}`);
      } catch (error) {
        console.error(`[AgentLoader] Error watching directory ${dir}:`, error);
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
   * Get an agent by ID
   */
  get(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all loaded agents
   */
  list(): AgentDefinition[] {
    return Array.from(this.agents.values());
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
   * Generate a catalog string for AI orchestrator context
   */
  generateCatalog(): string {
    const agents = this.list();

    if (agents.length === 0) {
      return 'No agents available.';
    }

    // Group by category (inferred from capabilities)
    const orchestration = agents.filter(a => a.capabilities?.includes('coordination'));
    const planning = agents.filter(a =>
      a.capabilities?.some(c => ['prd-creation', 'architecture-design', 'ui-design', 'task-planning'].includes(c))
    );
    const implementation = agents.filter(a =>
      a.capabilities?.some(c => ['code-generation', 'requirements-analysis'].includes(c))
    );
    const validation = agents.filter(a =>
      a.capabilities?.some(c => ['code-validation', 'debugging', 'quality-assessment'].includes(c))
    );
    const other = agents.filter(a =>
      !orchestration.includes(a) &&
      !planning.includes(a) &&
      !implementation.includes(a) &&
      !validation.includes(a)
    );

    const sections: string[] = [];

    const formatAgentSection = (title: string, agentList: AgentDefinition[]) => {
      if (agentList.length === 0) return '';

      const lines = [`## ${title}\n`];
      for (const agent of agentList) {
        lines.push(`### ${agent.id}`);
        lines.push(`- **Description**: ${agent.description}`);
        if (agent.capabilities?.length) {
          lines.push(`- **Capabilities**: ${agent.capabilities.join(', ')}`);
        }
        lines.push(`- **Model**: ${agent.model || 'inherit'}`);
        if (agent.canDelegate?.length) {
          lines.push(`- **Can delegate to**: ${agent.canDelegate.join(', ')}`);
        }
        lines.push('');
      }
      return lines.join('\n');
    };

    sections.push(formatAgentSection('ORCHESTRATION AGENTS', orchestration));
    sections.push(formatAgentSection('PLANNING AGENTS', planning));
    sections.push(formatAgentSection('IMPLEMENTATION AGENTS', implementation));
    sections.push(formatAgentSection('VALIDATION & QUALITY AGENTS', validation));
    sections.push(formatAgentSection('OTHER AGENTS', other));

    return sections.filter(s => s).join('\n');
  }

  /**
   * Check if the loader is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the count of loaded agents
   */
  count(): number {
    return this.agents.size;
  }
}
