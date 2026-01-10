/**
 * API Keys Router
 *
 * Manages owner API keys for programmatic access to content management.
 * Enterprise tier only.
 */

import { z } from 'zod';
import crypto from 'crypto';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const createApiKeyInput = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.enum(['read', 'write', 'delete'])).min(1),
  resources: z.array(z.string()).optional(), // Limit to specific resources
  rateLimit: z.number().min(10).max(10000).optional().default(100),
  expiresInDays: z.number().min(1).max(365).optional(),
});

const revokeApiKeyInput = z.object({
  projectId: z.string(),
  keyId: z.string(),
});

const listApiKeysInput = z.object({
  projectId: z.string(),
  includeRevoked: z.boolean().optional().default(false),
});

const getApiKeyUsageInput = z.object({
  projectId: z.string(),
  keyId: z.string(),
  days: z.number().min(1).max(90).optional().default(30),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has enterprise access for the project
 */
async function checkEnterpriseAccess(
  ctx: { prisma: any; userId: string },
  projectId: string
): Promise<void> {
  const project = await ctx.prisma.project.findFirst({
    where: {
      id: projectId,
      userId: ctx.userId,
    },
    include: {
      user: {
        select: { tier: true },
      },
    },
  });

  if (!project) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Project not found or access denied',
    });
  }

  if (project.user.tier !== 'enterprise') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'API keys require Enterprise tier subscription',
    });
  }
}

/**
 * Generate a secure API key
 */
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = 'mob_' + crypto.randomBytes(4).toString('hex');
  const secret = crypto.randomBytes(24).toString('base64url');
  const key = `${prefix}_${secret}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');

  return { key, prefix, hash };
}

// ============================================================================
// ROUTER
// ============================================================================

export const apiKeysRouter = router({
  /**
   * Create a new API key
   */
  create: protectedProcedure
    .input(createApiKeyInput)
    .mutation(async ({ ctx, input }) => {
      await checkEnterpriseAccess(ctx, input.projectId);

      // Check max keys limit (10 per project)
      const existingCount = await ctx.prisma.ownerApiKey.count({
        where: {
          projectId: input.projectId,
          revokedAt: null,
        },
      });

      if (existingCount >= 10) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum of 10 active API keys per project',
        });
      }

      const { key, prefix, hash } = generateApiKey();

      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const apiKey = await ctx.prisma.ownerApiKey.create({
        data: {
          projectId: input.projectId,
          userId: ctx.userId,
          name: input.name,
          description: input.description,
          keyHash: hash,
          keyPrefix: prefix,
          permissions: input.permissions,
          resources: input.resources || [],
          rateLimit: input.rateLimit,
          expiresAt,
        },
        select: {
          id: true,
          name: true,
          description: true,
          keyPrefix: true,
          permissions: true,
          resources: true,
          rateLimit: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      // Return full key only once (on creation)
      return {
        ...apiKey,
        key, // Full key - only shown once!
        message: 'Save this key securely. It will not be shown again.',
      };
    }),

  /**
   * List all API keys for a project
   */
  list: protectedProcedure.input(listApiKeysInput).query(async ({ ctx, input }) => {
    await checkEnterpriseAccess(ctx, input.projectId);

    const keys = await ctx.prisma.ownerApiKey.findMany({
      where: {
        projectId: input.projectId,
        ...(input.includeRevoked ? {} : { revokedAt: null }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        keyPrefix: true,
        permissions: true,
        resources: true,
        rateLimit: true,
        lastUsedAt: true,
        usageCount: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      keys: keys.map((key: any) => ({
        ...key,
        isExpired: key.expiresAt ? new Date(key.expiresAt) < new Date() : false,
        isRevoked: !!key.revokedAt,
        status: key.revokedAt
          ? 'revoked'
          : key.expiresAt && new Date(key.expiresAt) < new Date()
          ? 'expired'
          : 'active',
      })),
    };
  }),

  /**
   * Revoke an API key
   */
  revoke: protectedProcedure.input(revokeApiKeyInput).mutation(async ({ ctx, input }) => {
    await checkEnterpriseAccess(ctx, input.projectId);

    const key = await ctx.prisma.ownerApiKey.findFirst({
      where: {
        id: input.keyId,
        projectId: input.projectId,
        revokedAt: null,
      },
    });

    if (!key) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'API key not found or already revoked',
      });
    }

    await ctx.prisma.ownerApiKey.update({
      where: { id: input.keyId },
      data: {
        revokedAt: new Date(),
        revokedBy: ctx.userId,
      },
    });

    return { success: true };
  }),

  /**
   * Get API key usage statistics
   */
  getUsage: protectedProcedure.input(getApiKeyUsageInput).query(async ({ ctx, input }) => {
    await checkEnterpriseAccess(ctx, input.projectId);

    const key = await ctx.prisma.ownerApiKey.findFirst({
      where: {
        id: input.keyId,
        projectId: input.projectId,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        usageCount: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    if (!key) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'API key not found',
      });
    }

    // In a real implementation, this would query usage logs
    // For now, return basic usage info from the key record
    return {
      keyId: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      totalRequests: key.usageCount,
      lastUsed: key.lastUsedAt,
      createdAt: key.createdAt,
      // Placeholder for detailed usage data
      dailyUsage: [],
      topEndpoints: [],
    };
  }),

  /**
   * Regenerate an API key (revokes old, creates new with same settings)
   */
  regenerate: protectedProcedure.input(revokeApiKeyInput).mutation(async ({ ctx, input }) => {
    await checkEnterpriseAccess(ctx, input.projectId);

    const existingKey = await ctx.prisma.ownerApiKey.findFirst({
      where: {
        id: input.keyId,
        projectId: input.projectId,
        revokedAt: null,
      },
    });

    if (!existingKey) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'API key not found or already revoked',
      });
    }

    // Revoke the old key
    await ctx.prisma.ownerApiKey.update({
      where: { id: input.keyId },
      data: {
        revokedAt: new Date(),
        revokedBy: ctx.userId,
      },
    });

    // Create new key with same settings
    const { key, prefix, hash } = generateApiKey();

    const newKey = await ctx.prisma.ownerApiKey.create({
      data: {
        projectId: input.projectId,
        userId: ctx.userId,
        name: existingKey.name,
        description: existingKey.description,
        keyHash: hash,
        keyPrefix: prefix,
        permissions: existingKey.permissions,
        resources: existingKey.resources,
        rateLimit: existingKey.rateLimit,
        expiresAt: existingKey.expiresAt,
      },
      select: {
        id: true,
        name: true,
        description: true,
        keyPrefix: true,
        permissions: true,
        resources: true,
        rateLimit: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return {
      ...newKey,
      key, // Full key - only shown once!
      message: 'New key generated. Save it securely.',
    };
  }),
});
