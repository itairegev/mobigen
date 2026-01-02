import { Donation, GivingFund } from '../types';

export const MOCK_GIVING_FUNDS: GivingFund[] = [
  {
    id: '1',
    name: 'General Fund',
    description: 'Supports the overall ministry and operations of our church.',
    color: '#1e40af',
  },
  {
    id: '2',
    name: 'Missions',
    description: 'Supporting missionaries and global outreach initiatives.',
    goal: 50000,
    raised: 32450,
    color: '#059669',
  },
  {
    id: '3',
    name: 'Building Fund',
    description: 'Expansion project for our new worship center.',
    goal: 500000,
    raised: 287500,
    color: '#f59e0b',
  },
  {
    id: '4',
    name: 'Benevolence',
    description: 'Helping those in need within our church and community.',
    goal: 25000,
    raised: 18750,
    color: '#dc2626',
  },
];

export const MOCK_DONATIONS: Donation[] = [
  {
    id: '1',
    amount: 100,
    frequency: 'monthly',
    fund: 'General Fund',
    date: new Date('2024-06-01'),
    status: 'completed',
    method: 'credit-card',
  },
  {
    id: '2',
    amount: 500,
    frequency: 'one-time',
    fund: 'Missions',
    date: new Date('2024-05-15'),
    status: 'completed',
    method: 'bank-transfer',
  },
  {
    id: '3',
    amount: 250,
    frequency: 'monthly',
    fund: 'Building Fund',
    date: new Date('2024-06-01'),
    status: 'completed',
    method: 'credit-card',
  },
];

// Simulated API functions
export async function getGivingFunds(): Promise<GivingFund[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_GIVING_FUNDS];
}

export async function getDonationHistory(): Promise<Donation[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_DONATIONS].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function submitDonation(
  amount: number,
  frequency: 'one-time' | 'weekly' | 'monthly',
  fundId: string,
  method: string
): Promise<Donation> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const fund = MOCK_GIVING_FUNDS.find((f) => f.id === fundId);

  const newDonation: Donation = {
    id: String(MOCK_DONATIONS.length + 1),
    amount,
    frequency,
    fund: fund?.name || 'General Fund',
    date: new Date(),
    status: 'completed',
    method: method as any,
  };

  MOCK_DONATIONS.push(newDonation);

  // Update fund raised amount
  if (fund && fund.goal) {
    fund.raised = (fund.raised || 0) + amount;
  }

  return newDonation;
}
