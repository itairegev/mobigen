/**
 * Church Service - Bible verses, sermons, and ministry features
 *
 * Configuration:
 * - EXPO_PUBLIC_CHURCH_NAME: Name of the church
 * - EXPO_PUBLIC_BIBLE_VERSION: Bible version (default: 'web' - World English Bible)
 * - EXPO_PUBLIC_GIVING_URL: External giving/donation URL
 * - EXPO_PUBLIC_SERMON_PLAYLIST: YouTube playlist ID for sermons
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Sermon, Series, Prayer, Event, Group, Announcement } from '../types';
import { MOCK_SERMONS, MOCK_SERIES } from './sermons';
import { MOCK_EVENTS } from './events';
import { MOCK_PRAYERS } from './prayers';
import { MOCK_GROUPS } from './groups';
import { MOCK_ANNOUNCEMENTS } from './announcements';

// Configuration
const CHURCH_NAME = process.env.EXPO_PUBLIC_CHURCH_NAME || 'Our Church';
const BIBLE_VERSION = process.env.EXPO_PUBLIC_BIBLE_VERSION || 'web';
const GIVING_URL = process.env.EXPO_PUBLIC_GIVING_URL || '';
const SERMON_PLAYLIST = process.env.EXPO_PUBLIC_SERMON_PLAYLIST || '';

// Bible API (free, no key required)
const BIBLE_API_BASE = 'https://bible-api.com';

// Storage keys
const STORAGE_KEYS = {
  FAVORITE_VERSES: '@church/favoriteVerses',
  WATCHED_SERMONS: '@church/watchedSermons',
  SERMON_PROGRESS: '@church/sermonProgress',
  PRAYER_REQUESTS: '@church/prayerRequests',
  RSVP_EVENTS: '@church/rsvpEvents',
  JOINED_GROUPS: '@church/joinedGroups',
};

// Interfaces
interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
  verses?: Array<{ book_name: string; chapter: number; verse: number; text: string }>;
}

interface DailyVerse {
  reference: string;
  text: string;
  date: string;
}

// Cache for Bible verses
const verseCache: Map<string, BibleVerse> = new Map();

/**
 * Fetch a Bible verse or passage
 */
export async function getBibleVerse(reference: string): Promise<BibleVerse> {
  const cacheKey = `${reference}-${BIBLE_VERSION}`;

  if (verseCache.has(cacheKey)) {
    return verseCache.get(cacheKey)!;
  }

  try {
    const encodedRef = encodeURIComponent(reference);
    const response = await fetch(`${BIBLE_API_BASE}/${encodedRef}?translation=${BIBLE_VERSION}`);

    if (!response.ok) {
      throw new Error('Failed to fetch verse');
    }

    const data = await response.json();
    const verse: BibleVerse = {
      reference: data.reference,
      text: data.text.trim(),
      translation: data.translation_name || BIBLE_VERSION.toUpperCase(),
      verses: data.verses,
    };

    verseCache.set(cacheKey, verse);
    return verse;
  } catch (error) {
    console.error('Failed to fetch Bible verse:', error);
    // Return a default verse if API fails
    return {
      reference,
      text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
      translation: 'WEB',
    };
  }
}

/**
 * Get verse of the day
 */
export async function getVerseOfTheDay(): Promise<DailyVerse> {
  const today = new Date().toISOString().split('T')[0];

  // Daily verses rotation
  const dailyVerses = [
    'John 3:16',
    'Philippians 4:13',
    'Jeremiah 29:11',
    'Proverbs 3:5-6',
    'Isaiah 40:31',
    'Romans 8:28',
    'Psalm 23:1-4',
    'Matthew 11:28',
    'Joshua 1:9',
    'Psalm 46:10',
    '2 Timothy 1:7',
    'Psalm 91:1-2',
    'Romans 12:2',
    'Hebrews 11:1',
    '1 Corinthians 13:4-7',
    'Galatians 5:22-23',
    'Ephesians 6:10-11',
    'Psalm 119:105',
    'Matthew 6:33',
    'Isaiah 41:10',
    'Psalm 27:1',
    '2 Corinthians 5:17',
    'Philippians 4:6-7',
    'James 1:2-4',
    '1 Peter 5:7',
    'Proverbs 16:3',
    'Psalm 37:4',
    'Romans 5:8',
    'Psalm 139:14',
    'Colossians 3:23',
    'Matthew 28:19-20',
  ];

  // Get day of year to select verse
  const dayOfYear = Math.floor(
    (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const verseIndex = dayOfYear % dailyVerses.length;
  const reference = dailyVerses[verseIndex];

  const verse = await getBibleVerse(reference);

  return {
    reference: verse.reference,
    text: verse.text,
    date: today,
  };
}

/**
 * Get favorite verses
 */
export async function getFavoriteVerses(): Promise<BibleVerse[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_VERSES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get favorite verses:', error);
    return [];
  }
}

/**
 * Toggle favorite verse
 */
export async function toggleFavoriteVerse(verse: BibleVerse): Promise<boolean> {
  try {
    const favorites = await getFavoriteVerses();
    const index = favorites.findIndex(v => v.reference === verse.reference);

    if (index >= 0) {
      favorites.splice(index, 1);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_VERSES, JSON.stringify(favorites));
      return false; // Removed
    } else {
      favorites.unshift(verse);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_VERSES, JSON.stringify(favorites));
      return true; // Added
    }
  } catch (error) {
    console.error('Failed to toggle favorite verse:', error);
    return false;
  }
}

/**
 * Get all sermon series
 */
export async function getSeries(): Promise<Series[]> {
  return [...MOCK_SERIES];
}

/**
 * Get sermons by series
 */
export async function getSermonsBySeries(seriesId: string): Promise<Sermon[]> {
  return MOCK_SERMONS.filter(s => s.seriesId === seriesId);
}

/**
 * Get recent sermons
 */
export async function getRecentSermons(limit: number = 5): Promise<Sermon[]> {
  return [...MOCK_SERMONS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

/**
 * Get sermon by ID
 */
export async function getSermonById(id: string): Promise<Sermon | null> {
  return MOCK_SERMONS.find(s => s.id === id) || null;
}

/**
 * Mark sermon as watched
 */
export async function markSermonWatched(sermonId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.WATCHED_SERMONS);
    const watched: string[] = stored ? JSON.parse(stored) : [];

    if (!watched.includes(sermonId)) {
      watched.push(sermonId);
      await AsyncStorage.setItem(STORAGE_KEYS.WATCHED_SERMONS, JSON.stringify(watched));
    }
  } catch (error) {
    console.error('Failed to mark sermon watched:', error);
  }
}

/**
 * Get watched sermons
 */
export async function getWatchedSermons(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.WATCHED_SERMONS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get watched sermons:', error);
    return [];
  }
}

/**
 * Save sermon progress
 */
export async function saveSermonProgress(
  sermonId: string,
  progress: number
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SERMON_PROGRESS);
    const progressMap: Record<string, number> = stored ? JSON.parse(stored) : {};
    progressMap[sermonId] = progress;
    await AsyncStorage.setItem(STORAGE_KEYS.SERMON_PROGRESS, JSON.stringify(progressMap));
  } catch (error) {
    console.error('Failed to save sermon progress:', error);
  }
}

/**
 * Get sermon progress
 */
export async function getSermonProgress(sermonId: string): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SERMON_PROGRESS);
    const progressMap: Record<string, number> = stored ? JSON.parse(stored) : {};
    return progressMap[sermonId] || 0;
  } catch (error) {
    console.error('Failed to get sermon progress:', error);
    return 0;
  }
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(): Promise<Event[]> {
  const now = new Date();
  return MOCK_EVENTS.filter(e => new Date(e.date) >= now).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * RSVP to an event
 */
export async function rsvpToEvent(eventId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.RSVP_EVENTS);
    const rsvps: string[] = stored ? JSON.parse(stored) : [];

    if (rsvps.includes(eventId)) {
      // Cancel RSVP
      const filtered = rsvps.filter(id => id !== eventId);
      await AsyncStorage.setItem(STORAGE_KEYS.RSVP_EVENTS, JSON.stringify(filtered));
      return false;
    } else {
      // Add RSVP
      rsvps.push(eventId);
      await AsyncStorage.setItem(STORAGE_KEYS.RSVP_EVENTS, JSON.stringify(rsvps));
      return true;
    }
  } catch (error) {
    console.error('Failed to RSVP:', error);
    return false;
  }
}

/**
 * Get RSVP'd events
 */
export async function getRsvpEvents(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.RSVP_EVENTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get RSVPs:', error);
    return [];
  }
}

/**
 * Get prayer requests
 */
export async function getPrayerRequests(): Promise<Prayer[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PRAYER_REQUESTS);
    const userPrayers: Prayer[] = stored ? JSON.parse(stored) : [];
    return [...MOCK_PRAYERS, ...userPrayers].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Failed to get prayer requests:', error);
    return MOCK_PRAYERS;
  }
}

/**
 * Submit a prayer request
 */
export async function submitPrayerRequest(
  title: string,
  description: string,
  isAnonymous: boolean = false
): Promise<Prayer> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PRAYER_REQUESTS);
    const prayers: Prayer[] = stored ? JSON.parse(stored) : [];

    const newPrayer: Prayer = {
      id: `prayer-${Date.now()}`,
      title,
      description,
      author: isAnonymous ? 'Anonymous' : 'You',
      isAnonymous,
      prayerCount: 0,
      createdAt: new Date(),
    };

    prayers.unshift(newPrayer);
    await AsyncStorage.setItem(STORAGE_KEYS.PRAYER_REQUESTS, JSON.stringify(prayers));

    return newPrayer;
  } catch (error) {
    console.error('Failed to submit prayer request:', error);
    throw error;
  }
}

/**
 * Get ministry groups
 */
export async function getGroups(): Promise<Group[]> {
  return MOCK_GROUPS;
}

/**
 * Join a group
 */
export async function joinGroup(groupId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.JOINED_GROUPS);
    const joined: string[] = stored ? JSON.parse(stored) : [];

    if (joined.includes(groupId)) {
      const filtered = joined.filter(id => id !== groupId);
      await AsyncStorage.setItem(STORAGE_KEYS.JOINED_GROUPS, JSON.stringify(filtered));
      return false; // Left
    } else {
      joined.push(groupId);
      await AsyncStorage.setItem(STORAGE_KEYS.JOINED_GROUPS, JSON.stringify(joined));
      return true; // Joined
    }
  } catch (error) {
    console.error('Failed to join group:', error);
    return false;
  }
}

/**
 * Get announcements
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  return MOCK_ANNOUNCEMENTS.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get giving URL
 */
export function getGivingUrl(): string {
  return GIVING_URL;
}

/**
 * Get church configuration
 */
export function getChurchConfig() {
  return {
    name: CHURCH_NAME,
    bibleVersion: BIBLE_VERSION,
    hasGivingUrl: !!GIVING_URL,
    hasSermonPlaylist: !!SERMON_PLAYLIST,
  };
}

/**
 * Clear all church data (for testing)
 */
export async function clearChurchData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.FAVORITE_VERSES),
    AsyncStorage.removeItem(STORAGE_KEYS.WATCHED_SERMONS),
    AsyncStorage.removeItem(STORAGE_KEYS.SERMON_PROGRESS),
    AsyncStorage.removeItem(STORAGE_KEYS.PRAYER_REQUESTS),
    AsyncStorage.removeItem(STORAGE_KEYS.RSVP_EVENTS),
    AsyncStorage.removeItem(STORAGE_KEYS.JOINED_GROUPS),
  ]);
}
