import { create } from 'zustand';
import type { Tier } from '@/types';

const tiers: Tier[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, benefits: ['Birthday reward'] },
  { id: 'silver', name: 'Silver', minPoints: 1000, benefits: ['Birthday reward', '10% bonus points'] },
  { id: 'gold', name: 'Gold', minPoints: 5000, benefits: ['Birthday reward', '20% bonus points', 'Free shipping'] },
  { id: 'platinum', name: 'Platinum', minPoints: 15000, benefits: ['Birthday reward', '30% bonus points', 'Free shipping', 'Priority support'] },
];

interface PointsState {
  points: number;
  addPoints: (amount: number) => void;
  subtractPoints: (amount: number) => void;
}

const usePointsStore = create<PointsState>((set) => ({
  points: 2450,
  addPoints: (amount) => set((state) => ({ points: state.points + amount })),
  subtractPoints: (amount) => set((state) => ({ points: Math.max(0, state.points - amount) })),
}));

export function usePoints() {
  const { points, addPoints, subtractPoints } = usePointsStore();

  const tier = tiers.reduce((current, t) => {
    if (points >= t.minPoints) return t;
    return current;
  }, tiers[0]);

  const tierIndex = tiers.findIndex((t) => t.id === tier.id);
  const nextTier = tierIndex < tiers.length - 1 ? tiers[tierIndex + 1] : null;
  const pointsToNextTier = nextTier ? nextTier.minPoints - points : 0;

  return {
    points,
    tier,
    nextTier,
    pointsToNextTier,
    addPoints,
    subtractPoints,
    tiers,
  };
}
