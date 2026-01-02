import { useQuery } from '@tanstack/react-query';
import { getMembers, getMember, searchMembers } from '../services';

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: () => getMember(id),
    enabled: !!id,
  });
}

export function useSearchMembers(query: string) {
  return useQuery({
    queryKey: ['members', 'search', query],
    queryFn: () => searchMembers(query),
    enabled: query.length > 0,
  });
}
