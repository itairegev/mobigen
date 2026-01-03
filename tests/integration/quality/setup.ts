/**
 * Test Setup and Teardown for Integration Tests
 */

import * as fs from 'fs-extra';
import * as path from 'path';

// Test directories
export const TEST_BASE_DIR = '/tmp/mobigen-integration-tests';
export const TEST_PROJECTS_DIR = path.join(TEST_BASE_DIR, 'projects');
export const TEST_TEMPLATES_DIR = path.join(TEST_BASE_DIR, 'templates');

/**
 * Global test setup
 * Called once before all tests
 */
export async function globalSetup(): Promise<void> {
  console.log('[setup] Running global test setup...');

  // Create test directories
  await fs.ensureDir(TEST_BASE_DIR);
  await fs.ensureDir(TEST_PROJECTS_DIR);
  await fs.ensureDir(TEST_TEMPLATES_DIR);

  // Set environment variables for testing
  process.env.MOBIGEN_ROOT = TEST_BASE_DIR;
  process.env.MOBIGEN_TEST_MODE = 'true';
  process.env.NODE_ENV = 'test';

  console.log('[setup] Test directories created:', {
    base: TEST_BASE_DIR,
    projects: TEST_PROJECTS_DIR,
    templates: TEST_TEMPLATES_DIR,
  });

  // Copy templates if needed (optional - tests can use mocks)
  // await copyTemplates();
}

/**
 * Global test teardown
 * Called once after all tests
 */
export async function globalTeardown(): Promise<void> {
  console.log('[teardown] Running global test teardown...');

  // Clean up test directories (optional - keep for debugging)
  // await fs.remove(TEST_BASE_DIR);

  console.log('[teardown] Test cleanup complete');
  console.log(`[teardown] Test artifacts preserved at: ${TEST_BASE_DIR}`);
}

/**
 * Before each test
 */
export async function beforeEach(): Promise<void> {
  // Individual test setup if needed
}

/**
 * After each test
 */
export async function afterEach(): Promise<void> {
  // Individual test cleanup if needed
}

/**
 * Copy templates for testing (if not using mocks)
 */
async function copyTemplates(): Promise<void> {
  const realTemplatesDir = path.join(__dirname, '../../../templates-bare');

  if (await fs.pathExists(realTemplatesDir)) {
    console.log('[setup] Copying templates for testing...');
    await fs.copy(realTemplatesDir, TEST_TEMPLATES_DIR);
    console.log('[setup] Templates copied successfully');
  } else {
    console.log('[setup] No templates to copy - tests will use mocks');
  }
}

/**
 * Mock AI SDK query function for testing
 */
export function mockQueryFunction() {
  // This would be used to mock the Claude Agent SDK query() function
  // For now, tests will run against real orchestrator or use different mocking strategy
  return jest.fn();
}

/**
 * Create test logger that captures output
 */
export function createTestLogger() {
  const logs: string[] = [];

  return {
    log: (...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    },
    error: (...args: unknown[]) => {
      logs.push(`ERROR: ${args.map(String).join(' ')}`);
    },
    warn: (...args: unknown[]) => {
      logs.push(`WARN: ${args.map(String).join(' ')}`);
    },
    getLogs: () => logs,
    clear: () => {
      logs.length = 0;
    },
  };
}

/**
 * Wait for async operations to settle
 */
export async function waitForSettled(ms: number = 100): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a spy for progress events
 */
export function createProgressSpy() {
  const events: Array<{ type: string; data: unknown }> = [];

  return {
    emit: (type: string, data: unknown) => {
      events.push({ type, data });
    },
    getEvents: () => events,
    getEventsByType: (type: string) => events.filter(e => e.type === type),
    clear: () => {
      events.length = 0;
    },
  };
}
