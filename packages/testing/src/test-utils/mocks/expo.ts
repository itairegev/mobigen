/**
 * Expo module mocks
 *
 * Mocks for Expo SDK modules used in testing.
 */

// Mock expo-router
export const mockExpoRouter = {
  useLocalSearchParams: jest.fn(() => ({})),
  useGlobalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    setParams: jest.fn(),
    navigate: jest.fn(),
    dismissAll: jest.fn(),
  })),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => '/'),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  })),
  Link: 'Link',
  Stack: {
    Screen: 'Stack.Screen',
  },
  Tabs: {
    Screen: 'Tabs.Screen',
  },
  Slot: 'Slot',
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    setParams: jest.fn(),
  },
};

// Mock expo-status-bar
export const mockExpoStatusBar = {
  StatusBar: 'StatusBar',
  setStatusBarStyle: jest.fn(),
  setStatusBarBackgroundColor: jest.fn(),
  setStatusBarHidden: jest.fn(),
  setStatusBarNetworkActivityIndicatorVisible: jest.fn(),
  setStatusBarTranslucent: jest.fn(),
};

// Mock expo-image
export const mockExpoImage = {
  Image: 'ExpoImage',
  ImageBackground: 'ExpoImageBackground',
};

// Mock expo-font
export const mockExpoFont = {
  useFonts: jest.fn(() => [true, null]),
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
};

// Mock expo-splash-screen
export const mockExpoSplashScreen = {
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
};

// Mock expo-constants
export const mockExpoConstants = {
  expoConfig: {
    name: 'TestApp',
    slug: 'test-app',
    version: '1.0.0',
  },
  appOwnership: null,
  executionEnvironment: 'bare',
  installationId: 'test-installation-id',
  isDevice: true,
  platform: { ios: {} },
  sessionId: 'test-session-id',
  statusBarHeight: 44,
  systemFonts: [],
};

// Mock expo-location
export const mockExpoLocation = {
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true, expires: 'never' })
  ),
  requestBackgroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true, expires: 'never' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: null,
        accuracy: 5,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    })
  ),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  getLastKnownPositionAsync: jest.fn(() => Promise.resolve(null)),
  geocodeAsync: jest.fn(() => Promise.resolve([])),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([])),
};

// Mock expo-camera
export const mockExpoCamera = {
  Camera: 'Camera',
  useCameraPermissions: jest.fn(() => [
    { status: 'granted', canAskAgain: true, granted: true, expires: 'never' },
    jest.fn(),
  ]),
  CameraType: { back: 'back', front: 'front' },
  FlashMode: { off: 'off', on: 'on', auto: 'auto', torch: 'torch' },
};

// Mock expo-image-picker
export const mockExpoImagePicker = {
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://test-image.jpg', width: 100, height: 100 }],
    })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://test-photo.jpg', width: 100, height: 100 }],
    })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true, expires: 'never' })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true, expires: 'never' })
  ),
  MediaTypeOptions: {
    All: 'All',
    Images: 'Images',
    Videos: 'Videos',
  },
};

// Mock expo-secure-store
export const mockExpoSecureStore = {
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
};

// Mock expo-haptics
export const mockExpoHaptics = {
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
};

// Mock expo-notifications
export const mockExpoNotifications = {
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true, expires: 'never' })
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true, expires: 'never' })
  ),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: 'ExponentPushToken[test-token]' })
  ),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getPresentedNotificationsAsync: jest.fn(() => Promise.resolve([])),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
};

/**
 * Setup all Expo mocks
 */
export function setupExpoMocks() {
  jest.mock('expo-router', () => mockExpoRouter);
  jest.mock('expo-status-bar', () => mockExpoStatusBar);
  jest.mock('expo-font', () => mockExpoFont);
  jest.mock('expo-splash-screen', () => mockExpoSplashScreen);
  jest.mock('expo-constants', () => ({ default: mockExpoConstants }));
  jest.mock('expo-location', () => mockExpoLocation);
  jest.mock('expo-camera', () => mockExpoCamera);
  jest.mock('expo-image-picker', () => mockExpoImagePicker);
  jest.mock('expo-secure-store', () => mockExpoSecureStore);
  jest.mock('expo-haptics', () => mockExpoHaptics);
  jest.mock('expo-notifications', () => mockExpoNotifications);
}
