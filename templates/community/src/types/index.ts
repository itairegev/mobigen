export interface Member {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  tier: MembershipTier;
  joinedAt: Date;
  location?: string;
  badges?: string[];
  verified: boolean;
}

export type MembershipTier = 'free' | 'supporter' | 'premium' | 'vip';

export interface Membership {
  id: string;
  memberId: string;
  tier: MembershipTier;
  startDate: Date;
  expiresAt?: Date;
  autoRenew: boolean;
  benefits: string[];
}

export interface Post {
  id: string;
  authorId: string;
  author: Member;
  content: string;
  images?: string[];
  createdAt: Date;
  updatedAt?: Date;
  reactions: Reaction[];
  commentCount: number;
  pinned: boolean;
  tier?: MembershipTier; // Minimum tier required to view
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: Member;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  reactions: Reaction[];
  parentId?: string; // For nested replies
  replyCount: number;
}

export type ReactionType = 'like' | 'heart' | 'fire' | 'celebrate' | 'insightful';

export interface Reaction {
  id: string;
  type: ReactionType;
  userId: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'virtual' | 'in-person' | 'hybrid';
  startDate: Date;
  endDate: Date;
  location?: string;
  meetingLink?: string;
  coverImage: string;
  hostId: string;
  host: Member;
  capacity?: number;
  attendeeCount: number;
  rsvpStatus?: RSVPStatus;
  tier?: MembershipTier; // Minimum tier required
}

export type RSVPStatus = 'going' | 'maybe' | 'not-going';

export interface RSVP {
  id: string;
  eventId: string;
  userId: string;
  status: RSVPStatus;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: Member[];
  lastMessage?: Message;
  updatedAt: Date;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: Member;
  content: string;
  createdAt: Date;
  read: boolean;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: number;
}

export interface TierBenefit {
  tier: MembershipTier;
  name: string;
  color: string;
  benefits: string[];
  price?: number;
}
