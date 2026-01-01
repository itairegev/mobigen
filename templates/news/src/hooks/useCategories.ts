import { useQuery } from '@tanstack/react-query';
import type { Category } from '@/types';

const mockCategories: Category[] = [
  { id: '1', name: 'Technology', slug: 'technology', icon: '💻', color: '#3b82f6' },
  { id: '2', name: 'Business', slug: 'business', icon: '💼', color: '#10b981' },
  { id: '3', name: 'Sports', slug: 'sports', icon: '⚽', color: '#f59e0b' },
  { id: '4', name: 'Entertainment', slug: 'entertainment', icon: '🎬', color: '#8b5cf6' },
  { id: '5', name: 'Science', slug: 'science', icon: '🔬', color: '#06b6d4' },
  { id: '6', name: 'Health', slug: 'health', icon: '❤️', color: '#ef4444' },
  { id: '7', name: 'Politics', slug: 'politics', icon: '🏛️', color: '#6366f1' },
  { id: '8', name: 'World', slug: 'world', icon: '🌍', color: '#14b8a6' },
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
