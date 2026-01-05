/**
 * OpenAI/ChatGPT Provider Implementation
 */

import { BaseAIProvider } from '../base-provider.js';
import type {
  AIProviderConfig,
  CompletionOptions,
  CompletionResult,
  StreamChunk,
  EmbeddingOptions,
  EmbeddingResult,
  Message,
  ToolDefinition,
} from '../types.js';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }>;
}

interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'openai' as const;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  protected override getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    if (this.config.organization) {
      headers['OpenAI-Organization'] = this.config.organization;
    }

    return headers;
  }

  async complete(options: CompletionOptions): Promise<CompletionResult> {
    return this.withRetry(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(this.buildRequest(options)),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as OpenAIChatResponse;
      return this.parseResponse(data);
    });
  }

  async *streamComplete(options: CompletionOptions): AsyncGenerator<StreamChunk> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...this.buildRequest(options),
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6)) as OpenAIStreamChunk;
            yield this.parseStreamChunk(json);
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async embed(options: EmbeddingOptions): Promise<EmbeddingResult> {
    return this.withRetry(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/embeddings`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            model: options.model || 'text-embedding-3-small',
            input: options.input,
            dimensions: options.dimensions,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as OpenAIEmbeddingResponse;

      return {
        model: data.model,
        embeddings: data.data.map(d => d.embedding),
        usage: {
          promptTokens: data.usage.prompt_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    });
  }

  async listModels(): Promise<string[]> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/models`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = await response.json() as { data: Array<{ id: string }> };
    return data.data.map(m => m.id);
  }

  private buildRequest(options: CompletionOptions): Record<string, unknown> {
    const request: Record<string, unknown> = {
      model: options.model,
      messages: options.messages.map(m => this.convertMessage(m)),
    };

    if (options.temperature !== undefined) {
      request.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      request.max_tokens = options.maxTokens;
    }
    if (options.topP !== undefined) {
      request.top_p = options.topP;
    }
    if (options.stop) {
      request.stop = options.stop;
    }
    if (options.tools) {
      request.tools = options.tools.map(t => this.convertTool(t));
    }
    if (options.toolChoice) {
      request.tool_choice = options.toolChoice;
    }
    if (options.responseFormat) {
      request.response_format = options.responseFormat;
    }

    return request;
  }

  private convertMessage(message: Message): OpenAIMessage {
    const converted: OpenAIMessage = {
      role: message.role,
      content: message.content,
    };

    if (message.name) {
      converted.name = message.name;
    }
    if (message.toolCalls) {
      converted.tool_calls = message.toolCalls;
    }
    if (message.toolCallId) {
      converted.tool_call_id = message.toolCallId;
    }

    return converted;
  }

  private convertTool(tool: ToolDefinition): Record<string, unknown> {
    return {
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    };
  }

  private parseResponse(data: OpenAIChatResponse): CompletionResult {
    const choice = data.choices[0];

    return {
      id: data.id,
      model: data.model,
      content: choice.message.content,
      toolCalls: choice.message.tool_calls,
      finishReason: choice.finish_reason,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  private parseStreamChunk(chunk: OpenAIStreamChunk): StreamChunk {
    const choice = chunk.choices[0];

    return {
      id: chunk.id,
      model: chunk.model,
      delta: {
        content: choice.delta.content,
        toolCalls: choice.delta.tool_calls?.map(tc => ({
          id: tc.id,
          type: tc.type as 'function' | undefined,
          function: tc.function ? {
            name: tc.function.name || '',
            arguments: tc.function.arguments || '',
          } : undefined,
        })),
      },
      finishReason: choice.finish_reason || undefined,
    };
  }
}

export function createOpenAIProvider(config: AIProviderConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}
