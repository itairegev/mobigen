/**
 * Event Service - Conference/event sessions, speakers, and enrollment
 *
 * Configuration:
 * - EXPO_PUBLIC_EVENT_NAME: Name of the event
 * - EXPO_PUBLIC_EVENT_DATE: Event start date
 * - EXPO_PUBLIC_EVENT_VENUE: Venue name
 * - EXPO_PUBLIC_EVENT_TIMEZONE: Timezone (default: America/New_York)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, Speaker, Track, Sponsor, Attendee } from '@/types';
import { MOCK_SESSIONS, MOCK_TRACKS } from './sessions';
import { MOCK_SPEAKERS } from './speakers';
import { MOCK_SPONSORS } from './sponsors';

// Configuration
const EVENT_NAME = process.env.EXPO_PUBLIC_EVENT_NAME || 'Tech Conference 2026';
const EVENT_DATE = process.env.EXPO_PUBLIC_EVENT_DATE || '2026-03-15';
const EVENT_VENUE = process.env.EXPO_PUBLIC_EVENT_VENUE || 'Convention Center';
const EVENT_TIMEZONE = process.env.EXPO_PUBLIC_EVENT_TIMEZONE || 'America/New_York';

// Storage keys
const STORAGE_KEYS = {
  ENROLLED_SESSIONS: '@event/enrolledSessions',
  FAVORITED_SPEAKERS: '@event/favoritedSpeakers',
  ATTENDEE_PROFILE: '@event/attendeeProfile',
  NOTES: '@event/sessionNotes',
  SCHEDULE: '@event/mySchedule',
};

/**
 * Get all sessions
 */
export async function fetchSessions(): Promise<Session[]> {
  return [...MOCK_SESSIONS].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

/**
 * Get session by ID
 */
export async function fetchSessionById(id: string): Promise<Session | null> {
  return MOCK_SESSIONS.find(s => s.id === id) || null;
}

/**
 * Get sessions by track
 */
export async function fetchSessionsByTrack(trackId: string): Promise<Session[]> {
  return MOCK_SESSIONS.filter(s => s.trackId === trackId).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

/**
 * Get sessions by date
 */
export async function fetchSessionsByDate(date: string): Promise<Session[]> {
  return MOCK_SESSIONS.filter(s => s.startTime.startsWith(date)).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

/**
 * Get all tracks
 */
export async function fetchTracks(): Promise<Track[]> {
  return MOCK_TRACKS;
}

/**
 * Enroll in a session
 */
export async function enrollInSession(sessionId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = MOCK_SESSIONS.find(s => s.id === sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    if (session.enrolled >= session.capacity) {
      return { success: false, message: 'Session is full' };
    }

    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLED_SESSIONS);
    const enrolled: string[] = stored ? JSON.parse(stored) : [];

    if (enrolled.includes(sessionId)) {
      return { success: false, message: 'Already enrolled' };
    }

    // Check for time conflicts
    const enrolledSessions = MOCK_SESSIONS.filter(s => enrolled.includes(s.id));
    const hasConflict = enrolledSessions.some(s => {
      const newStart = new Date(session.startTime).getTime();
      const newEnd = new Date(session.endTime).getTime();
      const existingStart = new Date(s.startTime).getTime();
      const existingEnd = new Date(s.endTime).getTime();
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasConflict) {
      return { success: false, message: 'Time conflict with another enrolled session' };
    }

    enrolled.push(sessionId);
    await AsyncStorage.setItem(STORAGE_KEYS.ENROLLED_SESSIONS, JSON.stringify(enrolled));

    // Update mock data enrolled count
    session.enrolled++;

    return { success: true, message: 'Successfully enrolled' };
  } catch (error) {
    console.error('Failed to enroll:', error);
    return { success: false, message: 'Failed to enroll' };
  }
}

/**
 * Unenroll from a session
 */
export async function unenrollFromSession(sessionId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLED_SESSIONS);
    const enrolled: string[] = stored ? JSON.parse(stored) : [];

    const filtered = enrolled.filter(id => id !== sessionId);
    await AsyncStorage.setItem(STORAGE_KEYS.ENROLLED_SESSIONS, JSON.stringify(filtered));

    // Update mock data enrolled count
    const session = MOCK_SESSIONS.find(s => s.id === sessionId);
    if (session && session.enrolled > 0) {
      session.enrolled--;
    }

    return true;
  } catch (error) {
    console.error('Failed to unenroll:', error);
    return false;
  }
}

/**
 * Get enrolled session IDs
 */
export async function getEnrolledSessions(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLED_SESSIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get enrolled sessions:', error);
    return [];
  }
}

/**
 * Get my schedule (enrolled sessions)
 */
export async function getMySchedule(): Promise<Session[]> {
  const enrolledIds = await getEnrolledSessions();
  return MOCK_SESSIONS.filter(s => enrolledIds.includes(s.id)).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

/**
 * Get all speakers
 */
export async function fetchSpeakers(): Promise<Speaker[]> {
  return [...MOCK_SPEAKERS];
}

/**
 * Get speaker by ID
 */
export async function fetchSpeakerById(id: string): Promise<Speaker | null> {
  return MOCK_SPEAKERS.find(s => s.id === id) || null;
}

/**
 * Get speakers for a session
 */
export async function fetchSpeakersForSession(speakerIds: string[]): Promise<Speaker[]> {
  return MOCK_SPEAKERS.filter(s => speakerIds.includes(s.id));
}

/**
 * Toggle favorite speaker
 */
export async function toggleFavoriteSpeaker(speakerId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITED_SPEAKERS);
    let favorites: string[] = stored ? JSON.parse(stored) : [];

    const index = favorites.indexOf(speakerId);
    if (index >= 0) {
      favorites.splice(index, 1);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITED_SPEAKERS, JSON.stringify(favorites));
      return false; // Removed
    } else {
      favorites.push(speakerId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITED_SPEAKERS, JSON.stringify(favorites));
      return true; // Added
    }
  } catch (error) {
    console.error('Failed to toggle favorite speaker:', error);
    return false;
  }
}

/**
 * Get favorited speakers
 */
export async function getFavoriteSpeakers(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITED_SPEAKERS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get favorite speakers:', error);
    return [];
  }
}

/**
 * Get all sponsors
 */
export async function fetchSponsors(): Promise<Sponsor[]> {
  return MOCK_SPONSORS;
}

/**
 * Save session notes
 */
export async function saveSessionNotes(sessionId: string, notes: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
    const notesMap: Record<string, string> = stored ? JSON.parse(stored) : {};
    notesMap[sessionId] = notes;
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notesMap));
  } catch (error) {
    console.error('Failed to save notes:', error);
  }
}

/**
 * Get session notes
 */
export async function getSessionNotes(sessionId: string): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
    const notesMap: Record<string, string> = stored ? JSON.parse(stored) : {};
    return notesMap[sessionId] || '';
  } catch (error) {
    console.error('Failed to get notes:', error);
    return '';
  }
}

/**
 * Set attendee profile
 */
export async function setAttendeeProfile(profile: Attendee): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ATTENDEE_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to set attendee profile:', error);
  }
}

/**
 * Get attendee profile
 */
export async function getAttendeeProfile(): Promise<Attendee | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDEE_PROFILE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get attendee profile:', error);
    return null;
  }
}

/**
 * Search sessions
 */
export async function searchSessions(query: string): Promise<Session[]> {
  const lowerQuery = query.toLowerCase();
  return MOCK_SESSIONS.filter(
    s =>
      s.title.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.tags.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get upcoming sessions (next 24 hours)
 */
export async function getUpcomingSessions(): Promise<Session[]> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return MOCK_SESSIONS.filter(s => {
    const startTime = new Date(s.startTime);
    return startTime >= now && startTime <= tomorrow;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * Get event configuration
 */
export function getEventConfig() {
  return {
    name: EVENT_NAME,
    date: EVENT_DATE,
    venue: EVENT_VENUE,
    timezone: EVENT_TIMEZONE,
  };
}

/**
 * Get event dates (unique dates from sessions)
 */
export function getEventDates(): string[] {
  const dates = new Set<string>();
  for (const session of MOCK_SESSIONS) {
    dates.add(session.startTime.split('T')[0]);
  }
  return Array.from(dates).sort();
}

/**
 * Clear all event data (for testing)
 */
export async function clearEventData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.ENROLLED_SESSIONS),
    AsyncStorage.removeItem(STORAGE_KEYS.FAVORITED_SPEAKERS),
    AsyncStorage.removeItem(STORAGE_KEYS.ATTENDEE_PROFILE),
    AsyncStorage.removeItem(STORAGE_KEYS.NOTES),
    AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULE),
  ]);
}
