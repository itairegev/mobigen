import { Member, MembershipTier } from '../types';

export const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    username: '@sarahj',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'Community builder & creative entrepreneur. Passionate about connection.',
    tier: 'vip',
    joinedAt: new Date('2023-01-15'),
    location: 'San Francisco, CA',
    badges: ['founder', 'top-contributor'],
    verified: true,
  },
  {
    id: '2',
    name: 'Marcus Chen',
    username: '@marcusc',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Tech enthusiast and lifelong learner 🚀',
    tier: 'premium',
    joinedAt: new Date('2023-02-20'),
    location: 'New York, NY',
    badges: ['early-adopter'],
    verified: true,
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    username: '@emma_r',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Designer, artist, and community advocate',
    tier: 'premium',
    joinedAt: new Date('2023-03-10'),
    location: 'Austin, TX',
    verified: false,
  },
  {
    id: '4',
    name: 'James Thompson',
    username: '@jamest',
    avatar: 'https://i.pravatar.cc/150?img=14',
    bio: 'Building products that matter. Coffee addict ☕',
    tier: 'supporter',
    joinedAt: new Date('2023-04-05'),
    location: 'Seattle, WA',
    verified: false,
  },
  {
    id: '5',
    name: 'Aisha Patel',
    username: '@aishap',
    avatar: 'https://i.pravatar.cc/150?img=9',
    bio: 'Marketing strategist | Community enthusiast',
    tier: 'premium',
    joinedAt: new Date('2023-04-15'),
    location: 'Chicago, IL',
    badges: ['active-member'],
    verified: true,
  },
  {
    id: '6',
    name: 'David Kim',
    username: '@davidk',
    avatar: 'https://i.pravatar.cc/150?img=13',
    bio: 'Developer & open source contributor',
    tier: 'supporter',
    joinedAt: new Date('2023-05-01'),
    location: 'Los Angeles, CA',
    verified: false,
  },
  {
    id: '7',
    name: 'Sophie Martin',
    username: '@sophie_m',
    avatar: 'https://i.pravatar.cc/150?img=24',
    bio: 'Content creator sharing my journey 🌟',
    tier: 'free',
    joinedAt: new Date('2023-06-12'),
    location: 'Miami, FL',
    verified: false,
  },
  {
    id: '8',
    name: 'Ryan Foster',
    username: '@ryanf',
    avatar: 'https://i.pravatar.cc/150?img=33',
    bio: 'Entrepreneur | Podcast host | Community lover',
    tier: 'vip',
    joinedAt: new Date('2023-01-20'),
    location: 'Denver, CO',
    badges: ['founder', 'host'],
    verified: true,
  },
  {
    id: '9',
    name: 'Priya Sharma',
    username: '@priya_s',
    avatar: 'https://i.pravatar.cc/150?img=20',
    bio: 'UX designer making the web beautiful',
    tier: 'premium',
    joinedAt: new Date('2023-07-08'),
    location: 'Boston, MA',
    verified: true,
  },
  {
    id: '10',
    name: 'Tyler Brooks',
    username: '@tylerb',
    avatar: 'https://i.pravatar.cc/150?img=52',
    bio: 'Fitness coach & wellness advocate',
    tier: 'supporter',
    joinedAt: new Date('2023-08-14'),
    verified: false,
  },
  {
    id: '11',
    name: 'Nina Garcia',
    username: '@nina_g',
    avatar: 'https://i.pravatar.cc/150?img=29',
    bio: 'Writer ✍️ | Reader 📚 | Dreamer',
    tier: 'free',
    joinedAt: new Date('2023-09-03'),
    verified: false,
  },
  {
    id: '12',
    name: 'Oliver Chen',
    username: '@oliverc',
    avatar: 'https://i.pravatar.cc/150?img=59',
    bio: 'Data scientist exploring the world through numbers',
    tier: 'premium',
    joinedAt: new Date('2023-09-20'),
    location: 'Portland, OR',
    verified: false,
  },
  {
    id: '13',
    name: 'Mia Anderson',
    username: '@mia_a',
    avatar: 'https://i.pravatar.cc/150?img=16',
    bio: 'Photographer capturing life\'s moments',
    tier: 'supporter',
    joinedAt: new Date('2023-10-05'),
    location: 'Nashville, TN',
    badges: ['creative'],
    verified: true,
  },
  {
    id: '14',
    name: 'Lucas Santos',
    username: '@lucass',
    avatar: 'https://i.pravatar.cc/150?img=15',
    bio: 'Musician & producer | Creating vibes',
    tier: 'free',
    joinedAt: new Date('2023-10-22'),
    verified: false,
  },
  {
    id: '15',
    name: 'Zoe Williams',
    username: '@zoew',
    avatar: 'https://i.pravatar.cc/150?img=47',
    bio: 'Business consultant helping startups grow',
    tier: 'premium',
    joinedAt: new Date('2023-11-08'),
    location: 'Washington, DC',
    verified: true,
  },
  {
    id: '16',
    name: 'Ethan Davis',
    username: '@ethand',
    avatar: 'https://i.pravatar.cc/150?img=68',
    bio: 'Tech educator & speaker',
    tier: 'supporter',
    joinedAt: new Date('2023-11-19'),
    verified: false,
  },
  {
    id: '17',
    name: 'Lily Zhang',
    username: '@lily_z',
    avatar: 'https://i.pravatar.cc/150?img=44',
    bio: 'Product manager loving every sprint',
    tier: 'free',
    joinedAt: new Date('2023-12-01'),
    verified: false,
  },
  {
    id: '18',
    name: 'Noah Taylor',
    username: '@noaht',
    avatar: 'https://i.pravatar.cc/150?img=57',
    bio: 'Startup founder | Building the future',
    tier: 'vip',
    joinedAt: new Date('2023-02-14'),
    location: 'San Diego, CA',
    badges: ['founder', 'innovator'],
    verified: true,
  },
  {
    id: '19',
    name: 'Ava Mitchell',
    username: '@avam',
    avatar: 'https://i.pravatar.cc/150?img=32',
    bio: 'Social media strategist & content creator',
    tier: 'premium',
    joinedAt: new Date('2023-12-15'),
    verified: true,
  },
  {
    id: '20',
    name: 'Isabella Lee',
    username: '@bella_lee',
    avatar: 'https://i.pravatar.cc/150?img=26',
    bio: 'Life coach helping people find their path 🌈',
    tier: 'supporter',
    joinedAt: new Date('2024-01-02'),
    location: 'Phoenix, AZ',
    verified: false,
  },
];

export async function getMembers(): Promise<Member[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_MEMBERS];
}

export async function getMember(id: string): Promise<Member | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_MEMBERS.find((member) => member.id === id) || null;
}

export async function searchMembers(query: string): Promise<Member[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const lowerQuery = query.toLowerCase();
  return MOCK_MEMBERS.filter(
    (member) =>
      member.name.toLowerCase().includes(lowerQuery) ||
      member.username.toLowerCase().includes(lowerQuery) ||
      member.bio?.toLowerCase().includes(lowerQuery)
  );
}

export async function getMembersByTier(tier: MembershipTier): Promise<Member[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_MEMBERS.filter((member) => member.tier === tier);
}
