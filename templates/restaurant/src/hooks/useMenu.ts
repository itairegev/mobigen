import { useQuery } from '@tanstack/react-query';
import { getCategories, getMenuItems, getFeaturedItems, getMenuItem } from '@/services';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
}

export function useMenuItems(categoryId?: string) {
  return useQuery({
    queryKey: ['menuItems', categoryId],
    queryFn: () => getMenuItems(categoryId),
  });
}

export function useFeaturedItems() {
  return useQuery({
    queryKey: ['featuredItems'],
    queryFn: getFeaturedItems,
  });
}

export function useMenuItem(id: string) {
  return useQuery({
    queryKey: ['menuItem', id],
    queryFn: () => getMenuItem(id),
    enabled: !!id,
  });
}
