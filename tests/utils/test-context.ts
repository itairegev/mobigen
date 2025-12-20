/**
 * Test Context Utilities
 *
 * Creates mock tRPC context for API testing
 */

import { createMockPrisma, MockPrisma, createMockUser, createMockProject, createMockBuild } from './mock-prisma';

export interface TestContext {
  prisma: MockPrisma;
  userId?: string;
}

/**
 * Create a test context for unauthenticated requests
 */
export function createPublicContext(): TestContext {
  return {
    prisma: createMockPrisma(),
    userId: undefined,
  };
}

/**
 * Create a test context for authenticated requests
 */
export function createAuthenticatedContext(userId?: string): TestContext {
  const prisma = createMockPrisma();
  const user = createMockUser({ id: userId });
  prisma._store.users.push(user);

  return {
    prisma,
    userId: user.id,
  };
}

/**
 * Create a fully populated test context with sample data
 */
export function createPopulatedContext() {
  const prisma = createMockPrisma();

  // Create users
  const user1 = createMockUser({ id: 'user-1', email: 'user1@test.com', name: 'User One' });
  const user2 = createMockUser({ id: 'user-2', email: 'user2@test.com', name: 'User Two' });
  prisma._store.users.push(user1, user2);

  // Create projects
  const project1 = createMockProject(user1.id, {
    id: 'project-1',
    name: 'My News App',
    templateId: 'news',
    status: 'active',
  });
  const project2 = createMockProject(user1.id, {
    id: 'project-2',
    name: 'E-commerce Store',
    templateId: 'ecommerce',
    status: 'draft',
  });
  const project3 = createMockProject(user2.id, {
    id: 'project-3',
    name: 'User 2 App',
    templateId: 'base',
    status: 'draft',
  });
  prisma._store.projects.push(project1, project2, project3);

  // Create builds
  const build1 = createMockBuild(project1.id, {
    id: 'build-1',
    platform: 'ios',
    status: 'success',
    version: 1,
  });
  const build2 = createMockBuild(project1.id, {
    id: 'build-2',
    platform: 'android',
    status: 'building',
    version: 1,
  });
  prisma._store.builds.push(build1, build2);

  return {
    prisma,
    users: { user1, user2 },
    projects: { project1, project2, project3 },
    builds: { build1, build2 },
  };
}

/**
 * Assert that an error matches expected tRPC error
 */
export function assertTRPCError(error: unknown, code: string, messagePattern?: RegExp) {
  const err = error as { code?: string; message?: string };
  expect(err.code).toBe(code);
  if (messagePattern) {
    expect(err.message).toMatch(messagePattern);
  }
}
