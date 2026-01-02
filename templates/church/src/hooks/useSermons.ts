import { useQuery } from '@tanstack/react-query';
import { getSeries, getSermonsBySeries, getRecentSermons, getSermonById } from '../services/sermons';

export function useSeries() {
  return useQuery({
    queryKey: ['series'],
    queryFn: getSeries,
  });
}

export function useSermonsBySeries(seriesId: string) {
  return useQuery({
    queryKey: ['sermons', 'series', seriesId],
    queryFn: () => getSermonsBySeries(seriesId),
    enabled: !!seriesId,
  });
}

export function useRecentSermons(limit: number = 5) {
  return useQuery({
    queryKey: ['sermons', 'recent', limit],
    queryFn: () => getRecentSermons(limit),
  });
}

export function useSermon(id: string) {
  return useQuery({
    queryKey: ['sermon', id],
    queryFn: () => getSermonById(id),
    enabled: !!id,
  });
}
