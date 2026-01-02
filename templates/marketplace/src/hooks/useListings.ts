import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchListings, fetchListing, createListing, searchListings } from '@/services';
import type { Listing } from '@/types';

export function useListings(categoryId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', categoryId],
    queryFn: () => fetchListings(categoryId),
  });

  return {
    listings: data || [],
    isLoading,
    error,
  };
}

export function useListing(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id),
    enabled: !!id,
  });

  return {
    listing: data,
    isLoading,
    error,
  };
}

export function useSearchListings(query: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchListings(query),
    enabled: query.length > 0,
  });

  return {
    results: data || [],
    isLoading,
    error,
  };
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (listing: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => createListing(listing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  return {
    createListing: mutateAsync,
    isCreating: isPending,
    error,
  };
}
