import { Event, EventCategory } from '../types';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Sunday Worship Service',
    description: 'Join us for our weekly worship service with powerful worship music, biblical teaching, and fellowship.',
    date: new Date('2024-07-07T10:00:00'),
    endDate: new Date('2024-07-07T11:30:00'),
    time: '10:00 AM - 11:30 AM',
    location: 'Main Sanctuary',
    address: '123 Faith Street, Springfield, USA',
    category: 'service',
    image: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800',
    registrationRequired: false,
  },
  {
    id: '2',
    title: 'Youth Night',
    description: 'Middle and high school students gather for games, worship, and a relevant message.',
    date: new Date('2024-07-05T18:30:00'),
    endDate: new Date('2024-07-05T20:30:00'),
    time: '6:30 PM - 8:30 PM',
    location: 'Youth Center',
    address: '123 Faith Street, Springfield, USA',
    category: 'youth',
    image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800',
    registrationRequired: false,
  },
  {
    id: '3',
    title: 'Community Outreach Day',
    description: 'Serve our local community with food distribution, home repairs, and neighborhood cleanup.',
    date: new Date('2024-07-13T09:00:00'),
    endDate: new Date('2024-07-13T15:00:00'),
    time: '9:00 AM - 3:00 PM',
    location: 'Community Center',
    address: '456 Hope Avenue, Springfield, USA',
    category: 'outreach',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
    registrationRequired: true,
    capacity: 50,
    registered: 32,
  },
  {
    id: '4',
    title: 'Prayer Meeting',
    description: 'Gather together in prayer for our church, community, and world.',
    date: new Date('2024-07-10T19:00:00'),
    endDate: new Date('2024-07-10T20:30:00'),
    time: '7:00 PM - 8:30 PM',
    location: 'Prayer Chapel',
    address: '123 Faith Street, Springfield, USA',
    category: 'prayer',
    image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800',
    registrationRequired: false,
  },
  {
    id: '5',
    title: 'Kids\' Ministry - Adventure Club',
    description: 'Fun, interactive Bible lessons and activities for elementary-aged children.',
    date: new Date('2024-07-07T10:00:00'),
    endDate: new Date('2024-07-07T11:30:00'),
    time: '10:00 AM - 11:30 AM',
    location: 'Children\'s Wing',
    address: '123 Faith Street, Springfield, USA',
    category: 'children',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800',
    registrationRequired: false,
  },
  {
    id: '6',
    title: 'Men\'s Breakfast & Bible Study',
    description: 'Men gather for breakfast, fellowship, and a study through the book of Proverbs.',
    date: new Date('2024-07-06T07:00:00'),
    endDate: new Date('2024-07-06T08:30:00'),
    time: '7:00 AM - 8:30 AM',
    location: 'Fellowship Hall',
    address: '123 Faith Street, Springfield, USA',
    category: 'study',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    registrationRequired: false,
  },
  {
    id: '7',
    title: 'Worship Night',
    description: 'An evening of extended worship, prayer, and seeking God\'s presence together.',
    date: new Date('2024-07-19T19:00:00'),
    endDate: new Date('2024-07-19T21:00:00'),
    time: '7:00 PM - 9:00 PM',
    location: 'Main Sanctuary',
    address: '123 Faith Street, Springfield, USA',
    category: 'worship',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    registrationRequired: false,
  },
  {
    id: '8',
    title: 'Summer BBQ & Baptism',
    description: 'Celebrate with baptisms followed by a community BBQ and fellowship.',
    date: new Date('2024-07-21T16:00:00'),
    endDate: new Date('2024-07-21T19:00:00'),
    time: '4:00 PM - 7:00 PM',
    location: 'Church Courtyard',
    address: '123 Faith Street, Springfield, USA',
    category: 'community',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    registrationRequired: true,
    capacity: 150,
    registered: 87,
  },
];

// Simulated API functions
export async function getEvents(): Promise<Event[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_EVENTS].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function getUpcomingEvents(limit: number = 5): Promise<Event[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const now = new Date();
  return [...MOCK_EVENTS]
    .filter((event) => event.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}

export async function getEventById(id: string): Promise<Event | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_EVENTS.find((event) => event.id === id) || null;
}

export async function getEventsByCategory(category: EventCategory): Promise<Event[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_EVENTS.filter((event) => event.category === category);
}
