import { useQuery } from '@tanstack/react-query';
import { getSubjects, getSubjectById } from '../services/subjects';

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: ['subject', id],
    queryFn: () => getSubjectById(id),
    enabled: !!id,
  });
}
