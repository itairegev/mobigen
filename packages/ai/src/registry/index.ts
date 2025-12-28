/**
 * Registry Module
 *
 * Provides file-based discovery and registration for:
 * - Agents: AI agents with specific roles and capabilities
 * - Commands: Slash commands for user interactions
 * - Skills: Reusable capabilities that can be composed
 * - Memory: Persistent context across sessions
 *
 * All registries support:
 * - File-based definitions (markdown with YAML frontmatter)
 * - Hot-reload for development
 * - Runtime registration for dynamic additions
 */

// Agent Registry
export { AgentLoader, type AgentDefinition, type UserTier, type AgentCategory } from './agent-loader';

export {
  AgentRegistry,
  getDefaultRegistry,
  createRegistry
} from './agent-registry';
export type { RegistryOptions } from './agent-registry';

// Command Registry
export { CommandLoader } from './command-loader';
export type { CommandDefinition, CommandArgument } from './command-loader';

export {
  CommandRegistry,
  getDefaultCommandRegistry,
  createCommandRegistry
} from './command-registry';
export type { CommandRegistryOptions } from './command-registry';

// Skill Registry
export { SkillLoader } from './skill-loader';
export type { SkillDefinition, SkillInput, SkillOutput } from './skill-loader';

export {
  SkillRegistry,
  getDefaultSkillRegistry,
  createSkillRegistry
} from './skill-registry';
export type { SkillRegistryOptions } from './skill-registry';

// Memory Manager
export {
  MemoryManager,
  getDefaultMemoryManager,
  createMemoryManager
} from './memory-manager';
export type { MemoryEntry, MemoryScope, MemoryQuery } from './memory-manager';

/**
 * Initialize all registries with a common base path
 */
export async function initializeAllRegistries(basePath: string): Promise<{
  agents: import('./agent-registry').AgentRegistry;
  commands: import('./command-registry').CommandRegistry;
  skills: import('./skill-registry').SkillRegistry;
  memory: import('./memory-manager').MemoryManager;
}> {
  const { getDefaultRegistry } = await import('./agent-registry');
  const { getDefaultCommandRegistry } = await import('./command-registry');
  const { getDefaultSkillRegistry } = await import('./skill-registry');
  const { getDefaultMemoryManager } = await import('./memory-manager');

  const agents = getDefaultRegistry(basePath);
  const commands = getDefaultCommandRegistry(basePath);
  const skills = getDefaultSkillRegistry(basePath);
  const memory = getDefaultMemoryManager(basePath);

  await Promise.all([
    agents.initialize(),
    commands.initialize(),
    skills.initialize(),
    memory.initialize()
  ]);

  console.log(`[Registry] All registries initialized:
    - Agents: ${agents.count()}
    - Commands: ${commands.count()}
    - Skills: ${skills.count()}
    - Memory: ${memory.count('global')} global, ${memory.count('session')} session entries`);

  return { agents, commands, skills, memory };
}
