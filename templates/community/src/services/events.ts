import { Event, RSVP, RSVPStatus } from '../types';
import { MOCK_MEMBERS } from './members';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Community Kickoff 2024',
    description: 'Join us for our annual community kickoff! We\'ll be sharing our roadmap for the year, celebrating wins from 2023, and connecting with fellow members. Breakout sessions on various topics, networking opportunities, and special announcements!',
    type: 'virtual',
    startDate: new Date('2024-01-15T18:00:00'),
    endDate: new Date('2024-01-15T20:00:00'),
    meetingLink: 'https://zoom.us/j/example',
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    hostId: '1',
    host: MOCK_MEMBERS[0],
    capacity: 500,
    attendeeCount: 287,
    rsvpStatus: 'going',
  },
  {
    id: '2',
    title: 'Coffee & Connections: SF Meetup',
    description: 'Bay Area members! Let\'s meet up for coffee and casual networking. Great opportunity to put faces to usernames and make real connections. We\'ll be at Blue Bottle Coffee from 10-12pm.',
    type: 'in-person',
    startDate: new Date('2024-01-20T10:00:00'),
    endDate: new Date('2024-01-20T12:00:00'),
    location: 'Blue Bottle Coffee, Ferry Building, San Francisco',
    coverImage: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800',
    hostId: '8',
    host: MOCK_MEMBERS[7],
    capacity: 20,
    attendeeCount: 15,
    rsvpStatus: 'maybe',
  },
  {
    id: '3',
    title: 'Workshop: Building Your Personal Brand',
    description: 'Premium members exclusive! Join marketing expert Aisha Patel for a deep dive into personal branding. Learn strategies to stand out in your industry, create compelling content, and build an authentic online presence. Q&A session included.',
    type: 'virtual',
    startDate: new Date('2024-01-25T16:00:00'),
    endDate: new Date('2024-01-25T18:00:00'),
    meetingLink: 'https://zoom.us/j/workshop',
    coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    hostId: '5',
    host: MOCK_MEMBERS[4],
    capacity: 100,
    attendeeCount: 78,
    tier: 'premium',
  },
  {
    id: '4',
    title: 'Founder AMA with Noah Taylor',
    description: 'Ask Noah anything! Fresh off closing a seed round, Noah will be sharing his startup journey, lessons learned, and answering your burning questions about fundraising, product development, and scaling.',
    type: 'virtual',
    startDate: new Date('2024-02-01T17:00:00'),
    endDate: new Date('2024-02-01T18:30:00'),
    meetingLink: 'https://zoom.us/j/ama',
    coverImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800',
    hostId: '18',
    host: MOCK_MEMBERS[17],
    capacity: 200,
    attendeeCount: 156,
  },
  {
    id: '5',
    title: 'VIP Dinner: NYC',
    description: 'VIP members only! Exclusive dinner at a private venue in Manhattan. Limited spots available. This is your chance to connect with other VIP members and community leaders in an intimate setting. Dress code: Business casual.',
    type: 'in-person',
    startDate: new Date('2024-02-10T19:00:00'),
    endDate: new Date('2024-02-10T22:00:00'),
    location: 'Private Venue, Manhattan, NY (address shared with RSVPs)',
    coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    hostId: '1',
    host: MOCK_MEMBERS[0],
    capacity: 15,
    attendeeCount: 12,
    tier: 'vip',
  },
];

const MOCK_RSVPS: Map<string, RSVP[]> = new Map([
  [
    '1',
    [
      { id: 'rsvp1', eventId: '1', userId: '1', status: 'going', createdAt: new Date() },
      { id: 'rsvp2', eventId: '1', userId: '2', status: 'going', createdAt: new Date() },
    ],
  ],
]);

export async function getEvents(): Promise<Event[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_EVENTS];
}

export async function getEvent(id: string): Promise<Event | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_EVENTS.find((event) => event.id === id) || null;
}

export async function getUpcomingEvents(): Promise<Event[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const now = new Date();
  return MOCK_EVENTS.filter((event) => event.startDate > now).sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );
}

export async function updateRSVP(
  eventId: string,
  userId: string,
  status: RSVPStatus
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const event = MOCK_EVENTS.find((e) => e.id === eventId);
  if (!event) return;

  let rsvps = MOCK_RSVPS.get(eventId) || [];
  const existingIndex = rsvps.findIndex((r) => r.userId === userId);

  if (existingIndex >= 0) {
    if (status === 'not-going') {
      rsvps.splice(existingIndex, 1);
      event.attendeeCount = Math.max(0, event.attendeeCount - 1);
    } else {
      rsvps[existingIndex].status = status;
    }
  } else if (status !== 'not-going') {
    rsvps.push({
      id: Date.now().toString(),
      eventId,
      userId,
      status,
      createdAt: new Date(),
    });
    if (status === 'going') {
      event.attendeeCount += 1;
    }
  }

  MOCK_RSVPS.set(eventId, rsvps);

  // Update RSVP status on event
  event.rsvpStatus = status;
}

export async function getMyEvents(userId: string): Promise<Event[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const myEventIds = new Set<string>();

  MOCK_RSVPS.forEach((rsvps, eventId) => {
    if (rsvps.some((r) => r.userId === userId && r.status === 'going')) {
      myEventIds.add(eventId);
    }
  });

  return MOCK_EVENTS.filter((event) => myEventIds.has(event.id));
}
