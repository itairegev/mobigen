import { useQuery } from '@tanstack/react-query';
import { getCourses, getCourse, getCourseLessons } from '@/services/courses';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => getCourse(courseId),
    enabled: !!courseId,
  });
}

export function useCourseLessons(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'lessons'],
    queryFn: () => getCourseLessons(courseId),
    enabled: !!courseId,
  });
}
