import { useQuery } from '@tanstack/react-query';
import {
  getAnnouncements,
  getAnnouncementById,
  getUnreadAnnouncements,
} from '../services/announcements';

export function useAnnouncements(category?: string) {
  return useQuery({
    queryKey: ['announcements', category],
    queryFn: () => getAnnouncements(category),
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ['announcement', id],
    queryFn: () => getAnnouncementById(id),
    enabled: !!id,
  });
}

export function useUnreadAnnouncements() {
  return useQuery({
    queryKey: ['announcements', 'unread'],
    queryFn: getUnreadAnnouncements,
  });
}
