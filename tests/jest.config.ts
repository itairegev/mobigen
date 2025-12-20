import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@mobigen/api$': '<rootDir>/packages/api/src',
    '^@mobigen/db$': '<rootDir>/packages/db/src',
    '^@mobigen/ai$': '<rootDir>/packages/ai/src',
    '^@mobigen/storage$': '<rootDir>/packages/storage/src',
    '^@mobigen/testing$': '<rootDir>/packages/testing/src',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'services/*/src/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  verbose: true,
  testTimeout: 30000,
};

export default config;
