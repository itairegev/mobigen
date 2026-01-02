import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, getEvent, getUpcomingEvents, updateRSVP } from '../services';
import { RSVPStatus } from '../types';

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id),
    enabled: !!id,
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: getUpcomingEvents,
  });
}

export function useUpdateRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      userId,
      status,
    }: {
      eventId: string;
      userId: string;
      status: RSVPStatus;
    }) => updateRSVP(eventId, userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
