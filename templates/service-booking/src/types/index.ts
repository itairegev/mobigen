export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  image?: string;
  categoryId: string;
  staffIds: string[];
  available: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  sortOrder: number;
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  serviceIds: string[];
  available: boolean;
}

export interface TimeSlot {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  available: boolean;
}

export interface Appointment {
  id: string;
  serviceId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

export interface BookingState {
  serviceId: string | null;
  staffId: string | null;
  date: string | null;
  timeSlot: TimeSlot | null;
  notes: string;
}

export interface Review {
  id: string;
  appointmentId: string;
  staffId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  userName: string;
}
