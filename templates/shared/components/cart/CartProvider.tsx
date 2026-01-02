import { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  modifiers?: CartModifier[];
}

export interface CartModifier {
  id: string;
  name: string;
  price: number;
}

export interface CartContextValue {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const calculateSubtotal = (items: CartItem[]) => {
    return items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const modifiersTotal =
        (item.modifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0) *
        item.quantity;
      return total + itemTotal + modifiersTotal;
    }, 0);
  };

  const calculateItemCount = (items: CartItem[]) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const addItem = (newItem: CartItem) => {
    setItems(currentItems => {
      // Check if item with same ID and modifiers already exists
      const existingIndex = currentItems.findIndex(
        item =>
          item.id === newItem.id &&
          JSON.stringify(item.modifiers) === JSON.stringify(newItem.modifiers)
      );

      if (existingIndex > -1) {
        // Update quantity of existing item
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      } else {
        // Add new item
        return [...currentItems, newItem];
      }
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const value: CartContextValue = {
    items,
    subtotal: calculateSubtotal(items),
    itemCount: calculateItemCount(items),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
