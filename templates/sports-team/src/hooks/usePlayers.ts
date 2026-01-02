import { useQuery } from '@tanstack/react-query';
import { PlayerPosition } from '@/types';
import {
  getPlayers,
  getPlayer,
  getPlayersByPosition,
  getTopScorers,
} from '@/services/players';

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: getPlayers,
  });
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ['player', id],
    queryFn: () => getPlayer(id),
    enabled: !!id,
  });
}

export function usePlayersByPosition(position: PlayerPosition) {
  return useQuery({
    queryKey: ['players', 'position', position],
    queryFn: () => getPlayersByPosition(position),
    enabled: !!position,
  });
}

export function useTopScorers(limit = 5) {
  return useQuery({
    queryKey: ['players', 'top-scorers', limit],
    queryFn: () => getTopScorers(limit),
  });
}
