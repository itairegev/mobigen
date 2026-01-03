export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: PaginationMeta;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface SearchResponse {
  articles: Article[];
  total: number;
  query: string;
}

export interface ArticleRequest {
  page?: number;
  limit?: number;
  category?: string;
  featured?: boolean;
  search?: string;
}

export interface BookmarkRequest {
  articleId: string;
}

export interface NotificationRequest {
  token: string;
  preferences: NotificationPreferences;
}

export interface NotificationPreferences {
  breaking: boolean;
  categories: string[];
  frequency: 'immediate' | 'daily' | 'weekly';
}

// Re-export core types for convenience
import type { Article, Category, Author, Bookmark, UserPreferences } from './index';
export type { Article, Category, Author, Bookmark, UserPreferences };