import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category } from '../types';

interface CategoryState {
  categories: Category[];
  selectedCategories: string[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCategories: (categories: Category[]) => void;
  selectCategory: (categoryId: string) => void;
  deselectCategory: (categoryId: string) => void;
  toggleCategory: (categoryId: string) => void;
  clearSelectedCategories: () => void;
  setSelectedCategories: (categoryIds: string[]) => void;
  
  // Getters
  getSelectedCategories: () => Category[];
  getCategoryById: (id: string) => Category | undefined;
  hasActiveFilters: () => boolean;
}

// Default categories with icons and colors
const defaultCategories: Category[] = [
  {
    id: 'technology',
    name: 'Technology',
    slug: 'technology',
    icon: 'Cpu',
    color: '#3b82f6',
    description: 'Latest tech news and innovations',
  },
  {
    id: 'artificial-intelligence',
    name: 'AI & Machine Learning',
    slug: 'artificial-intelligence',
    icon: 'Brain',
    color: '#8b5cf6',
    description: 'AI developments and research',
  },
  {
    id: 'software',
    name: 'Software Development',
    slug: 'software',
    icon: 'Code',
    color: '#10b981',
    description: 'Programming and software updates',
  },
  {
    id: 'hardware',
    name: 'Hardware',
    slug: 'hardware',
    icon: 'HardDrive',
    color: '#f59e0b',
    description: 'Computer hardware and gadgets',
  },
  {
    id: 'mobile',
    name: 'Mobile',
    slug: 'mobile',
    icon: 'Smartphone',
    color: '#ef4444',
    description: 'Mobile devices and apps',
  },
  {
    id: 'startups',
    name: 'Startups',
    slug: 'startups',
    icon: 'Rocket',
    color: '#06b6d4',
    description: 'Startup news and funding',
  },
  {
    id: 'security',
    name: 'Cybersecurity',
    slug: 'security',
    icon: 'Shield',
    color: '#dc2626',
    description: 'Security and privacy news',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    slug: 'gaming',
    icon: 'Gamepad2',
    color: '#7c3aed',
    description: 'Gaming industry updates',
  },
];

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: defaultCategories,
      selectedCategories: [],
      isLoading: false,
      error: null,

      setCategories: (categories: Category[]) => {
        set({ categories, error: null });
      },

      selectCategory: (categoryId: string) => {
        const { selectedCategories } = get();
        if (!selectedCategories.includes(categoryId)) {
          set({
            selectedCategories: [...selectedCategories, categoryId],
            error: null,
          });
        }
      },

      deselectCategory: (categoryId: string) => {
        const { selectedCategories } = get();
        set({
          selectedCategories: selectedCategories.filter(id => id !== categoryId),
          error: null,
        });
      },

      toggleCategory: (categoryId: string) => {
        const { selectedCategories, selectCategory, deselectCategory } = get();
        
        if (selectedCategories.includes(categoryId)) {
          deselectCategory(categoryId);
        } else {
          selectCategory(categoryId);
        }
      },

      clearSelectedCategories: () => {
        set({ selectedCategories: [], error: null });
      },

      setSelectedCategories: (categoryIds: string[]) => {
        set({ selectedCategories: categoryIds, error: null });
      },

      getSelectedCategories: (): Category[] => {
        const { categories, selectedCategories } = get();
        return categories.filter(cat => selectedCategories.includes(cat.id));
      },

      getCategoryById: (id: string): Category | undefined => {
        const { categories } = get();
        return categories.find(cat => cat.id === id);
      },

      hasActiveFilters: (): boolean => {
        const { selectedCategories } = get();
        return selectedCategories.length > 0;
      },
    }),
    {
      name: 'category-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist selected categories and custom categories
      partialize: (state) => ({ 
        selectedCategories: state.selectedCategories,
        categories: state.categories.length !== defaultCategories.length ? state.categories : undefined
      }),
    }
  )
);