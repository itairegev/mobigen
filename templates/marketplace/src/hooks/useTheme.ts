import { useColorScheme } from 'react-native';
import { colors } from '@/theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  return { theme, colorScheme };
}
