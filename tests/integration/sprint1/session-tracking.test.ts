/**
 * Sprint 1 Integration Tests: Session Tracking
 *
 * Tests that session duration is correctly calculated and stored
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to ensure mocks are available before module loading
const mocks = vi.hoisted(() => ({
  projectUpdate: vi.fn(),
  projectFindUnique: vi.fn(),
  projectUpdateMany: vi.fn(),
  projectSessionCreate: vi.fn(),
  projectSessionFindFirst: vi.fn(),
  projectSessionUpdateMany: vi.fn(),
}));

// Mock Prisma using hoisted mocks
vi.mock('@mobigen/db', () => ({
  prisma: {
    project: {
      update: mocks.projectUpdate,
      findUnique: mocks.projectFindUnique,
      updateMany: mocks.projectUpdateMany,
    },
    projectSession: {
      create: mocks.projectSessionCreate,
      findFirst: mocks.projectSessionFindFirst,
      updateMany: mocks.projectSessionUpdateMany,
    },
  },
}));

// Import after mocking
import {
  saveSession,
  getSession,
  endSession,
} from '../../../services/generator/src/session-manager';

describe('Sprint 1: Session Tracking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Session Lifecycle', () => {
    it('should track complete session lifecycle with correct duration', async () => {
      const projectId = 'test-project-lifecycle';
      const sessionId = 'session-lifecycle-1';

      // 1. Start session - simulate creation at time T
      const sessionStartTime = new Date();
      vi.setSystemTime(sessionStartTime);

      mocks.projectUpdate.mockResolvedValue({ id: projectId });
      mocks.projectSessionCreate.mockResolvedValue({
        id: 'db-session-1',
        claudeSessionId: sessionId,
        createdAt: sessionStartTime,
      });

      await saveSession(projectId, sessionId);

      expect(mocks.projectUpdate).toHaveBeenCalledWith({
        where: { id: projectId },
        data: expect.objectContaining({
          claudeSessionId: sessionId,
        }),
      });

      // 2. Advance time by 5 minutes
      const fiveMinutesLater = new Date(sessionStartTime.getTime() + 5 * 60 * 1000);
      vi.setSystemTime(fiveMinutesLater);

      // 3. Get session - should still be valid
      mocks.projectFindUnique.mockResolvedValue({
        claudeSessionId: sessionId,
        sessionExpiresAt: new Date(sessionStartTime.getTime() + 24 * 60 * 60 * 1000),
      });

      const retrievedSession = await getSession(projectId);
      expect(retrievedSession).toBe(sessionId);

      // 4. End session
      mocks.projectSessionFindFirst.mockResolvedValue({
        createdAt: sessionStartTime,
      });
      mocks.projectSessionUpdateMany.mockResolvedValue({ count: 1 });

      await endSession(projectId, sessionId, 'Test completed', ['file1.ts'], 1000);

      // 5. Verify duration was calculated correctly (5 minutes = 300 seconds)
      expect(mocks.projectSessionUpdateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          projectId,
          claudeSessionId: sessionId,
        }),
        data: expect.objectContaining({
          durationSeconds: 300, // 5 minutes
          summary: 'Test completed',
          filesModified: ['file1.ts'],
          tokensUsed: 1000,
        }),
      });
    });

    it('should expire sessions after 24 hours', async () => {
      const projectId = 'test-project-expired';

      // Session expired 1 hour ago
      const expiredTime = new Date(Date.now() - 60 * 60 * 1000);

      mocks.projectFindUnique.mockResolvedValue({
        claudeSessionId: 'expired-session',
        sessionExpiresAt: expiredTime,
      });

      const result = await getSession(projectId);

      expect(result).toBeUndefined();
    });

    it('should handle long-running sessions (1 hour)', async () => {
      const projectId = 'test-project-long';
      const sessionId = 'session-long-1';

      // Session started 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      mocks.projectSessionFindFirst.mockResolvedValue({
        createdAt: oneHourAgo,
      });
      mocks.projectSessionUpdateMany.mockResolvedValue({ count: 1 });

      await endSession(projectId, sessionId, 'Long session', [], 5000);

      expect(mocks.projectSessionUpdateMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        data: expect.objectContaining({
          durationSeconds: 3600, // 1 hour = 3600 seconds
        }),
      });
    });

    it('should track files modified in session', async () => {
      const projectId = 'test-project-files';
      const sessionId = 'session-files-1';
      const filesModified = [
        'src/App.tsx',
        'src/screens/Home.tsx',
        'src/components/Button.tsx',
        'package.json',
      ];

      mocks.projectSessionFindFirst.mockResolvedValue({
        createdAt: new Date(Date.now() - 1000),
      });
      mocks.projectSessionUpdateMany.mockResolvedValue({ count: 1 });

      await endSession(projectId, sessionId, 'Multiple files', filesModified, 2000);

      expect(mocks.projectSessionUpdateMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        data: expect.objectContaining({
          filesModified,
        }),
      });
    });
  });
});
