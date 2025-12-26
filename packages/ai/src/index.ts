// Export AI client factory (supports Anthropic and Bedrock)
export {
  createAIClient,
  getModelId,
  getCurrentProvider,
  isBedrockConfigured,
  validateAIConfig,
  MODEL_MAPPING,
  BEDROCK_TO_ANTHROPIC,
} from './client';
export type { AIProvider, AIClientConfig, AIClient } from './client';

// Export types and constants
export { AGENT_TIMEOUTS } from './types';
export type {
  SDKMessage,
  AgentRole,
  AgentDefinition,
  PipelinePhase,
  PipelineConfig,
  PRDOutput,
  Feature,
  UserStory,
  ArchitectureOutput,
  TechStackDecision,
  DataModel,
  APIEndpoint,
  FileStructureNode,
  DependencyDecision,
  UIDesignOutput,
  ColorPalette,
  ColorScale,
  TypographySpec,
  ComponentSpec,
  ScreenSpec,
  NavigationSpec,
  AnimationSpec,
  TaskBreakdown,
  DevelopmentTask,
  ValidationResult,
  ValidationError,
  QAReport,
  QACategory,
  QAFinding,
  GenerationResult,
  WhiteLabelConfig,
  HookCallback,
  HookConfig,
  HookOutput,
  PreToolUseHookInput,
  PostToolUseHookInput,
} from './types';

// Export agents and pipeline configuration (legacy - will be deprecated)
export { mobigenAgents, generationPipeline, agentModelConfig } from './agents/index';

// Export new registry system
export {
  // Agent Registry
  AgentLoader,
  AgentRegistry,
  getDefaultRegistry,
  createRegistry,
  type AgentDefinition as DynamicAgentDefinition,
  type RegistryOptions,

  // Command Registry
  CommandLoader,
  CommandRegistry,
  getDefaultCommandRegistry,
  createCommandRegistry,
  type CommandDefinition,
  type CommandArgument,
  type CommandRegistryOptions,

  // Skill Registry
  SkillLoader,
  SkillRegistry,
  getDefaultSkillRegistry,
  createSkillRegistry,
  type SkillDefinition,
  type SkillInput,
  type SkillOutput,
  type SkillRegistryOptions,

  // Memory Manager
  MemoryManager,
  getDefaultMemoryManager,
  createMemoryManager,
  type MemoryEntry,
  type MemoryScope,
  type MemoryQuery,

  // Convenience function to initialize all registries
  initializeAllRegistries,
} from './registry';
