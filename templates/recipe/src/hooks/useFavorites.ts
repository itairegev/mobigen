import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoritesState } from '../types';

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      addFavorite: (recipeId) =>
        set((state) => {
          if (state.favoriteIds.includes(recipeId)) {
            return state;
          }
          return { favoriteIds: [...state.favoriteIds, recipeId] };
        }),

      removeFavorite: (recipeId) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((id) => id !== recipeId),
        })),

      isFavorite: (recipeId) => {
        return get().favoriteIds.includes(recipeId);
      },

      toggleFavorite: (recipeId) =>
        set((state) => {
          if (state.favoriteIds.includes(recipeId)) {
            return {
              favoriteIds: state.favoriteIds.filter((id) => id !== recipeId),
            };
          }
          return {
            favoriteIds: [...state.favoriteIds, recipeId],
          };
        }),
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
