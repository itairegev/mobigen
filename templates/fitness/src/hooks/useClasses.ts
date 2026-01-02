import { useQuery } from '@tanstack/react-query';
import { getClasses, getClassById } from '@/services/classes';

export function useClasses(category?: string, difficulty?: string) {
  return useQuery({
    queryKey: ['classes', category, difficulty],
    queryFn: () => getClasses(category, difficulty),
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ['class', id],
    queryFn: () => getClassById(id),
    enabled: !!id,
  });
}
