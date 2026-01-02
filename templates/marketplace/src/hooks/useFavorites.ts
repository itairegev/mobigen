import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesStore {
  favorites: string[];
  addFavorite: (listingId: string) => void;
  removeFavorite: (listingId: string) => void;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => void;
}

export const useFavorites = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (listingId: string) => {
        set((state) => ({
          favorites: [...new Set([...state.favorites, listingId])],
        }));
      },

      removeFavorite: (listingId: string) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== listingId),
        }));
      },

      isFavorite: (listingId: string) => {
        return get().favorites.includes(listingId);
      },

      toggleFavorite: (listingId: string) => {
        const isFav = get().isFavorite(listingId);
        if (isFav) {
          get().removeFavorite(listingId);
        } else {
          get().addFavorite(listingId);
        }
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
