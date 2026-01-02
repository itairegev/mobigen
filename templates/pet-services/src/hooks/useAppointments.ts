import { useQuery } from '@tanstack/react-query';
import { getAppointments, getUpcomingAppointments } from '@/services';

export function useAppointments(petId?: string) {
  return useQuery({
    queryKey: ['appointments', petId],
    queryFn: () => getAppointments(petId),
  });
}

export function useUpcomingAppointments() {
  return useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: getUpcomingAppointments,
  });
}
