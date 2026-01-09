/**
 * Shared types for template APIs
 */

export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  cacheTime?: number; // Cache duration in milliseconds
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  cached: boolean;
  timestamp: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  retryable: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

// Pagination types
export interface PaginatedRequest {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Common entity types used across APIs
export interface ImageAsset {
  id: string;
  url: string;
  width?: number;
  height?: number;
}

export interface Category {
  id: string | number;
  name: string;
}
