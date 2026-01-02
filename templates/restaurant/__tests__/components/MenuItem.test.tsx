/**
 * Tests for MenuItem component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock dependencies
jest.mock('@/utils', () => ({
  formatCurrency: jest.fn((amount) => `$${amount.toFixed(2)}`),
}));

// Import after mocks
import { MenuItem } from '../../src/components/MenuItem';

describe('MenuItem', () => {
  const mockItem = {
    id: 'item-1',
    name: 'Classic Burger',
    description: 'A delicious beef burger with fresh vegetables',
    price: 12.99,
    image: 'https://example.com/burger.jpg',
    categoryId: 'cat-1',
    available: true,
    featured: false,
    dietaryTags: ['gluten-free'],
    prepTime: 15,
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render item name and price', () => {
    const { getByText } = render(
      <MenuItem item={mockItem} onPress={mockOnPress} />
    );

    expect(getByText('Classic Burger')).toBeTruthy();
    expect(getByText('$12.99')).toBeTruthy();
  });

  it('should render item description', () => {
    const { getByText } = render(
      <MenuItem item={mockItem} onPress={mockOnPress} />
    );

    expect(getByText('A delicious beef burger with fresh vegetables')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const { getByTestId } = render(
      <MenuItem item={mockItem} onPress={mockOnPress} testID="menu-item" />
    );

    fireEvent.press(getByTestId('menu-item'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should show unavailable badge when item is not available', () => {
    const unavailableItem = { ...mockItem, available: false };
    const { getByText } = render(
      <MenuItem item={unavailableItem} onPress={mockOnPress} />
    );

    expect(getByText('Unavailable')).toBeTruthy();
  });

  it('should not show unavailable badge when item is available', () => {
    const { queryByText } = render(
      <MenuItem item={mockItem} onPress={mockOnPress} />
    );

    expect(queryByText('Unavailable')).toBeNull();
  });

  it('should show featured badge when item is featured', () => {
    const featuredItem = { ...mockItem, featured: true };
    const { getByText } = render(
      <MenuItem item={featuredItem} onPress={mockOnPress} />
    );

    expect(getByText('Featured')).toBeTruthy();
  });

  it('should not show featured badge when item is not featured', () => {
    const { queryByText } = render(
      <MenuItem item={mockItem} onPress={mockOnPress} />
    );

    expect(queryByText('Featured')).toBeNull();
  });

  it('should render dietary tags', () => {
    const itemWithTags = {
      ...mockItem,
      dietaryTags: ['vegan', 'gluten-free'],
    };
    const { getByText } = render(
      <MenuItem item={itemWithTags} onPress={mockOnPress} />
    );

    expect(getByText('vegan')).toBeTruthy();
    expect(getByText('gluten-free')).toBeTruthy();
  });

  it('should render prep time when provided', () => {
    const { getByText } = render(
      <MenuItem item={mockItem} onPress={mockOnPress} />
    );

    expect(getByText('15 min')).toBeTruthy();
  });

  it('should not render prep time when not provided', () => {
    const itemWithoutPrepTime = { ...mockItem, prepTime: undefined };
    const { queryByText } = render(
      <MenuItem item={itemWithoutPrepTime} onPress={mockOnPress} />
    );

    expect(queryByText(/min$/)).toBeNull();
  });

  it('should handle item without dietary tags', () => {
    const itemWithoutTags = { ...mockItem, dietaryTags: undefined };
    const { getByText } = render(
      <MenuItem item={itemWithoutTags} onPress={mockOnPress} />
    );

    // Should still render without crashing
    expect(getByText('Classic Burger')).toBeTruthy();
  });
});
