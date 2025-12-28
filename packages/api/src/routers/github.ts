import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  getOAuthUrl,
  exchangeCodeForTokens,
  getUserInfo,
  encodeState,
  decodeState,
  GitHubClient,
  GitHubAuthError,
  GitHubRateLimitError,
  queueSync,
  type OAuthState,
} from '@mobigen/github';

/**
 * GitHub Integration Router
 *
 * Provides endpoints for:
 * - OAuth flow (connect GitHub account)
 * - Repository management (list, create, select)
 * - Sync configuration (enable/disable, settings)
 * - Sync status and history
 */
export const githubRouter = router({
  // ============================================================================
  // OAUTH ENDPOINTS
  // ============================================================================

  /**
   * Get OAuth URL for connecting GitHub account
   */
  getOAuthUrl: protectedProcedure
    .input(z.object({ redirectPath: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const stateData: Omit<OAuthState, 'timestamp'> = {
        userId: ctx.userId!,
        redirectPath: input.redirectPath || '/dashboard/settings/github',
      };

      const state = encodeState(stateData);
      return { url: getOAuthUrl(state) };
    }),

  /**
   * Handle OAuth callback - exchange code for tokens and save connection
   */
  handleOAuthCallback: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decode and validate state
      const stateData = decodeState(input.state);
      if (!stateData) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired state parameter',
        });
      }

      // Check state age (15 minute max)
      if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'OAuth state has expired. Please try again.',
        });
      }

      try {
        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(input.code);

        // Get user info from GitHub
        const githubUser = await getUserInfo(tokens.access_token);

        // Calculate expiration if available
        const tokenExpiresAt = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null;

        // Upsert the connection
        const connection = await ctx.prisma.gitHubConnection.upsert({
          where: {
            userId_githubId: {
              userId: stateData.userId,
              githubId: githubUser.id,
            },
          },
          update: {
            username: githubUser.login,
            email: githubUser.email,
            avatarUrl: githubUser.avatar_url,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiresAt,
            scopes: tokens.scope?.split(',') || [],
            updatedAt: new Date(),
          },
          create: {
            userId: stateData.userId,
            githubId: githubUser.id,
            username: githubUser.login,
            email: githubUser.email,
            avatarUrl: githubUser.avatar_url,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiresAt,
            scopes: tokens.scope?.split(',') || [],
          },
        });

        return {
          success: true,
          connectionId: connection.id,
          username: connection.username,
          redirectPath: stateData.redirectPath,
        };
      } catch (error: unknown) {
        if (error instanceof GitHubAuthError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete OAuth flow',
        });
      }
    }),

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * List user's GitHub connections
   */
  listConnections: protectedProcedure.query(async ({ ctx }) => {
    const connections = await ctx.prisma.gitHubConnection.findMany({
      where: { userId: ctx.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        scopes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { projectConfigs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return connections.map((conn) => ({
      ...conn,
      projectCount: conn._count.projectConfigs,
    }));
  }),

  /**
   * Disconnect a GitHub account
   */
  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.prisma.gitHubConnection.findFirst({
        where: { id: input.connectionId, userId: ctx.userId },
        include: { projectConfigs: true },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'GitHub connection not found',
        });
      }

      // Check if any projects are using this connection
      if (connection.projectConfigs.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot disconnect: ${connection.projectConfigs.length} project(s) are using this GitHub connection. Please disconnect them first.`,
        });
      }

      await ctx.prisma.gitHubConnection.delete({
        where: { id: input.connectionId },
      });

      return { success: true };
    }),

  // ============================================================================
  // REPOSITORY MANAGEMENT
  // ============================================================================

  /**
   * List repositories available to the user
   */
  listRepos: protectedProcedure
    .input(
      z.object({
        connectionId: z.string().uuid(),
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const connection = await ctx.prisma.gitHubConnection.findFirst({
        where: { id: input.connectionId, userId: ctx.userId },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'GitHub connection not found',
        });
      }

      try {
        const client = new GitHubClient({ accessToken: connection.accessToken });
        const repos = await client.listUserRepos({
          sort: 'updated',
          perPage: input.perPage,
          page: input.page,
        });

        return repos;
      } catch (error: unknown) {
        if (error instanceof GitHubRateLimitError) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `GitHub rate limit exceeded. Resets at ${error.resetAt?.toISOString()}`,
          });
        }
        if (error instanceof GitHubAuthError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'GitHub token expired. Please reconnect your account.',
          });
        }
        throw error;
      }
    }),

  /**
   * Create a new repository for a project
   */
  createRepo: protectedProcedure
    .input(
      z.object({
        connectionId: z.string().uuid(),
        name: z.string().min(1).max(100),
        description: z.string().max(350).optional(),
        isPrivate: z.boolean().default(true),
        projectId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify connection ownership
      const connection = await ctx.prisma.gitHubConnection.findFirst({
        where: { id: input.connectionId, userId: ctx.userId },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'GitHub connection not found',
        });
      }

      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      try {
        const client = new GitHubClient({ accessToken: connection.accessToken });
        const repo = await client.createRepo({
          name: input.name,
          description: input.description || `Generated by Mobigen from project: ${project.name}`,
          private: input.isPrivate,
          autoInit: true,
        });

        // Create the project config linking to this repo
        const config = await ctx.prisma.projectGitHubConfig.create({
          data: {
            projectId: input.projectId,
            connectionId: input.connectionId,
            repoOwner: repo.owner.login,
            repoName: repo.name,
            defaultBranch: repo.default_branch,
            syncEnabled: true,
            autoCommit: true,
          },
        });

        return {
          repo,
          configId: config.id,
        };
      } catch (error: unknown) {
        if (error instanceof GitHubAuthError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'GitHub token expired. Please reconnect your account.',
          });
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create repository: ${message}`,
        });
      }
    }),

  // ============================================================================
  // PROJECT SYNC CONFIGURATION
  // ============================================================================

  /**
   * Get sync configuration for a project
   */
  getProjectConfig: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      const config = await ctx.prisma.projectGitHubConfig.findUnique({
        where: { projectId: input.projectId },
        include: {
          connection: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          syncHistory: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return config;
    }),

  /**
   * Connect a project to an existing repository
   */
  connectProjectToRepo: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        connectionId: z.string().uuid(),
        repoOwner: z.string(),
        repoName: z.string(),
        defaultBranch: z.string().default('main'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Verify connection ownership
      const connection = await ctx.prisma.gitHubConnection.findFirst({
        where: { id: input.connectionId, userId: ctx.userId },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'GitHub connection not found',
        });
      }

      // Verify repo exists and is accessible
      const client = new GitHubClient({ accessToken: connection.accessToken });
      try {
        await client.getRepo(`${input.repoOwner}/${input.repoName}`);
      } catch {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Repository not found or not accessible',
        });
      }

      // Upsert the config
      const config = await ctx.prisma.projectGitHubConfig.upsert({
        where: { projectId: input.projectId },
        update: {
          connectionId: input.connectionId,
          repoOwner: input.repoOwner,
          repoName: input.repoName,
          defaultBranch: input.defaultBranch,
          syncEnabled: true,
          syncStatus: 'idle',
        },
        create: {
          projectId: input.projectId,
          connectionId: input.connectionId,
          repoOwner: input.repoOwner,
          repoName: input.repoName,
          defaultBranch: input.defaultBranch,
          syncEnabled: true,
          autoCommit: true,
        },
      });

      return config;
    }),

  /**
   * Update sync configuration
   */
  updateSyncConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        syncEnabled: z.boolean().optional(),
        autoCommit: z.boolean().optional(),
        commitPrefix: z.string().max(50).optional(),
        defaultBranch: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, ...updateData } = input;

      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      const config = await ctx.prisma.projectGitHubConfig.findUnique({
        where: { projectId },
      });

      if (!config) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'GitHub sync not configured for this project',
        });
      }

      return ctx.prisma.projectGitHubConfig.update({
        where: { projectId },
        data: updateData,
      });
    }),

  /**
   * Disconnect project from GitHub
   */
  disconnectProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      await ctx.prisma.projectGitHubConfig.deleteMany({
        where: { projectId: input.projectId },
      });

      return { success: true };
    }),

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  /**
   * Trigger a manual sync for a project
   */
  triggerSync: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        message: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      const config = await ctx.prisma.projectGitHubConfig.findUnique({
        where: { projectId: input.projectId },
      });

      if (!config) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'GitHub sync not configured for this project',
        });
      }

      if (!config.syncEnabled) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Sync is disabled for this project',
        });
      }

      // Queue the sync job
      const jobId = await queueSync({
        projectId: input.projectId,
        phase: 'manual',
        message: input.message,
      });

      // Update sync status
      await ctx.prisma.projectGitHubConfig.update({
        where: { projectId: input.projectId },
        data: { syncStatus: 'syncing' },
      });

      return { jobId };
    }),

  /**
   * Get sync history for a project
   */
  getSyncHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      const config = await ctx.prisma.projectGitHubConfig.findUnique({
        where: { projectId: input.projectId },
      });

      if (!config) {
        return { history: [], total: 0 };
      }

      const [history, total] = await Promise.all([
        ctx.prisma.gitHubSyncHistory.findMany({
          where: { configId: config.id },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.gitHubSyncHistory.count({
          where: { configId: config.id },
        }),
      ]);

      return { history, total };
    }),
});
