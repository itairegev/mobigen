import { useQuery } from '@tanstack/react-query';
import {
  getCalendarEvents,
  getEventsByDate,
  getUpcomingEvents,
  getEventsByType,
} from '../services/calendar';

export function useCalendarEvents(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['calendar', 'events', startDate, endDate],
    queryFn: () => getCalendarEvents(startDate, endDate),
  });
}

export function useEventsByDate(date: string) {
  return useQuery({
    queryKey: ['calendar', 'date', date],
    queryFn: () => getEventsByDate(date),
    enabled: !!date,
  });
}

export function useUpcomingEvents(limit?: number) {
  return useQuery({
    queryKey: ['calendar', 'upcoming', limit],
    queryFn: () => getUpcomingEvents(limit),
  });
}

export function useEventsByType(type: string) {
  return useQuery({
    queryKey: ['calendar', 'type', type],
    queryFn: () => getEventsByType(type),
    enabled: !!type,
  });
}
