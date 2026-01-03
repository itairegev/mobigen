import { renderHook, act } from '@testing-library/react-native';
import { useBookmarks } from './useBookmarks';

describe('useBookmarks', () => {
  it('should initialize with default bookmarks', () => {
    const { result } = renderHook(() => useBookmarks());
    
    expect(result.current.bookmarkedIds).toEqual(['1', '3']);
    expect(result.current.bookmarkCount).toBe(2);
    expect(result.current.isBookmarked('1')).toBe(true);
    expect(result.current.isBookmarked('2')).toBe(false);
  });

  it('should toggle bookmark status', () => {
    const { result } = renderHook(() => useBookmarks());
    
    // Add a new bookmark
    act(() => {
      result.current.toggleBookmark('2');
    });
    
    expect(result.current.isBookmarked('2')).toBe(true);
    expect(result.current.bookmarkCount).toBe(3);
    
    // Remove an existing bookmark
    act(() => {
      result.current.toggleBookmark('1');
    });
    
    expect(result.current.isBookmarked('1')).toBe(false);
    expect(result.current.bookmarkCount).toBe(2);
  });

  it('should clear all bookmarks', () => {
    const { result } = renderHook(() => useBookmarks());
    
    act(() => {
      result.current.clearBookmarks();
    });
    
    expect(result.current.bookmarkedIds).toEqual([]);
    expect(result.current.bookmarkCount).toBe(0);
  });
});