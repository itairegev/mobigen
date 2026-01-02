// Sports Team Theme Colors - Energetic and Bold

export const colors = {
  // Primary team colors (customizable)
  team: {
    primary: '#1e40af', // Deep blue
    secondary: '#ef4444', // Red
    accent: '#fbbf24', // Gold/Yellow
  },

  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Game status colors
  game: {
    live: '#ef4444',
    upcoming: '#3b82f6',
    completed: '#6b7280',
  },

  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    dark: '#111827',
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
  },

  // Border colors
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },
};

export type ColorTheme = typeof colors;
