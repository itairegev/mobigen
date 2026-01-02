import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealPlanState, MealPlan, PlannedMeal } from '../types';

// Helper to get Monday of the current week
function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export const useMealPlan = create<MealPlanState>()(
  persist(
    (set) => ({
      currentWeek: {
        id: 'current-week',
        weekStartDate: getMondayOfWeek(),
        meals: [],
      },

      setWeek: (weekStartDate) =>
        set({
          currentWeek: {
            id: `week-${weekStartDate}`,
            weekStartDate,
            meals: [],
          },
        }),

      addMeal: (meal) =>
        set((state) => {
          if (!state.currentWeek) {
            return state;
          }

          const newMeal: PlannedMeal = {
            ...meal,
            id: `meal-${Date.now()}-${Math.random()}`,
          };

          return {
            currentWeek: {
              ...state.currentWeek,
              meals: [...state.currentWeek.meals, newMeal],
            },
          };
        }),

      removeMeal: (mealId) =>
        set((state) => {
          if (!state.currentWeek) {
            return state;
          }

          return {
            currentWeek: {
              ...state.currentWeek,
              meals: state.currentWeek.meals.filter((meal) => meal.id !== mealId),
            },
          };
        }),

      updateMeal: (mealId, updates) =>
        set((state) => {
          if (!state.currentWeek) {
            return state;
          }

          return {
            currentWeek: {
              ...state.currentWeek,
              meals: state.currentWeek.meals.map((meal) =>
                meal.id === mealId ? { ...meal, ...updates } : meal
              ),
            },
          };
        }),

      clearDay: (dayOfWeek) =>
        set((state) => {
          if (!state.currentWeek) {
            return state;
          }

          return {
            currentWeek: {
              ...state.currentWeek,
              meals: state.currentWeek.meals.filter((meal) => meal.dayOfWeek !== dayOfWeek),
            },
          };
        }),

      clearWeek: () =>
        set((state) => {
          if (!state.currentWeek) {
            return state;
          }

          return {
            currentWeek: {
              ...state.currentWeek,
              meals: [],
            },
          };
        }),
    }),
    {
      name: 'meal-plan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
