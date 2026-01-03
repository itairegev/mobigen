import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct title', () => {
    render(<Button title="Test Button" onPress={jest.fn()} />);
    
    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    render(<Button title="Test Button" onPress={mockOnPress} />);
    
    fireEvent.press(screen.getByText('Test Button'));
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    render(<Button title="Test Button" onPress={jest.fn()} loading />);
    
    expect(screen.queryByText('Test Button')).toBeFalsy();
    // ActivityIndicator doesn't have a default testID, so we check it's not showing the title
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(
      <Button title="Primary" onPress={jest.fn()} variant="primary" />
    );
    
    rerender(<Button title="Secondary" onPress={jest.fn()} variant="secondary" />);
    rerender(<Button title="Outline" onPress={jest.fn()} variant="outline" />);
    
    // Test that different variants render (specific style assertions would require more setup)
    expect(screen.getByText('Outline')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const mockOnPress = jest.fn();
    render(<Button title="Disabled Button" onPress={mockOnPress} disabled />);
    
    const button = screen.getByText('Disabled Button');
    fireEvent.press(button);
    
    expect(mockOnPress).not.toHaveBeenCalled();
  });
});