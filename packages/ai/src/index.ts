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
export { AGENT_TIMEOUTS, AGENT_MAX_TURNS } from './types';
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
  ValidationStage,
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
  // E2E Testing types
  E2ETestSuite,
  E2ETest,
  E2ETestStep,
  TestCoverage,
  MissingTestId,
  DeviceProvider,
  DeviceTestConfig,
  DeviceTestResult,
  DeviceTestSession,
  DeviceTestSummary,
  DeviceSpec,
  DeviceArtifact,
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
  type UserTier,
  type AgentCategory,

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

// Export Zod schemas for runtime validation of AI outputs
export {
  // Schemas
  PRDOutputSchema,
  FeatureSchema,
  UserStorySchema,
  ArchitectureOutputSchema,
  TechStackDecisionSchema,
  DataModelSchema,
  APIEndpointSchema,
  FileStructureNodeSchema,
  DependencyDecisionSchema,
  UIDesignOutputSchema,
  ColorPaletteSchema,
  ColorScaleSchema,
  TypographySpecSchema,
  ComponentSpecSchema,
  ScreenSpecSchema,
  NavigationSpecSchema,
  AnimationSpecSchema,
  TaskBreakdownSchema,
  DevelopmentTaskSchema,
  ValidationResultSchema,
  ValidationErrorSchema,
  ValidationStageSchema,
  QAReportSchema,
  QACategorySchema,
  QAFindingSchema,
  // Helper functions
  parseAgentOutput,
  parseAgentOutputStrict,
  isValidAgentOutput,
} from './schemas';

// Export AI Providers (OpenAI/ChatGPT + Claude)
export {
  // Types
  type AIProviderType,
  type AIModel,
  type OpenAIModel,
  type ClaudeModel,
  type Message,
  type ToolCall,
  type ToolDefinition,
  type CompletionOptions,
  type CompletionResult,
  type StreamChunk,
  type EmbeddingOptions,
  type EmbeddingResult,
  type AIProviderConfig,
  type AIProvider as AIProviderInterface,
  type ModelSelectorConfig,
  type TaskModelMapping,
  // Base provider
  BaseAIProvider,
  // OpenAI provider
  OpenAIProvider,
  createOpenAIProvider,
  // Claude provider
  ClaudeProvider,
  createClaudeProvider,
  // Model selector
  ModelSelector,
  createModelSelector,
} from './providers/index.js';

// Export Agent Spawning System
export {
  // Types
  type TaskPriority,
  type AgentState,
  type TaskStatus,
  type AgentConfig as SpawningAgentConfig,
  type AgentTask,
  type AgentInstance,
  type AgentSpawnRequest,
  type AgentSpawnResult,
  type TaskResult,
  type AgentPoolConfig,
  type TaskQueueConfig,
  type ParallelExecutionConfig,
  type ParallelExecutionResult,
  type AgentLifecycleEvent,
  type AgentLifecycleEventData,
  type LifecycleEventListener,
  type AgentExecutionContext,
  type AgentHealth,
  // Classes
  AgentFactory,
  agentFactory,
  TaskQueue,
  AgentPool,
  ParallelExecutor,
  LifecycleManager,
  lifecycleManager,
} from './spawning/index.js';
