import { useBookmarkStore } from '@/stores';
import type { Bookmark } from '@/types';

export function useBookmarks() {
  const { bookmarks, addBookmark, removeBookmark, isBookmarked, getBookmarks } = useBookmarkStore();

  const toggleBookmark = (articleId: string) => {
    if (isBookmarked(articleId)) {
      removeBookmark(articleId);
    } else {
      addBookmark(articleId);
    }
  };

  return {
    bookmarks: getBookmarks(),
    bookmarkedIds: bookmarks.map(b => b.articleId),
    bookmarkCount: bookmarks.length,
    toggleBookmark,
    isBookmarked,
    addBookmark,
    removeBookmark,
  };
}
