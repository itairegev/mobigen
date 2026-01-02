import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingListState, ShoppingItem, Recipe } from '../types';

export const useShoppingList = create<ShoppingListState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // Check if item already exists
          const existingIndex = state.items.findIndex(
            (i) => i.name.toLowerCase() === item.name.toLowerCase() && i.unit === item.unit
          );

          if (existingIndex >= 0) {
            // Update existing item amount
            const updatedItems = [...state.items];
            updatedItems[existingIndex].amount += item.amount;
            return { items: updatedItems };
          }

          // Add new item
          const newItem: ShoppingItem = {
            ...item,
            id: `shopping-${Date.now()}-${Math.random()}`,
            checked: false,
            addedAt: new Date().toISOString(),
          };

          return { items: [...state.items, newItem] };
        }),

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        })),

      toggleItem: (itemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        })),

      clearChecked: () =>
        set((state) => ({
          items: state.items.filter((item) => !item.checked),
        })),

      clearAll: () => set({ items: [] }),

      addIngredientsFromRecipe: (recipe) =>
        set((state) => {
          const newItems: ShoppingItem[] = recipe.ingredients.map((ingredient) => ({
            id: `shopping-${Date.now()}-${ingredient.id}`,
            ingredientId: ingredient.id,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            checked: false,
            recipeId: recipe.id,
            recipeName: recipe.name,
            addedAt: new Date().toISOString(),
          }));

          return { items: [...state.items, ...newItems] };
        }),
    }),
    {
      name: 'shopping-list-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
