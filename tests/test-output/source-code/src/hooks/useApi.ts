import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { ErrorHandler, getErrorMessage } from '../utils/errorHandler';
import type {
  Article,
  Category,
  ArticlesResponse,
  SearchResponse,
  ArticleRequest,
  LoadingState,
} from '../types';

// Query keys for react-query
export const queryKeys = {
  articles: (params?: ArticleRequest) => ['articles', params],
  article: (id: string) => ['article', id],
  categories: () => ['categories'],
  search: (query: string, page?: number) => ['search', query, page],
  featuredArticles: (limit?: number) => ['articles', 'featured', limit],
};

// Custom hook for articles
export interface UseArticlesOptions {
  params?: ArticleRequest;
  enabled?: boolean;
  refetchOnMount?: boolean;
}

export const useArticles = (options: UseArticlesOptions = {}) => {
  const { params, enabled = true, refetchOnMount = true } = options;
  
  return useQuery({
    queryKey: queryKeys.articles(params),
    queryFn: () => apiService.getArticles(params),
    enabled,
    refetchOnMount,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (ErrorHandler.isApiError(error) && error.status && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Custom hook for single article
export const useArticle = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.article(id),
    queryFn: () => apiService.getArticle(id),
    enabled: enabled && !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
};

// Custom hook for categories
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => apiService.getCategories(),
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// Custom hook for featured articles
export const useFeaturedArticles = (limit = 5) => {
  return useQuery({
    queryKey: queryKeys.featuredArticles(limit),
    queryFn: () => apiService.getFeaturedArticles(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Custom hook for search with debouncing
export interface UseSearchOptions {
  query: string;
  page?: number;
  limit?: number;
  debounceMs?: number;
  enabled?: boolean;
}

export const useSearch = (options: UseSearchOptions) => {
  const { query, page = 1, limit = 20, debounceMs = 300, enabled = true } = options;
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useQuery({
    queryKey: queryKeys.search(debouncedQuery, page),
    queryFn: () => apiService.searchArticles(debouncedQuery, page, limit),
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Custom hook for infinite loading/pagination
export interface UseInfiniteArticlesOptions {
  params?: Omit<ArticleRequest, 'page'>;
  enabled?: boolean;
}

export const useInfiniteArticles = (options: UseInfiniteArticlesOptions = {}) => {
  const { params, enabled = true } = options;
  
  return useQuery({
    queryKey: ['articles', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      return apiService.getArticles({ ...params, page: pageParam });
    },
    enabled,
    getNextPageParam: (lastPage: ArticlesResponse) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
};

// Generic API mutation hook
export const useApiMutation = <T, P>(
  mutationFn: (params: P) => Promise<T>,
  options?: {
    onSuccess?: (data: T, variables: P) => void;
    onError?: (error: any, variables: P) => void;
    invalidateQueries?: string[][];
  }
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      options?.onSuccess?.(data, variables);
      
      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    onError: (error, variables) => {
      ErrorHandler.logError(error, 'API Mutation');
      options?.onError?.(error, variables);
    },
  });
};

// Network status hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  const checkConnection = useCallback(async () => {
    try {
      setIsConnecting(true);
      const isHealthy = await apiService.healthCheck();
      setIsOnline(isHealthy);
    } catch (error) {
      setIsOnline(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Periodic health checks
    checkIntervalRef.current = setInterval(checkConnection, 30000); // 30 seconds

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkConnection]);

  return {
    isOnline,
    isConnecting,
    checkConnection,
  };
};

// Cache management hook
export const useCache = () => {
  const queryClient = useQueryClient();

  const clearCache = useCallback(async () => {
    await apiService.clearCache();
    queryClient.clear();
  }, [queryClient]);

  const invalidateCache = useCallback(async (pattern?: string) => {
    await apiService.invalidateCache(pattern);
    queryClient.invalidateQueries();
  }, [queryClient]);

  const prefetchArticles = useCallback(async (params?: ArticleRequest) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.articles(params),
      queryFn: () => apiService.getArticles(params),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchArticle = useCallback(async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.article(id),
      queryFn: () => apiService.getArticle(id),
      staleTime: 30 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    clearCache,
    invalidateCache,
    prefetchArticles,
    prefetchArticle,
  };
};

export default {
  useArticles,
  useArticle,
  useCategories,
  useFeaturedArticles,
  useSearch,
  useInfiniteArticles,
  useApiMutation,
  useNetworkStatus,
  useCache,
};