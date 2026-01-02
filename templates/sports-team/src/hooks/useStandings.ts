import { useQuery } from '@tanstack/react-query';
import { getStandings, getTeamStanding } from '@/services/standings';

export function useStandings() {
  return useQuery({
    queryKey: ['standings'],
    queryFn: getStandings,
  });
}

export function useTeamStanding(teamId: string) {
  return useQuery({
    queryKey: ['standings', 'team', teamId],
    queryFn: () => getTeamStanding(teamId),
    enabled: !!teamId,
  });
}
