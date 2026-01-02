import { create } from 'zustand';
import type { BookingState, TimeSlot } from '@/types';

interface BookingStore extends BookingState {
  setService: (serviceId: string) => void;
  setStaff: (staffId: string) => void;
  setDate: (date: string) => void;
  setTimeSlot: (slot: TimeSlot) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
  canProceedToStaff: () => boolean;
  canProceedToDateTime: () => boolean;
  canProceedToConfirm: () => boolean;
}

const initialState: BookingState = {
  serviceId: null,
  staffId: null,
  date: null,
  timeSlot: null,
  notes: '',
};

export const useBooking = create<BookingStore>((set, get) => ({
  ...initialState,

  setService: (serviceId) => set({ serviceId }),
  setStaff: (staffId) => set({ staffId }),
  setDate: (date) => set({ date }),
  setTimeSlot: (timeSlot) => set({ timeSlot }),
  setNotes: (notes) => set({ notes }),
  reset: () => set(initialState),

  canProceedToStaff: () => {
    const { serviceId } = get();
    return serviceId !== null;
  },

  canProceedToDateTime: () => {
    const { serviceId, staffId } = get();
    return serviceId !== null && staffId !== null;
  },

  canProceedToConfirm: () => {
    const { serviceId, staffId, date, timeSlot } = get();
    return (
      serviceId !== null &&
      staffId !== null &&
      date !== null &&
      timeSlot !== null
    );
  },
}));
