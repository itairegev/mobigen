/**
 * AI Service - Real integration with Claude API
 *
 * Configuration via environment variables:
 * - EXPO_PUBLIC_AI_PROVIDER: 'anthropic' | 'openai' (default: 'anthropic')
 * - EXPO_PUBLIC_AI_API_KEY: Your API key
 * - EXPO_PUBLIC_AI_PROXY_URL: Optional proxy URL for production
 */

import type { Message, UserSettings } from '@/types';

// Model mapping to actual API model IDs
const MODEL_MAP: Record<string, { anthropic?: string; openai?: string }> = {
  'claude-3-sonnet': { anthropic: 'claude-sonnet-4-20250514' },
  'claude-3-opus': { anthropic: 'claude-opus-4-20250514' },
  'claude-3-haiku': { anthropic: 'claude-3-5-haiku-20241022' },
  'gpt-4': { openai: 'gpt-4-turbo-preview' },
  'gpt-3.5': { openai: 'gpt-3.5-turbo' },
};

// Configuration from environment
const AI_PROVIDER = process.env.EXPO_PUBLIC_AI_PROVIDER || 'anthropic';
const AI_PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL || '';

// API keys by provider
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_AI_API_KEY || '';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.EXPO_PUBLIC_AI_API_KEY || '';

// Helper to get the right API key
const getApiKey = (provider: string): string => {
  if (provider === 'anthropic') return ANTHROPIC_API_KEY;
  if (provider === 'openai') return OPENAI_API_KEY;
  return '';
};

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Main function to send chat messages to AI
 */
export async function sendChatMessage(
  messages: Message[],
  settings: UserSettings
): Promise<ChatResponse> {
  // Convert messages to API format
  const apiMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const request: ChatRequest = {
    messages: apiMessages,
    model: settings.selectedModel,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    systemPrompt: settings.systemPrompt,
  };

  // Use proxy if configured, otherwise direct API
  if (AI_PROXY_URL) {
    return sendViaProxy(request);
  }

  // Direct API calls
  if (AI_PROVIDER === 'anthropic') {
    return sendToAnthropic(request);
  } else if (AI_PROVIDER === 'openai') {
    return sendToOpenAI(request);
  }

  throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
}

/**
 * Send via proxy endpoint (recommended for production)
 */
async function sendViaProxy(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(AI_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI Proxy Error: ${error}`);
  }

  return response.json();
}

/**
 * Direct call to Anthropic Claude API
 */
async function sendToAnthropic(request: ChatRequest): Promise<ChatResponse> {
  const apiKey = getApiKey('anthropic');
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not configured');
  }

  const modelId = MODEL_MAP[request.model]?.anthropic || 'claude-sonnet-4-20250514';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      system: request.systemPrompt,
      messages: request.messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Anthropic API Error: ${error.error?.message || JSON.stringify(error)}`);
  }

  const data = await response.json();

  return {
    content: data.content[0]?.text || '',
    model: data.model,
    usage: {
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
    },
  };
}

/**
 * Direct call to OpenAI API
 */
async function sendToOpenAI(request: ChatRequest): Promise<ChatResponse> {
  const apiKey = getApiKey('openai');
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_OPENAI_API_KEY is not configured');
  }

  const modelId = MODEL_MAP[request.model]?.openai || 'gpt-4-turbo-preview';

  // OpenAI format includes system message in messages array
  const messages = [
    { role: 'system' as const, content: request.systemPrompt },
    ...request.messages,
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`OpenAI API Error: ${error.error?.message || JSON.stringify(error)}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || '',
    model: data.model,
    usage: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    },
  };
}

/**
 * Check if AI is configured
 */
export function isAIConfigured(): boolean {
  return !!(getApiKey(AI_PROVIDER) || AI_PROXY_URL);
}

/**
 * Get current AI provider name
 */
export function getAIProvider(): string {
  if (AI_PROXY_URL) return 'Proxy';
  return AI_PROVIDER === 'anthropic' ? 'Claude' : 'OpenAI';
}

/**
 * Streaming support for real-time responses
 * Note: This requires SSE or WebSocket support from the proxy
 */
export async function* streamChatMessage(
  messages: Message[],
  settings: UserSettings
): AsyncGenerator<string, void, unknown> {
  // For now, we use non-streaming and yield the full response
  // A full streaming implementation would use EventSource or WebSocket
  const response = await sendChatMessage(messages, settings);
  yield response.content;
}

// Export types
export type { ChatRequest, ChatResponse };
