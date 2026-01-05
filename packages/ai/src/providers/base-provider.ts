/**
 * Base AI Provider Abstract Class
 */

import type {
  AIProvider,
  AIProviderType,
  AIProviderConfig,
  CompletionOptions,
  CompletionResult,
  StreamChunk,
  EmbeddingOptions,
  EmbeddingResult,
} from './types.js';

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: AIProviderType;

  protected config: AIProviderConfig;
  protected retryDelays = [1000, 2000, 4000]; // Exponential backoff

  constructor(config: AIProviderConfig) {
    this.config = {
      timeout: 60000,
      maxRetries: 3,
      ...config,
    };
  }

  abstract complete(options: CompletionOptions): Promise<CompletionResult>;

  abstract streamComplete(options: CompletionOptions): AsyncGenerator<StreamChunk>;

  embed?(options: EmbeddingOptions): Promise<EmbeddingResult>;

  listModels?(): Promise<string[]>;

  protected async withRetry<T>(
    operation: () => Promise<T>,
    retries = this.config.maxRetries || 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (this.shouldNotRetry(error)) {
          throw error;
        }

        if (attempt < retries) {
          const delay = this.retryDelays[attempt] || this.retryDelays[this.retryDelays.length - 1];
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  protected shouldNotRetry(error: unknown): boolean {
    if (error instanceof Error) {
      // Don't retry on auth errors or invalid requests
      const message = error.message.toLowerCase();
      return (
        message.includes('invalid api key') ||
        message.includes('authentication') ||
        message.includes('invalid_api_key') ||
        message.includes('400')
      );
    }
    return false;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  protected async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout || 60000
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
