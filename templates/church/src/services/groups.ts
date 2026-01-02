import { Group } from '../types';

export const MOCK_GROUPS: Group[] = [
  {
    id: '1',
    name: 'Young Adults Bible Study',
    description: 'A vibrant community for ages 18-30 exploring God\'s Word together and building lasting friendships.',
    category: 'young-adults',
    leader: 'Emily Johnson',
    leaderContact: 'emily@church.com',
    meetingDay: 'Thursday',
    meetingTime: '7:00 PM',
    location: 'Room 204',
    members: 18,
    capacity: 25,
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
    isOpen: true,
  },
  {
    id: '2',
    name: 'Men\'s Discipleship',
    description: 'Men gathering to grow in faith, accountability, and biblical manhood.',
    category: 'men',
    leader: 'Michael Davis',
    leaderContact: 'michael@church.com',
    meetingDay: 'Saturday',
    meetingTime: '7:00 AM',
    location: 'Fellowship Hall',
    members: 12,
    capacity: 15,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    isOpen: true,
  },
  {
    id: '3',
    name: 'Women of Faith',
    description: 'Women connecting through Bible study, prayer, and mutual encouragement.',
    category: 'women',
    leader: 'Sarah Thompson',
    leaderContact: 'sarah@church.com',
    meetingDay: 'Tuesday',
    meetingTime: '6:30 PM',
    location: 'Room 101',
    members: 22,
    capacity: 25,
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800',
    isOpen: false,
  },
  {
    id: '4',
    name: 'Couples\' Connection',
    description: 'Building stronger marriages through biblical principles and couple fellowship.',
    category: 'couples',
    leader: 'David & Rachel Martinez',
    meetingDay: 'Friday',
    meetingTime: '7:30 PM',
    location: 'Room 302',
    members: 16,
    capacity: 20,
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
    isOpen: true,
  },
  {
    id: '5',
    name: 'Senior Saints',
    description: 'Fellowship and Bible study for our seasoned believers, ages 60+.',
    category: 'seniors',
    leader: 'George Wilson',
    meetingDay: 'Wednesday',
    meetingTime: '10:00 AM',
    location: 'Community Room',
    members: 25,
    image: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800',
    isOpen: true,
  },
  {
    id: '6',
    name: 'Prayer Warriors',
    description: 'Dedicated prayer group interceding for our church, community, and world.',
    category: 'prayer',
    leader: 'Linda Chen',
    meetingDay: 'Monday',
    meetingTime: '6:00 AM',
    location: 'Prayer Chapel',
    members: 15,
    image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800',
    isOpen: true,
  },
];

// Simulated API functions
export async function getGroups(): Promise<Group[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_GROUPS];
}

export async function getGroupById(id: string): Promise<Group | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_GROUPS.find((group) => group.id === id) || null;
}

export async function getOpenGroups(): Promise<Group[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_GROUPS.filter((group) => group.isOpen);
}
