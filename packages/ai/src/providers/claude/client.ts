/**
 * Claude/Anthropic Provider Implementation
 */

import { BaseAIProvider } from '../base-provider.js';
import type {
  AIProviderConfig,
  CompletionOptions,
  CompletionResult,
  StreamChunk,
  Message,
  ToolDefinition,
} from '../types.js';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'tool_use' | 'tool_result';
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
    tool_use_id?: string;
    content?: string;
  }>;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: Array<{
    type: 'text' | 'tool_use';
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  }>;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeStreamEvent {
  type: string;
  index?: number;
  message?: ClaudeResponse;
  content_block?: {
    type: 'text' | 'tool_use';
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  };
  delta?: {
    type: string;
    text?: string;
    partial_json?: string;
    stop_reason?: string;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export class ClaudeProvider extends BaseAIProvider {
  readonly name = 'claude' as const;
  private baseUrl: string;
  private apiVersion = '2023-06-01';

  constructor(config: AIProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  }

  protected override getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': this.apiVersion,
    };
  }

  async complete(options: CompletionOptions): Promise<CompletionResult> {
    return this.withRetry(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/messages`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(this.buildRequest(options)),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as ClaudeResponse;
      return this.parseResponse(data);
    });
  }

  async *streamComplete(options: CompletionOptions): AsyncGenerator<StreamChunk> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/messages`,
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
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let messageId = '';
    let model = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const event = JSON.parse(trimmed.slice(6)) as ClaudeStreamEvent;

            if (event.type === 'message_start' && event.message) {
              messageId = event.message.id;
              model = event.message.model;
            }

            if (event.type === 'content_block_delta' && event.delta?.text) {
              yield {
                id: messageId,
                model,
                delta: { content: event.delta.text },
              };
            }

            if (event.type === 'message_delta' && event.delta?.stop_reason) {
              yield {
                id: messageId,
                model,
                delta: {},
                finishReason: this.mapStopReason(event.delta.stop_reason),
              };
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private buildRequest(options: CompletionOptions): Record<string, unknown> {
    const { systemMessage, messages } = this.extractSystemMessage(options.messages);

    const request: Record<string, unknown> = {
      model: options.model,
      messages: messages.map(m => this.convertMessage(m)),
      max_tokens: options.maxTokens || 4096,
    };

    if (systemMessage) {
      request.system = systemMessage;
    }
    if (options.temperature !== undefined) {
      request.temperature = options.temperature;
    }
    if (options.topP !== undefined) {
      request.top_p = options.topP;
    }
    if (options.stop) {
      request.stop_sequences = options.stop;
    }
    if (options.tools && options.tools.length > 0) {
      request.tools = options.tools.map(t => this.convertTool(t));
    }
    if (options.toolChoice) {
      if (options.toolChoice === 'auto') {
        request.tool_choice = { type: 'auto' };
      } else if (options.toolChoice === 'none') {
        // Claude doesn't have 'none', we just don't pass tools
        delete request.tools;
      } else if (options.toolChoice === 'required') {
        request.tool_choice = { type: 'any' };
      } else if (typeof options.toolChoice === 'object') {
        request.tool_choice = {
          type: 'tool',
          name: options.toolChoice.function.name,
        };
      }
    }

    return request;
  }

  private extractSystemMessage(messages: Message[]): {
    systemMessage: string | null;
    messages: Message[];
  } {
    const systemMessages = messages.filter(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    return {
      systemMessage: systemMessages.length > 0
        ? systemMessages.map(m => m.content).join('\n\n')
        : null,
      messages: otherMessages,
    };
  }

  private convertMessage(message: Message): ClaudeMessage {
    // Map roles (Claude only supports user/assistant)
    const role = message.role === 'tool' ? 'user' : message.role as 'user' | 'assistant';

    if (message.role === 'tool' && message.toolCallId) {
      // Tool result message
      return {
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: message.toolCallId,
          content: message.content,
        }],
      };
    }

    if (message.toolCalls && message.toolCalls.length > 0) {
      // Message with tool calls
      return {
        role,
        content: message.toolCalls.map(tc => ({
          type: 'tool_use' as const,
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        })),
      };
    }

    return {
      role,
      content: message.content,
    };
  }

  private convertTool(tool: ToolDefinition): Record<string, unknown> {
    return {
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    };
  }

  private parseResponse(data: ClaudeResponse): CompletionResult {
    const textContent = data.content.find(c => c.type === 'text');
    const toolUses = data.content.filter(c => c.type === 'tool_use');

    return {
      id: data.id,
      model: data.model,
      content: textContent?.text || null,
      toolCalls: toolUses.length > 0 ? toolUses.map(tu => ({
        id: tu.id!,
        type: 'function' as const,
        function: {
          name: tu.name!,
          arguments: JSON.stringify(tu.input),
        },
      })) : undefined,
      finishReason: this.mapStopReason(data.stop_reason),
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }

  private mapStopReason(
    reason: string
  ): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    switch (reason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'tool_use':
        return 'tool_calls';
      default:
        return 'stop';
    }
  }
}

export function createClaudeProvider(config: AIProviderConfig): ClaudeProvider {
  return new ClaudeProvider(config);
}
