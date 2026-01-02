/**
 * Tests for CartSummary component
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock dependencies
jest.mock('@/utils', () => ({
  formatCurrency: jest.fn((amount) => `$${amount.toFixed(2)}`),
}));

// Import after mocks
import { CartSummary } from '../../src/components/CartSummary';

describe('CartSummary', () => {
  const defaultProps = {
    subtotal: 25.98,
    tax: 2.34,
    tip: 0,
    deliveryFee: 0,
    total: 28.32,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render subtotal', () => {
    const { getByText } = render(<CartSummary {...defaultProps} />);

    expect(getByText('Subtotal')).toBeTruthy();
    expect(getByText('$25.98')).toBeTruthy();
  });

  it('should render tax', () => {
    const { getByText } = render(<CartSummary {...defaultProps} />);

    expect(getByText('Tax (9%)')).toBeTruthy();
    expect(getByText('$2.34')).toBeTruthy();
  });

  it('should render total', () => {
    const { getByText } = render(<CartSummary {...defaultProps} />);

    expect(getByText('Total')).toBeTruthy();
    expect(getByText('$28.32')).toBeTruthy();
  });

  it('should render tip when provided', () => {
    const propsWithTip = { ...defaultProps, tip: 5.00, total: 33.32 };
    const { getByText } = render(<CartSummary {...propsWithTip} />);

    expect(getByText('Tip')).toBeTruthy();
    expect(getByText('$5.00')).toBeTruthy();
  });

  it('should not render tip when zero', () => {
    const { queryByText } = render(<CartSummary {...defaultProps} />);

    expect(queryByText('Tip')).toBeNull();
  });

  it('should render delivery fee when provided', () => {
    const propsWithDelivery = { ...defaultProps, deliveryFee: 3.99, total: 32.31 };
    const { getByText } = render(<CartSummary {...propsWithDelivery} />);

    expect(getByText('Delivery Fee')).toBeTruthy();
    expect(getByText('$3.99')).toBeTruthy();
  });

  it('should not render delivery fee when zero', () => {
    const { queryByText } = render(<CartSummary {...defaultProps} />);

    expect(queryByText('Delivery Fee')).toBeNull();
  });

  it('should render all fees when provided', () => {
    const fullProps = {
      subtotal: 25.98,
      tax: 2.34,
      tip: 5.00,
      deliveryFee: 3.99,
      total: 37.31,
    };
    const { getByText } = render(<CartSummary {...fullProps} />);

    expect(getByText('Subtotal')).toBeTruthy();
    expect(getByText('Tax (9%)')).toBeTruthy();
    expect(getByText('Tip')).toBeTruthy();
    expect(getByText('Delivery Fee')).toBeTruthy();
    expect(getByText('Total')).toBeTruthy();
    expect(getByText('$37.31')).toBeTruthy();
  });

  it('should handle testID correctly', () => {
    const { getByTestId } = render(
      <CartSummary {...defaultProps} testID="cart-summary" />
    );

    expect(getByTestId('cart-summary')).toBeTruthy();
  });

  it('should render correctly with zero subtotal', () => {
    const emptyCartProps = {
      subtotal: 0,
      tax: 0,
      tip: 0,
      deliveryFee: 0,
      total: 0,
    };
    const { getByText } = render(<CartSummary {...emptyCartProps} />);

    expect(getByText('$0.00')).toBeTruthy();
  });

  it('should render large amounts correctly', () => {
    const largeAmountProps = {
      subtotal: 1234.56,
      tax: 111.11,
      tip: 200.00,
      deliveryFee: 0,
      total: 1545.67,
    };
    const { getByText } = render(<CartSummary {...largeAmountProps} />);

    expect(getByText('$1234.56')).toBeTruthy();
    expect(getByText('$1545.67')).toBeTruthy();
  });
});
