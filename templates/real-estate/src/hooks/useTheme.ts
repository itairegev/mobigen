import { useColorScheme } from 'react-native';
import { colors } from '@/theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors,
    isDark,
    colorScheme,
  };
}
