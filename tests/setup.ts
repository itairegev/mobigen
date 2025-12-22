/**
 * Vitest Test Setup
 *
 * Mocks external dependencies and sets up test environment
 */

import { vi, beforeAll, afterAll } from 'vitest';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from monorepo root FIRST (for E2E tests that need real database)
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Set test environment variables ONLY if not already set by .env
// This allows E2E tests to use real database while unit tests use mocks
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/mobigen_test';
process.env.NODE_ENV = 'test';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-api-key';
process.env.S3_BUCKET = process.env.S3_BUCKET || 'mobigen-test-bucket';
process.env.GENERATOR_URL = process.env.GENERATOR_URL || 'http://localhost:4000';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Enable verbose logging for debugging in tests
process.env.CLAUDE_SDK_VERBOSE = process.env.CLAUDE_SDK_VERBOSE || 'true';
process.env.GENERATOR_DEBUG = process.env.GENERATOR_DEBUG || 'true';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

// Set MOBIGEN_ROOT for proper path resolution
process.env.MOBIGEN_ROOT = process.env.MOBIGEN_ROOT || path.join(__dirname, '..');

// Only mock console for unit tests, not E2E (check if running E2E by looking at test file path)
const isE2E = process.argv.some(arg => arg.includes('e2e'));

const originalConsole = { ...console };
beforeAll(() => {
  if (!isE2E) {
    console.log = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
  }
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
});

// Note: Test timeout is configured in vitest.config.ts
