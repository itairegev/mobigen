/**
 * Tests for useMenu hooks
 */

import { renderHook, waitFor } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock services
const mockCategories = [
  { id: 'cat-1', name: 'Burgers', icon: 'burger' },
  { id: 'cat-2', name: 'Pizza', icon: 'pizza' },
  { id: 'cat-3', name: 'Drinks', icon: 'drink' },
];

const mockMenuItems = [
  { id: 'item-1', name: 'Classic Burger', price: 10.99, categoryId: 'cat-1' },
  { id: 'item-2', name: 'Cheese Burger', price: 12.99, categoryId: 'cat-1' },
  { id: 'item-3', name: 'Margherita', price: 14.99, categoryId: 'cat-2' },
];

const mockFeaturedItems = [
  { id: 'item-1', name: 'Classic Burger', price: 10.99, featured: true },
];

jest.mock('@/services', () => ({
  getCategories: jest.fn(() => Promise.resolve(mockCategories)),
  getMenuItems: jest.fn((categoryId?: string) =>
    Promise.resolve(
      categoryId
        ? mockMenuItems.filter((item) => item.categoryId === categoryId)
        : mockMenuItems
    )
  ),
  getFeaturedItems: jest.fn(() => Promise.resolve(mockFeaturedItems)),
  getMenuItem: jest.fn((id: string) =>
    Promise.resolve(mockMenuItems.find((item) => item.id === id))
  ),
}));

// Import after mocks
import { useCategories, useMenuItems, useFeaturedItems, useMenuItem } from '../../src/hooks/useMenu';
import * as services from '@/services';

// Wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCategories', () => {
  it('should fetch categories', async () => {
    const { result, waitFor: waitForHook } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitForHook(() => result.current.isSuccess);

    expect(result.current.data).toEqual(mockCategories);
    expect(services.getCategories).toHaveBeenCalled();
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});

describe('useMenuItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all menu items', async () => {
    const { result, waitFor: waitForHook } = renderHook(() => useMenuItems(), {
      wrapper: createWrapper(),
    });

    await waitForHook(() => result.current.isSuccess);

    expect(result.current.data).toEqual(mockMenuItems);
    expect(services.getMenuItems).toHaveBeenCalledWith(undefined);
  });

  it('should fetch menu items by category', async () => {
    const { result, waitFor: waitForHook } = renderHook(() => useMenuItems('cat-1'), {
      wrapper: createWrapper(),
    });

    await waitForHook(() => result.current.isSuccess);

    expect(result.current.data).toHaveLength(2);
    expect(services.getMenuItems).toHaveBeenCalledWith('cat-1');
  });

  it('should use categoryId in query key', async () => {
    const { result: result1 } = renderHook(() => useMenuItems('cat-1'), {
      wrapper: createWrapper(),
    });

    const { result: result2 } = renderHook(() => useMenuItems('cat-2'), {
      wrapper: createWrapper(),
    });

    // Different category IDs should result in separate queries
    expect(services.getMenuItems).toHaveBeenCalledWith('cat-1');
    expect(services.getMenuItems).toHaveBeenCalledWith('cat-2');
  });
});

describe('useFeaturedItems', () => {
  it('should fetch featured items', async () => {
    const { result, waitFor: waitForHook } = renderHook(() => useFeaturedItems(), {
      wrapper: createWrapper(),
    });

    await waitForHook(() => result.current.isSuccess);

    expect(result.current.data).toEqual(mockFeaturedItems);
    expect(services.getFeaturedItems).toHaveBeenCalled();
  });
});

describe('useMenuItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a single menu item by id', async () => {
    const { result, waitFor: waitForHook } = renderHook(() => useMenuItem('item-1'), {
      wrapper: createWrapper(),
    });

    await waitForHook(() => result.current.isSuccess);

    expect(result.current.data).toEqual(mockMenuItems[0]);
    expect(services.getMenuItem).toHaveBeenCalledWith('item-1');
  });

  it('should not fetch when id is empty', () => {
    const { result } = renderHook(() => useMenuItem(''), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    expect(result.current.fetchStatus).toBe('idle');
    expect(services.getMenuItem).not.toHaveBeenCalled();
  });

  it('should return undefined for non-existent item', async () => {
    const { result, waitFor: waitForHook } = renderHook(() => useMenuItem('non-existent'), {
      wrapper: createWrapper(),
    });

    await waitForHook(() => !result.current.isLoading);

    expect(result.current.data).toBeUndefined();
  });
});
