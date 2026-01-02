// ============================================================================
// Mock Calendar Service
// ============================================================================

import type { CalendarEvent } from '../types';
import { MOCK_SUBJECTS } from './subjects';
import { MOCK_ASSIGNMENTS } from './assignments';

const now = new Date();
const getDateOffset = (days: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  // Regular class schedule
  {
    id: 'class-1',
    title: 'Algebra II',
    description: 'Period 1',
    date: getDateOffset(0),
    startTime: '08:00',
    endTime: '08:50',
    type: 'class',
    location: 'Room 204',
    subjectId: 'math-101',
    subjectName: 'Algebra II',
    color: MOCK_SUBJECTS[0].color,
    allDay: false,
    recurring: true,
  },
  {
    id: 'class-2',
    title: 'English Literature',
    description: 'Period 2',
    date: getDateOffset(0),
    startTime: '09:00',
    endTime: '09:50',
    type: 'class',
    location: 'Room 112',
    subjectId: 'eng-101',
    subjectName: 'English Literature',
    color: MOCK_SUBJECTS[1].color,
    allDay: false,
    recurring: true,
  },
  {
    id: 'class-3',
    title: 'Biology',
    description: 'Period 3',
    date: getDateOffset(0),
    startTime: '10:00',
    endTime: '10:50',
    type: 'class',
    location: 'Lab 301',
    subjectId: 'sci-101',
    subjectName: 'Biology',
    color: MOCK_SUBJECTS[2].color,
    allDay: false,
    recurring: true,
  },
  {
    id: 'class-4',
    title: 'World History',
    description: 'Period 4',
    date: getDateOffset(0),
    startTime: '11:00',
    endTime: '11:50',
    type: 'class',
    location: 'Room 218',
    subjectId: 'hist-101',
    subjectName: 'World History',
    color: MOCK_SUBJECTS[3].color,
    allDay: false,
    recurring: true,
  },
  {
    id: 'class-5',
    title: 'Computer Science',
    description: 'Period 5',
    date: getDateOffset(0),
    startTime: '13:00',
    endTime: '13:50',
    type: 'class',
    location: 'Lab 405',
    subjectId: 'cs-101',
    subjectName: 'Computer Science',
    color: MOCK_SUBJECTS[4].color,
    allDay: false,
    recurring: true,
  },
  {
    id: 'class-6',
    title: 'Physical Education',
    description: 'Period 6',
    date: getDateOffset(0),
    startTime: '14:00',
    endTime: '14:50',
    type: 'class',
    location: 'Gymnasium',
    subjectId: 'pe-101',
    subjectName: 'Physical Education',
    color: MOCK_SUBJECTS[5].color,
    allDay: false,
    recurring: true,
  },

  // Assignment deadlines (from assignments)
  {
    id: 'deadline-1',
    title: 'Quadratic Equations Due',
    description: MOCK_ASSIGNMENTS[0].description,
    date: MOCK_ASSIGNMENTS[0].dueDate,
    type: 'assignment-due',
    subjectId: MOCK_ASSIGNMENTS[0].subjectId,
    subjectName: MOCK_ASSIGNMENTS[0].subjectName,
    color: MOCK_ASSIGNMENTS[0].subjectColor,
    allDay: true,
  },
  {
    id: 'deadline-2',
    title: 'Reading Response Due',
    description: MOCK_ASSIGNMENTS[1].description,
    date: MOCK_ASSIGNMENTS[1].dueDate,
    type: 'assignment-due',
    subjectId: MOCK_ASSIGNMENTS[1].subjectId,
    subjectName: MOCK_ASSIGNMENTS[1].subjectName,
    color: MOCK_ASSIGNMENTS[1].subjectColor,
    allDay: true,
  },
  {
    id: 'deadline-3',
    title: 'Cell Structure Quiz',
    description: MOCK_ASSIGNMENTS[2].description,
    date: MOCK_ASSIGNMENTS[2].dueDate,
    type: 'test',
    subjectId: MOCK_ASSIGNMENTS[2].subjectId,
    subjectName: MOCK_ASSIGNMENTS[2].subjectName,
    color: MOCK_ASSIGNMENTS[2].subjectColor,
    allDay: false,
    startTime: '10:00',
    endTime: '10:50',
  },
  {
    id: 'deadline-4',
    title: 'World War II Exam',
    description: MOCK_ASSIGNMENTS[3].description,
    date: MOCK_ASSIGNMENTS[3].dueDate,
    type: 'test',
    subjectId: MOCK_ASSIGNMENTS[3].subjectId,
    subjectName: MOCK_ASSIGNMENTS[3].subjectName,
    color: MOCK_ASSIGNMENTS[3].subjectColor,
    allDay: false,
    startTime: '11:00',
    endTime: '12:00',
  },

  // School events
  {
    id: 'event-1',
    title: 'School Picture Day',
    description: 'Wear your best outfit!',
    date: getDateOffset(1),
    type: 'event',
    location: 'Main Hall',
    allDay: true,
    color: '#10b981',
  },
  {
    id: 'event-2',
    title: 'Science Fair',
    description: 'Annual science fair exhibition',
    date: getDateOffset(14),
    startTime: '09:00',
    endTime: '15:00',
    type: 'event',
    location: 'Gymnasium',
    allDay: false,
    color: '#3b82f6',
  },
  {
    id: 'event-3',
    title: 'Parent-Teacher Conferences',
    description: 'Sign up for your time slot',
    date: getDateOffset(7),
    startTime: '15:00',
    endTime: '19:00',
    type: 'meeting',
    location: 'Various Classrooms',
    allDay: false,
    color: '#f59e0b',
  },
  {
    id: 'event-4',
    title: 'Winter Break',
    description: 'School closed for winter break',
    date: getDateOffset(21),
    type: 'holiday',
    allDay: true,
    color: '#ef4444',
  },
  {
    id: 'event-5',
    title: 'Basketball Game',
    description: 'Home game vs. Riverside High',
    date: getDateOffset(5),
    startTime: '18:00',
    endTime: '20:00',
    type: 'event',
    location: 'Gymnasium',
    allDay: false,
    color: '#10b981',
  },
];

export async function getCalendarEvents(
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  let events = [...MOCK_CALENDAR_EVENTS];

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    events = events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= start && eventDate <= end;
    });
  }

  return events.sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;

    // Sort by start time if same date
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });
}

export async function getEventsByDate(date: string): Promise<CalendarEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return MOCK_CALENDAR_EVENTS.filter((e) => {
    const eventDate = new Date(e.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === targetDate.getTime();
  }).sort((a, b) => {
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });
}

export async function getUpcomingEvents(limit: number = 5): Promise<CalendarEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return MOCK_CALENDAR_EVENTS
    .filter((e) => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

export async function getEventsByType(type: string): Promise<CalendarEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return MOCK_CALENDAR_EVENTS.filter((e) => e.type === type);
}
