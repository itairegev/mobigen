import { useQuery } from '@tanstack/react-query';
import { getLesson } from '@/services/courses';

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lessons', lessonId],
    queryFn: () => getLesson(lessonId),
    enabled: !!lessonId,
  });
}
