/**
 * Claude Agent SDK Shim
 *
 * This is a shim implementation of the Claude Agent SDK interface
 * described in the Mobigen technical design. It provides the same interface
 * using either direct Anthropic API or AWS Bedrock.
 *
 * Supports:
 * - AI_PROVIDER=bedrock (uses AWS Bedrock)
 * - AI_PROVIDER=anthropic (uses direct Anthropic API)
 *
 * When a real Claude Agent SDK becomes available, replace this package.
 */

import Anthropic from '@anthropic-ai/sdk';
import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';

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

// Model mapping for direct Anthropic API
const ANTHROPIC_MODEL_MAP: Record<string, string> = {
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-3-opus-20240229',
  haiku: 'claude-3-5-haiku-20241022',
};

// Model mapping for AWS Bedrock
// Note: Claude 4 models require cross-region inference profiles (us. or eu. prefix)
// Older Claude 3/3.5 models can use direct model IDs
// Set BEDROCK_OPUS_MODEL to override the default opus model
const BEDROCK_MODEL_MAP: Record<string, string> = {
  // Claude 4 Sonnet - requires cross-region inference profile
  sonnet: process.env.BEDROCK_SONNET_MODEL || 'us.anthropic.claude-sonnet-4-20250514-v1:0',
  // For opus: prefer Claude 3 Opus if available, otherwise fall back to Sonnet
  // Claude 3 Opus may not be available in all regions or require different access
  opus: process.env.BEDROCK_OPUS_MODEL || 'us.anthropic.claude-sonnet-4-20250514-v1:0',
  // Claude 3.5 Haiku (supports on-demand)
  haiku: process.env.BEDROCK_HAIKU_MODEL || 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
};

type AIProvider = 'anthropic' | 'bedrock';

function getProvider(): AIProvider {
  return (process.env.AI_PROVIDER as AIProvider) || 'bedrock';
}

function createClient(): Anthropic | AnthropicBedrock {
  const provider = getProvider();

  if (provider === 'bedrock') {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const sessionToken = process.env.AWS_SESSION_TOKEN;

    if (accessKeyId && secretAccessKey) {
      return new AnthropicBedrock({
        awsRegion: region,
        awsAccessKey: accessKeyId,
        awsSecretKey: secretAccessKey,
        awsSessionToken: sessionToken,
      });
    }

    // Use default AWS credential chain (IAM role, ~/.aws/credentials, etc.)
    return new AnthropicBedrock({ awsRegion: region });
  }

  // Direct Anthropic API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY required when AI_PROVIDER=anthropic. Set AI_PROVIDER=bedrock to use AWS Bedrock.');
  }
  return new Anthropic({ apiKey });
}

function getModelId(alias: string): string {
  const provider = getProvider();
  const modelMap = provider === 'bedrock' ? BEDROCK_MODEL_MAP : ANTHROPIC_MODEL_MAP;
  return modelMap[alias] || alias;
}

// Default timeout for API calls (5 minutes)
const API_TIMEOUT_MS = parseInt(process.env.CLAUDE_API_TIMEOUT_MS || '300000', 10);

/**
 * Wraps a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout: ${message} (${ms}ms)`)), ms);
    }),
  ]);
}

/**
 * Query function implementing the Claude Agent SDK interface
 *
 * Uses AWS Bedrock (default) or direct Anthropic API based on AI_PROVIDER env var.
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

  // Get the model to use - prefer explicit model option, then agent model, then default
  const agentModel = Object.values(params.options?.agents || {})[0]?.model;
  const modelAlias = params.options?.model || agentModel || 'sonnet';
  const modelId = getModelId(modelAlias);

  let client: Anthropic | AnthropicBedrock;
  try {
    // Create client (Bedrock or direct Anthropic)
    client = createClient();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[claude-agent-sdk] Failed to create client: ${errMsg}`);
    yield {
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: `Error: Failed to initialize AI client - ${errMsg}` }],
      },
    };
    return;
  }

  // Build system prompt from agent definitions
  const agentPrompts = Object.values(params.options?.agents || {})
    .map(a => a.prompt)
    .join('\n\n');

  const systemPrompt = [
    params.options?.systemPrompt,
    agentPrompts,
    params.options?.cwd ? `Working directory: ${params.options.cwd}` : null,
  ].filter(Boolean).join('\n\n');

  try {
    console.log(`[claude-agent-sdk] Calling model: ${modelId} (${modelAlias})`);
    const startTime = Date.now();

    // Make the API call with timeout
    // Use type assertion to handle union type incompatibility between SDK versions
    const response = await withTimeout(
      (client.messages.create as (params: {
        model: string;
        max_tokens: number;
        system?: string;
        messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      }) => Promise<{ content: Array<{ type: string; text?: string }> }>)({
        model: modelId,
        max_tokens: 4096,
        system: systemPrompt || undefined,
        messages: [
          { role: 'user', content: params.prompt }
        ],
      }),
      API_TIMEOUT_MS,
      `API call to ${modelId}`
    );

    const elapsed = Date.now() - startTime;
    console.log(`[claude-agent-sdk] Response received in ${elapsed}ms`);

    // Yield assistant message
    yield {
      type: 'assistant',
      message: {
        content: response.content.map((block) => {
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
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[claude-agent-sdk] API call failed: ${errMsg}`);

    // Yield error as assistant message so caller knows what happened
    yield {
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: `Error: API call failed - ${errMsg}` }],
      },
    };
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Export types for consumers
export type { Anthropic };
