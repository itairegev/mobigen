/**
 * Skill Loader - File-based skill discovery
 *
 * Loads skill definitions from markdown files with YAML frontmatter.
 * Skills are reusable capabilities that can be composed and invoked by agents.
 * Similar to Claude Code's skills system.
 *
 * Supports hot-reloading when files change.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Skill definition loaded from a markdown file
 */
export interface SkillDefinition {
  /** Unique skill identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the skill does */
  description: string;
  /** The skill prompt/instructions (body of markdown) */
  prompt: string;
  /** Capabilities this skill provides */
  capabilities?: string[];
  /** Category for grouping skills */
  category?: string;
  /** Tools this skill requires */
  tools?: string[];
  /** Agents this skill works well with */
  compatibleAgents?: string[];
  /** Input parameters the skill accepts */
  inputs?: SkillInput[];
  /** Expected outputs from the skill */
  outputs?: SkillOutput[];
  /** Whether this skill can run in parallel with others */
  parallelizable?: boolean;
  /** Priority when multiple skills match (higher = preferred) */
  priority?: number;
  /** Path to the source file */
  filePath: string;
}

/**
 * Skill input definition
 */
export interface SkillInput {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: unknown;
}

/**
 * Skill output definition
 */
export interface SkillOutput {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file';
}

/**
 * Frontmatter parsed from skill markdown file
 */
interface SkillFrontmatter {
  id: string;
  name?: string;
  description: string;
  capabilities?: string[];
  category?: string;
  tools?: string[];
  compatibleAgents?: string[];
  inputs?: SkillInput[];
  outputs?: SkillOutput[];
  parallelizable?: boolean;
  priority?: number;
}

/**
 * Parse YAML-like frontmatter from markdown content
 */
function parseFrontmatter(content: string): { frontmatter: SkillFrontmatter; body: string } | null {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  const yamlContent = match[1];
  const body = match[2].trim();

  // Simple YAML parser
  const frontmatter: Record<string, unknown> = {};
  const lines = yamlContent.split('\n');
  let currentKey: string | null = null;
  let currentArray: unknown[] | null = null;
  let inComplexArray = false;
  let currentArrayItem: Record<string, unknown> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Check for array item start (- name: value format)
    if (trimmed.startsWith('- ') && currentKey && (currentKey === 'inputs' || currentKey === 'outputs' || currentKey === 'capabilities' || currentKey === 'tools' || currentKey === 'compatibleAgents')) {
      // Handle complex array items (inputs/outputs)
      if (currentKey === 'inputs' || currentKey === 'outputs') {
        if (currentArrayItem && currentArray) {
          currentArray.push(currentArrayItem);
        }
        currentArrayItem = {};
        inComplexArray = true;

        // Parse the first property on the same line
        const firstProp = trimmed.slice(2).trim();
        if (firstProp.includes(':')) {
          const colonIdx = firstProp.indexOf(':');
          const key = firstProp.slice(0, colonIdx).trim();
          const value = firstProp.slice(colonIdx + 1).trim();
          if (key && value) {
            currentArrayItem[key] = parseValue(value);
          }
        }
      } else {
        // Simple array item
        if (currentArray) {
          currentArray.push(trimmed.slice(2).trim());
        }
      }
      continue;
    }

    // Check for property within complex array item (indented)
    if (inComplexArray && line.startsWith('    ') && currentArrayItem) {
      const propMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (propMatch) {
        currentArrayItem[propMatch[1]] = parseValue(propMatch[2]);
      }
      continue;
    }

    // Check for key-value pair at root level
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch && !line.startsWith(' ')) {
      // Save previous array if exists
      if (currentKey && currentArray !== null) {
        if (inComplexArray && currentArrayItem) {
          currentArray.push(currentArrayItem);
        }
        frontmatter[currentKey] = currentArray;
      }

      inComplexArray = false;
      currentArrayItem = null;
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
    if (inComplexArray && currentArrayItem) {
      currentArray.push(currentArrayItem);
    }
    frontmatter[currentKey] = currentArray;
  }

  return {
    frontmatter: frontmatter as unknown as SkillFrontmatter,
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
 * SkillLoader - Loads and watches skill definition files
 */
export class SkillLoader extends EventEmitter {
  private skillsDirs: string[];
  private skills: Map<string, SkillDefinition> = new Map();
  private watchers: fs.FSWatcher[] = [];
  private initialized: boolean = false;

  constructor(skillsDirs: string[]) {
    super();
    this.skillsDirs = skillsDirs;
  }

  /**
   * Load all skills from the configured directories
   */
  async loadAll(): Promise<Map<string, SkillDefinition>> {
    this.skills.clear();

    for (const dir of this.skillsDirs) {
      if (!fs.existsSync(dir)) {
        console.log(`[SkillLoader] Directory not found, skipping: ${dir}`);
        continue;
      }

      await this.loadDirectory(dir);
    }

    this.initialized = true;
    console.log(`[SkillLoader] Loaded ${this.skills.size} skills`);

    return this.skills;
  }

  /**
   * Load skills from a single directory
   */
  private async loadDirectory(dir: string): Promise<void> {
    try {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await this.loadDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          await this.loadSkillFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`[SkillLoader] Error loading directory ${dir}:`, error);
    }
  }

  /**
   * Load a single skill file
   */
  private async loadSkillFile(filePath: string): Promise<SkillDefinition | null> {
    try {
      const content = await fsPromises.readFile(filePath, 'utf-8');
      const parsed = parseFrontmatter(content);

      if (!parsed) {
        console.warn(`[SkillLoader] No frontmatter found in ${filePath}`);
        return null;
      }

      const { frontmatter, body } = parsed;

      // If no id, derive from filename
      const id = frontmatter.id || path.basename(filePath, '.md');

      if (!frontmatter.description) {
        console.warn(`[SkillLoader] No description in frontmatter of ${filePath}`);
        return null;
      }

      const skill: SkillDefinition = {
        id,
        name: frontmatter.name || id,
        description: frontmatter.description,
        prompt: body,
        capabilities: frontmatter.capabilities,
        category: frontmatter.category,
        tools: frontmatter.tools,
        compatibleAgents: frontmatter.compatibleAgents,
        inputs: frontmatter.inputs,
        outputs: frontmatter.outputs,
        parallelizable: frontmatter.parallelizable ?? true,
        priority: frontmatter.priority ?? 0,
        filePath
      };

      this.skills.set(skill.id, skill);
      console.log(`[SkillLoader] Loaded skill: ${skill.id} from ${filePath}`);

      return skill;
    } catch (error) {
      console.error(`[SkillLoader] Error loading skill file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Watch for changes in skill directories
   */
  watch(callback?: (skills: Map<string, SkillDefinition>) => void): void {
    this.stopWatching();

    for (const dir of this.skillsDirs) {
      if (!fs.existsSync(dir)) {
        continue;
      }

      try {
        const watcher = fs.watch(dir, { recursive: true }, async (eventType, filename) => {
          if (!filename || !filename.endsWith('.md')) {
            return;
          }

          const fullPath = path.join(dir, filename);
          console.log(`[SkillLoader] File ${eventType}: ${fullPath}`);

          if (eventType === 'rename') {
            if (fs.existsSync(fullPath)) {
              await this.loadSkillFile(fullPath);
            } else {
              for (const [id, skill] of this.skills) {
                if (skill.filePath === fullPath) {
                  this.skills.delete(id);
                  console.log(`[SkillLoader] Removed skill: ${id}`);
                  break;
                }
              }
            }
          } else if (eventType === 'change') {
            await this.loadSkillFile(fullPath);
          }

          this.emit('change', this.skills);

          if (callback) {
            callback(this.skills);
          }
        });

        this.watchers.push(watcher);
        console.log(`[SkillLoader] Watching directory: ${dir}`);
      } catch (error) {
        console.error(`[SkillLoader] Error watching directory ${dir}:`, error);
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
   * Get a skill by ID
   */
  get(skillId: string): SkillDefinition | undefined {
    return this.skills.get(skillId);
  }

  /**
   * List all loaded skills
   */
  list(): SkillDefinition[] {
    return Array.from(this.skills.values());
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
   * Find parallelizable skills
   */
  findParallelizable(): SkillDefinition[] {
    return this.list().filter(skill => skill.parallelizable !== false);
  }

  /**
   * Generate a catalog string for AI context
   */
  generateCatalog(): string {
    const skills = this.list();

    if (skills.length === 0) {
      return 'No skills available.';
    }

    // Group by category
    const byCategory = new Map<string, SkillDefinition[]>();
    for (const skill of skills) {
      const category = skill.category || 'General';
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(skill);
    }

    const sections: string[] = [];

    for (const [category, skillList] of byCategory) {
      const lines = [`## ${category} Skills\n`];
      for (const skill of skillList) {
        lines.push(`### ${skill.name} (${skill.id})`);
        lines.push(`${skill.description}`);
        if (skill.capabilities?.length) {
          lines.push(`**Capabilities:** ${skill.capabilities.join(', ')}`);
        }
        if (skill.tools?.length) {
          lines.push(`**Required tools:** ${skill.tools.join(', ')}`);
        }
        if (skill.parallelizable === false) {
          lines.push('**Note:** Must run sequentially');
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
   * Get the count of loaded skills
   */
  count(): number {
    return this.skills.size;
  }
}
