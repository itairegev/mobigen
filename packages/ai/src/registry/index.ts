/**
 * Agent Registry Module
 *
 * Provides file-based agent discovery and registration.
 * Agents are defined as markdown files with YAML frontmatter.
 */

export {
  AgentLoader,
  type AgentDefinition,
} from './agent-loader';

export {
  AgentRegistry,
  getDefaultRegistry,
  createRegistry,
  type RegistryOptions,
} from './agent-registry';
