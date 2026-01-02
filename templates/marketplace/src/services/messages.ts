import type { Conversation, Message } from '@/types';

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    listingId: '1',
    listing: {
      id: '1',
      title: 'iPhone 14 Pro - Space Black',
      price: 799,
      image: 'https://picsum.photos/seed/iphone1/600/600',
    },
    otherUser: {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    lastMessage: {
      id: '1',
      conversationId: '1',
      senderId: '1',
      text: 'Hi! Is this still available?',
      timestamp: new Date('2024-12-20T10:30:00'),
      read: false,
    },
    unreadCount: 1,
    updatedAt: new Date('2024-12-20T10:30:00'),
  },
  {
    id: '2',
    listingId: '3',
    listing: {
      id: '3',
      title: 'Mountain Bike - Trek X-Caliber',
      price: 650,
      image: 'https://picsum.photos/seed/bike1/600/600',
    },
    otherUser: {
      id: '3',
      name: 'Emily Davis',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    lastMessage: {
      id: '2',
      conversationId: '2',
      senderId: 'me',
      text: 'Yes, you can come see it tomorrow at 2pm',
      timestamp: new Date('2024-12-19T15:45:00'),
      read: true,
    },
    unreadCount: 0,
    updatedAt: new Date('2024-12-19T15:45:00'),
  },
  {
    id: '3',
    listingId: '8',
    listing: {
      id: '8',
      title: 'PlayStation 5 Console + Controller',
      price: 450,
      image: 'https://picsum.photos/seed/ps5-1/600/600',
    },
    otherUser: {
      id: '4',
      name: 'John Smith',
      avatar: 'https://i.pravatar.cc/150?img=8',
    },
    lastMessage: {
      id: '3',
      conversationId: '3',
      senderId: '4',
      text: 'Would you take $400?',
      timestamp: new Date('2024-12-18T14:20:00'),
      read: false,
    },
    unreadCount: 2,
    updatedAt: new Date('2024-12-18T14:20:00'),
  },
];

const MOCK_MESSAGES: { [conversationId: string]: Message[] } = {
  '1': [
    {
      id: '1',
      conversationId: '1',
      senderId: '1',
      text: 'Hi! Is this still available?',
      timestamp: new Date('2024-12-20T10:30:00'),
      read: false,
    },
  ],
  '2': [
    {
      id: '2-1',
      conversationId: '2',
      senderId: '3',
      text: 'Hi! Can I come see the bike this weekend?',
      timestamp: new Date('2024-12-19T14:30:00'),
      read: true,
    },
    {
      id: '2-2',
      conversationId: '2',
      senderId: 'me',
      text: 'Sure! What day works best for you?',
      timestamp: new Date('2024-12-19T15:00:00'),
      read: true,
    },
    {
      id: '2-3',
      conversationId: '2',
      senderId: '3',
      text: 'Saturday afternoon?',
      timestamp: new Date('2024-12-19T15:30:00'),
      read: true,
    },
    {
      id: '2-4',
      conversationId: '2',
      senderId: 'me',
      text: 'Yes, you can come see it tomorrow at 2pm',
      timestamp: new Date('2024-12-19T15:45:00'),
      read: true,
    },
  ],
  '3': [
    {
      id: '3-1',
      conversationId: '3',
      senderId: 'me',
      text: 'Thanks for your interest!',
      timestamp: new Date('2024-12-18T14:00:00'),
      read: true,
    },
    {
      id: '3-2',
      conversationId: '3',
      senderId: '4',
      text: 'Would you take $400?',
      timestamp: new Date('2024-12-18T14:20:00'),
      read: false,
    },
    {
      id: '3-3',
      conversationId: '3',
      senderId: '4',
      text: 'I can pick it up today if you agree',
      timestamp: new Date('2024-12-18T14:21:00'),
      read: false,
    },
  ],
};

export async function fetchConversations(): Promise<Conversation[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_CONVERSATIONS;
}

export async function fetchConversation(id: string): Promise<Conversation | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_CONVERSATIONS.find((conv) => conv.id === id) || null;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_MESSAGES[conversationId] || [];
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<Message> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newMessage: Message = {
    id: String(Date.now()),
    conversationId,
    senderId: 'me',
    text,
    timestamp: new Date(),
    read: false,
  };

  return newMessage;
}

export async function createConversation(
  listingId: string,
  message: string
): Promise<Conversation> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const newConversation: Conversation = {
    id: String(Date.now()),
    listingId,
    listing: {
      id: listingId,
      title: 'Sample Listing',
      price: 99,
      image: 'https://picsum.photos/seed/default/600/600',
    },
    otherUser: {
      id: 'seller-id',
      name: 'Seller Name',
      avatar: 'https://i.pravatar.cc/150?img=10',
    },
    lastMessage: {
      id: String(Date.now()),
      conversationId: String(Date.now()),
      senderId: 'me',
      text: message,
      timestamp: new Date(),
      read: false,
    },
    unreadCount: 0,
    updatedAt: new Date(),
  };

  return newConversation;
}
