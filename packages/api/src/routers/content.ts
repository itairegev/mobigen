/**
 * Content Management tRPC Router
 *
 * Provides API endpoints for managing content in project owner dashboards.
 * Features tier-gated access control: Basic=view, Pro=CRUD, Enterprise=API+team
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createContentManager,
  ContentServiceError,
  type UserTier,
  type ContentOperation,
} from '@mobigen/backend/content-manager';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const listParamsSchema = z.object({
  projectId: z.string().uuid(),
  resource: z.string(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']),
  }).optional(),
  filters: z.record(z.unknown()).optional(),
  search: z.string().optional(),
});

const createInputSchema = z.object({
  projectId: z.string().uuid(),
  resource: z.string(),
  data: z.record(z.unknown()),
});

const updateInputSchema = z.object({
  projectId: z.string().uuid(),
  resource: z.string(),
  id: z.string(),
  data: z.record(z.unknown()),
});

const deleteInputSchema = z.object({
  projectId: z.string().uuid(),
  resource: z.string(),
  id: z.string(),
});

const bulkDeleteInputSchema = z.object({
  projectId: z.string().uuid(),
  resource: z.string(),
  ids: z.array(z.string()).min(1).max(100),
});

const exportInputSchema = z.object({
  projectId: z.string().uuid(),
  resource: z.string(),
  filters: z.record(z.unknown()).optional(),
});

const importInputSchema = z.object({
  projectId: z.string().uuid(),
  resource: z.string(),
  data: z.string(), // CSV content
  options: z.object({
    mode: z.enum(['create', 'update', 'upsert']).default('create'),
    skipErrors: z.boolean().default(true),
    dryRun: z.boolean().default(false),
  }).optional(),
});

const searchInputSchema = z.object({
  projectId: z.string().uuid(),
  query: z.string().min(1),
  resource: z.string().optional(),
  fields: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).default(20),
});

const auditLogInputSchema = z.object({
  projectId: z.string().uuid(),
  resource: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a tier has access to an operation
 */
function checkTierAccess(tier: string, requiredTier: string[]): boolean {
  const tierHierarchy = ['basic', 'pro', 'enterprise'];
  const userTierLevel = tierHierarchy.indexOf(tier);
  const requiredLevel = Math.min(...requiredTier.map((t) => tierHierarchy.indexOf(t)));
  return userTierLevel >= requiredLevel;
}

/**
 * Get required tier for an operation
 */
function getRequiredTierForOperation(operation: ContentOperation): string[] {
  switch (operation) {
    case 'view':
      return ['basic', 'pro', 'enterprise'];
    case 'create':
    case 'update':
    case 'delete':
    case 'bulk':
    case 'export':
    case 'import':
    case 'audit':
      return ['pro', 'enterprise'];
    case 'api_keys':
    case 'team':
      return ['enterprise'];
    default:
      return ['enterprise'];
  }
}

/**
 * Map ContentServiceError to TRPCError
 */
function mapContentError(error: ContentServiceError): TRPCError {
  const codeMap: Record<string, 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR'> = {
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    FORBIDDEN: 'FORBIDDEN',
    BAD_REQUEST: 'BAD_REQUEST',
    INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR',
  };

  return new TRPCError({
    code: codeMap[error.code] || 'INTERNAL_SERVER_ERROR',
    message: error.message,
  });
}

// ============================================================================
// ROUTER
// ============================================================================

export const contentRouter = router({
  /**
   * Get schema for a project's template
   * Available to all tiers
   */
  getSchema: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

      const contentManager = createContentManager({
        backend: {
          projectId: project.id,
          templateId: backend.templateId,
          tablePrefix: backend.tablePrefix,
          region: backend.region,
        },
        userId: ctx.userId,
        userTier,
        prisma: ctx.prisma,
      });

      return contentManager.getSchema(project.id);
    }),

  /**
   * Get schema for a specific resource
   * Available to all tiers
   */
  getResourceSchema: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      resource: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

      const contentManager = createContentManager({
        backend: {
          projectId: project.id,
          templateId: backend.templateId,
          tablePrefix: backend.tablePrefix,
          region: backend.region,
        },
        userId: ctx.userId,
        userTier,
        prisma: ctx.prisma,
      });

      return contentManager.getResourceSchema(project.id, input.resource);
    }),

  /**
   * List items in a resource
   * Available to all tiers
   */
  list: protectedProcedure.input(listParamsSchema).query(async ({ ctx, input }) => {
    const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

    const contentManager = createContentManager({
      backend: {
        projectId: project.id,
        templateId: backend.templateId,
        tablePrefix: backend.tablePrefix,
        region: backend.region,
      },
      userId: ctx.userId,
      userTier,
      prisma: ctx.prisma,
    });

    try {
      return await contentManager.list(project.id, {
        resource: input.resource,
        limit: input.limit,
        cursor: input.cursor,
        sort: input.sort,
        filters: input.filters,
        search: input.search,
      });
    } catch (error) {
      if (error instanceof ContentServiceError) {
        throw mapContentError(error);
      }
      throw error;
    }
  }),

  /**
   * Get a single item by ID
   * Available to all tiers
   */
  get: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      resource: z.string(),
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

      const contentManager = createContentManager({
        backend: {
          projectId: project.id,
          templateId: backend.templateId,
          tablePrefix: backend.tablePrefix,
          region: backend.region,
        },
        userId: ctx.userId,
        userTier,
        prisma: ctx.prisma,
      });

      try {
        return await contentManager.get(project.id, input.resource, input.id);
      } catch (error) {
        if (error instanceof ContentServiceError) {
          throw mapContentError(error);
        }
        throw error;
      }
    }),

  /**
   * Create a new item
   * Pro tier and above
   */
  create: protectedProcedure.input(createInputSchema).mutation(async ({ ctx, input }) => {
    const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

    // Check tier access
    if (!checkTierAccess(userTier, getRequiredTierForOperation('create'))) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Creating items requires Pro tier or higher',
      });
    }

    const contentManager = createContentManager({
      backend: {
        projectId: project.id,
        templateId: backend.templateId,
        tablePrefix: backend.tablePrefix,
        region: backend.region,
      },
      userId: ctx.userId,
      userTier,
      prisma: ctx.prisma,
    });

    try {
      return await contentManager.create(project.id, {
        resource: input.resource,
        data: input.data,
      });
    } catch (error) {
      if (error instanceof ContentServiceError) {
        throw mapContentError(error);
      }
      throw error;
    }
  }),

  /**
   * Update an existing item
   * Pro tier and above
   */
  update: protectedProcedure.input(updateInputSchema).mutation(async ({ ctx, input }) => {
    const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

    if (!checkTierAccess(userTier, getRequiredTierForOperation('update'))) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Updating items requires Pro tier or higher',
      });
    }

    const contentManager = createContentManager({
      backend: {
        projectId: project.id,
        templateId: backend.templateId,
        tablePrefix: backend.tablePrefix,
        region: backend.region,
      },
      userId: ctx.userId,
      userTier,
      prisma: ctx.prisma,
    });

    try {
      return await contentManager.update(project.id, {
        resource: input.resource,
        id: input.id,
        data: input.data,
      });
    } catch (error) {
      if (error instanceof ContentServiceError) {
        throw mapContentError(error);
      }
      throw error;
    }
  }),

  /**
   * Delete an item
   * Pro tier and above
   */
  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ ctx, input }) => {
    const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

    if (!checkTierAccess(userTier, getRequiredTierForOperation('delete'))) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Deleting items requires Pro tier or higher',
      });
    }

    const contentManager = createContentManager({
      backend: {
        projectId: project.id,
        templateId: backend.templateId,
        tablePrefix: backend.tablePrefix,
        region: backend.region,
      },
      userId: ctx.userId,
      userTier,
      prisma: ctx.prisma,
    });

    try {
      return await contentManager.delete(project.id, input.resource, input.id);
    } catch (error) {
      if (error instanceof ContentServiceError) {
        throw mapContentError(error);
      }
      throw error;
    }
  }),

  /**
   * Bulk delete items
   * Pro tier and above
   */
  bulkDelete: protectedProcedure.input(bulkDeleteInputSchema).mutation(async ({ ctx, input }) => {
    const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

    if (!checkTierAccess(userTier, getRequiredTierForOperation('bulk'))) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Bulk operations require Pro tier or higher',
      });
    }

    const contentManager = createContentManager({
      backend: {
        projectId: project.id,
        templateId: backend.templateId,
        tablePrefix: backend.tablePrefix,
        region: backend.region,
      },
      userId: ctx.userId,
      userTier,
      prisma: ctx.prisma,
    });

    try {
      return await contentManager.bulkDelete(project.id, input.resource, input.ids);
    } catch (error) {
      if (error instanceof ContentServiceError) {
        throw mapContentError(error);
      }
      throw error;
    }
  }),

  /**
   * Export resource data to CSV
   * Pro tier and above
   */
  export: protectedProcedure.input(exportInputSchema).mutation(async ({ ctx, input }) => {
    const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

    if (!checkTierAccess(userTier, getRequiredTierForOperation('export'))) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Export requires Pro tier or higher',
      });
    }

    const contentManager = createContentManager({
      backend: {
        projectId: project.id,
        templateId: backend.templateId,
        tablePrefix: backend.tablePrefix,
        region: backend.region,
      },
      userId: ctx.userId,
      userTier,
      prisma: ctx.prisma,
    });

    try {
      return await contentManager.exportToCSV(project.id, input.resource, input.filters);
    } catch (error) {
      if (error instanceof ContentServiceError) {
        throw mapContentError(error);
      }
      throw error;
    }
  }),

  /**
   * Import data from CSV
   * Pro tier and above
   */
  import: protectedProcedure.input(importInputSchema).mutation(async ({ ctx, input }) => {
    const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

    if (!checkTierAccess(userTier, getRequiredTierForOperation('import'))) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Import requires Pro tier or higher',
      });
    }

    const contentManager = createContentManager({
      backend: {
        projectId: project.id,
        templateId: backend.templateId,
        tablePrefix: backend.tablePrefix,
        region: backend.region,
      },
      userId: ctx.userId,
      userTier,
      prisma: ctx.prisma,
    });

    try {
      return await contentManager.importFromCSV(
        project.id,
        input.resource,
        input.data,
        input.options
      );
    } catch (error) {
      if (error instanceof ContentServiceError) {
        throw mapContentError(error);
      }
      throw error;
    }
  }),

  /**
   * Search across resources
   * Available to all tiers
   */
  search: protectedProcedure.input(searchInputSchema).query(async ({ ctx, input }) => {
    const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

    const contentManager = createContentManager({
      backend: {
        projectId: project.id,
        templateId: backend.templateId,
        tablePrefix: backend.tablePrefix,
        region: backend.region,
      },
      userId: ctx.userId,
      userTier,
      prisma: ctx.prisma,
    });

    try {
      return await contentManager.search(project.id, input.query, {
        resource: input.resource,
        fields: input.fields,
        limit: input.limit,
      });
    } catch (error) {
      if (error instanceof ContentServiceError) {
        throw mapContentError(error);
      }
      throw error;
    }
  }),

  /**
   * Get audit log entries
   * Pro tier and above
   */
  getAuditLog: protectedProcedure.input(auditLogInputSchema).query(async ({ ctx, input }) => {
    const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

    if (!checkTierAccess(userTier, getRequiredTierForOperation('audit'))) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Audit log access requires Pro tier or higher',
      });
    }

    const contentManager = createContentManager({
      backend: {
        projectId: project.id,
        templateId: backend.templateId,
        tablePrefix: backend.tablePrefix,
        region: backend.region,
      },
      userId: ctx.userId,
      userTier,
      prisma: ctx.prisma,
    });

    try {
      return await contentManager.getAuditLog(project.id, input.resource, input.limit);
    } catch (error) {
      if (error instanceof ContentServiceError) {
        throw mapContentError(error);
      }
      throw error;
    }
  }),

  /**
   * Get dashboard overview stats
   * Available to all tiers
   */
  getDashboardStats: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { project, backend, userTier } = await getProjectContext(ctx, input.projectId);

      const contentManager = createContentManager({
        backend: {
          projectId: project.id,
          templateId: backend.templateId,
          tablePrefix: backend.tablePrefix,
          region: backend.region,
        },
        userId: ctx.userId,
        userTier,
        prisma: ctx.prisma,
      });

      // Get schema to list resources
      const schema = await contentManager.getSchema(project.id);

      // Get counts for each resource
      const stats = await Promise.all(
        schema.resources.map(async (resource) => {
          try {
            const result = await contentManager.list(project.id, {
              resource: resource.name,
              limit: 1,
            });
            return {
              resource: resource.name,
              singularName: resource.singularName,
              pluralName: resource.pluralName,
              icon: resource.icon,
              count: result.total,
            };
          } catch {
            return {
              resource: resource.name,
              singularName: resource.singularName,
              pluralName: resource.pluralName,
              icon: resource.icon,
              count: 0,
            };
          }
        })
      );

      return {
        projectId: project.id,
        templateId: backend.templateId,
        resources: stats,
        userTier,
        canEdit: checkTierAccess(userTier, ['pro', 'enterprise']),
      };
    }),
});

// ============================================================================
// CONTEXT HELPERS
// ============================================================================

interface ProjectContext {
  project: {
    id: string;
    userId: string;
    name: string;
    templateId: string;
  };
  backend: {
    templateId: string;
    tablePrefix: string;
    region: string;
    apiEndpoint?: string | null;
    apiKey?: string | null;
  };
  userTier: UserTier;
}

/**
 * Get project context with ownership verification and backend info
 */
async function getProjectContext(
  ctx: { prisma: PrismaClient; userId: string },
  projectId: string
): Promise<ProjectContext> {
  // Get project with ownership check
  const project = await ctx.prisma.project.findFirst({
    where: {
      id: projectId,
      userId: ctx.userId,
    },
  });

  if (!project) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Project not found or you do not have access',
    });
  }

  if (!project.templateId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Project does not have a template assigned',
    });
  }

  // Get backend configuration
  const backend = await ctx.prisma.projectBackend.findUnique({
    where: { projectId },
  });

  if (!backend) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Backend not provisioned for this project. Please provision backend first.',
    });
  }

  if (backend.status !== 'active') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Backend is not active. Current status: ${backend.status}`,
    });
  }

  // Get user tier
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { tier: true },
  });

  const userTier = (user?.tier || 'basic') as UserTier;

  return {
    project: {
      id: project.id,
      userId: project.userId,
      name: project.name,
      templateId: project.templateId,
    },
    backend: {
      templateId: backend.templateId,
      tablePrefix: backend.tablePrefix,
      region: backend.region,
      apiEndpoint: backend.apiEndpoint,
      apiKey: backend.apiKey,
    },
    userTier,
  };
}

// Type import for Prisma
type PrismaClient = {
  project: {
    findFirst: (args: { where: { id: string; userId: string } }) => Promise<{
      id: string;
      userId: string;
      name: string;
      templateId: string | null;
    } | null>;
  };
  projectBackend: {
    findUnique: (args: { where: { projectId: string } }) => Promise<{
      templateId: string;
      tablePrefix: string;
      region: string;
      status: string;
      apiEndpoint: string | null;
      apiKey: string | null;
    } | null>;
  };
  user: {
    findUnique: (args: { where: { id: string }; select: { tier: true } }) => Promise<{
      tier: string;
    } | null>;
  };
};
