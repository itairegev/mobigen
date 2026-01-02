// ============================================================================
// School Template Theme Colors
// Educational green and blue palette
// ============================================================================

export const colors = {
  // Primary - Educational Green
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Secondary - Academic Blue
  secondary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  // Subject colors (for visual categorization)
  subjects: {
    mathematics: '#6366f1', // Indigo
    english: '#ec4899', // Pink
    science: '#10b981', // Green
    history: '#f59e0b', // Amber
    art: '#a855f7', // Purple
    music: '#06b6d4', // Cyan
    physical_education: '#ef4444', // Red
    computer_science: '#3b82f6', // Blue
  },

  // Priority colors
  priority: {
    low: '#6b7280',
    normal: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444',
  },

  // Grade colors
  grade: {
    A: '#10b981', // Green
    B: '#3b82f6', // Blue
    C: '#f59e0b', // Amber
    D: '#f97316', // Orange
    F: '#ef4444', // Red
  },
} as const;

export type SubjectColor = keyof typeof colors.subjects;
