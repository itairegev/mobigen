import { useQuery } from '@tanstack/react-query';
import { getCategories, getMenuItems, getFeaturedItems, getMenuItem, searchMenuItems } from '@/services';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
  });
}

export function useMenuItems(categoryId?: string) {
  return useQuery({
    queryKey: ['menuItems', categoryId],
    queryFn: () => getMenuItems(categoryId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFeaturedItems() {
  return useQuery({
    queryKey: ['featuredItems'],
    queryFn: getFeaturedItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMenuItem(id: string) {
  return useQuery({
    queryKey: ['menuItem', id],
    queryFn: () => getMenuItem(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSearchMenu(query: string) {
  return useQuery({
    queryKey: ['searchMenu', query],
    queryFn: () => searchMenuItems(query),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}
