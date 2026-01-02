// Food-inspired color theme with warm orange and fresh green
export const colors = {
  light: {
    background: '#FFFBF5',
    surface: '#FFFFFF',
    text: '#2C1810',
    textSecondary: '#6B4423',
    primary: '#FF6B35',     // Warm orange (cooking fire)
    secondary: '#4ECDC4',   // Fresh teal (herbs/freshness)
    accent: '#FFE66D',      // Sunny yellow (butter/eggs)
    success: '#66BB6A',     // Fresh green
    warning: '#FFA726',     // Caution orange
    error: '#EF5350',       // Red
    border: '#E8DDD0',
    card: '#FFFFFF',
    shadow: 'rgba(44, 24, 16, 0.08)',
  },
  dark: {
    background: '#1A1410',
    surface: '#2C1810',
    text: '#F5EDE3',
    textSecondary: '#C4A68A',
    primary: '#FF8C5A',     // Lighter warm orange
    secondary: '#6FE0D7',   // Lighter fresh teal
    accent: '#FFE66D',      // Sunny yellow (same)
    success: '#81C784',     // Fresh green (lighter)
    warning: '#FFB74D',     // Caution orange (lighter)
    error: '#E57373',       // Red (lighter)
    border: '#4A3828',
    card: '#2C1810',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

// Category-specific colors for visual distinction
export const categoryColors = {
  breakfast: '#FFB84D',   // Morning yellow
  lunch: '#66BB6A',       // Midday green
  dinner: '#FF6B35',      // Evening orange
  dessert: '#EC4899',     // Sweet pink
  appetizer: '#8B5CF6',   // Purple
  salad: '#10B981',       // Fresh green
  soup: '#F59E0B',        // Warm amber
  beverage: '#06B6D4',    // Cool cyan
};

// Difficulty colors
export const difficultyColors = {
  easy: '#66BB6A',        // Green
  medium: '#FFB74D',      // Orange
  hard: '#EF5350',        // Red
};

// Meal type colors (for meal planning)
export const mealTypeColors = {
  breakfast: '#FFB84D',
  lunch: '#66BB6A',
  dinner: '#FF6B35',
  snack: '#A78BFA',
};
