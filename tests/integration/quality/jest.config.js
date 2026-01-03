/**
 * Jest Configuration for Quality Integration Tests
 */

module.exports = {
  displayName: 'quality-integration',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],

  // Setup and teardown
  globalSetup: '<rootDir>/setup.ts',
  globalTeardown: '<rootDir>/setup.ts',

  // Timeouts
  testTimeout: 600000, // 10 minutes for integration tests

  // Coverage
  collectCoverageFrom: [
    '../../../services/generator/src/**/*.ts',
    '../../../packages/testing/src/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // Module resolution
  moduleNameMapper: {
    '^@mobigen/(.*)$': '<rootDir>/../../../packages/$1/src',
  },

  // Transform
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        resolveJsonModule: true,
      },
    }],
  },

  // Verbose output
  verbose: true,

  // Run tests serially to avoid conflicts
  maxWorkers: 1,

  // Retry flaky tests
  retry: 1,
};
