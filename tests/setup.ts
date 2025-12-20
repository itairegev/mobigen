/**
 * Vitest Test Setup
 *
 * Mocks external dependencies and sets up test environment
 */

import { vi, beforeAll, afterAll } from 'vitest';

// Set test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/mobigen_test';
process.env.NODE_ENV = 'test';
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.S3_BUCKET = 'mobigen-test-bucket';
process.env.GENERATOR_URL = 'http://localhost:4000';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Mock console for cleaner test output
const originalConsole = { ...console };
beforeAll(() => {
  console.log = vi.fn();
  console.info = vi.fn();
  console.debug = vi.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
});

// Note: Test timeout is configured in vitest.config.ts
