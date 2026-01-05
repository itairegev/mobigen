/**
 * AI Provider Types
 */

export type AIProviderType = 'openai' | 'claude' | 'anthropic';

export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'o1'
  | 'o1-mini';

export type ClaudeModel =
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-5-20251101'
  | 'claude-haiku-4-5-20251001'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022';

export type AIModel = OpenAIModel | ClaudeModel;

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface CompletionOptions {
  model: AIModel;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  stream?: boolean;
  responseFormat?: { type: 'text' | 'json_object' };
}

export interface CompletionResult {
  id: string;
  model: string;
  content: string | null;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  id: string;
  model: string;
  delta: {
    content?: string;
    toolCalls?: Partial<ToolCall>[];
  };
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

export interface EmbeddingOptions {
  model: string;
  input: string | string[];
  dimensions?: number;
}

export interface EmbeddingResult {
  model: string;
  embeddings: number[][];
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  organization?: string;
  defaultModel?: AIModel;
  timeout?: number;
  maxRetries?: number;
}

export interface AIProvider {
  readonly name: AIProviderType;

  complete(options: CompletionOptions): Promise<CompletionResult>;

  streamComplete(options: CompletionOptions): AsyncGenerator<StreamChunk>;

  embed?(options: EmbeddingOptions): Promise<EmbeddingResult>;

  listModels?(): Promise<string[]>;
}
