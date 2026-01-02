import { useQuery } from '@tanstack/react-query';
import { getProjects, getProjectById } from '@/services';
import type { Project } from '@/types';

export function useProjects(featured?: boolean) {
  return useQuery({
    queryKey: ['projects', featured],
    queryFn: () => getProjects(featured),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id),
    enabled: !!id,
  });
}

export function useFeaturedProjects() {
  return useProjects(true);
}
