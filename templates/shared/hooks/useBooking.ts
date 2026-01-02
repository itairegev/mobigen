import { useState } from 'react';
import { TimeSlot } from '../components/booking';

export interface BookingData {
  serviceId?: string;
  staffId?: string;
  date: Date | null;
  timeSlot: TimeSlot | null;
  notes?: string;
}

export interface UseBookingReturn {
  bookingData: BookingData;
  setService: (serviceId: string) => void;
  setStaff: (staffId: string) => void;
  setDate: (date: Date) => void;
  setTimeSlot: (slot: TimeSlot) => void;
  setNotes: (notes: string) => void;
  clearBooking: () => void;
  isComplete: boolean;
}

export function useBooking(): UseBookingReturn {
  const [bookingData, setBookingData] = useState<BookingData>({
    date: null,
    timeSlot: null,
  });

  const setService = (serviceId: string) => {
    setBookingData(prev => ({ ...prev, serviceId }));
  };

  const setStaff = (staffId: string) => {
    setBookingData(prev => ({ ...prev, staffId }));
  };

  const setDate = (date: Date) => {
    setBookingData(prev => ({ ...prev, date, timeSlot: null }));
  };

  const setTimeSlot = (timeSlot: TimeSlot) => {
    setBookingData(prev => ({ ...prev, timeSlot }));
  };

  const setNotes = (notes: string) => {
    setBookingData(prev => ({ ...prev, notes }));
  };

  const clearBooking = () => {
    setBookingData({
      date: null,
      timeSlot: null,
    });
  };

  const isComplete = !!(
    bookingData.serviceId &&
    bookingData.date &&
    bookingData.timeSlot
  );

  return {
    bookingData,
    setService,
    setStaff,
    setDate,
    setTimeSlot,
    setNotes,
    clearBooking,
    isComplete,
  };
}
