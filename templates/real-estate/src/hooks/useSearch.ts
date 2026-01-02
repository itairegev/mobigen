import { create } from 'zustand';
import type { PropertyType, PropertyStatus } from '@/types';

interface SearchFilters {
  type: PropertyType[];
  status?: PropertyStatus;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
}

interface SearchState {
  query: string;
  filters: SearchFilters;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: SearchFilters = {
  type: [],
  status: undefined,
  priceMin: undefined,
  priceMax: undefined,
  bedrooms: undefined,
  bathrooms: undefined,
  city: undefined,
};

export const useSearch = create<SearchState>((set) => ({
  query: '',
  filters: defaultFilters,

  setQuery: (query: string) => set({ query }),

  setFilters: (filters: Partial<SearchFilters>) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
