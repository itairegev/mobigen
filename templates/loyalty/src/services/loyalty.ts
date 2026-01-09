/**
 * Loyalty Service - Points, rewards, and QR code validation
 *
 * Configuration:
 * - EXPO_PUBLIC_BUSINESS_NAME: Name of the business
 * - EXPO_PUBLIC_POINTS_PER_DOLLAR: Points earned per $1 spent (default: 1)
 * - EXPO_PUBLIC_REWARD_THRESHOLD: Points needed for a reward (default: 100)
 * - EXPO_PUBLIC_BUSINESS_SECRET: Secret for QR code validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reward, Transaction, Tier } from '@/types';

// Configuration
const BUSINESS_NAME = process.env.EXPO_PUBLIC_BUSINESS_NAME || 'Coffee Corner';
const POINTS_PER_DOLLAR = parseInt(process.env.EXPO_PUBLIC_POINTS_PER_DOLLAR || '1');
const REWARD_THRESHOLD = parseInt(process.env.EXPO_PUBLIC_REWARD_THRESHOLD || '100');
const BUSINESS_SECRET = process.env.EXPO_PUBLIC_BUSINESS_SECRET || 'demo-secret';

// Storage keys
const STORAGE_KEYS = {
  POINTS: '@loyalty/points',
  TRANSACTIONS: '@loyalty/transactions',
  REDEEMED_REWARDS: '@loyalty/redeemed',
};

// Tier definitions
export const TIERS: Tier[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, benefits: ['Birthday reward'] },
  { id: 'silver', name: 'Silver', minPoints: 1000, benefits: ['Birthday reward', '10% bonus points'] },
  { id: 'gold', name: 'Gold', minPoints: 5000, benefits: ['Birthday reward', '20% bonus points', 'Free shipping'] },
  { id: 'platinum', name: 'Platinum', minPoints: 15000, benefits: ['Birthday reward', '30% bonus points', 'Free shipping', 'Priority support'] },
];

// Mock rewards based on configuration
export function getRewards(): Reward[] {
  return [
    {
      id: 'reward-1',
      name: 'Free Coffee',
      description: `Enjoy a complimentary drink of your choice at ${BUSINESS_NAME}`,
      pointsCost: REWARD_THRESHOLD,
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
      category: 'drinks',
      termsAndConditions: 'Valid for one standard drink. Cannot be combined with other offers.',
    },
    {
      id: 'reward-2',
      name: 'Free Pastry',
      description: 'Choose any pastry from our bakery selection',
      pointsCost: Math.round(REWARD_THRESHOLD * 0.75),
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
      category: 'food',
      termsAndConditions: 'Valid for pastries up to $5 value.',
    },
    {
      id: 'reward-3',
      name: '10% Off Purchase',
      description: 'Save 10% on your next purchase',
      pointsCost: Math.round(REWARD_THRESHOLD * 0.5),
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
      category: 'discount',
      termsAndConditions: 'Maximum discount of $10. One use per customer.',
    },
    {
      id: 'reward-4',
      name: '25% Off Purchase',
      description: 'Get 25% off your entire order',
      pointsCost: Math.round(REWARD_THRESHOLD * 1.5),
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
      category: 'discount',
      termsAndConditions: 'Maximum discount of $25. One use per customer.',
    },
    {
      id: 'reward-5',
      name: 'Free Drink Upgrade',
      description: 'Upgrade any drink to a larger size for free',
      pointsCost: Math.round(REWARD_THRESHOLD * 0.25),
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
      category: 'drinks',
      termsAndConditions: 'Valid for one upgrade. Hot or iced drinks only.',
    },
    {
      id: 'reward-6',
      name: 'Exclusive Merchandise',
      description: `Limited edition ${BUSINESS_NAME} tumbler`,
      pointsCost: Math.round(REWARD_THRESHOLD * 3),
      image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
      category: 'merchandise',
      termsAndConditions: 'While supplies last. Cannot be exchanged for cash.',
    },
  ];
}

/**
 * Get stored points
 */
export async function getStoredPoints(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.POINTS);
    return stored ? parseInt(stored) : 2450; // Default starting points
  } catch {
    return 2450;
  }
}

/**
 * Save points to storage
 */
export async function savePoints(points: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.POINTS, points.toString());
  } catch (error) {
    console.error('Failed to save points:', error);
  }
}

/**
 * Get stored transactions
 */
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!stored) return generateMockTransactions();
    return JSON.parse(stored);
  } catch {
    return generateMockTransactions();
  }
}

/**
 * Add a transaction
 */
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction> {
  const transactions = await getTransactions();

  const newTransaction: Transaction = {
    ...transaction,
    id: `txn-${Date.now()}`,
    date: new Date().toISOString(),
  };

  transactions.unshift(newTransaction);

  // Keep only last 100 transactions
  const trimmed = transactions.slice(0, 100);

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save transaction:', error);
  }

  return newTransaction;
}

/**
 * Generate mock transactions for demo
 */
function generateMockTransactions(): Transaction[] {
  const now = new Date();
  return [
    {
      id: 'txn-1',
      type: 'earn',
      points: 50,
      description: 'Purchase at Main Street',
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Main Street Location',
      icon: '☕',
    },
    {
      id: 'txn-2',
      type: 'earn',
      points: 25,
      description: 'Purchase at Downtown',
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Downtown Location',
      icon: '🥐',
    },
    {
      id: 'txn-3',
      type: 'redeem',
      points: -100,
      description: 'Redeemed: Free Coffee',
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      icon: '🎁',
    },
    {
      id: 'txn-4',
      type: 'earn',
      points: 75,
      description: 'Purchase at Airport',
      date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Airport Location',
      icon: '✈️',
    },
    {
      id: 'txn-5',
      type: 'earn',
      points: 200,
      description: 'Welcome bonus!',
      date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      icon: '🎉',
    },
  ];
}

/**
 * Validate and process a QR code scan
 * QR code format: {business_id}:{amount}:{timestamp}:{signature}
 * Demo format: DEMO:{points}
 */
export async function validateQRCode(qrData: string): Promise<{
  success: boolean;
  points?: number;
  error?: string;
}> {
  try {
    // Demo mode - simple point codes
    if (qrData.startsWith('DEMO:')) {
      const points = parseInt(qrData.split(':')[1]);
      if (isNaN(points) || points <= 0) {
        return { success: false, error: 'Invalid demo code' };
      }
      return { success: true, points };
    }

    // Production mode - validate signature
    const parts = qrData.split(':');
    if (parts.length < 4) {
      return { success: false, error: 'Invalid QR code format' };
    }

    const [businessId, amountStr, timestamp, signature] = parts;
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Invalid purchase amount' };
    }

    // Validate timestamp (within 5 minutes)
    const codeTime = parseInt(timestamp);
    if (Date.now() - codeTime > 5 * 60 * 1000) {
      return { success: false, error: 'QR code has expired' };
    }

    // Simple signature validation (in production, use HMAC)
    const expectedSig = simpleHash(`${businessId}:${amount}:${timestamp}:${BUSINESS_SECRET}`);
    if (signature !== expectedSig) {
      // For demo, accept any code
      console.log('Signature mismatch, accepting for demo');
    }

    // Calculate points
    const points = Math.floor(amount * POINTS_PER_DOLLAR);

    return { success: true, points };
  } catch (error) {
    return { success: false, error: 'Failed to process QR code' };
  }
}

/**
 * Simple hash function for demo purposes
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Redeem a reward
 */
export async function redeemReward(rewardId: string, currentPoints: number): Promise<{
  success: boolean;
  newPoints?: number;
  error?: string;
}> {
  const rewards = getRewards();
  const reward = rewards.find(r => r.id === rewardId);

  if (!reward) {
    return { success: false, error: 'Reward not found' };
  }

  if (currentPoints < reward.pointsCost) {
    return { success: false, error: 'Not enough points' };
  }

  const newPoints = currentPoints - reward.pointsCost;

  // Save the redemption
  await addTransaction({
    type: 'redeem',
    points: -reward.pointsCost,
    description: `Redeemed: ${reward.name}`,
    icon: '🎁',
  });

  // Track redeemed rewards
  try {
    const redeemed = await AsyncStorage.getItem(STORAGE_KEYS.REDEEMED_REWARDS);
    const redeemedList = redeemed ? JSON.parse(redeemed) : [];
    redeemedList.push({
      rewardId,
      redeemedAt: new Date().toISOString(),
      code: generateRedemptionCode(),
    });
    await AsyncStorage.setItem(STORAGE_KEYS.REDEEMED_REWARDS, JSON.stringify(redeemedList));
  } catch (error) {
    console.error('Failed to track redeemed reward:', error);
  }

  return { success: true, newPoints };
}

/**
 * Generate a redemption code for display
 */
function generateRedemptionCode(): string {
  return 'RDM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Get redeemed rewards
 */
export async function getRedeemedRewards(): Promise<Array<{
  rewardId: string;
  redeemedAt: string;
  code: string;
}>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.REDEEMED_REWARDS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get tier for a given point total
 */
export function getTierForPoints(points: number): Tier {
  return TIERS.reduce((current, t) => {
    if (points >= t.minPoints) return t;
    return current;
  }, TIERS[0]);
}

/**
 * Get configuration info
 */
export function getLoyaltyConfig() {
  return {
    businessName: BUSINESS_NAME,
    pointsPerDollar: POINTS_PER_DOLLAR,
    rewardThreshold: REWARD_THRESHOLD,
  };
}
