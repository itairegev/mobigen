import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { prisma as prismaClient } from '@mobigen/db';
import {
  BackendProvisioner,
  getSchemaForTemplate,
  hasSchemaForTemplate,
  getAvailableTemplates,
  generateApiClient,
} from '@mobigen/backend';

type PrismaClientType = typeof prismaClient;

export const backendRouter = router({
  /**
   * Get backend status for a project
   */
  getStatus: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const backend = await ctx.prisma.projectBackend.findUnique({
        where: { projectId: input.projectId },
      });

      return backend;
    }),

  /**
   * Provision backend for a project
   */
  provision: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        environment: z.enum(['dev', 'staging', 'prod']).default('prod'),
        region: z.string().default('us-east-1'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      if (!project.templateId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Project must have a template to provision backend',
        });
      }

      if (!hasSchemaForTemplate(project.templateId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `No schema defined for template: ${project.templateId}`,
        });
      }

      // Check if backend already exists
      const existingBackend = await ctx.prisma.projectBackend.findUnique({
        where: { projectId: input.projectId },
      });

      if (existingBackend && existingBackend.status === 'active') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Backend already provisioned for this project',
        });
      }

      // Create or update backend record
      const tablePrefix = `mobigen-${input.environment}-${input.projectId}`;

      const backend = await ctx.prisma.projectBackend.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          templateId: project.templateId,
          environment: input.environment,
          region: input.region,
          tablePrefix,
          status: 'provisioning',
        },
        update: {
          status: 'provisioning',
          lastError: null,
          retryCount: { increment: 1 },
        },
      });

      // Log start of provisioning
      await ctx.prisma.backendProvisioningLog.create({
        data: {
          projectId: input.projectId,
          operation: 'provision',
          step: 'start',
          status: 'started',
          message: `Starting backend provisioning for ${project.templateId} template`,
        },
      });

      // Provision in background (don't await)
      provisionBackendAsync(ctx.prisma, input.projectId, project.templateId, {
        region: input.region,
        environment: input.environment,
        accountId: process.env.AWS_ACCOUNT_ID!,
      }).catch((error: unknown) => {
        console.error('Backend provisioning failed:', error);
      });

      return backend;
    }),

  /**
   * Deprovision backend for a project
   */
  deprovision: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const backend = await ctx.prisma.projectBackend.findUnique({
        where: { projectId: input.projectId },
      });

      if (!backend) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No backend provisioned for this project',
        });
      }

      // Update status
      await ctx.prisma.projectBackend.update({
        where: { projectId: input.projectId },
        data: { status: 'deprovisioning' },
      });

      // Deprovision in background
      deprovisionBackendAsync(ctx.prisma, input.projectId, backend).catch(
        (error: unknown) => {
          console.error('Backend deprovisioning failed:', error);
        }
      );

      return { success: true, message: 'Deprovisioning started' };
    }),

  /**
   * Get provisioning logs for a project
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      return ctx.prisma.backendProvisioningLog.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  /**
   * Generate API client code for a project
   */
  getApiClient: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const backend = await ctx.prisma.projectBackend.findUnique({
        where: { projectId: input.projectId },
      });

      if (!backend || backend.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Backend must be provisioned first',
        });
      }

      if (!backend.apiEndpoint || !backend.apiKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Backend API endpoint not configured',
        });
      }

      const schema = getSchemaForTemplate(backend.templateId);
      return generateApiClient(schema, backend.apiEndpoint, backend.apiKey);
    }),

  /**
   * Get available templates with their schemas
   */
  getTemplates: protectedProcedure.query(async () => {
    const templateIds = getAvailableTemplates();

    return templateIds.map((id) => {
      const schema = getSchemaForTemplate(id);
      return {
        id,
        tables: schema.tables.map((t) => ({
          name: t.name,
          attributeCount: t.attributes.length,
          hasGsi: (t.gsi?.length || 0) > 0,
        })),
      };
    });
  }),

  /**
   * Set custom database URL (Pro tier only)
   */
  setCustomDbUrl: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        dbUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership and user tier
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      if (user?.tier !== 'pro' && user?.tier !== 'enterprise') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Custom database URL is only available for Pro tier',
        });
      }

      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const backend = await ctx.prisma.projectBackend.findUnique({
        where: { projectId: input.projectId },
      });

      if (!backend) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Backend must be provisioned first',
        });
      }

      return ctx.prisma.projectBackend.update({
        where: { projectId: input.projectId },
        data: { customDbUrl: input.dbUrl },
      });
    }),
});

/**
 * Background provisioning function
 */
async function provisionBackendAsync(
  prisma: PrismaClientType,
  projectId: string,
  templateId: string,
  config: {
    region: string;
    environment: 'dev' | 'staging' | 'prod';
    accountId: string;
  }
): Promise<void> {
  const startTime = Date.now();

  try {
    const provisioner = new BackendProvisioner({
      region: config.region,
      environment: config.environment,
      projectId,
      accountId: config.accountId,
    });

    // Log each step
    const logStep = async (step: string, status: 'started' | 'completed' | 'failed', message?: string) => {
      await prisma.backendProvisioningLog.create({
        data: {
          projectId,
          operation: 'provision',
          step,
          status,
          message,
          durationMs: status !== 'started' ? Date.now() - startTime : undefined,
        },
      });
    };

    await logStep('create_tables', 'started');
    const result = await provisioner.provision(templateId);
    await logStep('create_tables', 'completed');

    // Update backend record with results
    await prisma.projectBackend.update({
      where: { projectId },
      data: {
        status: 'active',
        tableNames: result.tableNames,
        functionName: result.functionName,
        functionArn: result.functionArn,
        lambdaRoleArn: result.lambdaRoleArn,
        apiId: result.apiId,
        apiEndpoint: result.apiEndpoint,
        apiKey: result.apiKey,
        apiKeyId: result.apiKeyId,
        stageName: result.stageName,
        provisionedAt: new Date(),
      },
    });

    await logStep('complete', 'completed', 'Backend provisioning completed successfully');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await prisma.projectBackend.update({
      where: { projectId },
      data: {
        status: 'failed',
        lastError: errorMessage,
      },
    });

    await prisma.backendProvisioningLog.create({
      data: {
        projectId,
        operation: 'provision',
        step: 'error',
        status: 'failed',
        message: errorMessage,
        durationMs: Date.now() - startTime,
      },
    });

    throw error;
  }
}

/**
 * Background deprovisioning function
 */
async function deprovisionBackendAsync(
  prisma: PrismaClientType,
  projectId: string,
  backend: { region: string; environment: string }
): Promise<void> {
  const startTime = Date.now();

  try {
    const provisioner = new BackendProvisioner({
      region: backend.region,
      environment: backend.environment as 'dev' | 'staging' | 'prod',
      projectId,
      accountId: process.env.AWS_ACCOUNT_ID!,
    });

    await prisma.backendProvisioningLog.create({
      data: {
        projectId,
        operation: 'deprovision',
        step: 'start',
        status: 'started',
        message: 'Starting backend deprovisioning',
      },
    });

    await provisioner.deprovision();

    await prisma.projectBackend.update({
      where: { projectId },
      data: {
        status: 'deprovisioned',
        deprovisionedAt: new Date(),
      },
    });

    await prisma.backendProvisioningLog.create({
      data: {
        projectId,
        operation: 'deprovision',
        step: 'complete',
        status: 'completed',
        message: 'Backend deprovisioning completed successfully',
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await prisma.projectBackend.update({
      where: { projectId },
      data: {
        status: 'failed',
        lastError: errorMessage,
      },
    });

    await prisma.backendProvisioningLog.create({
      data: {
        projectId,
        operation: 'deprovision',
        step: 'error',
        status: 'failed',
        message: errorMessage,
        durationMs: Date.now() - startTime,
      },
    });

    throw error;
  }
}
