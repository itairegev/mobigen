/**
 * Real Estate Service - Property listings with search and favorites
 *
 * Configuration:
 * - EXPO_PUBLIC_AGENCY_NAME: Name of the real estate agency
 * - EXPO_PUBLIC_DEFAULT_CITY: Default city for searches
 * - EXPO_PUBLIC_CURRENCY: Currency symbol (default: $)
 * - EXPO_PUBLIC_CONTACT_PHONE: Agency contact phone
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Property, Agent, PropertyType, PropertyStatus } from '@/types';
import { MOCK_PROPERTIES, MOCK_AGENTS } from './properties';

// Configuration
const AGENCY_NAME = process.env.EXPO_PUBLIC_AGENCY_NAME || 'Premier Real Estate';
const DEFAULT_CITY = process.env.EXPO_PUBLIC_DEFAULT_CITY || 'Seattle';
const CURRENCY = process.env.EXPO_PUBLIC_CURRENCY || '$';
const CONTACT_PHONE = process.env.EXPO_PUBLIC_CONTACT_PHONE || '';

// Storage keys
const STORAGE_KEYS = {
  FAVORITES: '@realestate/favorites',
  SAVED_SEARCHES: '@realestate/savedSearches',
  VIEWED_PROPERTIES: '@realestate/viewedProperties',
  INQUIRIES: '@realestate/inquiries',
  SEARCH_HISTORY: '@realestate/searchHistory',
};

// In-memory cache
let cachedProperties: Property[] | null = null;

/**
 * Load properties
 */
async function loadProperties(): Promise<Property[]> {
  if (cachedProperties) return cachedProperties;

  // In production, this would fetch from API
  cachedProperties = MOCK_PROPERTIES.map(p => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));

  return cachedProperties;
}

/**
 * Get all properties
 */
export async function getProperties(): Promise<Property[]> {
  return loadProperties();
}

/**
 * Get property by ID
 */
export async function getPropertyById(id: string): Promise<Property | null> {
  const properties = await loadProperties();
  const property = properties.find(p => p.id === id);

  if (property) {
    // Track viewed property
    await trackViewedProperty(id);
  }

  return property || null;
}

/**
 * Search properties with filters
 */
export async function searchProperties(
  query?: string,
  filters?: {
    type?: PropertyType[];
    status?: PropertyStatus;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    bathrooms?: number;
    city?: string;
    sqftMin?: number;
    sqftMax?: number;
  }
): Promise<Property[]> {
  let results = await loadProperties();

  // Save search to history if there's a query
  if (query) {
    await saveSearchHistory(query);
  }

  // Filter by query
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.address.city.toLowerCase().includes(q) ||
        p.address.state.toLowerCase().includes(q) ||
        p.address.street.toLowerCase().includes(q)
    );
  }

  // Filter by type
  if (filters?.type && filters.type.length > 0) {
    results = results.filter(p => filters.type!.includes(p.type));
  }

  // Filter by status
  if (filters?.status) {
    results = results.filter(p => p.status === filters.status);
  }

  // Filter by price
  if (filters?.priceMin !== undefined) {
    results = results.filter(p => p.price >= filters.priceMin!);
  }
  if (filters?.priceMax !== undefined) {
    results = results.filter(p => p.price <= filters.priceMax!);
  }

  // Filter by bedrooms
  if (filters?.bedrooms !== undefined) {
    results = results.filter(p => p.bedrooms >= filters.bedrooms!);
  }

  // Filter by bathrooms
  if (filters?.bathrooms !== undefined) {
    results = results.filter(p => p.bathrooms >= filters.bathrooms!);
  }

  // Filter by city
  if (filters?.city) {
    results = results.filter(p =>
      p.address.city.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }

  // Filter by square footage
  if (filters?.sqftMin !== undefined) {
    results = results.filter(p => p.sqft >= filters.sqftMin!);
  }
  if (filters?.sqftMax !== undefined) {
    results = results.filter(p => p.sqft <= filters.sqftMax!);
  }

  return results;
}

/**
 * Get featured properties
 */
export async function getFeaturedProperties(): Promise<Property[]> {
  const properties = await loadProperties();
  return properties.filter(p => p.status === 'for-sale').slice(0, 5);
}

/**
 * Get recently viewed properties
 */
export async function getRecentlyViewedProperties(): Promise<Property[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.VIEWED_PROPERTIES);
    const viewedIds: string[] = stored ? JSON.parse(stored) : [];

    const properties = await loadProperties();
    return viewedIds
      .map(id => properties.find(p => p.id === id))
      .filter((p): p is Property => p !== undefined);
  } catch (error) {
    console.error('Failed to get recently viewed:', error);
    return [];
  }
}

/**
 * Track viewed property
 */
async function trackViewedProperty(propertyId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.VIEWED_PROPERTIES);
    let viewed: string[] = stored ? JSON.parse(stored) : [];

    // Remove if exists, add to front
    viewed = viewed.filter(id => id !== propertyId);
    viewed.unshift(propertyId);
    viewed = viewed.slice(0, 20); // Keep last 20

    await AsyncStorage.setItem(STORAGE_KEYS.VIEWED_PROPERTIES, JSON.stringify(viewed));
  } catch (error) {
    console.error('Failed to track viewed property:', error);
  }
}

/**
 * Toggle favorite property
 */
export async function toggleFavorite(propertyId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    let favorites: string[] = stored ? JSON.parse(stored) : [];

    const index = favorites.indexOf(propertyId);
    if (index >= 0) {
      favorites.splice(index, 1);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      return false; // Removed
    } else {
      favorites.push(propertyId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      return true; // Added
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return false;
  }
}

/**
 * Get favorite property IDs
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
 * Get favorite properties
 */
export async function getFavoriteProperties(): Promise<Property[]> {
  const favoriteIds = await getFavorites();
  const properties = await loadProperties();
  return properties.filter(p => favoriteIds.includes(p.id));
}

/**
 * Save a search
 */
export async function saveSearch(
  name: string,
  filters: Record<string, unknown>
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES);
    const searches: Array<{ id: string; name: string; filters: Record<string, unknown> }> =
      stored ? JSON.parse(stored) : [];

    searches.unshift({
      id: `search-${Date.now()}`,
      name,
      filters,
    });

    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(searches));
  } catch (error) {
    console.error('Failed to save search:', error);
  }
}

/**
 * Get saved searches
 */
export async function getSavedSearches(): Promise<
  Array<{ id: string; name: string; filters: Record<string, unknown> }>
> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get saved searches:', error);
    return [];
  }
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(searchId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES);
    const searches: Array<{ id: string; name: string; filters: Record<string, unknown> }> =
      stored ? JSON.parse(stored) : [];

    const filtered = searches.filter(s => s.id !== searchId);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete saved search:', error);
  }
}

/**
 * Save search history
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
 * Submit property inquiry
 */
export async function submitInquiry(
  propertyId: string,
  message: string,
  contactInfo: { name: string; email: string; phone?: string }
): Promise<{ success: boolean; inquiryId: string }> {
  const inquiry = {
    id: `inquiry-${Date.now()}`,
    propertyId,
    message,
    ...contactInfo,
    timestamp: new Date().toISOString(),
  };

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.INQUIRIES);
    const inquiries: Array<typeof inquiry> = stored ? JSON.parse(stored) : [];
    inquiries.push(inquiry);
    await AsyncStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));

    return { success: true, inquiryId: inquiry.id };
  } catch (error) {
    console.error('Failed to submit inquiry:', error);
    return { success: false, inquiryId: '' };
  }
}

/**
 * Get agent by ID
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  return MOCK_AGENTS.find(a => a.id === id) || null;
}

/**
 * Get all agents
 */
export async function getAgents(): Promise<Agent[]> {
  return [...MOCK_AGENTS];
}

/**
 * Calculate mortgage estimate
 */
export function calculateMortgage(
  price: number,
  downPaymentPercent: number = 20,
  interestRate: number = 7.0,
  loanTermYears: number = 30
): {
  monthlyPayment: number;
  downPayment: number;
  loanAmount: number;
  totalInterest: number;
} {
  const downPayment = price * (downPaymentPercent / 100);
  const loanAmount = price - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTermYears * 12;

  const monthlyPayment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  const totalPayments = monthlyPayment * numPayments;
  const totalInterest = totalPayments - loanAmount;

  return {
    monthlyPayment: Math.round(monthlyPayment),
    downPayment: Math.round(downPayment),
    loanAmount: Math.round(loanAmount),
    totalInterest: Math.round(totalInterest),
  };
}

/**
 * Format price
 */
export function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${CURRENCY}${(price / 1000000).toFixed(1)}M`;
  }
  return `${CURRENCY}${price.toLocaleString()}`;
}

/**
 * Get real estate configuration
 */
export function getRealEstateConfig() {
  return {
    agencyName: AGENCY_NAME,
    defaultCity: DEFAULT_CITY,
    currency: CURRENCY,
    contactPhone: CONTACT_PHONE,
  };
}

/**
 * Clear all real estate data (for testing)
 */
export async function clearRealEstateData(): Promise<void> {
  cachedProperties = null;
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES),
    AsyncStorage.removeItem(STORAGE_KEYS.SAVED_SEARCHES),
    AsyncStorage.removeItem(STORAGE_KEYS.VIEWED_PROPERTIES),
    AsyncStorage.removeItem(STORAGE_KEYS.INQUIRIES),
    AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY),
  ]);
}
