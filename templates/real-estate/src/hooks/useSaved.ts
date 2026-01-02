import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SavedState {
  savedPropertyIds: string[];
  addSaved: (propertyId: string) => void;
  removeSaved: (propertyId: string) => void;
  isSaved: (propertyId: string) => boolean;
  clearSaved: () => void;
}

export const useSaved = create<SavedState>()(
  persist(
    (set, get) => ({
      savedPropertyIds: [],

      addSaved: (propertyId: string) =>
        set((state) => ({
          savedPropertyIds: [...state.savedPropertyIds, propertyId],
        })),

      removeSaved: (propertyId: string) =>
        set((state) => ({
          savedPropertyIds: state.savedPropertyIds.filter((id) => id !== propertyId),
        })),

      isSaved: (propertyId: string) =>
        get().savedPropertyIds.includes(propertyId),

      clearSaved: () => set({ savedPropertyIds: [] }),
    }),
    {
      name: 'saved-properties',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
