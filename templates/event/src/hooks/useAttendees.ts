import { useQuery } from '@tanstack/react-query';
import { fetchAttendees, fetchAttendeeById } from '@/services/attendees';

export function useAttendees() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['attendees'],
    queryFn: fetchAttendees,
  });

  return {
    attendees: data || [],
    isLoading,
    error,
  };
}

export function useAttendee(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['attendee', id],
    queryFn: () => fetchAttendeeById(id),
    enabled: !!id,
  });

  return {
    attendee: data,
    isLoading,
    error,
  };
}
