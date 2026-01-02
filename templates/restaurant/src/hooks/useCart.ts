import { create } from 'zustand';
import { CartItem, MenuItem, SelectedModifier, CartState } from '@/types';
import { calculateItemTotal } from '@/utils';

export const useCart = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  itemCount: 0,

  addItem: (item: MenuItem, quantity: number, modifiers?: SelectedModifier[], instructions?: string) => {
    const cartItemId = `${item.id}-${Date.now()}`;
    const modifierTotal = modifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
    const subtotal = calculateItemTotal(item.price, quantity, modifiers);

    const newItem: CartItem = {
      id: cartItemId,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      image: item.image,
      selectedModifiers: modifiers,
      specialInstructions: instructions,
      subtotal,
    };

    set((state) => {
      const items = [...state.items, newItem];
      const newSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const newItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

      return {
        items,
        subtotal: newSubtotal,
        itemCount: newItemCount,
      };
    });
  },

  updateQuantity: (itemId: string, quantity: number) => {
    set((state) => {
      const items = state.items
        .map((item) => {
          if (item.id === itemId) {
            const modifierTotal = item.selectedModifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
            return {
              ...item,
              quantity,
              subtotal: (item.price + modifierTotal) * quantity,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      const newSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const newItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

      return {
        items,
        subtotal: newSubtotal,
        itemCount: newItemCount,
      };
    });
  },

  removeItem: (itemId: string) => {
    set((state) => {
      const items = state.items.filter((item) => item.id !== itemId);
      const newSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const newItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

      return {
        items,
        subtotal: newSubtotal,
        itemCount: newItemCount,
      };
    });
  },

  clearCart: () => {
    set({ items: [], subtotal: 0, itemCount: 0 });
  },
}));
