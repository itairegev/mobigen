import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService from '../services/database';
import type { Bookmark, Article } from '../types';

interface BookmarkState {
  bookmarks: Bookmark[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addBookmark: (article: Article) => Promise<void>;
  removeBookmark: (articleId: string) => Promise<void>;
  toggleBookmark: (article: Article) => Promise<void>;
  isBookmarked: (articleId: string) => boolean;
  getBookmarkedArticles: () => Article[];
  loadBookmarksFromDb: () => Promise<void>;
  clearBookmarks: () => Promise<void>;
  updateBookmarkNotes: (bookmarkId: string, notes: string) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      isLoading: false,
      error: null,

      addBookmark: async (article: Article) => {
        try {
          set({ isLoading: true, error: null });
          
          const { bookmarks } = get();
          
          // Check if already bookmarked
          if (bookmarks.some(b => b.articleId === article.id)) {
            set({ isLoading: false });
            return;
          }

          const bookmark: Bookmark = {
            id: `bookmark_${article.id}_${Date.now()}`,
            articleId: article.id,
            article,
            savedAt: new Date(),
          };

          // Save to database
          await DatabaseService.addBookmark(bookmark, article);

          // Update state
          set({
            bookmarks: [bookmark, ...bookmarks],
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add bookmark';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      removeBookmark: async (articleId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { bookmarks } = get();

          // Remove from database
          await DatabaseService.removeBookmark(articleId);

          // Update state
          set({
            bookmarks: bookmarks.filter(b => b.articleId !== articleId),
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to remove bookmark';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      toggleBookmark: async (article: Article) => {
        const { isBookmarked, addBookmark, removeBookmark } = get();
        
        if (isBookmarked(article.id)) {
          await removeBookmark(article.id);
        } else {
          await addBookmark(article);
        }
      },

      isBookmarked: (articleId: string): boolean => {
        const { bookmarks } = get();
        return bookmarks.some(b => b.articleId === articleId);
      },

      getBookmarkedArticles: (): Article[] => {
        const { bookmarks } = get();
        return bookmarks
          .filter(b => b.article)
          .map(b => b.article!)
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      },

      loadBookmarksFromDb: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const bookmarks = await DatabaseService.getBookmarks();
          
          set({
            bookmarks,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load bookmarks';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      clearBookmarks: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { bookmarks } = get();
          
          // Remove all from database
          await Promise.all(
            bookmarks.map(b => DatabaseService.removeBookmark(b.articleId))
          );

          set({
            bookmarks: [],
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to clear bookmarks';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateBookmarkNotes: async (bookmarkId: string, notes: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { bookmarks } = get();
          const bookmark = bookmarks.find(b => b.id === bookmarkId);
          
          if (!bookmark || !bookmark.article) {
            throw new Error('Bookmark not found');
          }

          const updatedBookmark = { ...bookmark, notes };

          // Update in database
          await DatabaseService.addBookmark(updatedBookmark, bookmark.article);

          // Update state
          set({
            bookmarks: bookmarks.map(b => 
              b.id === bookmarkId ? updatedBookmark : b
            ),
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update bookmark notes';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'bookmark-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the bookmarks array, not loading states
      partialize: (state) => ({ bookmarks: state.bookmarks }),
    }
  )
);