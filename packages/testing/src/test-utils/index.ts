/**
 * Test utilities for Mobigen templates
 *
 * Provides mock providers, helpers, and utilities for testing React Native components.
 */

// Providers
export * from './providers';

// Helpers
export * from './helpers';

// Mocks
export * from './mocks';

// Setup function for test environments
import { setupReactNativeMocks } from './mocks/react-native';
import { setupExpoMocks } from './mocks/expo';

/**
 * Setup all mocks for testing
 * Call this in your jest.setup.js or at the top of test files
 */
export function setupTestEnvironment() {
  setupReactNativeMocks();
  setupExpoMocks();
}

/**
 * Jest configuration helper
 */
export const jestConfig = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@tanstack/.*|lucide-react-native)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
