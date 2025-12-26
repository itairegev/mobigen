/**
 * Claude Agent SDK Shim
 *
 * This is a shim implementation of the Claude Agent SDK interface
 * described in the Mobigen technical design. It provides the same interface
 * using either direct Anthropic API or AWS Bedrock.
 *
 * Features:
 * - Multi-turn tool execution loop (continues until stop_reason != 'tool_use')
 * - Built-in tools: Read, Write, Edit, Bash, Glob, Grep
 * - Custom tool support via customTools option
 * - Session management for conversation continuity
 *
 * Supports:
 * - AI_PROVIDER=bedrock (uses AWS Bedrock)
 * - AI_PROVIDER=anthropic (uses direct Anthropic API)
 *
 * When a real Claude Agent SDK becomes available, replace this package.
 */

import Anthropic from '@anthropic-ai/sdk';
import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';
import {
  builtinTools,
  getToolDefinitions,
  executeTool,
  type Tool,
  type ToolDefinition,
  type ToolResult,
  type ToolUseBlock,
  type ToolResultBlock,
  type CustomToolConfig,
} from './tools/index.js';

// Re-export tool types
export type {
  Tool,
  ToolDefinition,
  ToolResult,
  ToolUseBlock,
  ToolResultBlock,
  CustomToolConfig,
};

// Export tools module
export {
  builtinTools,
  getToolDefinitions,
  executeTool,
} from './tools/index.js';

// Export parallel execution
export {
  ParallelExecutionManager,
  type TaskResult,
  type TaskOptions,
  type TaskExecutor,
  type ExecutionEvents,
} from './tools/index.js';

// Export Task tool for spawning subagents
export {
  createTaskTool,
  createTaskOutputTool,
  createTaskTools,
  type TaskToolInput,
  type TaskToolOutput,
  type TaskToolConfig,
  type TaskAgentDefinition,
  type AgentExecutor,
} from './tools/index.js';

// Export Command tools for slash commands
export {
  createCommandTool,
  createListCommandsTool,
  type CommandToolInput,
  type CommandToolConfig,
  type CommandToolDefinition,
  type CommandToolArgument,
} from './tools/index.js';

// Export Skill tools for reusable capabilities
export {
  createSkillTool,
  createFindSkillsTool,
  type SkillToolInput,
  type SkillToolConfig,
  type SkillToolDefinition,
} from './tools/index.js';

// Export Memory tools for persistent context
export {
  createRememberTool,
  createRecallTool,
  createQueryMemoryTool,
  createForgetTool,
  createGetMemoryContextTool,
  createMemoryTools,
  type MemoryToolConfig,
  type MemoryToolEntry,
  type MemoryToolScope,
} from './tools/index.js';

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
  /**
   * Custom tools to register for this query.
   * These are in addition to built-in tools (Read, Write, Edit, Bash, Glob, Grep).
   */
  customTools?: Record<string, CustomToolConfig>;
  /**
   * Whether to enable tool execution loop.
   * When true (default), the SDK will automatically execute tools and continue
   * the conversation until the model stops requesting tools.
   */
  enableToolExecution?: boolean;
  /**
   * Optional context for logging and retry budget tracking.
   * Helps identify which task/agent a call belongs to in logs.
   */
  context?: {
    agentId?: string;
    phase?: string;
    taskId?: string;
    projectId?: string;
  };
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
    content: Array<ContentBlock>;
  };
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_result?: ToolResult;
  stop_reason?: string;
}

// Content block types matching Anthropic API
interface TextBlock {
  type: 'text';
  text: string;
}

interface ToolUseBlockContent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type ContentBlock = TextBlock | ToolUseBlockContent | { type: string };

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

// Default timeout for API calls (10 minutes - increased from 5)
const API_TIMEOUT_MS = parseInt(process.env.CLAUDE_API_TIMEOUT_MS || '600000', 10);

// Default max turns for tool execution loop
const DEFAULT_MAX_TURNS = 50;

// Retry configuration for rate limiting
const RETRY_CONFIG = {
  maxRetries: parseInt(process.env.CLAUDE_MAX_RETRIES || '5', 10),
  initialDelayMs: parseInt(process.env.CLAUDE_RETRY_INITIAL_DELAY_MS || '2000', 10),
  maxDelayMs: parseInt(process.env.CLAUDE_RETRY_MAX_DELAY_MS || '60000', 10),
  backoffMultiplier: 2,
};

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
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (rate limiting or transient errors)
 */
function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const e = error as Record<string, unknown>;

  // Check HTTP status codes
  const status = e.status as number | undefined;
  if (status === 429) return true; // Rate limited
  if (status === 503) return true; // Service unavailable
  if (status === 502) return true; // Bad gateway
  if (status === 500) return true; // Internal server error (sometimes transient)

  // Check error messages
  const message = (e.message as string | undefined) || '';
  if (message.includes('Too many tokens')) return true;
  if (message.includes('ThrottlingException')) return true;
  if (message.includes('rate limit')) return true;
  if (message.includes('ECONNRESET')) return true;
  if (message.includes('ETIMEDOUT')) return true;

  return false;
}

/**
 * Context for retry operations
 */
interface RetryContext {
  agentId?: string;
  phase?: string;
  turnCount?: number;
  startTime: number; // When the operation started (for timeout budget)
  timeoutMs: number; // Total timeout budget
}

/**
 * Execute an API call with retry and exponential backoff
 * Respects timeout budget - won't retry if delay would exceed remaining time
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: RetryContext
): Promise<T> {
  let lastError: unknown;
  let delay = RETRY_CONFIG.initialDelayMs;
  let totalDelayAccumulated = 0;

  const contextStr = context?.agentId
    ? ` [agent=${context.agentId}${context.phase ? `, phase=${context.phase}` : ''}${context.turnCount ? `, turn=${context.turnCount}` : ''}]`
    : '';

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt >= RETRY_CONFIG.maxRetries) {
        throw error;
      }

      // Check if retry delay would exceed remaining timeout budget
      if (context) {
        const elapsed = Date.now() - context.startTime;
        const remaining = context.timeoutMs - elapsed;

        if (delay > remaining) {
          log('warn', `Skipping retry${contextStr} - delay ${delay}ms would exceed remaining budget ${remaining}ms`, {
            error: error instanceof Error ? error.message : String(error),
            attempt,
            elapsed,
            remaining,
            wouldDelay: delay,
          });
          throw new Error(`Retry would exceed timeout budget. Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      log('warn', `Retryable error on ${operationName}${contextStr}, attempt ${attempt}/${RETRY_CONFIG.maxRetries}`, {
        error: error instanceof Error ? error.message : String(error),
        nextDelayMs: delay,
        totalDelayAccumulated,
        agentId: context?.agentId,
        phase: context?.phase,
        turn: context?.turnCount,
      });

      await sleep(delay);
      totalDelayAccumulated += delay;

      // Exponential backoff with jitter
      delay = Math.min(
        delay * RETRY_CONFIG.backoffMultiplier + Math.random() * 1000,
        RETRY_CONFIG.maxDelayMs
      );
    }
  }

  throw lastError;
}

/**
 * Wraps a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  log('debug', `Starting operation with ${ms}ms timeout: ${message}`);

  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      log('error', `Operation timed out: ${message}`);
      reject(new Error(`Timeout: ${message} (${ms}ms)`));
    }, ms);
  });

  // Clear timeout when the original promise settles
  const wrappedPromise = promise.finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  return Promise.race([wrappedPromise, timeoutPromise]);
}

/**
 * Build tool definitions from allowed tools and custom tools
 */
function buildToolDefinitions(
  allowedTools?: string[],
  customTools?: Record<string, CustomToolConfig>
): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  // Add built-in tools (filtered by allowedTools if specified)
  const builtinDefs = getToolDefinitions(allowedTools);
  tools.push(...builtinDefs);

  // Add custom tools
  if (customTools) {
    for (const [name, config] of Object.entries(customTools)) {
      // Skip if allowedTools is specified and doesn't include this tool
      if (allowedTools && !allowedTools.includes(name)) continue;

      tools.push({
        name,
        description: config.description || `Custom tool: ${name}`,
        input_schema: config.schema,
      });
    }
  }

  return tools;
}

/**
 * Build custom tools map from config
 */
function buildCustomToolsMap(
  customTools?: Record<string, CustomToolConfig>
): Record<string, Tool> | undefined {
  if (!customTools) return undefined;

  const map: Record<string, Tool> = {};
  for (const [name, config] of Object.entries(customTools)) {
    map[name] = {
      definition: {
        name,
        description: config.description || `Custom tool: ${name}`,
        input_schema: config.schema,
      },
      handler: config.handler,
    };
  }
  return map;
}

/**
 * Run hooks for a tool use
 */
async function runHooks(
  hookType: 'PreToolUse' | 'PostToolUse',
  toolName: string,
  toolInput: Record<string, unknown>,
  toolUseId: string,
  hooks?: HookConfig,
  signal?: AbortSignal
): Promise<HookOutput | null> {
  if (!hooks || !hooks[hookType]) return null;

  for (const matcher of hooks[hookType]!) {
    const regex = new RegExp(matcher.matcher);
    if (regex.test(toolName)) {
      for (const hookFn of matcher.hooks) {
        const result = await hookFn(
          { tool_name: toolName, tool_input: toolInput, hook_event_name: hookType },
          toolUseId,
          { signal }
        );
        if (result.hookSpecificOutput) {
          return result;
        }
      }
    }
  }
  return null;
}

/**
 * Query function implementing the Claude Agent SDK interface
 *
 * Uses AWS Bedrock (default) or direct Anthropic API based on AI_PROVIDER env var.
 * Implements multi-turn tool execution loop.
 */
export async function* query(params: {
  prompt: string;
  options?: QueryOptions;
}): AsyncGenerator<SDKMessage> {
  const sessionId = params.options?.resume || generateSessionId();
  const agentNames = Object.keys(params.options?.agents || {});
  const enableToolExecution = params.options?.enableToolExecution !== false;
  const maxTurns = params.options?.maxTurns || DEFAULT_MAX_TURNS;
  const queryContext = params.options?.context;
  const queryStartTime = Date.now();

  // Build context string for logging
  const contextStr = queryContext?.agentId
    ? ` [agent=${queryContext.agentId}${queryContext.phase ? `, phase=${queryContext.phase}` : ''}${queryContext.projectId ? `, project=${queryContext.projectId.slice(0, 8)}` : ''}]`
    : '';

  log('info', `Query started${contextStr}`, {
    sessionId,
    agents: agentNames,
    resuming: !!params.options?.resume,
    promptLength: params.prompt.length,
    enableToolExecution,
    maxTurns,
    context: queryContext,
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

  // Build tools
  const toolDefinitions = buildToolDefinitions(
    params.options?.allowedTools,
    params.options?.customTools
  );
  const customToolsMap = buildCustomToolsMap(params.options?.customTools);

  log('debug', `System prompt built`, { length: systemPrompt.length });
  log('debug', `Tools configured`, { count: toolDefinitions.length, names: toolDefinitions.map(t => t.name) });
  log('debug', `User prompt preview`, { preview: params.prompt.substring(0, 200) + '...' });

  // Message history for multi-turn conversation
  type Message = { role: 'user' | 'assistant'; content: string | ContentBlock[] };
  const messages: Message[] = [
    { role: 'user', content: params.prompt }
  ];

  let turnCount = 0;
  let continueLoop = true;

  while (continueLoop && turnCount < maxTurns) {
    turnCount++;
    log('info', `Turn ${turnCount}/${maxTurns}${contextStr}`);

    try {
      log('info', `Calling model${contextStr}: ${modelId} (timeout: ${API_TIMEOUT_MS}ms)`);
      const turnStartTime = Date.now();

      // Build API request parameters
      const requestParams: {
        model: string;
        max_tokens: number;
        system?: string;
        messages: Message[];
        tools?: ToolDefinition[];
      } = {
        model: modelId,
        max_tokens: 4096,
        system: systemPrompt || undefined,
        messages,
      };

      // Add tools if enabled
      if (enableToolExecution && toolDefinitions.length > 0) {
        requestParams.tools = toolDefinitions;
      }

      // Build retry context for timeout budget tracking
      const retryContext: RetryContext = {
        agentId: queryContext?.agentId,
        phase: queryContext?.phase,
        turnCount,
        startTime: queryStartTime,
        timeoutMs: API_TIMEOUT_MS,
      };

      // Make the API call with retry and timeout
      const response = await withRetry(
        () => withTimeout(
          (client.messages.create as (params: typeof requestParams) => Promise<{
            content: ContentBlock[];
            stop_reason: string;
          }>)(requestParams),
          API_TIMEOUT_MS,
          `API call to ${modelId}${contextStr}`
        ),
        `Turn ${turnCount} API call`,
        retryContext
      );

      const elapsed = Date.now() - turnStartTime;

      log('info', `Response received${contextStr}`, {
        durationMs: elapsed,
        contentBlocks: response.content.length,
        stopReason: response.stop_reason,
      });

      // Check for tool use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is ToolUseBlockContent => block.type === 'tool_use'
      );

      // Yield assistant message
      yield {
        type: 'assistant',
        message: {
          content: response.content,
        },
        stop_reason: response.stop_reason,
      };

      // If there are tool uses and tool execution is enabled, execute them
      if (toolUseBlocks.length > 0 && enableToolExecution) {
        // Add assistant message to history
        messages.push({ role: 'assistant', content: response.content });

        // Execute each tool and collect results
        const toolResults: ToolResultBlock[] = [];

        for (const toolUse of toolUseBlocks) {
          log('info', `Executing tool: ${toolUse.name}`, { id: toolUse.id });

          // Run PreToolUse hooks
          const preHookResult = await runHooks(
            'PreToolUse',
            toolUse.name,
            toolUse.input,
            toolUse.id,
            params.options?.hooks
          );

          // Check if hook blocked the tool
          if (preHookResult?.hookSpecificOutput?.permissionDecision === 'deny') {
            log('warn', `Tool blocked by PreToolUse hook: ${toolUse.name}`);
            yield {
              type: 'tool',
              tool_name: toolUse.name,
              tool_input: toolUse.input,
              tool_result: {
                success: false,
                error: preHookResult.hookSpecificOutput.permissionDecisionReason as string || 'Blocked by hook',
              },
            };
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Error: ${preHookResult.hookSpecificOutput.permissionDecisionReason || 'Blocked by hook'}`,
              is_error: true,
            });
            continue;
          }

          // Execute the tool
          const result = await executeTool(toolUse.name, toolUse.input, customToolsMap);

          // Yield tool execution message
          yield {
            type: 'tool',
            tool_name: toolUse.name,
            tool_input: toolUse.input,
            tool_result: result,
          };

          // Run PostToolUse hooks
          await runHooks(
            'PostToolUse',
            toolUse.name,
            toolUse.input,
            toolUse.id,
            params.options?.hooks
          );

          // Format result for API
          const resultContent = result.success
            ? (typeof result.output === 'string' ? result.output : JSON.stringify(result.output))
            : `Error: ${result.error}`;

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: resultContent,
            is_error: !result.success,
          });
        }

        // Add tool results to messages
        messages.push({
          role: 'user',
          content: toolResults as unknown as ContentBlock[],
        });

        // Continue loop to get model's response to tool results
        continueLoop = true;
      } else {
        // No tool use or tool execution disabled - stop loop
        continueLoop = false;
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;

      // Extract more details from Anthropic/Bedrock errors
      let errorDetails: Record<string, unknown> = {
        modelId,
        provider,
        turn: turnCount,
        agentId: queryContext?.agentId,
        phase: queryContext?.phase,
        projectId: queryContext?.projectId,
        taskId: queryContext?.taskId,
        elapsedSinceStart: Date.now() - queryStartTime,
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

      log('error', `API call failed${contextStr}: ${errMsg}`, errorDetails);

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

      // Stop loop on error
      continueLoop = false;
    }
  }

  if (turnCount >= maxTurns) {
    log('warn', `Max turns (${maxTurns}) reached`);
    yield {
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: `Warning: Maximum turns (${maxTurns}) reached. The conversation was stopped.` }],
      },
    };
  }

  // Yield result
  yield {
    type: 'result',
    session_id: sessionId,
  };

  log('info', `Query completed`, { sessionId, totalTurns: turnCount });
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Export types for consumers
export type { Anthropic };
