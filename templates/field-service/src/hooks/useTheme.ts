import { colors } from '../theme';

export function useTheme() {
  return {
    colors,
    isDark: false, // Can be extended for dark mode support
  };
}
