import { create } from 'zustand';

interface BookmarksState {
  bookmarkedIds: Set<string>;
  toggleBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
  clearBookmarks: () => void;
}

const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarkedIds: new Set(['1', '3']), // Some mock bookmarks
  toggleBookmark: (articleId) =>
    set((state) => {
      const newBookmarks = new Set(state.bookmarkedIds);
      if (newBookmarks.has(articleId)) {
        newBookmarks.delete(articleId);
      } else {
        newBookmarks.add(articleId);
      }
      return { bookmarkedIds: newBookmarks };
    }),
  isBookmarked: (articleId) => get().bookmarkedIds.has(articleId),
  clearBookmarks: () => set({ bookmarkedIds: new Set() }),
}));

export function useBookmarks() {
  const { bookmarkedIds, toggleBookmark, isBookmarked, clearBookmarks } = useBookmarksStore();

  return {
    bookmarkedIds: Array.from(bookmarkedIds),
    bookmarkCount: bookmarkedIds.size,
    toggleBookmark,
    isBookmarked,
    clearBookmarks,
  };
}
