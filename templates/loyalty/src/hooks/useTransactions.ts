import { useQuery } from '@tanstack/react-query';
import type { Transaction } from '@/types';

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'earn',
    points: 50,
    description: 'Coffee Purchase',
    date: 'Today, 9:30 AM',
    icon: '☕',
    location: 'Downtown Store',
  },
  {
    id: '2',
    type: 'redeem',
    points: 500,
    description: 'Free Coffee Reward',
    date: 'Yesterday',
    icon: '🎁',
  },
  {
    id: '3',
    type: 'earn',
    points: 100,
    description: 'Lunch Purchase',
    date: '2 days ago',
    icon: '🥗',
    location: 'Mall Location',
  },
  {
    id: '4',
    type: 'earn',
    points: 200,
    description: 'Bonus Points',
    date: 'Last week',
    icon: '⭐',
  },
];

async function fetchTransactions(): Promise<Transaction[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockTransactions;
}

export function useTransactions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  return {
    transactions: data || [],
    isLoading,
    error,
  };
}
