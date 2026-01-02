import { useQuery } from '@tanstack/react-query';
import type { Assignment } from '../types';
import {
  getAssignments,
  getAssignmentById,
  getUpcomingAssignments,
  getAssignmentsBySubject,
} from '../services/assignments';

export function useAssignments(status?: Assignment['status']) {
  return useQuery({
    queryKey: ['assignments', status],
    queryFn: () => getAssignments(status),
  });
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: ['assignment', id],
    queryFn: () => getAssignmentById(id),
    enabled: !!id,
  });
}

export function useUpcomingAssignments(limit?: number) {
  return useQuery({
    queryKey: ['assignments', 'upcoming', limit],
    queryFn: () => getUpcomingAssignments(limit),
  });
}

export function useAssignmentsBySubject(subjectId: string) {
  return useQuery({
    queryKey: ['assignments', 'subject', subjectId],
    queryFn: () => getAssignmentsBySubject(subjectId),
    enabled: !!subjectId,
  });
}
