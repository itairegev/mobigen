import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';
import type { JobStatus, JobPriority } from '../types';

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return 'Today';
  }

  if (isTomorrow(date)) {
    return 'Tomorrow';
  }

  return format(date, 'MMM d, yyyy');
}

/**
 * Format time for display (24h to 12h)
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format datetime range
 */
export function formatDateTimeRange(
  date: string,
  startTime: string,
  duration: number
): string {
  const dateStr = formatDate(date);
  const timeStr = formatTime(startTime);
  return `${dateStr} at ${timeStr} (${duration} min)`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

/**
 * Format duration in minutes to readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Get status display label
 */
export function getStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    scheduled: 'Scheduled',
    'en-route': 'En Route',
    'in-progress': 'In Progress',
    'on-hold': 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

/**
 * Get priority display label
 */
export function getPriorityLabel(priority: JobPriority): string {
  const labels: Record<JobPriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[priority];
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate elapsed time from clock in
 */
export function calculateElapsedTime(clockInTime: string): number {
  const clockIn = new Date(clockInTime).getTime();
  const now = Date.now();
  return Math.floor((now - clockIn) / (1000 * 60)); // minutes
}

/**
 * Format elapsed time for timer display
 */
export function formatElapsedTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
