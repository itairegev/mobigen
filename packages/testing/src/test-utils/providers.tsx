/**
 * Mock providers for testing React Native components
 *
 * Wraps components with necessary providers for isolated testing.
 */

import React, { ReactNode } from 'react';

// Mock QueryClient for TanStack Query
const mockQueryClient = {
  getQueryCache: () => ({ clear: jest.fn() }),
  getMutationCache: () => ({ clear: jest.fn() }),
  clear: jest.fn(),
  setDefaultOptions: jest.fn(),
  getDefaultOptions: () => ({}),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
  prefetchQuery: jest.fn(),
  fetchQuery: jest.fn(),
  cancelQueries: jest.fn(),
  removeQueries: jest.fn(),
  resetQueries: jest.fn(),
  isFetching: jest.fn(() => 0),
  isMutating: jest.fn(() => 0),
  getQueryState: jest.fn(),
  setMutationDefaults: jest.fn(),
  getMutationDefaults: jest.fn(),
  setQueryDefaults: jest.fn(),
  getQueryDefaults: jest.fn(),
  mount: jest.fn(),
  unmount: jest.fn(),
};

// Mock QueryClientProvider
export const MockQueryClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Mock Navigation context
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(() => ({
    routes: [],
    index: 0,
    key: 'mock-key',
    type: 'stack',
    routeNames: [],
  })),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
  getId: jest.fn(),
};

const mockRoute = {
  key: 'mock-route-key',
  name: 'MockScreen',
  params: {},
};

// Navigation context mock
const NavigationContext = React.createContext(mockNavigation);
const RouteContext = React.createContext(mockRoute);

export const MockNavigationProvider: React.FC<{
  children: ReactNode;
  navigation?: Partial<typeof mockNavigation>;
  route?: Partial<typeof mockRoute>;
}> = ({ children, navigation = {}, route = {} }) => {
  const navValue = { ...mockNavigation, ...navigation };
  const routeValue = { ...mockRoute, ...route };

  return (
    <NavigationContext.Provider value={navValue}>
      <RouteContext.Provider value={routeValue}>
        {children}
      </RouteContext.Provider>
    </NavigationContext.Provider>
  );
};

// Safe Area context mock
const SafeAreaContext = React.createContext({
  top: 44,
  right: 0,
  bottom: 34,
  left: 0,
});

export const MockSafeAreaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SafeAreaContext.Provider value={{ top: 44, right: 0, bottom: 34, left: 0 }}>
      {children}
    </SafeAreaContext.Provider>
  );
};

// Theme context mock (for NativeWind/styled components)
const ThemeContext = React.createContext({
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    text: '#000000',
    border: '#E5E5E5',
    error: '#FF3B30',
    success: '#34C759',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
});

export const MockThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

/**
 * All providers combined for comprehensive testing
 */
export const AllProviders: React.FC<{
  children: ReactNode;
  navigation?: Partial<typeof mockNavigation>;
  route?: Partial<typeof mockRoute>;
}> = ({ children, navigation, route }) => {
  return (
    <MockQueryClientProvider>
      <MockSafeAreaProvider>
        <MockNavigationProvider navigation={navigation} route={route}>
          <MockThemeProvider>
            {children}
          </MockThemeProvider>
        </MockNavigationProvider>
      </MockSafeAreaProvider>
    </MockQueryClientProvider>
  );
};

/**
 * Custom render function with all providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    navigation?: Partial<typeof mockNavigation>;
    route?: Partial<typeof mockRoute>;
  }
) {
  const { navigation, route } = options || {};

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AllProviders navigation={navigation} route={route}>
      {children}
    </AllProviders>
  );

  // Note: In actual usage, this would use @testing-library/react-native's render
  // For now, we export the wrapper for use with the actual render function
  return { Wrapper };
}

// Export mock objects for direct use in tests
export { mockNavigation, mockRoute, mockQueryClient };
