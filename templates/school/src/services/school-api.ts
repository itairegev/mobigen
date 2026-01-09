/**
 * School Service - Student grades, assignments, and calendar
 *
 * Configuration:
 * - EXPO_PUBLIC_SCHOOL_NAME: Name of the school
 * - EXPO_PUBLIC_SCHOOL_YEAR: Current school year
 * - EXPO_PUBLIC_GRADING_SCALE: Grading scale type (letter, percentage)
 * - EXPO_PUBLIC_ENABLE_NOTIFICATIONS: Enable push notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Grade, Subject, Assignment, CalendarEvent, Announcement, SubjectGradesSummary, LetterGrade } from '../types';
import { MOCK_GRADES, getSubjectGradesSummary, calculateGPA } from './grades';
import { MOCK_SUBJECTS } from './subjects';
import { MOCK_ASSIGNMENTS } from './assignments';
import { MOCK_CALENDAR_EVENTS } from './calendar';
import { MOCK_ANNOUNCEMENTS } from './announcements';

// Configuration
const SCHOOL_NAME = process.env.EXPO_PUBLIC_SCHOOL_NAME || 'Springfield High School';
const SCHOOL_YEAR = process.env.EXPO_PUBLIC_SCHOOL_YEAR || '2024-2025';
const GRADING_SCALE = process.env.EXPO_PUBLIC_GRADING_SCALE || 'letter';
const ENABLE_NOTIFICATIONS = process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS !== 'false';

// Storage keys
const STORAGE_KEYS = {
  COMPLETED_ASSIGNMENTS: '@school/completedAssignments',
  CALENDAR_EVENTS: '@school/calendarEvents',
  NOTIFICATIONS: '@school/notifications',
  STUDENT_PROFILE: '@school/studentProfile',
  STUDY_SESSIONS: '@school/studySessions',
};

// Interfaces
interface StudentProfile {
  id: string;
  name: string;
  email: string;
  grade: string;
  studentId: string;
}

interface StudySession {
  id: string;
  subjectId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // minutes
}

/**
 * Get all grades
 */
export async function getGrades(): Promise<Grade[]> {
  return [...MOCK_GRADES].sort(
    (a, b) => new Date(b.gradedDate).getTime() - new Date(a.gradedDate).getTime()
  );
}

/**
 * Get grades by subject
 */
export async function getGradesBySubject(subjectId: string): Promise<Grade[]> {
  return MOCK_GRADES.filter(g => g.subjectId === subjectId).sort(
    (a, b) => new Date(b.gradedDate).getTime() - new Date(a.gradedDate).getTime()
  );
}

/**
 * Get subject grades summary
 */
export async function getSubjectSummaries(): Promise<SubjectGradesSummary[]> {
  return getSubjectGradesSummary();
}

/**
 * Get GPA
 */
export async function getGPA(): Promise<number> {
  return calculateGPA();
}

/**
 * Get all subjects
 */
export async function getSubjects(): Promise<Subject[]> {
  return [...MOCK_SUBJECTS];
}

/**
 * Get subject by ID
 */
export async function getSubjectById(id: string): Promise<Subject | null> {
  return MOCK_SUBJECTS.find(s => s.id === id) || null;
}

/**
 * Get assignments with optional filters
 */
export async function getAssignments(filter?: {
  subjectId?: string;
  status?: 'upcoming' | 'overdue' | 'completed';
}): Promise<Assignment[]> {
  let assignments = [...MOCK_ASSIGNMENTS];

  if (filter?.subjectId) {
    assignments = assignments.filter(a => a.subjectId === filter.subjectId);
  }

  // Check completed status from storage
  const completedIds = await getCompletedAssignments();
  const now = new Date();

  if (filter?.status === 'completed') {
    assignments = assignments.filter(a => completedIds.includes(a.id));
  } else if (filter?.status === 'upcoming') {
    assignments = assignments.filter(a =>
      !completedIds.includes(a.id) && new Date(a.dueDate) >= now
    );
  } else if (filter?.status === 'overdue') {
    assignments = assignments.filter(a =>
      !completedIds.includes(a.id) && new Date(a.dueDate) < now
    );
  }

  return assignments.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

/**
 * Get assignment by ID
 */
export async function getAssignmentById(id: string): Promise<Assignment | null> {
  return MOCK_ASSIGNMENTS.find(a => a.id === id) || null;
}

/**
 * Mark assignment as completed
 */
export async function markAssignmentCompleted(assignmentId: string): Promise<boolean> {
  try {
    const completed = await getCompletedAssignments();

    if (completed.includes(assignmentId)) {
      // Already completed
      return true;
    }

    completed.push(assignmentId);
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_ASSIGNMENTS, JSON.stringify(completed));
    return true;
  } catch (error) {
    console.error('Failed to mark assignment completed:', error);
    return false;
  }
}

/**
 * Get completed assignment IDs
 */
export async function getCompletedAssignments(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_ASSIGNMENTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get completed assignments:', error);
    return [];
  }
}

/**
 * Get upcoming assignments (next 7 days)
 */
export async function getUpcomingAssignments(): Promise<Assignment[]> {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const completedIds = await getCompletedAssignments();

  return MOCK_ASSIGNMENTS.filter(a => {
    const dueDate = new Date(a.dueDate);
    return !completedIds.includes(a.id) && dueDate >= now && dueDate <= nextWeek;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/**
 * Get overdue assignments
 */
export async function getOverdueAssignments(): Promise<Assignment[]> {
  const now = new Date();
  const completedIds = await getCompletedAssignments();

  return MOCK_ASSIGNMENTS.filter(a =>
    !completedIds.includes(a.id) && new Date(a.dueDate) < now
  ).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
}

/**
 * Get calendar events
 */
export async function getCalendarEvents(month?: number, year?: number): Promise<CalendarEvent[]> {
  let events = [...MOCK_CALENDAR_EVENTS];

  // Load custom events from storage
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CALENDAR_EVENTS);
    const customEvents: CalendarEvent[] = stored ? JSON.parse(stored) : [];
    events = [...events, ...customEvents];
  } catch (error) {
    console.error('Failed to load custom events:', error);
  }

  // Filter by month/year if provided
  if (month !== undefined && year !== undefined) {
    events = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Add custom calendar event
 */
export async function addCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  const newEvent: CalendarEvent = {
    ...event,
    id: `event-${Date.now()}`,
  };

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CALENDAR_EVENTS);
    const events: CalendarEvent[] = stored ? JSON.parse(stored) : [];
    events.push(newEvent);
    await AsyncStorage.setItem(STORAGE_KEYS.CALENDAR_EVENTS, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to add calendar event:', error);
    throw error;
  }

  return newEvent;
}

/**
 * Get announcements
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  return [...MOCK_ANNOUNCEMENTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get today's schedule
 */
export async function getTodaySchedule(): Promise<CalendarEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  const events = await getCalendarEvents();

  return events.filter(e => e.date.startsWith(today)).sort(
    (a, b) => {
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return 0;
    }
  );
}

/**
 * Start a study session
 */
export async function startStudySession(subjectId: string): Promise<StudySession> {
  const session: StudySession = {
    id: `study-${Date.now()}`,
    subjectId,
    startTime: new Date().toISOString(),
  };

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
    const sessions: StudySession[] = stored ? JSON.parse(stored) : [];
    sessions.push(session);
    await AsyncStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to start study session:', error);
    throw error;
  }

  return session;
}

/**
 * End a study session
 */
export async function endStudySession(sessionId: string): Promise<StudySession> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
    const sessions: StudySession[] = stored ? JSON.parse(stored) : [];

    const session = sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    const endTime = new Date();
    const startTime = new Date(session.startTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    session.endTime = endTime.toISOString();
    session.duration = duration;

    await AsyncStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
    return session;
  } catch (error) {
    console.error('Failed to end study session:', error);
    throw error;
  }
}

/**
 * Get study time by subject (total minutes)
 */
export async function getStudyTimeBySubject(): Promise<Record<string, number>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
    const sessions: StudySession[] = stored ? JSON.parse(stored) : [];

    const studyTime: Record<string, number> = {};
    for (const session of sessions) {
      if (session.duration) {
        studyTime[session.subjectId] = (studyTime[session.subjectId] || 0) + session.duration;
      }
    }

    return studyTime;
  } catch (error) {
    console.error('Failed to get study time:', error);
    return {};
  }
}

/**
 * Get student profile
 */
export async function getStudentProfile(): Promise<StudentProfile | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.STUDENT_PROFILE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get student profile:', error);
    return null;
  }
}

/**
 * Set student profile
 */
export async function setStudentProfile(profile: StudentProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to set student profile:', error);
    throw error;
  }
}

/**
 * Get school configuration
 */
export function getSchoolConfig() {
  return {
    schoolName: SCHOOL_NAME,
    schoolYear: SCHOOL_YEAR,
    gradingScale: GRADING_SCALE,
    notificationsEnabled: ENABLE_NOTIFICATIONS,
  };
}

/**
 * Get recent activity (grades, assignments)
 */
export async function getRecentActivity(): Promise<Array<{
  type: 'grade' | 'assignment';
  item: Grade | Assignment;
  date: Date;
}>> {
  const grades = await getGrades();
  const assignments = await getUpcomingAssignments();

  const activity: Array<{ type: 'grade' | 'assignment'; item: Grade | Assignment; date: Date }> = [];

  // Add recent grades
  for (const grade of grades.slice(0, 5)) {
    activity.push({
      type: 'grade',
      item: grade,
      date: new Date(grade.gradedDate),
    });
  }

  // Add upcoming assignments
  for (const assignment of assignments.slice(0, 5)) {
    activity.push({
      type: 'assignment',
      item: assignment,
      date: new Date(assignment.dueDate),
    });
  }

  return activity.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Clear all school data (for testing)
 */
export async function clearSchoolData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.COMPLETED_ASSIGNMENTS),
    AsyncStorage.removeItem(STORAGE_KEYS.CALENDAR_EVENTS),
    AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS),
    AsyncStorage.removeItem(STORAGE_KEYS.STUDENT_PROFILE),
    AsyncStorage.removeItem(STORAGE_KEYS.STUDY_SESSIONS),
  ]);
}
