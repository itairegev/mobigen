import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.project.findMany({
      where: { userId: ctx.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        builds: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: {
          user: { select: { id: true, tier: true } },
          sessions: { take: 5, orderBy: { createdAt: 'desc' } },
          changes: { take: 10, orderBy: { version: 'desc' } },
          builds: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      return project;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        templateId: z.string().optional(),
        bundleIdIos: z.string().optional(),
        bundleIdAndroid: z.string().optional(),
        branding: z
          .object({
            primaryColor: z.string().optional(),
            secondaryColor: z.string().optional(),
            logoUrl: z.string().url().optional(),
          })
          .optional(),
        // Template-specific environment variables collected from ConfigChat
        envVars: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = crypto.randomUUID();

      return ctx.prisma.project.create({
        data: {
          id: projectId,
          userId: ctx.userId!,
          name: input.name,
          templateId: input.templateId,
          bundleIdIos: input.bundleIdIos,
          bundleIdAndroid: input.bundleIdAndroid,
          branding: input.branding || {},
          // Store template config in the config JSON field
          config: input.envVars ? { envVars: input.envVars } : {},
          s3Bucket: process.env.S3_BUCKET || 'mobigen-projects',
          s3Prefix: `projects/${projectId}`,
          status: 'draft',
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        bundleIdIos: z.string().optional(),
        bundleIdAndroid: z.string().optional(),
        branding: z
          .object({
            primaryColor: z.string().optional(),
            secondaryColor: z.string().optional(),
            logoUrl: z.string().url().optional(),
          })
          .optional(),
        status: z.enum(['draft', 'active', 'archived']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const project = await ctx.prisma.project.findFirst({
        where: { id, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      return ctx.prisma.project.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      await ctx.prisma.project.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
