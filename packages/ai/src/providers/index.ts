/**
 * AI Providers Index
 */

// Types
export type {
  AIProviderType,
  AIModel,
  OpenAIModel,
  ClaudeModel,
  Message,
  ToolCall,
  ToolDefinition,
  CompletionOptions,
  CompletionResult,
  StreamChunk,
  EmbeddingOptions,
  EmbeddingResult,
  AIProviderConfig,
  AIProvider,
} from './types.js';

// Base provider
export { BaseAIProvider } from './base-provider.js';

// OpenAI provider
export { OpenAIProvider, createOpenAIProvider } from './openai/index.js';

// Claude provider
export { ClaudeProvider, createClaudeProvider } from './claude/index.js';

// Model selector
export {
  ModelSelector,
  createModelSelector,
} from './model-selector.js';
export type { ModelSelectorConfig, TaskModelMapping } from './model-selector.js';
