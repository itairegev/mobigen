import { useQuery } from '@tanstack/react-query';
import { getEvents, getUpcomingEvents, getEventById, getEventsByCategory } from '../services/events';
import { EventCategory } from '../types';

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });
}

export function useUpcomingEvents(limit: number = 5) {
  return useQuery({
    queryKey: ['events', 'upcoming', limit],
    queryFn: () => getUpcomingEvents(limit),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id),
    enabled: !!id,
  });
}

export function useEventsByCategory(category: EventCategory) {
  return useQuery({
    queryKey: ['events', 'category', category],
    queryFn: () => getEventsByCategory(category),
    enabled: !!category,
  });
}
