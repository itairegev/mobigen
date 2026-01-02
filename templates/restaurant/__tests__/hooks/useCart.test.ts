/**
 * Tests for useCart hook
 */

import { act, renderHook } from '@testing-library/react-hooks';

// Mock zustand before importing the hook
jest.mock('zustand', () => ({
  create: jest.fn((createState) => {
    let state = createState(
      (newState) => {
        state = typeof newState === 'function' ? newState(state) : { ...state, ...newState };
      },
      () => state,
      {} as any
    );

    const useStore = (selector?: (s: typeof state) => any) => {
      return selector ? selector(state) : state;
    };

    useStore.getState = () => state;
    useStore.setState = (newState: any) => {
      state = typeof newState === 'function' ? newState(state) : { ...state, ...newState };
    };

    return useStore;
  }),
}));

// Mock utilities
jest.mock('@/utils', () => ({
  calculateItemTotal: jest.fn((price, quantity, modifiers) => {
    const modifierTotal = modifiers?.reduce((sum: number, mod: any) => sum + mod.price, 0) || 0;
    return (price + modifierTotal) * quantity;
  }),
}));

// Import after mocks
import { useCart } from '../../src/hooks/useCart';

describe('useCart', () => {
  beforeEach(() => {
    // Reset cart state before each test
    useCart.setState({ items: [], subtotal: 0, itemCount: 0 });
  });

  const mockMenuItem = {
    id: 'item-1',
    name: 'Burger',
    price: 10.99,
    image: 'burger.jpg',
    description: 'A delicious burger',
    categoryId: 'cat-1',
  };

  const mockModifiers = [
    { id: 'mod-1', name: 'Extra Cheese', price: 1.50 },
    { id: 'mod-2', name: 'Bacon', price: 2.00 },
  ];

  describe('addItem', () => {
    it('should add an item to the cart', () => {
      const { addItem } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 1);
      });

      const state = useCart.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Burger');
      expect(state.items[0].quantity).toBe(1);
      expect(state.itemCount).toBe(1);
    });

    it('should add item with modifiers', () => {
      const { addItem } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 1, mockModifiers as any);
      });

      const state = useCart.getState();
      expect(state.items[0].selectedModifiers).toEqual(mockModifiers);
      // Price: 10.99 + 1.50 + 2.00 = 14.49
      expect(state.items[0].subtotal).toBe(14.49);
    });

    it('should add item with special instructions', () => {
      const { addItem } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 1, undefined, 'No onions please');
      });

      const state = useCart.getState();
      expect(state.items[0].specialInstructions).toBe('No onions please');
    });

    it('should update subtotal when adding items', () => {
      const { addItem } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 2);
      });

      const state = useCart.getState();
      expect(state.subtotal).toBe(21.98); // 10.99 * 2
    });

    it('should increment item count', () => {
      const { addItem } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 3);
      });

      const state = useCart.getState();
      expect(state.itemCount).toBe(3);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { addItem, updateQuantity } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 1);
      });

      const itemId = useCart.getState().items[0].id;

      act(() => {
        updateQuantity(itemId, 5);
      });

      const state = useCart.getState();
      expect(state.items[0].quantity).toBe(5);
      expect(state.itemCount).toBe(5);
    });

    it('should remove item when quantity is set to 0', () => {
      const { addItem, updateQuantity } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 1);
      });

      const itemId = useCart.getState().items[0].id;

      act(() => {
        updateQuantity(itemId, 0);
      });

      const state = useCart.getState();
      expect(state.items).toHaveLength(0);
      expect(state.itemCount).toBe(0);
    });

    it('should update subtotal when quantity changes', () => {
      const { addItem, updateQuantity } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 1);
      });

      const itemId = useCart.getState().items[0].id;

      act(() => {
        updateQuantity(itemId, 3);
      });

      const state = useCart.getState();
      expect(state.subtotal).toBe(32.97); // 10.99 * 3
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      const { addItem, removeItem } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 1);
      });

      const itemId = useCart.getState().items[0].id;

      act(() => {
        removeItem(itemId);
      });

      const state = useCart.getState();
      expect(state.items).toHaveLength(0);
      expect(state.subtotal).toBe(0);
      expect(state.itemCount).toBe(0);
    });

    it('should only remove specified item', () => {
      const { addItem, removeItem } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 1);
        addItem({ ...mockMenuItem, id: 'item-2', name: 'Pizza', price: 15.99 } as any, 1);
      });

      const firstItemId = useCart.getState().items[0].id;

      act(() => {
        removeItem(firstItemId);
      });

      const state = useCart.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Pizza');
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', () => {
      const { addItem, clearCart } = useCart.getState();

      act(() => {
        addItem(mockMenuItem as any, 2);
        addItem({ ...mockMenuItem, id: 'item-2' } as any, 3);
      });

      expect(useCart.getState().items).toHaveLength(2);

      act(() => {
        clearCart();
      });

      const state = useCart.getState();
      expect(state.items).toHaveLength(0);
      expect(state.subtotal).toBe(0);
      expect(state.itemCount).toBe(0);
    });
  });
});
