import { useQuery } from '@tanstack/react-query';
import {
  getExercises,
  getExerciseById,
  searchExercises,
  getFeaturedExercises,
  getNoEquipmentExercises,
} from '@/services/exercises';

export function useExercises(category?: string) {
  return useQuery({
    queryKey: ['exercises', category],
    queryFn: () => getExercises(category),
    staleTime: 30 * 60 * 1000, // 30 minutes - exercise data is static
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ['exercise', id],
    queryFn: () => getExerciseById(id),
    enabled: !!id,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useExerciseSearch(query: string) {
  return useQuery({
    queryKey: ['exercises-search', query],
    queryFn: () => searchExercises(query),
    enabled: query.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes for search
  });
}

export function useFeaturedExercises() {
  return useQuery({
    queryKey: ['exercises-featured'],
    queryFn: getFeaturedExercises,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useBodyweightExercises() {
  return useQuery({
    queryKey: ['exercises-bodyweight'],
    queryFn: getNoEquipmentExercises,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
