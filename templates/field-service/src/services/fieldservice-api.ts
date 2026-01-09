/**
 * Field Service Management - Job tracking, time entries, and client communication
 *
 * Configuration:
 * - EXPO_PUBLIC_COMPANY_NAME: Name of the service company
 * - EXPO_PUBLIC_ENABLE_GPS: Enable GPS tracking
 * - EXPO_PUBLIC_ENABLE_PHOTOS: Enable job photos
 * - EXPO_PUBLIC_DISPATCH_PHONE: Dispatch contact number
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Job, Client, TimeEntry, Photo, Conversation, JobStats } from '../types';
import { MOCK_JOBS, MOCK_CLIENTS, MOCK_TIME_ENTRIES, MOCK_CONVERSATIONS } from './jobs';

// Configuration
const COMPANY_NAME = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Field Services Co.';
const ENABLE_GPS = process.env.EXPO_PUBLIC_ENABLE_GPS !== 'false';
const ENABLE_PHOTOS = process.env.EXPO_PUBLIC_ENABLE_PHOTOS !== 'false';
const DISPATCH_PHONE = process.env.EXPO_PUBLIC_DISPATCH_PHONE || '';

// Storage keys
const STORAGE_KEYS = {
  JOBS: '@fieldservice/jobs',
  TIME_ENTRIES: '@fieldservice/timeEntries',
  JOB_PHOTOS: '@fieldservice/jobPhotos',
  JOB_NOTES: '@fieldservice/jobNotes',
  MESSAGES: '@fieldservice/messages',
  TECHNICIAN: '@fieldservice/technician',
  GPS_HISTORY: '@fieldservice/gpsHistory',
};

// In-memory cache
let cachedJobs: Job[] | null = null;
let cachedTimeEntries: TimeEntry[] | null = null;

/**
 * Initialize jobs from storage
 */
async function loadJobs(): Promise<Job[]> {
  if (cachedJobs) return cachedJobs;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.JOBS);
    if (stored) {
      cachedJobs = JSON.parse(stored);
      return cachedJobs;
    }
  } catch (error) {
    console.error('Failed to load jobs:', error);
  }

  cachedJobs = [...MOCK_JOBS];
  await saveJobs(cachedJobs);
  return cachedJobs;
}

/**
 * Save jobs to storage
 */
async function saveJobs(jobs: Job[]): Promise<void> {
  cachedJobs = jobs;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  } catch (error) {
    console.error('Failed to save jobs:', error);
  }
}

/**
 * Load time entries from storage
 */
async function loadTimeEntries(): Promise<TimeEntry[]> {
  if (cachedTimeEntries) return cachedTimeEntries;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
    if (stored) {
      cachedTimeEntries = JSON.parse(stored);
      return cachedTimeEntries;
    }
  } catch (error) {
    console.error('Failed to load time entries:', error);
  }

  cachedTimeEntries = [...MOCK_TIME_ENTRIES];
  await saveTimeEntries(cachedTimeEntries);
  return cachedTimeEntries;
}

/**
 * Save time entries to storage
 */
async function saveTimeEntries(entries: TimeEntry[]): Promise<void> {
  cachedTimeEntries = entries;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save time entries:', error);
  }
}

/**
 * Get jobs with optional filters
 */
export async function getJobs(filter?: {
  status?: string;
  date?: string;
  priority?: string;
}): Promise<Job[]> {
  let jobs = await loadJobs();

  if (filter?.status) {
    jobs = jobs.filter(job => job.status === filter.status);
  }

  if (filter?.date) {
    jobs = jobs.filter(job => job.scheduledDate === filter.date);
  }

  if (filter?.priority) {
    jobs = jobs.filter(job => job.priority === filter.priority);
  }

  return jobs.sort((a, b) => {
    // Sort by date and time
    const timeA = new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime();
    const timeB = new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime();
    return timeA - timeB;
  });
}

/**
 * Get job by ID
 */
export async function getJobById(id: string): Promise<Job | null> {
  const jobs = await loadJobs();
  return jobs.find(job => job.id === id) || null;
}

/**
 * Update job status
 */
export async function updateJobStatus(
  id: string,
  status: string,
  notes?: string
): Promise<Job> {
  const jobs = await loadJobs();
  const job = jobs.find(j => j.id === id);

  if (!job) throw new Error('Job not found');

  job.status = status as Job['status'];
  job.updatedAt = new Date().toISOString();

  if (status === 'completed') {
    job.completedAt = new Date().toISOString();
  }

  if (notes) {
    job.notes = notes;
  }

  await saveJobs(jobs);
  return job;
}

/**
 * Add notes to a job
 */
export async function addJobNotes(jobId: string, notes: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.JOB_NOTES);
    const notesMap: Record<string, string[]> = stored ? JSON.parse(stored) : {};

    if (!notesMap[jobId]) {
      notesMap[jobId] = [];
    }

    notesMap[jobId].push(JSON.stringify({
      text: notes,
      timestamp: new Date().toISOString(),
    }));

    await AsyncStorage.setItem(STORAGE_KEYS.JOB_NOTES, JSON.stringify(notesMap));

    // Also update the job's notes field
    const jobs = await loadJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      job.notes = job.notes ? `${job.notes}\n${notes}` : notes;
      await saveJobs(jobs);
    }
  } catch (error) {
    console.error('Failed to add notes:', error);
    throw error;
  }
}

/**
 * Get time entries for a job
 */
export async function getTimeEntries(jobId?: string): Promise<TimeEntry[]> {
  const entries = await loadTimeEntries();

  if (jobId) {
    return entries.filter(entry => entry.jobId === jobId);
  }

  return entries;
}

/**
 * Clock in to a job
 */
export async function clockIn(jobId: string, notes?: string): Promise<TimeEntry> {
  const entries = await loadTimeEntries();

  // Check if already clocked in
  const activeEntry = entries.find(e => e.jobId === jobId && !e.clockOut);
  if (activeEntry) {
    throw new Error('Already clocked in to this job');
  }

  const entry: TimeEntry = {
    id: `time-${Date.now()}`,
    jobId,
    technicianId: 'tech-001',
    clockIn: new Date().toISOString(),
    notes,
    createdAt: new Date().toISOString(),
  };

  entries.push(entry);
  await saveTimeEntries(entries);

  // Update job status to in-progress
  await updateJobStatus(jobId, 'in-progress');

  return entry;
}

/**
 * Clock out of a job
 */
export async function clockOut(entryId: string, notes?: string): Promise<TimeEntry> {
  const entries = await loadTimeEntries();
  const entry = entries.find(e => e.id === entryId);

  if (!entry) throw new Error('Time entry not found');
  if (entry.clockOut) throw new Error('Already clocked out');

  const clockOutTime = new Date();
  const clockInTime = new Date(entry.clockIn);
  const duration = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));

  entry.clockOut = clockOutTime.toISOString();
  entry.duration = duration;
  if (notes) entry.notes = notes;

  await saveTimeEntries(entries);
  return entry;
}

/**
 * Get active time entry (currently clocked in)
 */
export async function getActiveTimeEntry(): Promise<TimeEntry | null> {
  const entries = await loadTimeEntries();
  return entries.find(e => !e.clockOut) || null;
}

/**
 * Add photo to a job
 */
export async function addJobPhoto(
  jobId: string,
  photoUri: string,
  caption?: string
): Promise<Photo> {
  if (!ENABLE_PHOTOS) {
    throw new Error('Photos are disabled');
  }

  const photo: Photo = {
    id: `photo-${Date.now()}`,
    jobId,
    uri: photoUri,
    caption,
    timestamp: new Date().toISOString(),
  };

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.JOB_PHOTOS);
    const photos: Photo[] = stored ? JSON.parse(stored) : [];
    photos.push(photo);
    await AsyncStorage.setItem(STORAGE_KEYS.JOB_PHOTOS, JSON.stringify(photos));
  } catch (error) {
    console.error('Failed to add photo:', error);
    throw error;
  }

  return photo;
}

/**
 * Get photos for a job
 */
export async function getJobPhotos(jobId: string): Promise<Photo[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.JOB_PHOTOS);
    const photos: Photo[] = stored ? JSON.parse(stored) : [];
    return photos.filter(p => p.jobId === jobId);
  } catch (error) {
    console.error('Failed to get photos:', error);
    return [];
  }
}

/**
 * Get conversations
 */
export async function getConversations(): Promise<Conversation[]> {
  return [...MOCK_CONVERSATIONS].sort((a, b) =>
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );
}

/**
 * Send message to client
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<void> {
  // In production, this would send via API
  console.log('Sending message:', { conversationId, content });
}

/**
 * Get job statistics
 */
export async function getJobStats(): Promise<JobStats> {
  const jobs = await loadJobs();
  const entries = await loadTimeEntries();

  const today = new Date().toISOString().split('T')[0];
  const todayJobs = jobs.filter(job => job.scheduledDate === today);

  // Calculate total hours worked
  const totalMinutes = entries
    .filter(e => e.duration)
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  return {
    today: {
      total: todayJobs.length,
      completed: todayJobs.filter(j => j.status === 'completed').length,
      inProgress: todayJobs.filter(j => j.status === 'in-progress').length,
      scheduled: todayJobs.filter(j => j.status === 'scheduled').length,
    },
    week: {
      total: jobs.length,
      completed: jobs.filter(j => j.status === 'completed').length,
      hoursWorked: Math.round(totalMinutes / 60 * 10) / 10,
    },
    month: {
      total: jobs.length,
      completed: jobs.filter(j => j.status === 'completed').length,
      revenue: 12450, // Would come from actual calculations
    },
  };
}

/**
 * Get today's jobs
 */
export async function getTodayJobs(): Promise<Job[]> {
  const today = new Date().toISOString().split('T')[0];
  return getJobs({ date: today });
}

/**
 * Get upcoming jobs
 */
export async function getUpcomingJobs(days: number = 7): Promise<Job[]> {
  const jobs = await loadJobs();
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return jobs.filter(job => {
    const jobDate = new Date(job.scheduledDate);
    return jobDate >= now && jobDate <= futureDate;
  }).sort((a, b) => {
    const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
    const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Get clients
 */
export async function getClients(): Promise<Client[]> {
  return [...MOCK_CLIENTS];
}

/**
 * Get client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
  return MOCK_CLIENTS.find(c => c.id === id) || null;
}

/**
 * Record GPS location
 */
export async function recordGPSLocation(
  jobId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  if (!ENABLE_GPS) return;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.GPS_HISTORY);
    const history: Array<{
      jobId: string;
      latitude: number;
      longitude: number;
      timestamp: string;
    }> = stored ? JSON.parse(stored) : [];

    history.push({
      jobId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });

    // Keep last 1000 entries
    const trimmed = history.slice(-1000);
    await AsyncStorage.setItem(STORAGE_KEYS.GPS_HISTORY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to record GPS:', error);
  }
}

/**
 * Get field service configuration
 */
export function getFieldServiceConfig() {
  return {
    companyName: COMPANY_NAME,
    gpsEnabled: ENABLE_GPS,
    photosEnabled: ENABLE_PHOTOS,
    dispatchPhone: DISPATCH_PHONE,
  };
}

/**
 * Clear all field service data (for testing)
 */
export async function clearFieldServiceData(): Promise<void> {
  cachedJobs = null;
  cachedTimeEntries = null;
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.JOBS),
    AsyncStorage.removeItem(STORAGE_KEYS.TIME_ENTRIES),
    AsyncStorage.removeItem(STORAGE_KEYS.JOB_PHOTOS),
    AsyncStorage.removeItem(STORAGE_KEYS.JOB_NOTES),
    AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES),
    AsyncStorage.removeItem(STORAGE_KEYS.GPS_HISTORY),
  ]);
}
