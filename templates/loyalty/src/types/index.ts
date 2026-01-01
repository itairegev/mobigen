export interface Tier {
  id: 'bronze' | 'silver' | 'gold' | 'platinum';
  name: string;
  minPoints: number;
  benefits: string[];
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  image: string;
  category: string;
  expiresAt?: Date;
  termsAndConditions?: string;
}

export interface Transaction {
  id: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  date: string;
  icon?: string;
  location?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  points: number;
  tier: Tier;
  memberSince: Date;
  referralCode: string;
}
