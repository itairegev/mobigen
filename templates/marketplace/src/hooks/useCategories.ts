import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchCategory } from '@/services';

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

export function useCategory(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['category', id],
    queryFn: () => fetchCategory(id),
    enabled: !!id,
  });

  return {
    category: data,
    isLoading,
    error,
  };
}
