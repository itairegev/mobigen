import { useColorScheme } from 'react-native';

export function useTheme() {
  const colorScheme = useColorScheme();

  return {
    isDark: colorScheme === 'dark',
    colors: {
      primary: '#0d9488',
      primaryLight: '#14b8a6',
      primaryDark: '#0f766e',
      secondary: '#9333ea',
      background: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
      text: colorScheme === 'dark' ? '#f3f4f6' : '#111827',
      textSecondary: colorScheme === 'dark' ? '#9ca3af' : '#6b7280',
      border: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
    },
  };
}
