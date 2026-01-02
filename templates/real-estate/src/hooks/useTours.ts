import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tour } from '@/types';

interface ToursState {
  tours: Tour[];
  addTour: (tour: Omit<Tour, 'id' | 'status' | 'createdAt'>) => void;
  cancelTour: (tourId: string) => void;
  getToursByProperty: (propertyId: string) => Tour[];
}

export const useTours = create<ToursState>()(
  persist(
    (set, get) => ({
      tours: [],

      addTour: (tourData) => {
        const tour: Tour = {
          ...tourData,
          id: `tour-${Date.now()}`,
          status: 'pending',
          createdAt: new Date(),
        };
        set((state) => ({
          tours: [...state.tours, tour],
        }));
      },

      cancelTour: (tourId: string) =>
        set((state) => ({
          tours: state.tours.map((tour) =>
            tour.id === tourId ? { ...tour, status: 'cancelled' as const } : tour
          ),
        })),

      getToursByProperty: (propertyId: string) =>
        get().tours.filter((tour) => tour.propertyId === propertyId),
    }),
    {
      name: 'property-tours',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
