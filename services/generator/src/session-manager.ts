import { prisma } from '@mobigen/db';
import type { SDKMessage } from '@mobigen/ai';

export interface SessionManager {
  saveSession(projectId: string, sessionId: string): Promise<void>;
  getSession(projectId: string): Promise<string | undefined>;
  forkSession(projectId: string, branchName: string): Promise<string>;
}

export async function saveSession(projectId: string, sessionId: string): Promise<void> {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      claudeSessionId: sessionId,
      sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  await prisma.projectSession.create({
    data: {
      projectId,
      claudeSessionId: sessionId,
    },
  });
}

export async function getSession(projectId: string): Promise<string | undefined> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      claudeSessionId: true,
      sessionExpiresAt: true,
    },
  });

  if (!project?.claudeSessionId || !project.sessionExpiresAt) {
    return undefined;
  }

  // Check if session is expired
  if (new Date() > project.sessionExpiresAt) {
    return undefined;
  }

  return project.claudeSessionId;
}

export async function forkSession(
  projectId: string,
  branchName: string
): Promise<string> {
  const parentSession = await getSession(projectId);

  // Create a new session record linked to the parent
  const newSession = await prisma.projectSession.create({
    data: {
      projectId,
      claudeSessionId: `fork-${branchName}-${Date.now()}`,
      summary: `Forked from ${parentSession} for ${branchName}`,
    },
  });

  return newSession.claudeSessionId;
}

export async function flagForHumanReview(
  projectId: string,
  logs: SDKMessage[]
): Promise<void> {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'needs_review',
        config: {
          reviewReason: 'Validation failed after 3 attempts',
          failedAt: new Date().toISOString(),
          logCount: logs.length,
        },
      },
    });

    // Could also send notification, create support ticket, etc.
    console.warn(`Project ${projectId} flagged for human review`);
  } catch (error) {
    // Handle case where project doesn't exist (e.g., during E2E tests)
    console.warn(`Could not flag project ${projectId} for review:`, error instanceof Error ? error.message : error);
  }
}

export async function endSession(
  projectId: string,
  sessionId: string,
  summary: string,
  filesModified: string[],
  tokensUsed: number
): Promise<void> {
  await prisma.projectSession.updateMany({
    where: {
      projectId,
      claudeSessionId: sessionId,
      endedAt: null,
    },
    data: {
      endedAt: new Date(),
      summary,
      filesModified,
      tokensUsed,
      durationSeconds: Math.floor(
        (Date.now() - new Date().getTime()) / 1000
      ),
    },
  });
}
