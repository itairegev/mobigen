/**
 * Marketplace Service - Persistent listings and messaging
 *
 * Configuration:
 * - EXPO_PUBLIC_MARKETPLACE_NAME: Name of the marketplace
 * - EXPO_PUBLIC_DEFAULT_LOCATION: Default location for listings
 * - EXPO_PUBLIC_CURRENCY: Currency symbol (default: $)
 * - EXPO_PUBLIC_ENABLE_MESSAGING: Enable in-app messaging
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Listing, Seller, Category, Message, Conversation } from '@/types';
import { MOCK_LISTINGS } from './listings';
import { MOCK_CATEGORIES } from './categories';

// Configuration
const MARKETPLACE_NAME = process.env.EXPO_PUBLIC_MARKETPLACE_NAME || 'Marketplace';
const DEFAULT_LOCATION = process.env.EXPO_PUBLIC_DEFAULT_LOCATION || 'San Francisco, CA';
const CURRENCY = process.env.EXPO_PUBLIC_CURRENCY || '$';
const ENABLE_MESSAGING = process.env.EXPO_PUBLIC_ENABLE_MESSAGING !== 'false';

// Storage keys
const STORAGE_KEYS = {
  LISTINGS: '@marketplace/listings',
  MY_LISTINGS: '@marketplace/myListings',
  FAVORITES: '@marketplace/favorites',
  CONVERSATIONS: '@marketplace/conversations',
  MESSAGES: '@marketplace/messages',
  SEARCH_HISTORY: '@marketplace/searchHistory',
  CURRENT_USER: '@marketplace/currentUser',
};

// In-memory cache
let cachedListings: Listing[] | null = null;

// Default user (seller)
const DEFAULT_USER: Seller = {
  id: 'user-1',
  name: 'You',
  avatar: 'https://i.pravatar.cc/150?img=10',
  rating: 5.0,
  reviewCount: 0,
  joinedDate: new Date(),
  activeListings: 0,
};

/**
 * Initialize listings from storage
 */
async function loadListings(): Promise<Listing[]> {
  if (cachedListings) return cachedListings;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LISTINGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedListings = parsed.map((listing: Listing & { createdAt: string; updatedAt: string }) => ({
        ...listing,
        createdAt: new Date(listing.createdAt),
        updatedAt: new Date(listing.updatedAt),
      }));
      return cachedListings;
    }
  } catch (error) {
    console.error('Failed to load listings:', error);
  }

  // Initialize with mock data
  cachedListings = MOCK_LISTINGS.map(l => ({
    ...l,
    createdAt: new Date(l.createdAt),
    updatedAt: new Date(l.updatedAt),
  }));
  await saveListings(cachedListings);
  return cachedListings;
}

/**
 * Save listings to storage
 */
async function saveListings(listings: Listing[]): Promise<void> {
  cachedListings = listings;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  } catch (error) {
    console.error('Failed to save listings:', error);
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<Seller> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get current user:', error);
  }
  return DEFAULT_USER;
}

/**
 * Set current user profile
 */
export async function setUserProfile(profile: Partial<Seller>): Promise<Seller> {
  const current = await getCurrentUser();
  const updated = { ...current, ...profile };
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to set user profile:', error);
  }
  return updated;
}

/**
 * Fetch listings with optional category filter
 */
export async function fetchListings(options?: {
  categoryId?: string;
  sellerId?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'newest' | 'price-low' | 'price-high';
}): Promise<Listing[]> {
  let listings = await loadListings();

  // Apply filters
  if (options?.categoryId) {
    listings = listings.filter(l => l.categoryId === options.categoryId);
  }
  if (options?.sellerId) {
    listings = listings.filter(l => l.sellerId === options.sellerId);
  }
  if (options?.condition) {
    listings = listings.filter(l => l.condition === options.condition);
  }
  if (options?.priceMin !== undefined) {
    listings = listings.filter(l => l.price >= options.priceMin!);
  }
  if (options?.priceMax !== undefined) {
    listings = listings.filter(l => l.price <= options.priceMax!);
  }

  // Sort
  switch (options?.sortBy) {
    case 'price-low':
      listings.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      listings.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
    default:
      listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return listings;
}

/**
 * Fetch single listing by ID
 */
export async function fetchListing(id: string): Promise<Listing | null> {
  const listings = await loadListings();
  return listings.find(l => l.id === id) || null;
}

/**
 * Search listings
 */
export async function searchListings(query: string): Promise<Listing[]> {
  const listings = await loadListings();
  const lowerQuery = query.toLowerCase();

  // Save to search history
  await saveSearchHistory(query);

  return listings.filter(
    l =>
      l.title.toLowerCase().includes(lowerQuery) ||
      l.description.toLowerCase().includes(lowerQuery) ||
      l.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Save search to history
 */
async function saveSearchHistory(query: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    let history: string[] = stored ? JSON.parse(stored) : [];

    // Remove if exists, add to front
    history = history.filter(h => h.toLowerCase() !== query.toLowerCase());
    history.unshift(query);
    history = history.slice(0, 10); // Keep last 10

    await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
}

/**
 * Get search history
 */
export async function getSearchHistory(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get search history:', error);
    return [];
  }
}

/**
 * Create a new listing
 */
export async function createListing(
  listing: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerId'>
): Promise<Listing> {
  const listings = await loadListings();
  const currentUser = await getCurrentUser();

  const newListing: Listing = {
    ...listing,
    id: `listing-${Date.now()}`,
    sellerId: currentUser.id,
    seller: currentUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  listings.unshift(newListing);
  await saveListings(listings);

  return newListing;
}

/**
 * Update a listing
 */
export async function updateListing(
  id: string,
  updates: Partial<Omit<Listing, 'id' | 'createdAt' | 'seller' | 'sellerId'>>
): Promise<Listing> {
  const listings = await loadListings();
  const index = listings.findIndex(l => l.id === id);

  if (index === -1) {
    throw new Error('Listing not found');
  }

  listings[index] = {
    ...listings[index],
    ...updates,
    updatedAt: new Date(),
  };

  await saveListings(listings);
  return listings[index];
}

/**
 * Delete a listing
 */
export async function deleteListing(id: string): Promise<void> {
  const listings = await loadListings();
  const filtered = listings.filter(l => l.id !== id);
  await saveListings(filtered);
}

/**
 * Get my listings
 */
export async function getMyListings(): Promise<Listing[]> {
  const currentUser = await getCurrentUser();
  const listings = await loadListings();
  return listings.filter(l => l.sellerId === currentUser.id);
}

/**
 * Toggle favorite listing
 */
export async function toggleFavorite(listingId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    let favorites: string[] = stored ? JSON.parse(stored) : [];

    const index = favorites.indexOf(listingId);
    if (index >= 0) {
      favorites.splice(index, 1);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      return false; // Removed
    } else {
      favorites.push(listingId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      return true; // Added
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return false;
  }
}

/**
 * Get favorite listing IDs
 */
export async function getFavorites(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return [];
  }
}

/**
 * Get favorite listings
 */
export async function getFavoriteListings(): Promise<Listing[]> {
  const favoriteIds = await getFavorites();
  const listings = await loadListings();
  return listings.filter(l => favoriteIds.includes(l.id));
}

/**
 * Get categories
 */
export async function getCategories(): Promise<Category[]> {
  return MOCK_CATEGORIES;
}

/**
 * Send message to seller
 */
export async function sendMessage(
  listingId: string,
  sellerId: string,
  content: string
): Promise<Message> {
  if (!ENABLE_MESSAGING) {
    throw new Error('Messaging is disabled');
  }

  const currentUser = await getCurrentUser();

  const message: Message = {
    id: `msg-${Date.now()}`,
    conversationId: `conv-${listingId}-${sellerId}`,
    senderId: currentUser.id,
    receiverId: sellerId,
    content,
    timestamp: new Date(),
    read: false,
  };

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    const messages: Message[] = stored ? JSON.parse(stored) : [];
    messages.push(message);
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }

  return message;
}

/**
 * Get conversations
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    const messages: Message[] = stored ? JSON.parse(stored) : [];

    // Group by conversation
    const conversationMap = new Map<string, Message[]>();
    for (const msg of messages) {
      const existing = conversationMap.get(msg.conversationId) || [];
      existing.push(msg);
      conversationMap.set(msg.conversationId, existing);
    }

    const conversations: Conversation[] = [];
    for (const [convId, msgs] of conversationMap) {
      const lastMessage = msgs[msgs.length - 1];
      conversations.push({
        id: convId,
        listingId: convId.split('-')[1],
        participantIds: [msgs[0].senderId, msgs[0].receiverId],
        lastMessage: lastMessage.content,
        lastMessageTime: new Date(lastMessage.timestamp),
        unreadCount: msgs.filter(m => !m.read).length,
      });
    }

    return conversations.sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return [];
  }
}

/**
 * Get marketplace configuration
 */
export function getMarketplaceConfig() {
  return {
    name: MARKETPLACE_NAME,
    defaultLocation: DEFAULT_LOCATION,
    currency: CURRENCY,
    messagingEnabled: ENABLE_MESSAGING,
  };
}

/**
 * Format price
 */
export function formatPrice(price: number): string {
  return `${CURRENCY}${price.toLocaleString()}`;
}

/**
 * Clear all marketplace data (for testing)
 */
export async function clearMarketplaceData(): Promise<void> {
  cachedListings = null;
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.LISTINGS),
    AsyncStorage.removeItem(STORAGE_KEYS.MY_LISTINGS),
    AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES),
    AsyncStorage.removeItem(STORAGE_KEYS.CONVERSATIONS),
    AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES),
    AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY),
  ]);
}
