/**
 * Booking Service - Persistent appointments and availability
 *
 * Configuration:
 * - EXPO_PUBLIC_BUSINESS_NAME: Name of the business
 * - EXPO_PUBLIC_BUSINESS_HOURS_START: Opening time (default: '09:00')
 * - EXPO_PUBLIC_BUSINESS_HOURS_END: Closing time (default: '18:00')
 * - EXPO_PUBLIC_SLOT_INTERVAL: Time slot interval in minutes (default: 30)
 * - EXPO_PUBLIC_BOOKING_BUFFER: Minutes between appointments (default: 15)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format, parse, isBefore, isAfter, addMinutes } from 'date-fns';
import type { Appointment, TimeSlot, Service, Staff } from '@/types';
import { MOCK_SERVICES } from './services';
import { MOCK_STAFF } from './staff';

// Configuration
const BUSINESS_NAME = process.env.EXPO_PUBLIC_BUSINESS_NAME || 'Wellness Spa';
const HOURS_START = process.env.EXPO_PUBLIC_BUSINESS_HOURS_START || '09:00';
const HOURS_END = process.env.EXPO_PUBLIC_BUSINESS_HOURS_END || '18:00';
const SLOT_INTERVAL = parseInt(process.env.EXPO_PUBLIC_SLOT_INTERVAL || '30');
const BOOKING_BUFFER = parseInt(process.env.EXPO_PUBLIC_BOOKING_BUFFER || '15');

// Storage keys
const STORAGE_KEYS = {
  APPOINTMENTS: '@booking/appointments',
  LAST_SYNC: '@booking/lastSync',
};

// In-memory cache with persistence
let cachedAppointments: Appointment[] | null = null;

/**
 * Initialize appointments from storage
 */
async function loadAppointments(): Promise<Appointment[]> {
  if (cachedAppointments) {
    return cachedAppointments;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Restore Date objects
      cachedAppointments = parsed.map((apt: Appointment & { createdAt: string }) => ({
        ...apt,
        createdAt: new Date(apt.createdAt),
      }));
      return cachedAppointments;
    }
  } catch (error) {
    console.error('Failed to load appointments:', error);
  }

  // Return mock data as starting point
  cachedAppointments = generateInitialAppointments();
  await saveAppointments(cachedAppointments);
  return cachedAppointments;
}

/**
 * Save appointments to storage
 */
async function saveAppointments(appointments: Appointment[]): Promise<void> {
  cachedAppointments = appointments;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  } catch (error) {
    console.error('Failed to save appointments:', error);
  }
}

/**
 * Generate initial mock appointments
 */
function generateInitialAppointments(): Appointment[] {
  const now = new Date();
  return [
    {
      id: 'apt-1',
      serviceId: '1',
      staffId: '1',
      date: format(addDays(now, 2), 'yyyy-MM-dd'),
      startTime: '10:00',
      endTime: '11:00',
      status: 'upcoming',
      notes: 'First visit',
      createdAt: new Date(),
    },
    {
      id: 'apt-2',
      serviceId: '4',
      staffId: '3',
      date: format(addDays(now, 5), 'yyyy-MM-dd'),
      startTime: '14:00',
      endTime: '15:00',
      status: 'upcoming',
      createdAt: new Date(),
    },
    {
      id: 'apt-3',
      serviceId: '2',
      staffId: '2',
      date: format(addDays(now, -3), 'yyyy-MM-dd'),
      startTime: '11:00',
      endTime: '11:45',
      status: 'completed',
      createdAt: addDays(now, -10),
    },
  ];
}

/**
 * Parse time string to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

/**
 * Format minutes from midnight to time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Generate available time slots for a staff member on a date
 */
export async function getAvailableSlots(
  staffId: string,
  date: string,
  serviceDuration: number = 60
): Promise<TimeSlot[]> {
  const appointments = await loadAppointments();
  const slots: TimeSlot[] = [];

  const startMinutes = timeToMinutes(HOURS_START);
  const endMinutes = timeToMinutes(HOURS_END);

  // Get booked slots for this staff and date
  const bookedSlots = appointments.filter(
    apt => apt.staffId === staffId &&
           apt.date === date &&
           apt.status !== 'cancelled'
  );

  // Generate slots at interval
  let currentMinutes = startMinutes;
  let slotIndex = 0;

  while (currentMinutes + serviceDuration <= endMinutes) {
    const slotStart = minutesToTime(currentMinutes);
    const slotEnd = minutesToTime(currentMinutes + serviceDuration);

    // Check if this slot overlaps with any booking
    const isBooked = bookedSlots.some(apt => {
      const aptStart = timeToMinutes(apt.startTime);
      const aptEnd = timeToMinutes(apt.endTime);
      const slotStartMins = currentMinutes;
      const slotEndMins = currentMinutes + serviceDuration;

      // Slots overlap if one starts before the other ends
      return slotStartMins < aptEnd && slotEndMins > aptStart;
    });

    // Check if slot is in the past
    const slotDateTime = parse(`${date} ${slotStart}`, 'yyyy-MM-dd HH:mm', new Date());
    const isPast = isBefore(slotDateTime, new Date());

    slots.push({
      id: `${staffId}-${date}-${slotIndex}`,
      staffId,
      date,
      startTime: slotStart,
      endTime: slotEnd,
      available: !isBooked && !isPast,
    });

    currentMinutes += SLOT_INTERVAL;
    slotIndex++;
  }

  return slots;
}

/**
 * Get all appointments
 */
export async function getAppointments(): Promise<Appointment[]> {
  const appointments = await loadAppointments();

  // Update status of past appointments
  const now = new Date();
  const updated = appointments.map(apt => {
    if (apt.status === 'upcoming') {
      const aptDate = parse(`${apt.date} ${apt.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
      if (isBefore(aptDate, now)) {
        return { ...apt, status: 'completed' as const };
      }
    }
    return apt;
  });

  // Save if any status changed
  if (JSON.stringify(updated) !== JSON.stringify(appointments)) {
    await saveAppointments(updated);
  }

  // Sort by date and status
  return updated.sort((a, b) => {
    if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
    if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const appointments = await loadAppointments();
  return appointments.find(apt => apt.id === id) || null;
}

/**
 * Get upcoming appointments
 */
export async function getUpcomingAppointments(): Promise<Appointment[]> {
  const appointments = await getAppointments();
  return appointments
    .filter(apt => apt.status === 'upcoming')
    .sort((a, b) => {
      const dateA = parse(`${a.date} ${a.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const dateB = parse(`${b.date} ${b.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
      return dateA.getTime() - dateB.getTime();
    });
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  appointment: Omit<Appointment, 'id' | 'createdAt'>
): Promise<Appointment> {
  const appointments = await loadAppointments();

  // Verify slot is still available
  const service = MOCK_SERVICES.find(s => s.id === appointment.serviceId);
  const slots = await getAvailableSlots(
    appointment.staffId,
    appointment.date,
    service?.duration || 60
  );

  const requestedSlot = slots.find(s =>
    s.startTime === appointment.startTime &&
    s.available
  );

  if (!requestedSlot) {
    throw new Error('This time slot is no longer available');
  }

  const newAppointment: Appointment = {
    ...appointment,
    id: `apt-${Date.now()}`,
    createdAt: new Date(),
  };

  appointments.push(newAppointment);
  await saveAppointments(appointments);

  return newAppointment;
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(id: string): Promise<void> {
  const appointments = await loadAppointments();
  const index = appointments.findIndex(apt => apt.id === id);

  if (index === -1) {
    throw new Error('Appointment not found');
  }

  appointments[index].status = 'cancelled';
  await saveAppointments(appointments);
}

/**
 * Reschedule an appointment
 */
export async function rescheduleAppointment(
  id: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string
): Promise<Appointment> {
  const appointments = await loadAppointments();
  const index = appointments.findIndex(apt => apt.id === id);

  if (index === -1) {
    throw new Error('Appointment not found');
  }

  const appointment = appointments[index];

  // Verify new slot is available
  const service = MOCK_SERVICES.find(s => s.id === appointment.serviceId);
  const slots = await getAvailableSlots(
    appointment.staffId,
    newDate,
    service?.duration || 60
  );

  const requestedSlot = slots.find(s =>
    s.startTime === newStartTime &&
    s.available
  );

  if (!requestedSlot) {
    throw new Error('This time slot is not available');
  }

  appointments[index] = {
    ...appointment,
    date: newDate,
    startTime: newStartTime,
    endTime: newEndTime,
  };

  await saveAppointments(appointments);
  return appointments[index];
}

/**
 * Get staff available on a specific date for a service
 */
export async function getAvailableStaff(
  serviceId: string,
  date: string
): Promise<Staff[]> {
  const service = MOCK_SERVICES.find(s => s.id === serviceId);
  if (!service) return [];

  const availableStaff: Staff[] = [];

  for (const staff of MOCK_STAFF) {
    if (!staff.serviceIds.includes(serviceId)) continue;
    if (!staff.available) continue;

    // Check if staff has any available slots
    const slots = await getAvailableSlots(staff.id, date, service.duration);
    const hasAvailableSlots = slots.some(s => s.available);

    if (hasAvailableSlots) {
      availableStaff.push(staff);
    }
  }

  return availableStaff;
}

/**
 * Get next available date for a service with a specific staff
 */
export async function getNextAvailableDate(
  serviceId: string,
  staffId: string,
  startFromDate: string = format(new Date(), 'yyyy-MM-dd')
): Promise<string | null> {
  const service = MOCK_SERVICES.find(s => s.id === serviceId);
  if (!service) return null;

  // Check next 30 days
  for (let i = 0; i < 30; i++) {
    const checkDate = format(addDays(new Date(startFromDate), i), 'yyyy-MM-dd');
    const slots = await getAvailableSlots(staffId, checkDate, service.duration);

    if (slots.some(s => s.available)) {
      return checkDate;
    }
  }

  return null;
}

/**
 * Clear all appointments (for testing)
 */
export async function clearAppointments(): Promise<void> {
  cachedAppointments = null;
  await AsyncStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
}

/**
 * Get business configuration
 */
export function getBookingConfig() {
  return {
    businessName: BUSINESS_NAME,
    hoursStart: HOURS_START,
    hoursEnd: HOURS_END,
    slotInterval: SLOT_INTERVAL,
    bookingBuffer: BOOKING_BUFFER,
  };
}

/**
 * Check if service booking is configured
 */
export function isBookingConfigured(): boolean {
  return !!BUSINESS_NAME;
}
