import { PrayerRequest } from '../types';

export const MOCK_PRAYERS: PrayerRequest[] = [
  {
    id: '1',
    title: 'Healing for my mother',
    description: 'Please pray for my mother who is recovering from surgery. Asking for complete healing and strength.',
    category: 'health',
    isPrivate: false,
    submittedBy: 'Sarah M.',
    submittedAt: new Date('2024-06-25'),
    status: 'praying',
    prayerCount: 45,
  },
  {
    id: '2',
    title: 'Job opportunity',
    description: 'I have a job interview this week. Praying for God\'s favor and guidance in this career decision.',
    category: 'financial',
    isPrivate: false,
    submittedBy: 'James T.',
    submittedAt: new Date('2024-06-26'),
    status: 'praying',
    prayerCount: 32,
  },
  {
    id: '3',
    title: 'Family restoration',
    description: 'Asking for prayers for reconciliation in my family relationships.',
    category: 'family',
    isPrivate: true,
    submittedBy: 'Anonymous',
    submittedAt: new Date('2024-06-27'),
    status: 'praying',
    prayerCount: 28,
  },
  {
    id: '4',
    title: 'Grateful for answered prayer',
    description: 'Thank you God for providing a new job! Grateful for everyone who prayed with me.',
    category: 'gratitude',
    isPrivate: false,
    submittedBy: 'Michael R.',
    submittedAt: new Date('2024-06-20'),
    status: 'answered',
    prayerCount: 67,
  },
  {
    id: '5',
    title: 'Wisdom in decision making',
    description: 'Facing an important life decision and need God\'s wisdom and direction.',
    category: 'guidance',
    isPrivate: false,
    submittedBy: 'Emily K.',
    submittedAt: new Date('2024-06-28'),
    status: 'praying',
    prayerCount: 19,
  },
];

// Simulated API functions
export async function getPrayerRequests(): Promise<PrayerRequest[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_PRAYERS]
    .filter((prayer) => !prayer.isPrivate)
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

export async function submitPrayerRequest(
  title: string,
  description: string,
  category: string,
  isPrivate: boolean
): Promise<PrayerRequest> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const newPrayer: PrayerRequest = {
    id: String(MOCK_PRAYERS.length + 1),
    title,
    description,
    category: category as any,
    isPrivate,
    submittedBy: 'You',
    submittedAt: new Date(),
    status: 'pending',
    prayerCount: 0,
  };

  MOCK_PRAYERS.push(newPrayer);
  return newPrayer;
}

export async function prayForRequest(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const prayer = MOCK_PRAYERS.find((p) => p.id === id);
  if (prayer) {
    prayer.prayerCount++;
  }
}
