import { useQuery } from '@tanstack/react-query';
import { fetchSpeakers, fetchSpeakerById } from '@/services/speakers';

export function useSpeakers() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['speakers'],
    queryFn: fetchSpeakers,
  });

  return {
    speakers: data || [],
    isLoading,
    error,
  };
}

export function useSpeaker(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['speaker', id],
    queryFn: () => fetchSpeakerById(id),
    enabled: !!id,
  });

  return {
    speaker: data,
    isLoading,
    error,
  };
}
