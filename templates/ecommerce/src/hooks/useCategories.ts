import { useQuery } from '@tanstack/react-query';
import type { Category } from '@/types';
import { getShopifyCategories } from '@/services/shopify-api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK DATA (Fallback when Shopify unavailable)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const mockCategories: Category[] = [
  { id: 'electronics', name: 'Electronics', icon: '📱', productCount: 24 },
  { id: 'clothing', name: 'Clothing', icon: '👕', productCount: 56 },
  { id: 'sports', name: 'Sports', icon: '⚽', productCount: 32 },
  { id: 'home', name: 'Home & Garden', icon: '🏠', productCount: 45 },
  { id: 'accessories', name: 'Accessories', icon: '👜', productCount: 28 },
  { id: 'beauty', name: 'Beauty', icon: '💄', productCount: 19 },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA FETCHING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function fetchCategories(): Promise<Category[]> {
  try {
    const categories = await getShopifyCategories();
    if (categories.length > 0) {
      return categories;
    }
  } catch (error) {
    console.warn('Failed to fetch categories from Shopify:', error);
  }
  return mockCategories;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOOK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useCategories() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  });

  return {
    categories: data || mockCategories,
    isLoading,
    error,
    refetch,
  };
}
