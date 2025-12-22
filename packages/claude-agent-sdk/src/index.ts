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

// Logging configuration
const LOG_PREFIX = '[claude-agent-sdk]';
const LOG_VERBOSE = process.env.CLAUDE_SDK_VERBOSE === 'true';

function log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const prefix = `${LOG_PREFIX} [${timestamp}]`;

  if (level === 'debug' && !LOG_VERBOSE) return;

  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (data) {
    const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    if (dataStr.length > 500) {
      logFn(`${prefix} ${level.toUpperCase()}: ${message} (${dataStr.length} chars)`);
    } else {
      logFn(`${prefix} ${level.toUpperCase()}: ${message}`, data);
    }
  } else {
    logFn(`${prefix} ${level.toUpperCase()}: ${message}`);
  }
}

/**
 * Wraps a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  log('debug', `Starting operation with ${ms}ms timeout: ${message}`);
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        log('error', `Operation timed out: ${message}`);
        reject(new Error(`Timeout: ${message} (${ms}ms)`));
      }, ms);
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
  const agentNames = Object.keys(params.options?.agents || {});

  log('info', `Query started`, {
    sessionId,
    agents: agentNames,
    resuming: !!params.options?.resume,
    promptLength: params.prompt.length,
  });

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
  const provider = getProvider();

  log('info', `Model selected`, {
    alias: modelAlias,
    modelId,
    provider,
    agentModel: agentModel || 'not specified',
  });

  let client: Anthropic | AnthropicBedrock;
  try {
    log('debug', `Creating ${provider} client...`);
    client = createClient();
    log('info', `Client created successfully`, { provider });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    log('error', `Failed to create client: ${errMsg}`, { stack: errStack });
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

  log('debug', `System prompt built`, { length: systemPrompt.length });
  log('debug', `User prompt preview`, { preview: params.prompt.substring(0, 200) + '...' });

  try {
    log('info', `Calling model: ${modelId} (timeout: ${API_TIMEOUT_MS}ms)`);
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
    const responseText = response.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map(b => b.text)
      .join('');

    log('info', `Response received`, {
      durationMs: elapsed,
      responseLength: responseText.length,
      contentBlocks: response.content.length,
    });
    log('debug', `Response preview`, { preview: responseText.substring(0, 300) + '...' });

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

    log('info', `Query completed successfully`, { sessionId, durationMs: elapsed });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;

    // Extract more details from Anthropic/Bedrock errors
    let errorDetails: Record<string, unknown> = {
      modelId,
      provider,
    };

    if (error && typeof error === 'object') {
      const e = error as Record<string, unknown>;
      if (e.status) errorDetails.httpStatus = e.status;
      if (e.error) errorDetails.apiError = e.error;
      if (e.code) errorDetails.errorCode = e.code;
      if (e.type) errorDetails.errorType = e.type;
      if (e.headers) errorDetails.headers = e.headers;

      // Bedrock-specific errors
      if (e.$metadata) {
        const metadata = e.$metadata as Record<string, unknown>;
        errorDetails.requestId = metadata.requestId;
        errorDetails.attempts = metadata.attempts;
        errorDetails.totalRetryDelay = metadata.totalRetryDelay;
      }
    }

    log('error', `API call failed: ${errMsg}`, errorDetails);

    if (errStack) {
      log('debug', 'Stack trace:', { stack: errStack });
    }

    // Provide more helpful error message
    let userMessage = `Error: API call failed - ${errMsg}`;

    if (errMsg.includes('Could not resolve credentials')) {
      userMessage += '\n\nHint: AWS credentials not found. Configure via:\n' +
        '- Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)\n' +
        '- AWS CLI profile (~/.aws/credentials)\n' +
        '- Or set AI_PROVIDER=anthropic and provide ANTHROPIC_API_KEY';
    } else if (errMsg.includes('AccessDeniedException') || errMsg.includes('UnauthorizedAccess')) {
      userMessage += '\n\nHint: Check that your AWS credentials have access to Bedrock and the Claude models.';
    } else if (errMsg.includes('ModelNotFound') || errMsg.includes('ValidationException')) {
      userMessage += `\n\nHint: Model ${modelId} may not be available in your region or requires enablement.`;
    } else if (errMsg.includes('ThrottlingException')) {
      userMessage += '\n\nHint: Rate limited. Try again in a few seconds.';
    } else if (errMsg.includes('Timeout')) {
      userMessage += '\n\nHint: API call timed out. Try setting CLAUDE_API_TIMEOUT_MS to a higher value.';
    }

    // Yield error as assistant message so caller knows what happened
    yield {
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: userMessage }],
      },
    };
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Export types for consumers
export type { Anthropic };
