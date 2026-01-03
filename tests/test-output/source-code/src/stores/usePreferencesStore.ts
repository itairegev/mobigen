import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPreferences } from '@/types';

interface PreferencesStore extends Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  preferredCategories: ['technology', 'ai', 'mobile'],
  notificationsEnabled: true,
  darkModeEnabled: false,
  readingSpeed: 200,
  fontSize: 'medium',
  autoDownload: false,
  lastSyncAt: undefined,
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      
      updatePreferences: (preferences: Partial<UserPreferences>) => {
        set(state => ({
          ...state,
          ...preferences,
        }));
      },
      
      resetPreferences: () => {
        set(defaultPreferences);
      },
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);