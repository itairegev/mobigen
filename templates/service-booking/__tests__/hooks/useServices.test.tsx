/**
 * Tests for useServices hooks
 */

import { renderHook, waitFor } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock data
const mockServices = [
  {
    id: 'service-1',
    name: 'Haircut',
    description: 'Classic haircut',
    price: 30,
    duration: 30,
    categoryId: 'cat-1',
  },
  {
    id: 'service-2',
    name: 'Beard Trim',
    description: 'Professional beard trim',
    price: 20,
    duration: 20,
    categoryId: 'cat-1',
  },
  {
    id: 'service-3',
    name: 'Hair Color',
    description: 'Full hair coloring',
    price: 80,
    duration: 90,
    categoryId: 'cat-2',
  },
];

const mockCategories = [
  { id: 'cat-1', name: 'Hair', icon: 'scissors' },
  { id: 'cat-2', name: 'Color', icon: 'palette' },
];

jest.mock('@/services', () => ({
  getServices: jest.fn((categoryId?: string) =>
    Promise.resolve(
      categoryId
        ? mockServices.filter((s) => s.categoryId === categoryId)
        : mockServices
    )
  ),
  getServiceById: jest.fn((id: string) =>
    Promise.resolve(mockServices.find((s) => s.id === id))
  ),
  getCategories: jest.fn(() => Promise.resolve(mockCategories)),
}));

// Import after mocks
import { useServices, useService, useCategories } from '../../src/hooks/useServices';
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

describe('useServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all services', async () => {
    const { result, waitFor: waitForHook } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    });

    await waitForHook(() => result.current.isSuccess);

    expect(result.current.data).toEqual(mockServices);
    expect(services.getServices).toHaveBeenCalledWith(undefined);
  });

  it('should fetch services by category', async () => {
    const { result, waitFor: waitForHook } = renderHook(() => useServices('cat-1'), {
      wrapper: createWrapper(),
    });

    await waitForHook(() => result.current.isSuccess);

    expect(result.current.data).toHaveLength(2);
    expect(services.getServices).toHaveBeenCalledWith('cat-1');
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});

describe('useService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a single service by id', async () => {
    const { result, waitFor: waitForHook } = renderHook(() => useService('service-1'), {
      wrapper: createWrapper(),
    });

    await waitForHook(() => result.current.isSuccess);

    expect(result.current.data).toEqual(mockServices[0]);
    expect(services.getServiceById).toHaveBeenCalledWith('service-1');
  });

  it('should not fetch when id is empty', () => {
    const { result } = renderHook(() => useService(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(services.getServiceById).not.toHaveBeenCalled();
  });

  it('should return undefined for non-existent service', async () => {
    const { result, waitFor: waitForHook } = renderHook(() => useService('non-existent'), {
      wrapper: createWrapper(),
    });

    await waitForHook(() => !result.current.isLoading);

    expect(result.current.data).toBeUndefined();
  });
});

describe('useCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
