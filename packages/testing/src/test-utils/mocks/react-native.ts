/**
 * React Native module mocks
 *
 * Mocks for React Native core modules used in testing.
 */

// Mock Dimensions
export const mockDimensions = {
  get: jest.fn((dim: 'window' | 'screen') => ({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 1,
  })),
  set: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
};

// Mock Platform
export const mockPlatform = {
  OS: 'ios' as const,
  Version: '14.0',
  isPad: false,
  isTVOS: false,
  isTV: false,
  select: jest.fn((options: any) => options.ios || options.default),
};

// Mock Animated
export const mockAnimated = {
  Value: jest.fn((value: number) => ({
    setValue: jest.fn(),
    setOffset: jest.fn(),
    flattenOffset: jest.fn(),
    extractOffset: jest.fn(),
    addListener: jest.fn(() => 'listener-id'),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    stopAnimation: jest.fn((cb?: (value: number) => void) => cb?.(value)),
    resetAnimation: jest.fn((cb?: (value: number) => void) => cb?.(value)),
    interpolate: jest.fn(() => ({ __getValue: () => 0 })),
    __getValue: () => value,
  })),
  ValueXY: jest.fn(() => ({
    x: { setValue: jest.fn(), __getValue: () => 0 },
    y: { setValue: jest.fn(), __getValue: () => 0 },
    setValue: jest.fn(),
    setOffset: jest.fn(),
    flattenOffset: jest.fn(),
    extractOffset: jest.fn(),
    stopAnimation: jest.fn(),
    resetAnimation: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    getLayout: jest.fn(() => ({ left: 0, top: 0 })),
    getTranslateTransform: jest.fn(() => [{ translateX: 0 }, { translateY: 0 }]),
  })),
  timing: jest.fn(() => ({
    start: jest.fn((cb?: () => void) => cb?.()),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  spring: jest.fn(() => ({
    start: jest.fn((cb?: () => void) => cb?.()),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  decay: jest.fn(() => ({
    start: jest.fn((cb?: () => void) => cb?.()),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  parallel: jest.fn(() => ({
    start: jest.fn((cb?: () => void) => cb?.()),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  sequence: jest.fn(() => ({
    start: jest.fn((cb?: () => void) => cb?.()),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  stagger: jest.fn(() => ({
    start: jest.fn((cb?: () => void) => cb?.()),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  loop: jest.fn(() => ({
    start: jest.fn((cb?: () => void) => cb?.()),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  event: jest.fn(() => jest.fn()),
  createAnimatedComponent: jest.fn((Component: any) => Component),
  View: 'Animated.View',
  Text: 'Animated.Text',
  Image: 'Animated.Image',
  ScrollView: 'Animated.ScrollView',
  FlatList: 'Animated.FlatList',
};

// Mock Alert
export const mockAlert = {
  alert: jest.fn(),
  prompt: jest.fn(),
};

// Mock Linking
export const mockLinking = {
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  openSettings: jest.fn(() => Promise.resolve()),
};

// Mock Keyboard
export const mockKeyboard = {
  dismiss: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  isVisible: jest.fn(() => false),
  scheduleLayoutAnimation: jest.fn(),
};

// Mock Share
export const mockShare = {
  share: jest.fn(() => Promise.resolve({ action: 'sharedAction' })),
};

// Mock Clipboard
export const mockClipboard = {
  getString: jest.fn(() => Promise.resolve('')),
  setString: jest.fn(),
  hasString: jest.fn(() => Promise.resolve(false)),
  hasURL: jest.fn(() => Promise.resolve(false)),
  hasNumber: jest.fn(() => Promise.resolve(false)),
  hasWebURL: jest.fn(() => Promise.resolve(false)),
};

// Mock AppState
export const mockAppState = {
  currentState: 'active' as const,
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  isAvailable: true,
};

// Mock StatusBar
export const mockStatusBar = {
  setBarStyle: jest.fn(),
  setBackgroundColor: jest.fn(),
  setHidden: jest.fn(),
  setNetworkActivityIndicatorVisible: jest.fn(),
  setTranslucent: jest.fn(),
  pushStackEntry: jest.fn(() => ({ statusBarId: 'mock-id' })),
  popStackEntry: jest.fn(),
  replaceStackEntry: jest.fn(),
  currentHeight: 44,
};

// Mock BackHandler (Android)
export const mockBackHandler = {
  exitApp: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
};

// Mock PixelRatio
export const mockPixelRatio = {
  get: jest.fn(() => 2),
  getFontScale: jest.fn(() => 1),
  getPixelSizeForLayoutSize: jest.fn((size: number) => size * 2),
  roundToNearestPixel: jest.fn((size: number) => Math.round(size * 2) / 2),
};

// Mock NativeModules
export const mockNativeModules = {
  UIManager: {
    measure: jest.fn(),
    measureInWindow: jest.fn(),
    measureLayout: jest.fn(),
    measureLayoutRelativeToParent: jest.fn(),
    dispatchViewManagerCommand: jest.fn(),
    setLayoutAnimationEnabledExperimental: jest.fn(),
    getViewManagerConfig: jest.fn(() => ({})),
    getConstantsForViewManager: jest.fn(() => ({})),
    blur: jest.fn(),
    focus: jest.fn(),
  },
  PlatformConstants: {
    forceTouchAvailable: false,
    interfaceIdiom: 'phone',
    isTesting: true,
    osVersion: '14.0',
    systemName: 'iOS',
  },
  ImageLoader: {
    getSize: jest.fn(),
    prefetchImage: jest.fn(),
    queryCache: jest.fn(),
  },
};

/**
 * Apply all mocks to jest
 */
export function setupReactNativeMocks() {
  jest.mock('react-native', () => ({
    Dimensions: mockDimensions,
    Platform: mockPlatform,
    Animated: mockAnimated,
    Alert: mockAlert,
    Linking: mockLinking,
    Keyboard: mockKeyboard,
    Share: mockShare,
    Clipboard: mockClipboard,
    AppState: mockAppState,
    StatusBar: mockStatusBar,
    BackHandler: mockBackHandler,
    PixelRatio: mockPixelRatio,
    NativeModules: mockNativeModules,
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (style: any) => (Array.isArray(style) ? Object.assign({}, ...style) : style),
      compose: (style1: any, style2: any) => [style1, style2],
      absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      hairlineWidth: 0.5,
    },
    // Core components (simplified mocks)
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    ScrollView: 'ScrollView',
    FlatList: 'FlatList',
    SectionList: 'SectionList',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    TouchableHighlight: 'TouchableHighlight',
    TouchableWithoutFeedback: 'TouchableWithoutFeedback',
    Pressable: 'Pressable',
    Button: 'Button',
    Switch: 'Switch',
    ActivityIndicator: 'ActivityIndicator',
    Modal: 'Modal',
    SafeAreaView: 'SafeAreaView',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    RefreshControl: 'RefreshControl',
  }));
}
