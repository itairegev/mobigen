import '@testing-library/jest-native/extend-expect';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  Home: 'Home',
  Compass: 'Compass', 
  Bookmark: 'Bookmark',
  User: 'User',
  ArrowLeft: 'ArrowLeft',
  Share2: 'Share2',
  Bell: 'Bell',
  Moon: 'Moon',
  HelpCircle: 'HelpCircle',
  FileText: 'FileText',
  LogOut: 'LogOut',
  ChevronRight: 'ChevronRight',
}));