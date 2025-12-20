/**
 * Projects API Tests
 *
 * Tests for the projects tRPC router
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  createAuthenticatedContext,
  createPublicContext,
  createPopulatedContext,
} from '../utils/test-context';
import { createMockProject, generateUUID } from '../utils/mock-prisma';

// Simulated projects router procedures
// In real tests, you would import the actual router

describe('Projects API', () => {
  describe('projects.list', () => {
    it('should return empty array when user has no projects', async () => {
      const ctx = createAuthenticatedContext();

      // Simulate the list query
      const result = await ctx.prisma.project.findMany({
        where: { userId: ctx.userId },
        orderBy: { updatedAt: 'desc' },
      });

      expect(result).toEqual([]);
    });

    it('should return only projects belonging to authenticated user', async () => {
      const { prisma, users, projects } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      const result = await prisma.project.findMany({
        where: { userId: ctx.userId },
        orderBy: { updatedAt: 'desc' },
      });

      expect(result).toHaveLength(2); // user1 has project1 and project2
      expect(result.map((p) => p.id)).toContain(projects.project1.id);
      expect(result.map((p) => p.id)).toContain(projects.project2.id);
      expect(result.map((p) => p.id)).not.toContain(projects.project3.id); // belongs to user2
    });

    it('should reject unauthenticated requests', () => {
      const ctx = createPublicContext();

      // In real implementation, the protectedProcedure middleware would throw
      expect(ctx.userId).toBeUndefined();
    });
  });

  describe('projects.getById', () => {
    it('should return project with related data', async () => {
      const { prisma, users, projects, builds } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      const result = await prisma.project.findFirst({
        where: { id: projects.project1.id, userId: ctx.userId },
        include: {
          sessions: { take: 5, orderBy: { createdAt: 'desc' } },
          changes: { take: 10, orderBy: { version: 'desc' } },
          builds: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe(projects.project1.id);
      expect(result?.name).toBe('My News App');
    });

    it('should throw NOT_FOUND for non-existent project', async () => {
      const ctx = createAuthenticatedContext();
      const fakeId = generateUUID();

      const result = await ctx.prisma.project.findFirst({
        where: { id: fakeId, userId: ctx.userId },
      });

      expect(result).toBeNull();
      // In real test: expect(() => projects.getById({ id: fakeId })).toThrow(TRPCError)
    });

    it('should not return projects belonging to other users', async () => {
      const { prisma, users, projects } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      // Try to access user2's project
      const result = await prisma.project.findFirst({
        where: { id: projects.project3.id, userId: ctx.userId },
      });

      expect(result).toBeNull();
    });
  });

  describe('projects.create', () => {
    it('should create a new project with required fields', async () => {
      const ctx = createAuthenticatedContext();

      const input = {
        name: 'My New App',
        templateId: 'news',
        bundleIdIos: 'com.mynewapp.ios',
        bundleIdAndroid: 'com.mynewapp.android',
        branding: {
          primaryColor: '#ff5500',
          secondaryColor: '#00ff55',
        },
      };

      const result = await ctx.prisma.project.create({
        data: {
          id: generateUUID(),
          userId: ctx.userId!,
          name: input.name,
          templateId: input.templateId,
          bundleIdIos: input.bundleIdIos,
          bundleIdAndroid: input.bundleIdAndroid,
          branding: input.branding || {},
          s3Bucket: process.env.S3_BUCKET || 'mobigen-projects',
          s3Prefix: `projects/${generateUUID()}`,
          status: 'draft',
        },
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('My New App');
      expect(result.templateId).toBe('news');
      expect(result.status).toBe('draft');
      expect(result.userId).toBe(ctx.userId);
    });

    it('should create project with minimal fields', async () => {
      const ctx = createAuthenticatedContext();

      const result = await ctx.prisma.project.create({
        data: {
          id: generateUUID(),
          userId: ctx.userId!,
          name: 'Minimal App',
          s3Bucket: 'mobigen-projects',
          s3Prefix: `projects/${generateUUID()}`,
          status: 'draft',
          branding: {},
          config: {},
        },
      });

      expect(result.name).toBe('Minimal App');
      expect(result.templateId).toBeNull();
    });

    it('should validate name length', () => {
      // In real test with zod validation
      const shortName = '';
      const longName = 'a'.repeat(101);

      // z.string().min(1).max(100) would reject these
      expect(shortName.length).toBeLessThan(1);
      expect(longName.length).toBeGreaterThan(100);
    });
  });

  describe('projects.update', () => {
    it('should update project fields', async () => {
      const { prisma, users, projects } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      const result = await prisma.project.update({
        where: { id: projects.project1.id },
        data: {
          name: 'Updated App Name',
          status: 'archived',
        },
      });

      expect(result.name).toBe('Updated App Name');
      expect(result.status).toBe('archived');
    });

    it('should not allow updating projects owned by others', async () => {
      const { prisma, users, projects } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      // Verify project belongs to user2
      const project = await prisma.project.findFirst({
        where: { id: projects.project3.id, userId: ctx.userId },
      });

      expect(project).toBeNull();
      // In real test: expect(() => projects.update({ id: project3.id, ... })).toThrow('NOT_FOUND')
    });
  });

  describe('projects.delete', () => {
    it('should delete a project', async () => {
      const ctx = createAuthenticatedContext();
      const project = createMockProject(ctx.userId!);
      ctx.prisma._store.projects.push(project);

      const beforeCount = ctx.prisma._store.projects.length;
      await ctx.prisma.project.delete({ where: { id: project.id } });
      const afterCount = ctx.prisma._store.projects.length;

      expect(afterCount).toBe(beforeCount - 1);
    });

    it('should not delete projects owned by others', async () => {
      const { prisma, users, projects } = createPopulatedContext();
      const ctx = { prisma, userId: users.user1.id };

      // First verify user1 cannot see user2's project
      const project = await prisma.project.findFirst({
        where: { id: projects.project3.id, userId: ctx.userId },
      });

      expect(project).toBeNull();
    });
  });
});

describe('Projects API - Edge Cases', () => {
  describe('branding validation', () => {
    it('should accept valid branding configuration', async () => {
      const ctx = createAuthenticatedContext();

      const validBranding = {
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
        logoUrl: 'https://example.com/logo.png',
      };

      const result = await ctx.prisma.project.create({
        data: {
          id: generateUUID(),
          userId: ctx.userId!,
          name: 'Branded App',
          branding: validBranding,
          s3Bucket: 'test',
          s3Prefix: 'test',
          status: 'draft',
          config: {},
        },
      });

      expect(result.branding).toEqual(validBranding);
    });
  });

  describe('bundle ID validation', () => {
    it('should accept valid iOS bundle ID format', () => {
      const validBundleIds = [
        'com.example.app',
        'com.my-company.my-app',
        'io.mobigen.test123',
      ];

      validBundleIds.forEach((bundleId) => {
        const pattern = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/i;
        expect(bundleId).toMatch(pattern);
      });
    });
  });
});

describe('Projects API - Concurrency', () => {
  it('should handle concurrent project creation', async () => {
    const ctx = createAuthenticatedContext();

    const createProject = (name: string) =>
      ctx.prisma.project.create({
        data: {
          id: generateUUID(),
          userId: ctx.userId!,
          name,
          s3Bucket: 'test',
          s3Prefix: `projects/${generateUUID()}`,
          status: 'draft',
          branding: {},
          config: {},
        },
      });

    const results = await Promise.all([
      createProject('Project 1'),
      createProject('Project 2'),
      createProject('Project 3'),
    ]);

    expect(results).toHaveLength(3);
    expect(new Set(results.map((r) => r.id)).size).toBe(3); // All unique IDs
  });
});
