import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Bookmark } from '@/types';

interface BookmarkStore {
  bookmarks: Bookmark[];
  addBookmark: (articleId: string) => void;
  removeBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
  getBookmarks: () => Bookmark[];
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      
      addBookmark: (articleId: string) => {
        const bookmarks = get().bookmarks;
        if (!bookmarks.some(b => b.articleId === articleId)) {
          const newBookmark: Bookmark = {
            id: Date.now().toString(),
            articleId,
            savedAt: new Date(),
          };
          set({ bookmarks: [...bookmarks, newBookmark] });
        }
      },
      
      removeBookmark: (articleId: string) => {
        set(state => ({
          bookmarks: state.bookmarks.filter(b => b.articleId !== articleId)
        }));
      },
      
      isBookmarked: (articleId: string) => {
        return get().bookmarks.some(b => b.articleId === articleId);
      },
      
      getBookmarks: () => {
        return get().bookmarks;
      },
    }),
    {
      name: 'bookmarks-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);