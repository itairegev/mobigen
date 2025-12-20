import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const buildsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      return ctx.prisma.build.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const build = await ctx.prisma.build.findFirst({
        where: { id: input.id },
        include: { project: true },
      });

      if (!build || build.project.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Build not found' });
      }

      return build;
    }),

  trigger: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        platform: z.enum(['ios', 'android']),
        version: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      return ctx.prisma.build.create({
        data: {
          projectId: input.projectId,
          version: input.version,
          platform: input.platform,
          status: 'pending',
        },
      });
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const build = await ctx.prisma.build.findFirst({
        where: { id: input.id },
        include: { project: true },
      });

      if (!build || build.project.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Build not found' });
      }

      if (!['pending', 'queued', 'building'].includes(build.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot cancel completed build',
        });
      }

      return ctx.prisma.build.update({
        where: { id: input.id },
        data: { status: 'cancelled' },
      });
    }),
});
