/**
 * Test helper utilities
 *
 * Common utilities for testing React Native components.
 */

import { ReactElement } from 'react';

/**
 * Wait for async updates to complete
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock function that resolves with data
 */
export function createMockQuery<T>(data: T, delay: number = 0) {
  return jest.fn().mockImplementation(async () => {
    if (delay > 0) {
      await waitForAsync(delay);
    }
    return data;
  });
}

/**
 * Create a mock function that rejects with error
 */
export function createMockQueryError(error: Error | string, delay: number = 0) {
  return jest.fn().mockImplementation(async () => {
    if (delay > 0) {
      await waitForAsync(delay);
    }
    throw typeof error === 'string' ? new Error(error) : error;
  });
}

/**
 * Mock AsyncStorage
 */
export function createMockAsyncStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: jest.fn((keys: string[]) =>
      Promise.resolve(keys.map(key => [key, store[key] || null]))
    ),
    multiSet: jest.fn((pairs: [string, string][]) => {
      pairs.forEach(([key, value]) => {
        store[key] = value;
      });
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach(key => delete store[key]);
      return Promise.resolve();
    }),
    // For debugging
    _getStore: () => ({ ...store }),
  };
}

/**
 * Mock fetch responses
 */
export function mockFetch(responses: Record<string, any>) {
  const mockFn = jest.fn((url: string, options?: RequestInit) => {
    const response = responses[url];

    if (!response) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
        text: () => Promise.resolve('Not found'),
      });
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    });
  });

  global.fetch = mockFn as any;
  return mockFn;
}

/**
 * Mock console methods
 */
export function mockConsole() {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  const mocks = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    console.log = mocks.log;
    console.warn = mocks.warn;
    console.error = mocks.error;
  });

  afterEach(() => {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  });

  return mocks;
}

/**
 * Create mock navigation params
 */
export function createMockParams<T extends Record<string, any>>(params: T) {
  return {
    params,
    key: 'mock-key',
    name: 'MockScreen',
  };
}

/**
 * Create a mock React Native event
 */
export function createMockEvent(type: string, data?: any) {
  return {
    nativeEvent: data || {},
    currentTarget: {},
    target: {},
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: true,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    persist: jest.fn(),
    timeStamp: Date.now(),
    type,
  };
}

/**
 * Create a mock scroll event
 */
export function createMockScrollEvent(options: {
  x?: number;
  y?: number;
  contentHeight?: number;
  layoutHeight?: number;
} = {}) {
  const { x = 0, y = 0, contentHeight = 1000, layoutHeight = 500 } = options;

  return createMockEvent('scroll', {
    contentOffset: { x, y },
    contentSize: { width: 375, height: contentHeight },
    layoutMeasurement: { width: 375, height: layoutHeight },
  });
}

/**
 * Create a mock touch event
 */
export function createMockTouchEvent(options: {
  x?: number;
  y?: number;
} = {}) {
  const { x = 0, y = 0 } = options;

  return createMockEvent('touch', {
    locationX: x,
    locationY: y,
    pageX: x,
    pageY: y,
    touches: [{ locationX: x, locationY: y, pageX: x, pageY: y }],
  });
}

/**
 * Test ID helpers
 */
export const testIds = {
  button: (name: string) => `${name}-button`,
  input: (name: string) => `${name}-input`,
  text: (name: string) => `${name}-text`,
  list: (name: string) => `${name}-list`,
  item: (name: string, index: number) => `${name}-item-${index}`,
  screen: (name: string) => `${name}-screen`,
  modal: (name: string) => `${name}-modal`,
  loading: (name: string) => `${name}-loading`,
  error: (name: string) => `${name}-error`,
};

/**
 * Assert element has specific style
 */
export function expectStyle(
  element: any,
  style: Record<string, any>
) {
  const elementStyle = element.props?.style || {};
  const flatStyle = Array.isArray(elementStyle)
    ? Object.assign({}, ...elementStyle)
    : elementStyle;

  Object.entries(style).forEach(([key, value]) => {
    expect(flatStyle[key]).toBe(value);
  });
}

/**
 * Create snapshot test helper
 */
export function createSnapshotTest(
  name: string,
  Component: ReactElement
) {
  return () => {
    // Note: Actual snapshot testing requires @testing-library/react-native
    // This is a placeholder that documents the expected structure
    expect(Component).toBeDefined();
  };
}
