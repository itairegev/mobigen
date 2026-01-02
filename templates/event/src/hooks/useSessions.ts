import { useQuery } from '@tanstack/react-query';
import { fetchSessions, fetchSessionById, fetchSessionsByTrack, fetchTracks } from '@/services/sessions';
import type { Session, Track } from '@/types';

export function useSessions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  });

  return {
    sessions: data || [],
    isLoading,
    error,
  };
}

export function useSession(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => fetchSessionById(id),
    enabled: !!id,
  });

  return {
    session: data,
    isLoading,
    error,
  };
}

export function useSessionsByTrack(trackId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions', 'track', trackId],
    queryFn: () => fetchSessionsByTrack(trackId),
    enabled: !!trackId,
  });

  return {
    sessions: data || [],
    isLoading,
    error,
  };
}

export function useTracks() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tracks'],
    queryFn: fetchTracks,
  });

  return {
    tracks: data || [],
    isLoading,
    error,
  };
}
