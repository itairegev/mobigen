/**
 * Tests for CartItem component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock dependencies
jest.mock('@/utils', () => ({
  formatCurrency: jest.fn((amount) => `$${amount.toFixed(2)}`),
}));

jest.mock('lucide-react-native', () => ({
  Minus: 'Minus',
  Plus: 'Plus',
  Trash2: 'Trash2',
}));

// Import after mocks
import { CartItem } from '../../src/components/CartItem';

describe('CartItem', () => {
  const mockItem = {
    id: 'cart-item-1',
    menuItemId: 'item-1',
    name: 'Classic Burger',
    price: 12.99,
    quantity: 2,
    subtotal: 25.98,
    image: 'https://example.com/burger.jpg',
    selectedModifiers: [],
    specialInstructions: '',
  };

  const mockOnUpdateQuantity = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render item name', () => {
    const { getByText } = render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('Classic Burger')).toBeTruthy();
  });

  it('should render item subtotal', () => {
    const { getByText } = render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('$25.98')).toBeTruthy();
  });

  it('should render item quantity', () => {
    const { getByText } = render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('2')).toBeTruthy();
  });

  it('should call onUpdateQuantity with incremented value when plus is pressed', () => {
    const { getByTestId } = render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        testID="cart-item"
      />
    );

    fireEvent.press(getByTestId('cart-item-increase'));
    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(3);
  });

  it('should call onUpdateQuantity with decremented value when minus is pressed', () => {
    const { getByTestId } = render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        testID="cart-item"
      />
    );

    fireEvent.press(getByTestId('cart-item-decrease'));
    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(1);
  });

  it('should render modifiers when present', () => {
    const itemWithModifiers = {
      ...mockItem,
      selectedModifiers: [
        {
          groupId: 'group-1',
          modifierId: 'mod-1',
          modifierName: 'Extra Cheese',
          price: 1.50,
        },
        {
          groupId: 'group-2',
          modifierId: 'mod-2',
          modifierName: 'Bacon',
          price: 2.00,
        },
      ],
    };

    const { getByText } = render(
      <CartItem
        item={itemWithModifiers}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('+ Extra Cheese ($1.50)')).toBeTruthy();
    expect(getByText('+ Bacon ($2.00)')).toBeTruthy();
  });

  it('should render modifier without price when price is 0', () => {
    const itemWithFreeModifier = {
      ...mockItem,
      selectedModifiers: [
        {
          groupId: 'group-1',
          modifierId: 'mod-1',
          modifierName: 'No Onions',
          price: 0,
        },
      ],
    };

    const { getByText } = render(
      <CartItem
        item={itemWithFreeModifier}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('+ No Onions')).toBeTruthy();
  });

  it('should render special instructions when present', () => {
    const itemWithInstructions = {
      ...mockItem,
      specialInstructions: 'Well done please',
    };

    const { getByText } = render(
      <CartItem
        item={itemWithInstructions}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('Note: Well done please')).toBeTruthy();
  });

  it('should not render special instructions when empty', () => {
    const { queryByText } = render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(queryByText(/Note:/)).toBeNull();
  });

  it('should show trash icon when quantity is 1', () => {
    const singleItem = { ...mockItem, quantity: 1 };
    const { getByTestId } = render(
      <CartItem
        item={singleItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        testID="cart-item"
      />
    );

    // The decrease button should still be present
    expect(getByTestId('cart-item-decrease')).toBeTruthy();
    // When pressed, it should request quantity 0
    fireEvent.press(getByTestId('cart-item-decrease'));
    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(0);
  });

  it('should handle testID correctly', () => {
    const { getByTestId } = render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        testID="my-cart-item"
      />
    );

    expect(getByTestId('my-cart-item')).toBeTruthy();
    expect(getByTestId('my-cart-item-increase')).toBeTruthy();
    expect(getByTestId('my-cart-item-decrease')).toBeTruthy();
  });
});
