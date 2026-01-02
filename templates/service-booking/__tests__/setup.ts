/**
 * Jest setup for service-booking template tests
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
  Calendar: 'Calendar',
  Clock: 'Clock',
  User: 'User',
  Check: 'Check',
  ChevronRight: 'ChevronRight',
  ChevronLeft: 'ChevronLeft',
  X: 'X',
  Star: 'Star',
  MapPin: 'MapPin',
  Phone: 'Phone',
  Mail: 'Mail',
  Scissors: 'Scissors',
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
  formatCurrency: jest.fn((amount) => `$${amount.toFixed(2)}`),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString()),
  formatTime: jest.fn((time) => time),
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
