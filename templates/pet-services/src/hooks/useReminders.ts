import { useQuery } from '@tanstack/react-query';
import { getReminders, getUpcomingReminders } from '@/services';

export function useReminders(petId?: string) {
  return useQuery({
    queryKey: ['reminders', petId],
    queryFn: () => getReminders(petId),
  });
}

export function useUpcomingReminders() {
  return useQuery({
    queryKey: ['reminders', 'upcoming'],
    queryFn: getUpcomingReminders,
  });
}
