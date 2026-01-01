import { useQuery } from '@tanstack/react-query';
import type { Category } from '@/types';

const mockCategories: Category[] = [
  { id: 'electronics', name: 'Electronics', icon: '📱', productCount: 24 },
  { id: 'clothing', name: 'Clothing', icon: '👕', productCount: 56 },
  { id: 'sports', name: 'Sports', icon: '⚽', productCount: 32 },
  { id: 'home', name: 'Home & Garden', icon: '🏠', productCount: 45 },
  { id: 'accessories', name: 'Accessories', icon: '👜', productCount: 28 },
  { id: 'beauty', name: 'Beauty', icon: '💄', productCount: 19 },
];

async function fetchCategories(): Promise<Category[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockCategories;
}

export function useCategories() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  return {
    categories: data || [],
    isLoading,
    error,
  };
}
