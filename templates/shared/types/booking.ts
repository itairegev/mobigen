/**
 * Booking-related types
 */

import { BaseEntity } from './common';

export interface Service extends BaseEntity {
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  image?: string;
  categoryId: string;
  staffIds: string[];
  available: boolean;
}

export interface Staff extends BaseEntity {
  name: string;
  title: string;
  avatar: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  serviceIds: string[];
  availability: StaffAvailability[];
}

export interface StaffAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface TimeSlot {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  available: boolean;
}

export interface Appointment extends BaseEntity {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  price: number;
  reminderSent?: boolean;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface BookingRequest {
  serviceId: string;
  staffId?: string;
  date: string;
  timeSlotId: string;
  notes?: string;
}

export interface BookingConfirmation {
  appointmentId: string;
  confirmationCode: string;
  service: Service;
  staff: Staff;
  date: string;
  time: string;
  location?: string;
  price: number;
}
