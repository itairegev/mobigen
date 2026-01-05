/**
 * AI Model Selector
 * Routes requests to appropriate providers based on model and task
 */

import { OpenAIProvider, createOpenAIProvider } from './openai/index.js';
import { ClaudeProvider, createClaudeProvider } from './claude/index.js';
import type {
  AIProvider,
  AIProviderConfig,
  AIModel,
  OpenAIModel,
  ClaudeModel,
  CompletionOptions,
  CompletionResult,
  StreamChunk,
} from './types.js';

export interface ModelSelectorConfig {
  openai?: AIProviderConfig;
  claude?: AIProviderConfig;
  defaultProvider?: 'openai' | 'claude';
  fallbackEnabled?: boolean;
}

export interface TaskModelMapping {
  codeGeneration: AIModel;
  analysis: AIModel;
  validation: AIModel;
  chat: AIModel;
  embedding: string;
}

const OPENAI_MODELS: OpenAIModel[] = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'o1',
  'o1-mini',
];

const CLAUDE_MODELS: ClaudeModel[] = [
  'claude-opus-4-5-20251101',
  'claude-sonnet-4-5-20251101',
  'claude-haiku-4-5-20251001',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
];

export class ModelSelector {
  private openaiProvider?: OpenAIProvider;
  private claudeProvider?: ClaudeProvider;
  private config: ModelSelectorConfig;

  // Default task-to-model mapping
  private taskModels: TaskModelMapping = {
    codeGeneration: 'claude-opus-4-5-20251101',
    analysis: 'claude-sonnet-4-5-20251101',
    validation: 'claude-sonnet-4-5-20251101',
    chat: 'gpt-4o',
    embedding: 'text-embedding-3-small',
  };

  constructor(config: ModelSelectorConfig) {
    this.config = config;

    if (config.openai) {
      this.openaiProvider = createOpenAIProvider(config.openai);
    }
    if (config.claude) {
      this.claudeProvider = createClaudeProvider(config.claude);
    }

    if (!this.openaiProvider && !this.claudeProvider) {
      throw new Error('At least one AI provider must be configured');
    }
  }

  setTaskModel(task: keyof TaskModelMapping, model: AIModel | string): void {
    this.taskModels[task] = model as AIModel;
  }

  getModelForTask(task: keyof TaskModelMapping): AIModel | string {
    return this.taskModels[task];
  }

  getProviderForModel(model: AIModel): AIProvider {
    if (this.isOpenAIModel(model)) {
      if (!this.openaiProvider) {
        if (this.config.fallbackEnabled && this.claudeProvider) {
          // Fallback to Claude
          return this.claudeProvider;
        }
        throw new Error('OpenAI provider not configured');
      }
      return this.openaiProvider;
    }

    if (this.isClaudeModel(model)) {
      if (!this.claudeProvider) {
        if (this.config.fallbackEnabled && this.openaiProvider) {
          // Fallback to OpenAI
          return this.openaiProvider;
        }
        throw new Error('Claude provider not configured');
      }
      return this.claudeProvider;
    }

    // Default to configured default provider
    const defaultProvider = this.config.defaultProvider === 'openai'
      ? this.openaiProvider
      : this.claudeProvider;

    if (!defaultProvider) {
      throw new Error(`Unknown model and no default provider: ${model}`);
    }

    return defaultProvider;
  }

  isOpenAIModel(model: string): model is OpenAIModel {
    return OPENAI_MODELS.includes(model as OpenAIModel);
  }

  isClaudeModel(model: string): model is ClaudeModel {
    return CLAUDE_MODELS.includes(model as ClaudeModel);
  }

  async complete(options: CompletionOptions): Promise<CompletionResult> {
    const provider = this.getProviderForModel(options.model);

    try {
      return await provider.complete(options);
    } catch (error) {
      // Try fallback if enabled
      if (this.config.fallbackEnabled) {
        const fallbackProvider = this.getFallbackProvider(options.model);
        if (fallbackProvider) {
          const fallbackModel = this.getFallbackModel(options.model);
          return fallbackProvider.complete({
            ...options,
            model: fallbackModel,
          });
        }
      }
      throw error;
    }
  }

  async *streamComplete(options: CompletionOptions): AsyncGenerator<StreamChunk> {
    const provider = this.getProviderForModel(options.model);
    yield* provider.streamComplete(options);
  }

  async completeForTask(
    task: keyof TaskModelMapping,
    options: Omit<CompletionOptions, 'model'>
  ): Promise<CompletionResult> {
    const model = this.taskModels[task] as AIModel;
    return this.complete({ ...options, model });
  }

  async *streamCompleteForTask(
    task: keyof TaskModelMapping,
    options: Omit<CompletionOptions, 'model'>
  ): AsyncGenerator<StreamChunk> {
    const model = this.taskModels[task] as AIModel;
    yield* this.streamComplete({ ...options, model });
  }

  private getFallbackProvider(model: AIModel): AIProvider | null {
    if (this.isOpenAIModel(model) && this.claudeProvider) {
      return this.claudeProvider;
    }
    if (this.isClaudeModel(model) && this.openaiProvider) {
      return this.openaiProvider;
    }
    return null;
  }

  private getFallbackModel(model: AIModel): AIModel {
    if (this.isOpenAIModel(model)) {
      // Map OpenAI models to Claude equivalents
      if (model === 'gpt-4o' || model === 'gpt-4-turbo' || model === 'gpt-4') {
        return 'claude-sonnet-4-5-20251101';
      }
      if (model === 'o1' || model === 'o1-mini') {
        return 'claude-opus-4-5-20251101';
      }
      return 'claude-haiku-4-5-20251001';
    }

    // Map Claude models to OpenAI equivalents
    if (model.includes('opus')) {
      return 'gpt-4o';
    }
    if (model.includes('sonnet')) {
      return 'gpt-4o';
    }
    return 'gpt-4o-mini';
  }

  getAvailableModels(): { openai: string[]; claude: string[] } {
    return {
      openai: this.openaiProvider ? [...OPENAI_MODELS] : [],
      claude: this.claudeProvider ? [...CLAUDE_MODELS] : [],
    };
  }

  getProviders(): { openai: boolean; claude: boolean } {
    return {
      openai: !!this.openaiProvider,
      claude: !!this.claudeProvider,
    };
  }
}

export function createModelSelector(config: ModelSelectorConfig): ModelSelector {
  return new ModelSelector(config);
}
