import type { Sponsor } from '@/types';

export const MOCK_SPONSORS: Sponsor[] = [
  {
    id: '1',
    name: 'Google Cloud',
    logo: 'https://via.placeholder.com/200x80/4285F4/FFFFFF?text=Google+Cloud',
    tier: 'platinum',
    description: 'Cloud computing services that run on the same infrastructure that Google uses internally.',
    website: 'https://cloud.google.com',
    booth: 'Booth 1',
  },
  {
    id: '2',
    name: 'Microsoft Azure',
    logo: 'https://via.placeholder.com/200x80/0078D4/FFFFFF?text=Azure',
    tier: 'platinum',
    description: 'Comprehensive cloud platform with solutions for building, running, and managing applications.',
    website: 'https://azure.microsoft.com',
    booth: 'Booth 2',
  },
  {
    id: '3',
    name: 'AWS',
    logo: 'https://via.placeholder.com/200x80/FF9900/FFFFFF?text=AWS',
    tier: 'platinum',
    description: "World's most comprehensive and broadly adopted cloud platform.",
    website: 'https://aws.amazon.com',
    booth: 'Booth 3',
  },
  {
    id: '4',
    name: 'Vercel',
    logo: 'https://via.placeholder.com/200x80/000000/FFFFFF?text=Vercel',
    tier: 'gold',
    description: 'The platform for frontend developers, providing speed and reliability.',
    website: 'https://vercel.com',
    booth: 'Booth 4',
  },
  {
    id: '5',
    name: 'Stripe',
    logo: 'https://via.placeholder.com/200x80/635BFF/FFFFFF?text=Stripe',
    tier: 'gold',
    description: 'Payment infrastructure for the internet.',
    website: 'https://stripe.com',
    booth: 'Booth 5',
  },
  {
    id: '6',
    name: 'MongoDB',
    logo: 'https://via.placeholder.com/200x80/47A248/FFFFFF?text=MongoDB',
    tier: 'gold',
    description: 'The most popular database for modern applications.',
    website: 'https://www.mongodb.com',
    booth: 'Booth 6',
  },
  {
    id: '7',
    name: 'GitHub',
    logo: 'https://via.placeholder.com/200x80/181717/FFFFFF?text=GitHub',
    tier: 'silver',
    description: 'Where the world builds software.',
    website: 'https://github.com',
  },
  {
    id: '8',
    name: 'Figma',
    logo: 'https://via.placeholder.com/200x80/F24E1E/FFFFFF?text=Figma',
    tier: 'silver',
    description: 'The collaborative interface design tool.',
    website: 'https://figma.com',
  },
  {
    id: '9',
    name: 'Notion',
    logo: 'https://via.placeholder.com/200x80/000000/FFFFFF?text=Notion',
    tier: 'silver',
    description: 'All-in-one workspace for notes, tasks, wikis, and databases.',
    website: 'https://notion.so',
  },
  {
    id: '10',
    name: 'Linear',
    logo: 'https://via.placeholder.com/200x80/5E6AD2/FFFFFF?text=Linear',
    tier: 'bronze',
    description: 'The issue tracking tool you'll enjoy using.',
    website: 'https://linear.app',
  },
];

export async function fetchSponsors(): Promise<Sponsor[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_SPONSORS;
}

export async function fetchSponsorsByTier(tier: string): Promise<Sponsor[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_SPONSORS.filter((s) => s.tier === tier);
}
