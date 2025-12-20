/**
 * Mock Claude Agent SDK
 *
 * This is a mock implementation of the hypothetical Claude Agent SDK
 * described in the Mobigen technical design. It provides a similar interface
 * using the standard Anthropic SDK under the hood.
 *
 * When a real Claude Agent SDK becomes available, replace this package.
 */

import Anthropic from '@anthropic-ai/sdk';

// Types
export interface AgentDefinition {
  description: string;
  prompt: string;
  tools?: string[];
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
}

export interface QueryOptions {
  resume?: string;
  agents?: Record<string, AgentDefinition>;
  allowedTools?: string[];
  systemPrompt?: string;
  cwd?: string;
  permissionMode?: 'acceptEdits' | 'ask';
  hooks?: HookConfig;
  model?: string;
  maxTurns?: number;
}

export interface HookConfig {
  PreToolUse?: HookMatcher[];
  PostToolUse?: HookMatcher[];
  SubagentStop?: HookMatcher[];
}

export interface HookMatcher {
  matcher: string;
  hooks: HookCallback[];
}

export type HookCallback = (
  input: Record<string, unknown>,
  toolUseId: string,
  context: { signal?: AbortSignal }
) => Promise<HookOutput>;

export interface HookOutput {
  hookSpecificOutput?: Record<string, unknown>;
}

export interface SDKMessage {
  type: 'system' | 'assistant' | 'tool' | 'result';
  subtype?: 'init';
  session_id?: string;
  message?: {
    content: Array<{ type: string; text?: string }>;
  };
  tool_name?: string;
  tool_input?: Record<string, unknown>;
}

// Model mapping
const MODEL_MAP: Record<string, string> = {
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-3-opus-20240229',
  haiku: 'claude-3-5-haiku-20241022',
};

/**
 * Mock query function that simulates the Claude Agent SDK behavior
 *
 * In reality, this would be a sophisticated multi-agent orchestration system.
 * For development, we simulate basic responses.
 */
export async function* query(params: {
  prompt: string;
  options?: QueryOptions;
}): AsyncGenerator<SDKMessage> {
  const sessionId = params.options?.resume || generateSessionId();

  // Emit init message with session ID
  yield {
    type: 'system',
    subtype: 'init',
    session_id: sessionId,
  };

  // Get the model to use
  const modelAlias = Object.values(params.options?.agents || {})[0]?.model || 'sonnet';
  const modelId = MODEL_MAP[modelAlias] || modelAlias;

  try {
    // Create Anthropic client
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build system prompt from agent definitions
    const agentPrompts = Object.values(params.options?.agents || {})
      .map(a => a.prompt)
      .join('\n\n');

    const systemPrompt = [
      params.options?.systemPrompt,
      agentPrompts,
      params.options?.cwd ? `Working directory: ${params.options.cwd}` : null,
    ].filter(Boolean).join('\n\n');

    // Make the API call
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 4096,
      system: systemPrompt || undefined,
      messages: [
        { role: 'user', content: params.prompt }
      ],
    });

    // Yield assistant message
    yield {
      type: 'assistant',
      message: {
        content: response.content.map(block => {
          if (block.type === 'text') {
            return { type: 'text', text: block.text };
          }
          return { type: block.type };
        }),
      },
    };

    // Yield result
    yield {
      type: 'result',
      session_id: sessionId,
    };

  } catch (error) {
    // If no API key, yield mock response for development
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[Claude Agent SDK Mock] No ANTHROPIC_API_KEY set, returning mock response');

      yield {
        type: 'assistant',
        message: {
          content: [{
            type: 'text',
            text: `[Mock Response] Received prompt: "${params.prompt.substring(0, 100)}..."

This is a mock response from the Claude Agent SDK stub.
Set ANTHROPIC_API_KEY to get real AI responses.

Mock analysis complete. No actual files were modified.`,
          }],
        },
      };

      yield {
        type: 'result',
        session_id: sessionId,
      };
    } else {
      throw error;
    }
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Export types for consumers
export type { Anthropic };
