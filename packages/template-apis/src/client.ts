/**
 * Unified API Client for Mobigen Templates
 *
 * Features:
 * - Automatic retries with exponential backoff
 * - Response caching with AsyncStorage
 * - Rate limit handling
 * - Offline support with stale data
 * - Request/response logging
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiConfig, ApiError, CacheEntry, RetryConfig } from './types';

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 3;
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

export class TemplateApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private retries: number;
  private cacheTime: number;
  private retryConfig: RetryConfig;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.retries = config.retries ?? DEFAULT_RETRIES;
    this.cacheTime = config.cacheTime ?? DEFAULT_CACHE_TIME;
    this.retryConfig = DEFAULT_RETRY_CONFIG;
  }

  /**
   * GET request with caching and retry
   */
  async get<T>(
    endpoint: string,
    options: {
      params?: Record<string, string | number | undefined>;
      headers?: Record<string, string>;
      cache?: boolean;
      cacheKey?: string;
    } = {}
  ): Promise<T> {
    const { params, headers, cache = true, cacheKey } = options;

    // Build URL with query params
    const url = this.buildUrl(endpoint, params);
    const key = cacheKey ?? `api_cache_${url}`;

    // Try cache first if enabled
    if (cache) {
      const cached = await this.getFromCache<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Make request with retry
    const data = await this.fetchWithRetry<T>(url, {
      method: 'GET',
      headers: this.buildHeaders(headers),
    });

    // Cache the response
    if (cache) {
      await this.setCache(key, data);
    }

    return data;
  }

  /**
   * POST request with retry (no caching)
   */
  async post<T>(
    endpoint: string,
    body: unknown,
    options: {
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint);

    return this.fetchWithRetry<T>(url, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(options.headers),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | undefined>
  ): string {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers
   */
  private buildHeaders(custom?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...custom,
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Fetch with automatic retry and exponential backoff
   */
  private async fetchWithRetry<T>(
    url: string,
    init: RequestInit
  ): Promise<T> {
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await this.parseErrorResponse(response);

          // Don't retry client errors (4xx) except rate limits (429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw error;
          }

          // Retry server errors (5xx) and rate limits
          if (attempt < this.retryConfig.maxRetries) {
            const delay = this.calculateDelay(attempt, response.status === 429);
            await this.sleep(delay);
            lastError = error;
            continue;
          }

          throw error;
        }

        return await response.json() as T;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          lastError = {
            message: 'Request timeout',
            code: 'TIMEOUT',
            retryable: true,
          };
        } else if (this.isApiError(error)) {
          lastError = error;
          if (!error.retryable) {
            throw error;
          }
        } else {
          lastError = {
            message: error instanceof Error ? error.message : 'Network error',
            code: 'NETWORK_ERROR',
            retryable: true,
          };
        }

        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt, false);
          await this.sleep(delay);
          continue;
        }
      }
    }

    // All retries exhausted, try to return stale cache
    const staleData = await this.getStaleFromCache<T>(url);
    if (staleData !== null) {
      console.warn(`[API] Returning stale data for ${url}`);
      return staleData;
    }

    throw lastError ?? { message: 'Unknown error', retryable: false };
  }

  /**
   * Parse error response
   */
  private async parseErrorResponse(response: Response): Promise<ApiError> {
    let message = `HTTP ${response.status}`;

    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // Ignore JSON parse errors
    }

    return {
      message,
      status: response.status,
      retryable: response.status >= 500 || response.status === 429,
    };
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateDelay(attempt: number, isRateLimit: boolean): number {
    if (isRateLimit) {
      // Longer delay for rate limits
      return Math.min(
        this.retryConfig.baseDelay * Math.pow(2, attempt + 2),
        this.retryConfig.maxDelay
      );
    }

    return Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
  }

  /**
   * Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get data from cache if not expired
   */
  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);

      if (Date.now() < entry.expiresAt) {
        return entry.data;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get stale data from cache (for offline fallback)
   */
  private async getStaleFromCache<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(`api_cache_${key}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * Save data to cache
   */
  private async setCache<T>(key: string, data: T): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.cacheTime,
      };

      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Ignore cache write errors
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith('api_cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch {
      // Ignore errors
    }
  }

  /**
   * Type guard for ApiError
   */
  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'retryable' in error
    );
  }
}

/**
 * Create a pre-configured client for common APIs
 */
export function createApiClient(
  baseUrl: string,
  apiKey?: string,
  options: Partial<ApiConfig> = {}
): TemplateApiClient {
  return new TemplateApiClient({
    baseUrl,
    apiKey,
    ...options,
  });
}
