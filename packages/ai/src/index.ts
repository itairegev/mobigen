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

// Export types
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

// Export agents and pipeline configuration
export { mobigenAgents, generationPipeline, agentModelConfig } from './agents/index';
