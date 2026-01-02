import { useQuery } from '@tanstack/react-query';
import {
  getGrades,
  getGradesBySubject,
  getSubjectGradesSummary,
  calculateGPA,
} from '../services/grades';

export function useGrades() {
  return useQuery({
    queryKey: ['grades'],
    queryFn: getGrades,
  });
}

export function useGradesBySubject(subjectId: string) {
  return useQuery({
    queryKey: ['grades', 'subject', subjectId],
    queryFn: () => getGradesBySubject(subjectId),
    enabled: !!subjectId,
  });
}

export function useSubjectGradesSummary() {
  return useQuery({
    queryKey: ['grades', 'summary'],
    queryFn: getSubjectGradesSummary,
  });
}

export function useGPA() {
  return useQuery({
    queryKey: ['gpa'],
    queryFn: calculateGPA,
  });
}
