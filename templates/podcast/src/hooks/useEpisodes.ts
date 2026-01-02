import { useQuery } from '@tanstack/react-query';
import { getAllEpisodes, getEpisodeById, searchEpisodes, getFeaturedEpisodes, getExclusiveEpisodes } from '../services/episodes';

export function useEpisodes() {
  return useQuery({
    queryKey: ['episodes'],
    queryFn: getAllEpisodes,
  });
}

export function useEpisode(id: string) {
  return useQuery({
    queryKey: ['episode', id],
    queryFn: () => getEpisodeById(id),
    enabled: !!id,
  });
}

export function useSearchEpisodes(query: string) {
  return useQuery({
    queryKey: ['episodes', 'search', query],
    queryFn: () => searchEpisodes(query),
    enabled: query.length > 0,
  });
}

export function useFeaturedEpisodes(limit?: number) {
  return useQuery({
    queryKey: ['episodes', 'featured', limit],
    queryFn: () => getFeaturedEpisodes(limit),
  });
}

export function useExclusiveEpisodes() {
  return useQuery({
    queryKey: ['episodes', 'exclusive'],
    queryFn: getExclusiveEpisodes,
  });
}
