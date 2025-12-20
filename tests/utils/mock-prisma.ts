/**
 * Mock Prisma Client for Testing
 *
 * Creates a mock Prisma client with common methods stubbed
 */

import { vi } from 'vitest';

// Type definitions for our mock data
export interface MockUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  passwordHash: string | null;
  tier: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: Date | null;
}

export interface MockProject {
  id: string;
  userId: string;
  name: string;
  templateId: string | null;
  status: string;
  config: Record<string, unknown>;
  bundleIdIos: string | null;
  bundleIdAndroid: string | null;
  branding: Record<string, unknown>;
  s3Bucket: string;
  s3Prefix: string;
  currentVersion: number;
  claudeSessionId: string | null;
  sessionExpiresAt: Date | null;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  builds?: MockBuild[];
}

export interface MockBuild {
  id: string;
  projectId: string;
  version: number;
  platform: string;
  status: string;
  easBuildId: string | null;
  easProjectId: string | null;
  artifactS3Key: string | null;
  artifactSizeBytes: bigint | null;
  logsS3Key: string | null;
  errorSummary: string | null;
  validationTier: string | null;
  validationPassed: boolean | null;
  validationErrors: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  project?: MockProject;
}

export interface MockUsageEvent {
  id: string;
  userId: string;
  projectId: string | null;
  eventType: string;
  creditsUsed: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// Helper to generate UUIDs
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to remove undefined values from overrides
function cleanOverrides<T extends Record<string, unknown>>(overrides: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(overrides).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
}

// Factory functions for creating mock data
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const cleaned = cleanOverrides(overrides);
  return {
    id: generateUUID(),
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    passwordHash: null,
    tier: 'basic',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: null,
    ...cleaned,
  };
}

export function createMockProject(userId: string, overrides: Partial<MockProject> = {}): MockProject {
  const id = generateUUID();
  return {
    id,
    userId,
    name: 'Test Project',
    templateId: 'base',
    status: 'draft',
    config: {},
    bundleIdIos: `com.test.app.${id.slice(0, 8)}`,
    bundleIdAndroid: `com.test.app.${id.slice(0, 8)}`,
    branding: {
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
    },
    s3Bucket: 'mobigen-test-bucket',
    s3Prefix: `projects/${id}`,
    currentVersion: 1,
    claudeSessionId: null,
    sessionExpiresAt: null,
    lastAccessedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    builds: [],
    ...overrides,
  };
}

export function createMockBuild(projectId: string, overrides: Partial<MockBuild> = {}): MockBuild {
  return {
    id: generateUUID(),
    projectId,
    version: 1,
    platform: 'ios',
    status: 'pending',
    easBuildId: null,
    easProjectId: null,
    artifactS3Key: null,
    artifactSizeBytes: null,
    logsS3Key: null,
    errorSummary: null,
    validationTier: null,
    validationPassed: null,
    validationErrors: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockUsageEvent(userId: string, overrides: Partial<MockUsageEvent> = {}): MockUsageEvent {
  return {
    id: generateUUID(),
    userId,
    projectId: null,
    eventType: 'generation',
    creditsUsed: 10,
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  };
}

// Create mock Prisma client
export function createMockPrisma() {
  const mockUsers: MockUser[] = [];
  const mockProjects: MockProject[] = [];
  const mockBuilds: MockBuild[] = [];
  const mockUsageEvents: MockUsageEvent[] = [];

  return {
    // Store refs for tests to populate
    _store: {
      users: mockUsers,
      projects: mockProjects,
      builds: mockBuilds,
      usageEvents: mockUsageEvents,
    },

    user: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) return mockUsers.find((u) => u.id === where.id) || null;
        if (where.email) return mockUsers.find((u) => u.email === where.email) || null;
        return null;
      }),
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return mockUsers.find((u) => Object.entries(where).every(([k, v]) => (u as Record<string, unknown>)[k] === v)) || null;
      }),
      findMany: vi.fn(async () => mockUsers),
      create: vi.fn(async ({ data }: { data: Partial<MockUser> }) => {
        const user = createMockUser(data);
        mockUsers.push(user);
        return user;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockUser> }) => {
        const idx = mockUsers.findIndex((u) => u.id === where.id);
        if (idx === -1) throw new Error('User not found');
        mockUsers[idx] = { ...mockUsers[idx], ...data, updatedAt: new Date() };
        return mockUsers[idx];
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const idx = mockUsers.findIndex((u) => u.id === where.id);
        if (idx === -1) throw new Error('User not found');
        const [deleted] = mockUsers.splice(idx, 1);
        return deleted;
      }),
    },

    project: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string } }) => {
        return mockProjects.find((p) => p.id === where.id) || null;
      }),
      findFirst: vi.fn(async ({ where, include }: { where: Record<string, unknown>; include?: Record<string, unknown> }) => {
        const project = mockProjects.find((p) =>
          Object.entries(where).every(([k, v]) => (p as Record<string, unknown>)[k] === v)
        );
        if (!project) return null;

        if (include?.builds) {
          return { ...project, builds: mockBuilds.filter((b) => b.projectId === project.id) };
        }
        return project;
      }),
      findMany: vi.fn(async ({ where, orderBy, include }: {
        where?: Record<string, unknown>;
        orderBy?: Record<string, string>;
        include?: Record<string, unknown>;
      }) => {
        let result = where
          ? mockProjects.filter((p) =>
              Object.entries(where).every(([k, v]) => (p as Record<string, unknown>)[k] === v)
            )
          : [...mockProjects];

        if (include?.builds) {
          result = result.map((p) => ({
            ...p,
            builds: mockBuilds.filter((b) => b.projectId === p.id).slice(0, 1),
          }));
        }

        return result;
      }),
      create: vi.fn(async ({ data }: { data: Partial<MockProject> & { userId: string } }) => {
        const project = createMockProject(data.userId, data);
        mockProjects.push(project);
        return project;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockProject> }) => {
        const idx = mockProjects.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error('Project not found');
        mockProjects[idx] = { ...mockProjects[idx], ...data, updatedAt: new Date() };
        return mockProjects[idx];
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const idx = mockProjects.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error('Project not found');
        const [deleted] = mockProjects.splice(idx, 1);
        return deleted;
      }),
      deleteMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        const toDelete = mockProjects.filter((p) =>
          Object.entries(where).every(([k, v]) => (p as Record<string, unknown>)[k] === v)
        );
        toDelete.forEach((p) => {
          const idx = mockProjects.indexOf(p);
          if (idx !== -1) mockProjects.splice(idx, 1);
        });
        return { count: toDelete.length };
      }),
    },

    build: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string } }) => {
        return mockBuilds.find((b) => b.id === where.id) || null;
      }),
      findFirst: vi.fn(async ({ where, include }: { where: Record<string, unknown>; include?: Record<string, unknown> }) => {
        const build = mockBuilds.find((b) =>
          Object.entries(where).every(([k, v]) => (b as Record<string, unknown>)[k] === v)
        );
        if (!build) return null;

        if (include?.project) {
          const project = mockProjects.find((p) => p.id === build.projectId);
          return { ...build, project };
        }
        return build;
      }),
      findMany: vi.fn(async ({ where, orderBy }: { where?: Record<string, unknown>; orderBy?: Record<string, string> }) => {
        let result = where
          ? mockBuilds.filter((b) =>
              Object.entries(where).every(([k, v]) => (b as Record<string, unknown>)[k] === v)
            )
          : [...mockBuilds];
        return result;
      }),
      create: vi.fn(async ({ data }: { data: Partial<MockBuild> & { projectId: string } }) => {
        const build = createMockBuild(data.projectId, data);
        mockBuilds.push(build);
        return build;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockBuild> }) => {
        const idx = mockBuilds.findIndex((b) => b.id === where.id);
        if (idx === -1) throw new Error('Build not found');
        mockBuilds[idx] = { ...mockBuilds[idx], ...data };
        return mockBuilds[idx];
      }),
      deleteMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        const toDelete = mockBuilds.filter((b) =>
          Object.entries(where).every(([k, v]) => (b as Record<string, unknown>)[k] === v)
        );
        toDelete.forEach((b) => {
          const idx = mockBuilds.indexOf(b);
          if (idx !== -1) mockBuilds.splice(idx, 1);
        });
        return { count: toDelete.length };
      }),
    },

    usageEvent: {
      findMany: vi.fn(async ({ where }: { where?: Record<string, unknown> }) => {
        if (!where) return [...mockUsageEvents];
        return mockUsageEvents.filter((e) =>
          Object.entries(where).every(([k, v]) => {
            if (k === 'createdAt') return true; // Skip date filtering in mock
            return (e as Record<string, unknown>)[k] === v;
          })
        );
      }),
      create: vi.fn(async ({ data }: { data: Partial<MockUsageEvent> & { userId: string } }) => {
        const event = createMockUsageEvent(data.userId, data);
        mockUsageEvents.push(event);
        return event;
      }),
      deleteMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        const toDelete = mockUsageEvents.filter((e) =>
          Object.entries(where).every(([k, v]) => (e as Record<string, unknown>)[k] === v)
        );
        toDelete.forEach((e) => {
          const idx = mockUsageEvents.indexOf(e);
          if (idx !== -1) mockUsageEvents.splice(idx, 1);
        });
        return { count: toDelete.length };
      }),
    },

    session: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },

    account: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },

    $transaction: vi.fn(async (operations: Promise<unknown>[]) => {
      return Promise.all(operations);
    }),
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
