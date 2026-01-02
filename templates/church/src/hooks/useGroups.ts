import { useQuery } from '@tanstack/react-query';
import { getGroups, getGroupById, getOpenGroups } from '../services/groups';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => getGroupById(id),
    enabled: !!id,
  });
}

export function useOpenGroups() {
  return useQuery({
    queryKey: ['groups', 'open'],
    queryFn: getOpenGroups,
  });
}
