import { useQuery } from '@tanstack/react-query';
import type { Reward } from '@/types';

const mockRewards: Reward[] = [
  {
    id: '1',
    name: 'Free Coffee',
    description: 'Get a free regular coffee at any location',
    pointsCost: 500,
    image: 'https://picsum.photos/seed/coffee/400/400',
    category: 'Beverages',
  },
  {
    id: '2',
    name: '20% Off Next Purchase',
    description: 'Save 20% on your next purchase',
    pointsCost: 1000,
    image: 'https://picsum.photos/seed/discount/400/400',
    category: 'Discounts',
  },
  {
    id: '3',
    name: 'Free Pastry',
    description: 'Get any pastry for free',
    pointsCost: 750,
    image: 'https://picsum.photos/seed/pastry/400/400',
    category: 'Food',
  },
  {
    id: '4',
    name: '$10 Gift Card',
    description: 'Receive a $10 gift card',
    pointsCost: 2000,
    image: 'https://picsum.photos/seed/giftcard/400/400',
    category: 'Gift Cards',
  },
];

async function fetchRewards(): Promise<Reward[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockRewards;
}

export function useRewards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rewards'],
    queryFn: fetchRewards,
  });

  return {
    rewards: data || [],
    isLoading,
    error,
  };
}
