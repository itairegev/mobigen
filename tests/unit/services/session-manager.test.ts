/**
 * Session Manager Unit Tests
 *
 * Tests for session duration calculation and session lifecycle
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma before importing the session manager
const mockPrisma = {
  project: {
    update: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  projectSession: {
    create: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock('@mobigen/db', () => ({
  prisma: mockPrisma,
}));

// Import after mocking
import { endSession, saveSession, getSession } from '../../../services/generator/src/session-manager';

describe('SessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('endSession', () => {
    it('should calculate correct duration in seconds', async () => {
      const projectId = 'test-project-1';
      const sessionId = 'test-session-1';

      // Session started 100 seconds ago
      const sessionStartTime = new Date(Date.now() - 100000);

      mockPrisma.projectSession.findFirst.mockResolvedValue({
        createdAt: sessionStartTime,
      });

      mockPrisma.projectSession.updateMany.mockResolvedValue({ count: 1 });

      await endSession(projectId, sessionId, 'Test summary', ['file1.ts'], 1000);

      // Verify updateMany was called with correct duration
      expect(mockPrisma.projectSession.updateMany).toHaveBeenCalledWith({
        where: {
          projectId,
          claudeSessionId: sessionId,
          endedAt: null,
        },
        data: expect.objectContaining({
          durationSeconds: 100, // 100000ms / 1000 = 100 seconds
          summary: 'Test summary',
          filesModified: ['file1.ts'],
          tokensUsed: 1000,
        }),
      });
    });

    it('should handle session not found gracefully', async () => {
      mockPrisma.projectSession.findFirst.mockResolvedValue(null);
      mockPrisma.projectSession.updateMany.mockResolvedValue({ count: 0 });

      await endSession('no-project', 'no-session', 'Test', [], 0);

      // Should still call updateMany, duration will be 0
      expect(mockPrisma.projectSession.updateMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        data: expect.objectContaining({
          durationSeconds: 0,
        }),
      });
    });

    it('should correctly calculate duration for longer sessions', async () => {
      const projectId = 'test-project-2';
      const sessionId = 'test-session-2';

      // Session started 30 minutes ago (1800 seconds)
      const sessionStartTime = new Date(Date.now() - 1800000);

      mockPrisma.projectSession.findFirst.mockResolvedValue({
        createdAt: sessionStartTime,
      });

      mockPrisma.projectSession.updateMany.mockResolvedValue({ count: 1 });

      await endSession(projectId, sessionId, 'Long session', [], 5000);

      expect(mockPrisma.projectSession.updateMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        data: expect.objectContaining({
          durationSeconds: 1800, // 30 minutes
        }),
      });
    });
  });

  describe('saveSession', () => {
    it('should save session with 24 hour expiry', async () => {
      const projectId = 'test-project';
      const sessionId = 'test-session';

      mockPrisma.project.update.mockResolvedValue({ id: projectId });
      mockPrisma.projectSession.create.mockResolvedValue({ id: 'new-session' });

      const now = Date.now();
      vi.setSystemTime(now);

      await saveSession(projectId, sessionId);

      // Verify project update includes session expiry
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          claudeSessionId: sessionId,
          sessionExpiresAt: expect.any(Date),
        },
      });

      // Verify expiry is ~24 hours from now
      const updateCall = mockPrisma.project.update.mock.calls[0][0];
      const expiryTime = updateCall.data.sessionExpiresAt.getTime();
      const expectedExpiry = now + 24 * 60 * 60 * 1000;

      expect(expiryTime).toBe(expectedExpiry);
    });
  });

  describe('getSession', () => {
    it('should return session ID if valid', async () => {
      const projectId = 'test-project';
      const sessionId = 'valid-session';

      // Session expires in the future
      const futureExpiry = new Date(Date.now() + 60000);

      mockPrisma.project.findUnique.mockResolvedValue({
        claudeSessionId: sessionId,
        sessionExpiresAt: futureExpiry,
      });

      const result = await getSession(projectId);

      expect(result).toBe(sessionId);
    });

    it('should return undefined for expired session', async () => {
      const projectId = 'test-project';

      // Session expired in the past
      const pastExpiry = new Date(Date.now() - 60000);

      mockPrisma.project.findUnique.mockResolvedValue({
        claudeSessionId: 'expired-session',
        sessionExpiresAt: pastExpiry,
      });

      const result = await getSession(projectId);

      expect(result).toBeUndefined();
    });

    it('should return undefined if no session exists', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const result = await getSession('no-project');

      expect(result).toBeUndefined();
    });
  });
});
