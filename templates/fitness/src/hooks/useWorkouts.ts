import { useQuery } from '@tanstack/react-query';
import { getWorkouts, getWorkoutById } from '@/services/workouts';

export function useWorkouts(category?: string) {
  return useQuery({
    queryKey: ['workouts', category],
    queryFn: () => getWorkouts(category),
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => getWorkoutById(id),
    enabled: !!id,
  });
}
