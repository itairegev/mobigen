// ============================================================================
// CHURCH APP TYPE DEFINITIONS
// ============================================================================

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  seriesId: string;
  date: Date;
  description: string;
  videoUrl?: string;
  audioUrl?: string;
  duration: number; // minutes
  thumbnail: string;
  scripture: string;
  notes?: string;
}

export interface Series {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  sermonCount: number;
  startDate: Date;
  endDate?: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  time: string;
  location: string;
  address?: string;
  category: EventCategory;
  image: string;
  registrationRequired: boolean;
  registrationUrl?: string;
  capacity?: number;
  registered?: number;
}

export type EventCategory =
  | 'service'
  | 'youth'
  | 'children'
  | 'community'
  | 'outreach'
  | 'prayer'
  | 'worship'
  | 'study';

export interface Donation {
  id: string;
  amount: number;
  frequency: DonationFrequency;
  fund: string;
  date: Date;
  status: 'pending' | 'completed' | 'failed';
  method: PaymentMethod;
}

export type DonationFrequency = 'one-time' | 'weekly' | 'monthly';
export type PaymentMethod = 'credit-card' | 'debit-card' | 'bank-transfer' | 'apple-pay' | 'google-pay';

export interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  category: PrayerCategory;
  isPrivate: boolean;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'praying' | 'answered';
  prayerCount: number;
}

export type PrayerCategory =
  | 'health'
  | 'family'
  | 'financial'
  | 'spiritual'
  | 'relationships'
  | 'guidance'
  | 'gratitude'
  | 'other';

export interface Group {
  id: string;
  name: string;
  description: string;
  category: GroupCategory;
  leader: string;
  leaderContact?: string;
  meetingDay: string;
  meetingTime: string;
  location: string;
  members: number;
  capacity?: number;
  image?: string;
  isOpen: boolean;
}

export type GroupCategory =
  | 'bible-study'
  | 'prayer'
  | 'youth'
  | 'men'
  | 'women'
  | 'couples'
  | 'seniors'
  | 'young-adults'
  | 'discipleship';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  date: Date;
  expiresAt?: Date;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface GivingFund {
  id: string;
  name: string;
  description: string;
  goal?: number;
  raised?: number;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  memberSince?: Date;
  groups?: string[];
}
