import { useQuery } from '@tanstack/react-query';
import { Game } from '@/types';
import {
  getGames,
  getGame,
  getUpcomingGames,
  getRecentGames,
  getNextGame,
} from '@/services/games';

export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: getGames,
  });
}

export function useGame(id: string) {
  return useQuery({
    queryKey: ['game', id],
    queryFn: () => getGame(id),
    enabled: !!id,
  });
}

export function useUpcomingGames() {
  return useQuery({
    queryKey: ['games', 'upcoming'],
    queryFn: getUpcomingGames,
  });
}

export function useRecentGames(limit = 3) {
  return useQuery({
    queryKey: ['games', 'recent', limit],
    queryFn: () => getRecentGames(limit),
  });
}

export function useNextGame() {
  return useQuery({
    queryKey: ['games', 'next'],
    queryFn: getNextGame,
  });
}
