import { useCallback, useEffect, useState } from 'react';
import StorageService from '../services/storage';
import DatabaseService from '../services/database';
import type { UserPreferences, Bookmark, SearchHistory, Article } from '../types';

export interface UseStorageReturn {
  // Preferences
  preferences: UserPreferences | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  
  // Bookmarks
  bookmarks: Bookmark[];
  isBookmarked: (articleId: string) => boolean;
  addBookmark: (article: Article) => Promise<void>;
  removeBookmark: (articleId: string) => Promise<void>;
  
  // Search history
  searchHistory: SearchHistory[];
  addSearchEntry: (entry: Omit<SearchHistory, 'id' | 'searchedAt'>) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  
  // Storage management
  clearCache: () => Promise<void>;
  getStorageSize: () => Promise<number>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

const defaultPreferences: UserPreferences = {
  categories: [],
  notificationsEnabled: true,
  darkMode: 'system',
  language: 'en',
  fontSize: 'medium',
  readingMode: false,
  autoRefresh: true,
  refreshInterval: 300000, // 5 minutes
};

export const useStorage = (): UseStorageReturn => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize storage and load data
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        setIsLoading(true);
        
        // Initialize database
        await DatabaseService.initialize();
        
        // Load preferences
        const storedPreferences = await StorageService.getUserPreferences();
        setPreferences(storedPreferences || defaultPreferences);
        
        // Load bookmarks from database
        const storedBookmarks = await DatabaseService.getBookmarks();
        setBookmarks(storedBookmarks);
        
        // Load search history from database
        const storedHistory = await DatabaseService.getSearchHistory();
        setSearchHistory(storedHistory);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize storage');
        console.error('Storage initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      const updated = { ...preferences, ...updates } as UserPreferences;
      await StorageService.setUserPreferences(updated);
      setPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    }
  }, [preferences]);

  // Check if article is bookmarked
  const isBookmarked = useCallback((articleId: string): boolean => {
    return bookmarks.some(bookmark => bookmark.articleId === articleId);
  }, [bookmarks]);

  // Add bookmark
  const addBookmark = useCallback(async (article: Article) => {
    try {
      const bookmark: Bookmark = {
        id: `bookmark_${article.id}_${Date.now()}`,
        articleId: article.id,
        article,
        savedAt: new Date(),
      };

      await DatabaseService.addBookmark(bookmark, article);
      setBookmarks(prev => [bookmark, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bookmark');
      throw err;
    }
  }, []);

  // Remove bookmark
  const removeBookmark = useCallback(async (articleId: string) => {
    try {
      await DatabaseService.removeBookmark(articleId);
      setBookmarks(prev => prev.filter(bookmark => bookmark.articleId !== articleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove bookmark');
      throw err;
    }
  }, []);

  // Add search entry
  const addSearchEntry = useCallback(async (entry: Omit<SearchHistory, 'id' | 'searchedAt'>) => {
    try {
      const searchEntry: SearchHistory = {
        id: `search_${Date.now()}`,
        searchedAt: new Date(),
        ...entry,
      };

      await DatabaseService.addSearchHistory(searchEntry);
      
      // Update local state
      setSearchHistory(prev => {
        const filtered = prev.filter(h => h.query !== entry.query);
        return [searchEntry, ...filtered].slice(0, 50);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add search entry');
      throw err;
    }
  }, []);

  // Clear search history
  const clearSearchHistory = useCallback(async () => {
    try {
      await DatabaseService.clearSearchHistory();
      setSearchHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear search history');
      throw err;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await StorageService.clearCache();
      await DatabaseService.clearExpiredCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
      throw err;
    }
  }, []);

  // Get storage size
  const getStorageSize = useCallback(async (): Promise<number> => {
    try {
      return await StorageService.getStorageSize();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get storage size');
      return 0;
    }
  }, []);

  return {
    preferences,
    updatePreferences,
    bookmarks,
    isBookmarked,
    addBookmark,
    removeBookmark,
    searchHistory,
    addSearchEntry,
    clearSearchHistory,
    clearCache,
    getStorageSize,
    isLoading,
    error,
  };
};

export default useStorage;