import { useColorScheme } from 'react-native';
import { colors } from '../theme/colors';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors: isDark ? colors.dark : colors.light,
    isDark,
  };
}
