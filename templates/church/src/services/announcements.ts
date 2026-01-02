import { Announcement } from '../types';

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Summer BBQ This Sunday!',
    message: 'Join us after service for our annual summer BBQ and baptism celebration. Food, games, and fellowship!',
    priority: 'high',
    category: 'events',
    date: new Date('2024-06-28'),
    expiresAt: new Date('2024-07-21'),
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    actionUrl: '/events/8',
    actionLabel: 'RSVP Now',
  },
  {
    id: '2',
    title: 'New Series Starting July 7',
    message: 'Don\'t miss the start of our new sermon series "Faith in Action" beginning this Sunday.',
    priority: 'medium',
    category: 'sermons',
    date: new Date('2024-06-29'),
    expiresAt: new Date('2024-07-07'),
    imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800',
  },
  {
    id: '3',
    title: 'Volunteers Needed',
    message: 'Sign up to serve at our Community Outreach Day on July 13. Make a difference in our neighborhood!',
    priority: 'medium',
    category: 'outreach',
    date: new Date('2024-06-27'),
    expiresAt: new Date('2024-07-13'),
    actionUrl: '/events/3',
    actionLabel: 'Sign Up',
  },
  {
    id: '4',
    title: 'Building Fund Update',
    message: 'We\'re 57% toward our goal! Thank you for your generous support of our new worship center.',
    priority: 'low',
    category: 'giving',
    date: new Date('2024-06-25'),
  },
];

// Simulated API functions
export async function getAnnouncements(): Promise<Announcement[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const now = new Date();
  return [...MOCK_ANNOUNCEMENTS]
    .filter((a) => !a.expiresAt || a.expiresAt >= now)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_ANNOUNCEMENTS.find((a) => a.id === id) || null;
}
