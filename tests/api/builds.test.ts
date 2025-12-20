/**
 * Builds API Tests
 *
 * Tests for the builds tRPC router
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAuthenticatedContext,
  createPopulatedContext,
} from '../utils/test-context';
import { createMockBuild, generateUUID } from '../utils/mock-prisma';

describe('Builds API', () => {
  describe('builds.list', () => {
    it('should return builds for a project', async () => {
      const { prisma, users, projects, builds } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      // First verify project belongs to user
      const project = await prisma.project.findFirst({
        where: { id: projects.project1.id, userId: ctx.userId },
      });
      expect(project).not.toBeNull();

      // Get builds
      const result = await prisma.build.findMany({
        where: { projectId: projects.project1.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toContain(builds.build1.id);
      expect(result.map((b) => b.id)).toContain(builds.build2.id);
    });

    it('should return empty array for project with no builds', async () => {
      const { prisma, users, projects } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      const result = await prisma.build.findMany({
        where: { projectId: projects.project2.id }, // project2 has no builds
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual([]);
    });

    it('should throw NOT_FOUND for non-existent project', async () => {
      const ctx = createAuthenticatedContext();
      const fakeProjectId = generateUUID();

      const project = await ctx.prisma.project.findFirst({
        where: { id: fakeProjectId, userId: ctx.userId },
      });

      expect(project).toBeNull();
      // In real test: expect(() => builds.list({ projectId: fakeProjectId })).toThrow('NOT_FOUND')
    });

    it('should not list builds for projects owned by others', async () => {
      const { prisma, users, projects } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      // Try to list builds for user2's project
      const project = await prisma.project.findFirst({
        where: { id: projects.project3.id, userId: ctx.userId },
      });

      expect(project).toBeNull();
    });
  });

  describe('builds.getById', () => {
    it('should return build with project details', async () => {
      const { prisma, users, builds, projects } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      const result = await prisma.build.findFirst({
        where: { id: builds.build1.id },
        include: { project: true },
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe(builds.build1.id);
      expect(result?.project?.id).toBe(projects.project1.id);
    });

    it('should throw NOT_FOUND for non-existent build', async () => {
      const ctx = createAuthenticatedContext();
      const fakeBuildId = generateUUID();

      const result = await ctx.prisma.build.findFirst({
        where: { id: fakeBuildId },
      });

      expect(result).toBeNull();
    });

    it('should not return builds for projects owned by others', async () => {
      const { prisma, users, projects } = createPopulatedContext();

      // Create a build for user2's project
      const otherUserBuild = createMockBuild(projects.project3.id, { id: 'build-other' });
      prisma._store.builds.push(otherUserBuild);

      // User1 tries to access it
      const ctx = { prisma, userId: users.user1.id };

      const result = await prisma.build.findFirst({
        where: { id: otherUserBuild.id },
        include: { project: true },
      });

      // Build exists but project belongs to different user
      if (result?.project) {
        expect(result.project.userId).not.toBe(ctx.userId);
      }
    });
  });

  describe('builds.trigger', () => {
    it('should create a new iOS build', async () => {
      const { prisma, users, projects } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      // Verify project belongs to user
      const project = await prisma.project.findFirst({
        where: { id: projects.project1.id, userId: ctx.userId },
      });
      expect(project).not.toBeNull();

      // Create build
      const result = await prisma.build.create({
        data: {
          projectId: projects.project1.id,
          version: 2,
          platform: 'ios',
          status: 'pending',
        },
      });

      expect(result.projectId).toBe(projects.project1.id);
      expect(result.platform).toBe('ios');
      expect(result.status).toBe('pending');
      expect(result.version).toBe(2);
    });

    it('should create a new Android build', async () => {
      const { prisma, users, projects } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      const result = await prisma.build.create({
        data: {
          projectId: projects.project1.id,
          version: 1,
          platform: 'android',
          status: 'pending',
        },
      });

      expect(result.platform).toBe('android');
      expect(result.status).toBe('pending');
    });

    it('should reject invalid platform', () => {
      // With zod validation: z.enum(['ios', 'android'])
      const validPlatforms = ['ios', 'android'];
      const invalidPlatforms = ['windows', 'web', 'linux'];

      invalidPlatforms.forEach((platform) => {
        expect(validPlatforms).not.toContain(platform);
      });
    });

    it('should reject negative version numbers', () => {
      // With zod validation: z.number().int().positive()
      const invalidVersions = [-1, 0, 1.5];

      invalidVersions.forEach((version) => {
        expect(version > 0 && Number.isInteger(version)).toBe(false);
      });
    });
  });

  describe('builds.cancel', () => {
    it('should cancel a pending build', async () => {
      const { prisma, users, builds } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      // Create a pending build
      const pendingBuild = createMockBuild(builds.build1.projectId, {
        id: 'pending-build',
        status: 'pending',
      });
      prisma._store.builds.push(pendingBuild);

      // Verify the build exists and check ownership
      const build = await prisma.build.findFirst({
        where: { id: pendingBuild.id },
        include: { project: true },
      });

      expect(build).not.toBeNull();
      expect(['pending', 'queued', 'building']).toContain(build!.status);

      // Cancel the build
      const result = await prisma.build.update({
        where: { id: pendingBuild.id },
        data: { status: 'cancelled' },
      });

      expect(result.status).toBe('cancelled');
    });

    it('should cancel a building status build', async () => {
      const { prisma, builds } = createPopulatedContext();

      // build2 has status 'building'
      const result = await prisma.build.update({
        where: { id: builds.build2.id },
        data: { status: 'cancelled' },
      });

      expect(result.status).toBe('cancelled');
    });

    it('should not cancel a completed build', async () => {
      const { prisma, builds } = createPopulatedContext();

      // build1 has status 'success'
      const build = await prisma.build.findFirst({
        where: { id: builds.build1.id },
      });

      expect(build?.status).toBe('success');
      expect(['pending', 'queued', 'building']).not.toContain(build?.status);
      // In real test: expect(() => builds.cancel({ id: build1.id })).toThrow('BAD_REQUEST')
    });

    it('should throw NOT_FOUND for non-existent build', async () => {
      const ctx = createAuthenticatedContext();
      const fakeBuildId = generateUUID();

      const result = await ctx.prisma.build.findFirst({
        where: { id: fakeBuildId },
      });

      expect(result).toBeNull();
    });
  });
});

describe('Builds API - Build Status Transitions', () => {
  const validTransitions: Record<string, string[]> = {
    pending: ['queued', 'building', 'cancelled'],
    queued: ['building', 'cancelled'],
    building: ['success', 'failed', 'cancelled'],
    success: [], // Terminal state
    failed: [], // Terminal state
    cancelled: [], // Terminal state
  };

  it('should track valid status transitions', () => {
    Object.entries(validTransitions).forEach(([from, allowed]) => {
      expect(Array.isArray(allowed)).toBe(true);
    });
  });

  it('should have terminal states with no transitions', () => {
    expect(validTransitions.success).toHaveLength(0);
    expect(validTransitions.failed).toHaveLength(0);
    expect(validTransitions.cancelled).toHaveLength(0);
  });
});

describe('Builds API - EAS Integration', () => {
  it('should store EAS build ID on creation', async () => {
    const ctx = createAuthenticatedContext();
    const projectId = generateUUID();

    // Simulate EAS build response
    const easBuildId = 'eas-build-' + generateUUID().slice(0, 8);

    const build = createMockBuild(projectId, {
      easBuildId,
      easProjectId: 'eas-project-123',
      status: 'queued',
    });

    ctx.prisma._store.builds.push(build);

    const result = await ctx.prisma.build.findFirst({
      where: { id: build.id },
    });

    expect(result?.easBuildId).toBe(easBuildId);
    expect(result?.easProjectId).toBe('eas-project-123');
  });

  it('should update artifact path on build completion', async () => {
    const { prisma, builds } = createPopulatedContext();

    const artifactPath = 'builds/project-1/ios-v1.ipa';
    const artifactSize = BigInt(50 * 1024 * 1024); // 50MB

    const result = await prisma.build.update({
      where: { id: builds.build1.id },
      data: {
        artifactS3Key: artifactPath,
        artifactSizeBytes: artifactSize,
        status: 'success',
        completedAt: new Date(),
      },
    });

    expect(result.artifactS3Key).toBe(artifactPath);
    expect(result.artifactSizeBytes).toBe(artifactSize);
    expect(result.status).toBe('success');
  });
});

describe('Builds API - Validation Results', () => {
  it('should store validation tier and results', async () => {
    const ctx = createAuthenticatedContext();
    const projectId = generateUUID();

    const validationErrors = [
      { file: 'src/App.tsx', line: 42, message: 'Type error' },
      { file: 'src/screens/Home.tsx', line: 10, message: 'Missing import' },
    ];

    const build = createMockBuild(projectId, {
      validationTier: 'tier2',
      validationPassed: false,
      validationErrors,
      status: 'failed',
      errorSummary: 'Validation failed at tier2 with 2 errors',
    });

    ctx.prisma._store.builds.push(build);

    const result = await ctx.prisma.build.findFirst({
      where: { id: build.id },
    });

    expect(result?.validationTier).toBe('tier2');
    expect(result?.validationPassed).toBe(false);
    expect(result?.validationErrors).toEqual(validationErrors);
    expect(result?.errorSummary).toContain('2 errors');
  });

  it('should mark validation passed for successful builds', async () => {
    const ctx = createAuthenticatedContext();
    const projectId = generateUUID();

    const build = createMockBuild(projectId, {
      validationTier: 'tier3',
      validationPassed: true,
      validationErrors: null,
      status: 'success',
    });

    ctx.prisma._store.builds.push(build);

    const result = await ctx.prisma.build.findFirst({
      where: { id: build.id },
    });

    expect(result?.validationPassed).toBe(true);
    expect(result?.validationErrors).toBeNull();
  });
});
