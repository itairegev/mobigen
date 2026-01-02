import { useQuery } from '@tanstack/react-query';
import { getProperties, getPropertyById, searchProperties, getFeaturedProperties } from '@/services';
import type { PropertyType, PropertyStatus } from '@/types';

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => getPropertyById(id),
    enabled: !!id,
  });
}

export function useFeaturedProperties() {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: getFeaturedProperties,
  });
}

export function useSearchProperties(
  query?: string,
  filters?: {
    type?: PropertyType[];
    status?: PropertyStatus;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    bathrooms?: number;
    city?: string;
  }
) {
  return useQuery({
    queryKey: ['properties', 'search', query, filters],
    queryFn: () => searchProperties(query, filters),
  });
}
