import { useQuery } from '@tanstack/react-query';
import { getExercises, getExerciseById, searchExercises } from '@/services/exercises';

export function useExercises(category?: string) {
  return useQuery({
    queryKey: ['exercises', category],
    queryFn: () => getExercises(category),
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ['exercise', id],
    queryFn: () => getExerciseById(id),
    enabled: !!id,
  });
}

export function useExerciseSearch(query: string) {
  return useQuery({
    queryKey: ['exercises-search', query],
    queryFn: () => searchExercises(query),
    enabled: query.length > 2,
  });
}
