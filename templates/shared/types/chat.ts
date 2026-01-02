/**
 * Chat and messaging-related types
 */

import { BaseEntity } from './common';

export interface Message extends BaseEntity {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  status: MessageStatus;
  attachments?: Attachment[];
  replyTo?: string; // Message ID if replying to another message
  reactions?: MessageReaction[];
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name?: string;
  size?: number; // bytes
  duration?: number; // for audio/video in seconds
  thumbnail?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface Conversation extends BaseEntity {
  participants: ConversationParticipant[];
  lastMessage: Message;
  unreadCount: number;
  type: 'direct' | 'group';
  name?: string; // For group conversations
  avatar?: string; // For group conversations
  muted: boolean;
  pinned: boolean;
}

export interface ConversationParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role?: 'admin' | 'member';
  online?: boolean;
  lastSeen?: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ChatSettings {
  notifications: boolean;
  sound: boolean;
  vibration: boolean;
  showReadReceipts: boolean;
  showTypingIndicator: boolean;
  autoDownloadMedia: boolean;
}
