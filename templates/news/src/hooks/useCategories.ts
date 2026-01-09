import { useQuery } from '@tanstack/react-query';
import type { Category } from '@/types';
import { getNewsCategories } from '@/services/news-api';

const mockCategories: Category[] = [
  { id: 'technology', name: 'Technology', slug: 'technology', icon: '💻', color: '#3b82f6' },
  { id: 'business', name: 'Business', slug: 'business', icon: '💼', color: '#10b981' },
  { id: 'sports', name: 'Sports', slug: 'sports', icon: '⚽', color: '#f59e0b' },
  { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', icon: '🎬', color: '#8b5cf6' },
  { id: 'science', name: 'Science', slug: 'science', icon: '🔬', color: '#06b6d4' },
  { id: 'health', name: 'Health', slug: 'health', icon: '🏥', color: '#ef4444' },
  { id: 'general', name: 'General', slug: 'general', icon: '📰', color: '#6b7280' },
];

async function fetchCategories(): Promise<Category[]> {
  try {
    const categories = await getNewsCategories();
    if (categories.length > 0) {
      return categories;
    }
  } catch (error) {
    console.warn('Failed to fetch categories:', error);
  }
  return mockCategories;
}

export function useCategories() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  return {
    categories: data || mockCategories,
    isLoading,
    error,
  };
}
