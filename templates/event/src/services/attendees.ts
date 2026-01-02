import type { Attendee } from '@/types';

export const MOCK_ATTENDEES: Attendee[] = [
  {
    id: '1',
    name: 'John Smith',
    title: 'Software Engineer',
    company: 'Google',
    avatar: 'https://i.pravatar.cc/400?img=60',
    bio: 'Passionate about web technologies and open source',
    interests: ['React', 'TypeScript', 'Open Source'],
    linkedin: 'john-smith',
    twitter: '@johnsmith',
  },
  {
    id: '2',
    name: 'Maria Garcia',
    title: 'Product Designer',
    company: 'Figma',
    avatar: 'https://i.pravatar.cc/400?img=45',
    bio: 'Creating delightful user experiences',
    interests: ['Design Systems', 'UX Research', 'Prototyping'],
    linkedin: 'maria-garcia-design',
  },
  {
    id: '3',
    name: 'Chen Wei',
    title: 'Startup Founder',
    company: 'InnovateCo',
    avatar: 'https://i.pravatar.cc/400?img=68',
    bio: 'Building the future of fintech',
    interests: ['Startups', 'Fintech', 'AI'],
    linkedin: 'chen-wei',
    twitter: '@chenwei',
  },
  {
    id: '4',
    name: 'Sarah Johnson',
    title: 'Engineering Manager',
    company: 'Microsoft',
    avatar: 'https://i.pravatar.cc/400?img=32',
    bio: 'Leading diverse teams and building great products',
    interests: ['Leadership', 'Team Building', 'Cloud'],
    linkedin: 'sarah-johnson-em',
  },
  {
    id: '5',
    name: 'Ahmed Ali',
    title: 'DevOps Engineer',
    company: 'Amazon',
    avatar: 'https://i.pravatar.cc/400?img=70',
    bio: 'Infrastructure and automation enthusiast',
    interests: ['DevOps', 'Kubernetes', 'Automation'],
    linkedin: 'ahmed-ali-devops',
    twitter: '@ahmedali',
  },
  {
    id: '6',
    name: 'Emily Brown',
    title: 'UX Researcher',
    company: 'Airbnb',
    avatar: 'https://i.pravatar.cc/400?img=28',
    bio: 'Understanding user needs through research',
    interests: ['User Research', 'Psychology', 'Data Analysis'],
    linkedin: 'emily-brown-ux',
  },
  {
    id: '7',
    name: 'Carlos Rodriguez',
    title: 'Mobile Developer',
    company: 'Spotify',
    avatar: 'https://i.pravatar.cc/400?img=51',
    bio: 'Building beautiful mobile experiences',
    interests: ['React Native', 'iOS', 'Android'],
    linkedin: 'carlos-rodriguez-mobile',
    twitter: '@carlosrod',
  },
  {
    id: '8',
    name: 'Lisa Wang',
    title: 'Data Scientist',
    company: 'Netflix',
    avatar: 'https://i.pravatar.cc/400?img=29',
    bio: 'Turning data into insights',
    interests: ['Machine Learning', 'Python', 'Statistics'],
    linkedin: 'lisa-wang-data',
  },
  {
    id: '9',
    name: 'David Kim',
    title: 'Product Manager',
    company: 'Meta',
    avatar: 'https://i.pravatar.cc/400?img=62',
    bio: 'Shipping products people love',
    interests: ['Product Strategy', 'Growth', 'Analytics'],
    linkedin: 'david-kim-pm',
  },
  {
    id: '10',
    name: 'Anna Kowalski',
    title: 'Frontend Engineer',
    company: 'Stripe',
    avatar: 'https://i.pravatar.cc/400?img=26',
    bio: 'Crafting pixel-perfect interfaces',
    interests: ['React', 'CSS', 'Performance'],
    linkedin: 'anna-kowalski-fe',
    twitter: '@annakowalski',
  },
];

export async function fetchAttendees(): Promise<Attendee[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_ATTENDEES;
}

export async function fetchAttendeeById(id: string): Promise<Attendee | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_ATTENDEES.find((a) => a.id === id) || null;
}
