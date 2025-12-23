/**
 * Agent Registry Module
 *
 * Provides file-based agent discovery and registration.
 * Agents are defined as markdown files with YAML frontmatter.
 */

export { AgentLoader } from './agent-loader';
export type { AgentDefinition } from './agent-loader';

export { AgentRegistry, getDefaultRegistry, createRegistry } from './agent-registry';
export type { RegistryOptions } from './agent-registry';
