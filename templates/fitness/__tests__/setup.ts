/**
 * Jest setup for fitness template tests
 */

// Mock react-native modules
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: jest.fn((obj) => obj.ios) },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  StyleSheet: {
    create: (styles: any) => styles,
    flatten: (style: any) => (Array.isArray(style) ? Object.assign({}, ...style) : style),
  },
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  SafeAreaView: 'SafeAreaView',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  Modal: 'Modal',
  Alert: { alert: jest.fn() },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  })),
  useSegments: jest.fn(() => []),
  Link: 'Link',
  Stack: { Screen: 'Stack.Screen' },
  Tabs: { Screen: 'Tabs.Screen' },
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Dumbbell: 'Dumbbell',
  Flame: 'Flame',
  Clock: 'Clock',
  Play: 'Play',
  Pause: 'Pause',
  RotateCcw: 'RotateCcw',
  Check: 'Check',
  ChevronRight: 'ChevronRight',
  ChevronLeft: 'ChevronLeft',
  Plus: 'Plus',
  Minus: 'Minus',
  Target: 'Target',
  Trophy: 'Trophy',
  Calendar: 'Calendar',
  Activity: 'Activity',
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => date.toLocaleDateString()),
  startOfWeek: jest.fn((date) => date),
  isWithinInterval: jest.fn(() => true),
  differenceInDays: jest.fn(() => 1),
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn((options) => ({
      data: undefined,
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
      refetch: jest.fn(),
      ...options,
    })),
    useMutation: jest.fn(() => ({
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
    })),
  };
});

// Mock NativeWind
jest.mock('nativewind', () => ({
  styled: (component: any) => component,
}));

// Mock path aliases
jest.mock('@/types', () => ({}), { virtual: true });
jest.mock('@/utils', () => ({
  formatDuration: jest.fn((mins) => `${mins} min`),
  formatCalories: jest.fn((cal) => `${cal} cal`),
}), { virtual: true });

// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  error: console.error,
  warn: console.warn,
};

// Mock timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});
