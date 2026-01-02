export type ListingCondition = 'new' | 'like-new' | 'good' | 'fair' | 'poor';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string;
  category: string;
  condition: ListingCondition;
  location: string;
  sellerId: string;
  seller: Seller;
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  listingCount: number;
}

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  joinedDate: Date;
  activeListings: number;
}

export interface Conversation {
  id: string;
  listingId: string;
  listing: {
    id: string;
    title: string;
    price: number;
    image: string;
  };
  otherUser: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  location: string;
  bio?: string;
  joinedDate: Date;
}
