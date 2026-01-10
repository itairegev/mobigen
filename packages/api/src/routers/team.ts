/**
 * Team Router
 *
 * Manages team collaboration for project content management.
 * Enterprise tier only.
 */

import { z } from 'zod';
import crypto from 'crypto';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const inviteMemberInput = z.object({
  projectId: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
  permissions: z.array(z.string()).optional(), // Specific resource permissions
});

const updateMemberInput = z.object({
  projectId: z.string(),
  memberId: z.string(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
  permissions: z.array(z.string()).optional(),
});

const removeMemberInput = z.object({
  projectId: z.string(),
  memberId: z.string(),
});

const listMembersInput = z.object({
  projectId: z.string(),
  includeRemoved: z.boolean().optional().default(false),
});

const resendInviteInput = z.object({
  projectId: z.string(),
  memberId: z.string(),
});

const acceptInviteInput = z.object({
  token: z.string(),
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
): Promise<{ project: any; isOwner: boolean }> {
  const project = await ctx.prisma.project.findFirst({
    where: { id: projectId },
    include: {
      user: {
        select: { id: true, tier: true, email: true },
      },
    },
  });

  if (!project) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Project not found',
    });
  }

  const isOwner = project.userId === ctx.userId;

  // Check if user is an admin team member
  const teamMember = await ctx.prisma.teamMember.findFirst({
    where: {
      projectId,
      userId: ctx.userId,
      status: 'accepted',
      removedAt: null,
    },
  });

  const isAdmin = teamMember?.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only project owners and admins can manage team members',
    });
  }

  if (project.user.tier !== 'enterprise') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Team collaboration requires Enterprise tier subscription',
    });
  }

  return { project, isOwner };
}

/**
 * Generate an invite token
 */
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Role hierarchy for permission checks
 */
const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

// ============================================================================
// ROUTER
// ============================================================================

export const teamRouter = router({
  /**
   * Invite a new team member
   */
  invite: protectedProcedure.input(inviteMemberInput).mutation(async ({ ctx, input }) => {
    const { project } = await checkEnterpriseAccess(ctx, input.projectId);

    // Check if email is the owner
    if (input.email === project.user.email) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot invite the project owner as a team member',
      });
    }

    // Check max team size (20 members)
    const existingCount = await ctx.prisma.teamMember.count({
      where: {
        projectId: input.projectId,
        removedAt: null,
      },
    });

    if (existingCount >= 20) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Maximum of 20 team members per project',
      });
    }

    // Check if already invited/member
    const existing = await ctx.prisma.teamMember.findFirst({
      where: {
        projectId: input.projectId,
        email: input.email,
        removedAt: null,
      },
    });

    if (existing) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This email is already invited or a team member',
      });
    }

    // Find user by email (may not exist yet)
    const invitedUser = await ctx.prisma.user.findUnique({
      where: { email: input.email },
    });

    const inviteToken = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const member = await ctx.prisma.teamMember.create({
      data: {
        projectId: input.projectId,
        userId: invitedUser?.id || ctx.userId, // Use invited user's ID if they exist, otherwise current user
        invitedBy: ctx.userId,
        email: input.email,
        role: input.role,
        permissions: input.permissions || [],
        status: 'pending',
        inviteToken,
        inviteExpiresAt: expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // In production, send invite email here
    // await sendInviteEmail(input.email, inviteToken, project.name);

    return {
      member,
      inviteUrl: `/accept-invite?token=${inviteToken}`,
      message: `Invitation sent to ${input.email}`,
    };
  }),

  /**
   * List team members
   */
  list: protectedProcedure.input(listMembersInput).query(async ({ ctx, input }) => {
    // Allow any team member to view the list
    const project = await ctx.prisma.project.findFirst({
      where: { id: input.projectId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!project) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Project not found',
      });
    }

    // Check if user has access
    const hasAccess =
      project.userId === ctx.userId ||
      (await ctx.prisma.teamMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.userId,
          status: 'accepted',
          removedAt: null,
        },
      }));

    if (!hasAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied',
      });
    }

    const members = await ctx.prisma.teamMember.findMany({
      where: {
        projectId: input.projectId,
        ...(input.includeRemoved ? {} : { removedAt: null }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        permissions: true,
        acceptedAt: true,
        removedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Include owner as first "member"
    const ownerMember = {
      id: 'owner',
      email: project.user.email,
      role: 'owner' as const,
      status: 'accepted' as const,
      permissions: ['*'],
      acceptedAt: project.createdAt,
      removedAt: null,
      createdAt: project.createdAt,
      user: {
        id: project.user.id,
        name: project.user.name,
        email: project.user.email,
      },
      inviter: null,
      isOwner: true,
    };

    return {
      members: [ownerMember, ...members.map((m: any) => ({ ...m, isOwner: false }))],
    };
  }),

  /**
   * Update a team member's role/permissions
   */
  update: protectedProcedure.input(updateMemberInput).mutation(async ({ ctx, input }) => {
    await checkEnterpriseAccess(ctx, input.projectId);

    const member = await ctx.prisma.teamMember.findFirst({
      where: {
        id: input.memberId,
        projectId: input.projectId,
        removedAt: null,
      },
    });

    if (!member) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Team member not found',
      });
    }

    // Get current user's role
    const currentUserMember = await ctx.prisma.teamMember.findFirst({
      where: {
        projectId: input.projectId,
        userId: ctx.userId,
        status: 'accepted',
        removedAt: null,
      },
    });

    const project = await ctx.prisma.project.findUnique({
      where: { id: input.projectId },
    });

    const isOwner = project?.userId === ctx.userId;
    const currentRole = isOwner ? 'owner' : currentUserMember?.role || 'viewer';

    // Can't promote someone to same or higher role
    if (input.role && ROLE_HIERARCHY[input.role] >= ROLE_HIERARCHY[currentRole]) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot promote to same or higher role than yourself',
      });
    }

    const updated = await ctx.prisma.teamMember.update({
      where: { id: input.memberId },
      data: {
        role: input.role,
        permissions: input.permissions,
      },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
        status: true,
      },
    });

    return { member: updated };
  }),

  /**
   * Remove a team member
   */
  remove: protectedProcedure.input(removeMemberInput).mutation(async ({ ctx, input }) => {
    const { isOwner } = await checkEnterpriseAccess(ctx, input.projectId);

    const member = await ctx.prisma.teamMember.findFirst({
      where: {
        id: input.memberId,
        projectId: input.projectId,
        removedAt: null,
      },
    });

    if (!member) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Team member not found',
      });
    }

    // Only owner can remove admins
    if (member.role === 'admin' && !isOwner) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the project owner can remove admins',
      });
    }

    await ctx.prisma.teamMember.update({
      where: { id: input.memberId },
      data: {
        removedAt: new Date(),
        removedBy: ctx.userId,
      },
    });

    return { success: true };
  }),

  /**
   * Resend invitation email
   */
  resendInvite: protectedProcedure.input(resendInviteInput).mutation(async ({ ctx, input }) => {
    await checkEnterpriseAccess(ctx, input.projectId);

    const member = await ctx.prisma.teamMember.findFirst({
      where: {
        id: input.memberId,
        projectId: input.projectId,
        status: 'pending',
        removedAt: null,
      },
    });

    if (!member) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Pending invitation not found',
      });
    }

    // Generate new token
    const inviteToken = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await ctx.prisma.teamMember.update({
      where: { id: input.memberId },
      data: {
        inviteToken,
        inviteExpiresAt: expiresAt,
      },
    });

    // In production, send invite email here

    return {
      success: true,
      inviteUrl: `/accept-invite?token=${inviteToken}`,
      message: `Invitation resent to ${member.email}`,
    };
  }),

  /**
   * Accept an invitation (called by invited user)
   */
  acceptInvite: protectedProcedure.input(acceptInviteInput).mutation(async ({ ctx, input }) => {
    const member = await ctx.prisma.teamMember.findFirst({
      where: {
        inviteToken: input.token,
        status: 'pending',
        removedAt: null,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!member) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invalid or expired invitation',
      });
    }

    if (member.inviteExpiresAt && new Date(member.inviteExpiresAt) < new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This invitation has expired. Please request a new one.',
      });
    }

    // Verify email matches (if user was already registered)
    const currentUser = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
    });

    if (member.email !== currentUser?.email) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'This invitation was sent to a different email address',
      });
    }

    await ctx.prisma.teamMember.update({
      where: { id: member.id },
      data: {
        userId: ctx.userId,
        status: 'accepted',
        acceptedAt: new Date(),
        inviteToken: null, // Clear token after use
      },
    });

    return {
      success: true,
      projectId: member.project.id,
      projectName: member.project.name,
      role: member.role,
    };
  }),

  /**
   * Leave a project (for team members)
   */
  leave: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Owner can't leave their own project
      if (project.userId === ctx.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Project owners cannot leave. Transfer ownership or delete the project.',
        });
      }

      const member = await ctx.prisma.teamMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.userId,
          status: 'accepted',
          removedAt: null,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'You are not a member of this project',
        });
      }

      await ctx.prisma.teamMember.update({
        where: { id: member.id },
        data: {
          removedAt: new Date(),
          removedBy: ctx.userId,
        },
      });

      return { success: true };
    }),

  /**
   * Get current user's role in a project
   */
  getMyRole: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      if (project.userId === ctx.userId) {
        return {
          role: 'owner',
          permissions: ['*'],
          canManageTeam: true,
          canManageApiKeys: true,
        };
      }

      const member = await ctx.prisma.teamMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.userId,
          status: 'accepted',
          removedAt: null,
        },
      });

      if (!member) {
        return null; // Not a team member
      }

      return {
        role: member.role,
        permissions: member.permissions,
        canManageTeam: member.role === 'admin',
        canManageApiKeys: false,
      };
    }),
});
