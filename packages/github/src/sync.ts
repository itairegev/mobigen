/**
 * GitHub Sync Service
 *
 * Handles queuing and processing of sync jobs to push changes to GitHub
 */

import { Queue, Worker, Job } from 'bullmq';
import type {
  SyncJobData,
  SyncResult,
  FileChanges,
  ProjectGitHubConfig,
  GitHubConnection,
} from './types';
import { GitHubClient } from './client';
import { GitHubSyncConfigError } from './errors';

// Queue configuration
const QUEUE_NAME = 'github-sync';

// Default Redis connection (can be overridden)
const DEFAULT_REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

/**
 * Sync queue for background processing
 */
let syncQueueInstance: Queue<SyncJobData> | null = null;

/**
 * Get or create the sync queue
 */
export function getSyncQueue(redisConfig = DEFAULT_REDIS_CONFIG): Queue<SyncJobData> {
  if (!syncQueueInstance) {
    syncQueueInstance = new Queue<SyncJobData>(QUEUE_NAME, {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return syncQueueInstance;
}

/**
 * Queue a sync job
 */
export async function queueSync(data: SyncJobData): Promise<string> {
  const queue = getSyncQueue();
  const job = await queue.add('sync', data, {
    priority: data.phase === 'manual' ? 1 : 10,
  });
  return job.id || '';
}

/**
 * Dependency interfaces to avoid circular dependencies
 */
export interface SyncDependencies {
  getProjectConfig: (projectId: string) => Promise<ProjectGitHubConfig | null>;
  getConnection: (connectionId: string) => Promise<GitHubConnection | null>;
  decrypt: (encrypted: string) => Promise<string>;
  readFile: (projectId: string, path: string) => Promise<string>;
  getChangedFiles: (projectId: string, sinceCommit: string | null) => Promise<FileChanges>;
  updateSyncStatus: (projectId: string, status: string, commitSha?: string) => Promise<void>;
  createSyncHistory: (data: {
    projectId: string;
    configId: string | null;
    phase: string;
    commitSha?: string;
    commitMessage?: string;
    branch?: string;
    filesAdded?: string[];
    filesModified?: string[];
    filesDeleted?: string[];
    status: string;
    errorMessage?: string;
    durationMs: number;
  }) => Promise<void>;
}

/**
 * Create sync worker with dependencies
 */
export function createSyncWorker(
  deps: SyncDependencies,
  redisConfig = DEFAULT_REDIS_CONFIG
): Worker<SyncJobData, SyncResult> {
  return new Worker<SyncJobData, SyncResult>(
    QUEUE_NAME,
    async (job: Job<SyncJobData>) => processSync(job, deps),
    {
      connection: redisConfig,
      concurrency: 5,
    }
  );
}

/**
 * Process a sync job
 */
async function processSync(
  job: Job<SyncJobData>,
  deps: SyncDependencies
): Promise<SyncResult> {
  const { projectId, phase, message, files } = job.data;
  const startTime = Date.now();

  try {
    // 1. Get project GitHub config
    const config = await deps.getProjectConfig(projectId);

    if (!config) {
      return { success: false, skipped: true, reason: 'GitHub sync not configured' };
    }

    if (!config.syncEnabled) {
      return { success: false, skipped: true, reason: 'Sync disabled for project' };
    }

    if (!config.connectionId) {
      return { success: false, skipped: true, reason: 'No GitHub connection' };
    }

    // 2. Get connection and create client
    const connection = await deps.getConnection(config.connectionId);
    if (!connection || connection.status !== 'active') {
      throw new GitHubSyncConfigError('GitHub connection not found or inactive');
    }

    const github = await GitHubClient.fromConnection(connection, deps.decrypt);

    // 3. Get changed files
    const changedFiles = files || await deps.getChangedFiles(projectId, config.lastCommitSha);

    if (
      changedFiles.added.length === 0 &&
      changedFiles.modified.length === 0 &&
      changedFiles.deleted.length === 0
    ) {
      return { success: true, skipped: true, reason: 'No changes to sync' };
    }

    // 4. Read file contents
    const filesToCommit = await Promise.all(
      [...changedFiles.added, ...changedFiles.modified].map(async (path) => ({
        path,
        content: await deps.readFile(projectId, path),
      }))
    );

    // 5. Determine branch
    let branch = config.currentBranch || config.defaultBranch;

    if (config.branchStrategy === 'feature') {
      // Create feature branch for this session
      const branchName = `mobigen/${projectId.substring(0, 8)}`;
      branch = await github.createBranch({
        owner: config.repoOwner,
        repo: config.repoName,
        branchName,
        baseBranch: config.defaultBranch,
      });
    }

    // 6. Create commit
    const commitMessage = formatCommitMessage(phase, message, changedFiles);
    const commit = await github.createCommit({
      owner: config.repoOwner,
      repo: config.repoName,
      branch,
      message: commitMessage,
      files: filesToCommit,
      deletedFiles: changedFiles.deleted,
    });

    // 7. Create PR if configured
    let prUrl: string | undefined;
    if (config.createPrs && config.branchStrategy === 'feature') {
      const pr = await github.createPullRequest({
        owner: config.repoOwner,
        repo: config.repoName,
        title: `[Mobigen] ${phase}: ${message || 'App update'}`,
        body: generatePRBody(phase, changedFiles, projectId),
        head: branch,
        base: config.defaultBranch,
      });
      prUrl = pr.html_url;
    }

    // 8. Update sync status and create history
    await deps.updateSyncStatus(projectId, 'synced', commit.sha);
    await deps.createSyncHistory({
      projectId,
      configId: config.id,
      phase,
      commitSha: commit.sha,
      commitMessage,
      branch,
      filesAdded: changedFiles.added,
      filesModified: changedFiles.modified,
      filesDeleted: changedFiles.deleted,
      status: 'success',
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      commitSha: commit.sha,
      prUrl,
    };
  } catch (error) {
    // Update status to failed
    await deps.updateSyncStatus(projectId, 'failed');
    await deps.createSyncHistory({
      projectId,
      configId: null,
      phase,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });

    throw error;
  }
}

/**
 * Format commit message
 */
function formatCommitMessage(
  phase: string,
  customMessage: string | undefined,
  files: FileChanges
): string {
  const description = customMessage || getPhaseDescription(phase);

  const lines = [
    `[Mobigen] ${phase}: ${description}`,
    '',
    `Phase: ${phase}`,
    'Generated by Mobigen AI',
    '',
    'Changes:',
  ];

  if (files.added.length > 0) {
    lines.push(...files.added.map(f => `+ ${f}`));
  }
  if (files.modified.length > 0) {
    lines.push(...files.modified.map(f => `~ ${f}`));
  }
  if (files.deleted.length > 0) {
    lines.push(...files.deleted.map(f => `- ${f}`));
  }

  return lines.join('\n');
}

/**
 * Get human-readable description for a phase
 */
function getPhaseDescription(phase: string): string {
  const descriptions: Record<string, string> = {
    design: 'Theme and UI configuration',
    generation: 'App components and screens',
    validation: 'All checks passed',
    fix: 'Resolved validation errors',
    refinement: 'User-requested changes',
    manual: 'Manual sync',
  };
  return descriptions[phase] || 'App update';
}

/**
 * Generate PR body with change summary
 */
function generatePRBody(
  phase: string,
  files: FileChanges,
  projectId: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mobigen.io';

  return `## Summary

This PR was automatically created by Mobigen after the **${phase}** phase.

## Changes

### Added (${files.added.length})
${files.added.map(f => `- \`${f}\``).join('\n') || '_None_'}

### Modified (${files.modified.length})
${files.modified.map(f => `- \`${f}\``).join('\n') || '_None_'}

### Deleted (${files.deleted.length})
${files.deleted.map(f => `- \`${f}\``).join('\n') || '_None_'}

---

[View in Mobigen](${appUrl}/project/${projectId})

_Generated by Mobigen AI_
`;
}

/**
 * File change tracker for orchestrator integration
 */
export class GitHubFileTracker {
  private added: Set<string> = new Set();
  private modified: Set<string> = new Set();
  private deleted: Set<string> = new Set();

  /**
   * Track a file write operation
   */
  trackWrite(filePath: string, isNew: boolean): void {
    // Normalize path (remove leading project path if present)
    const normalizedPath = this.normalizePath(filePath);

    if (isNew) {
      this.added.add(normalizedPath);
      this.modified.delete(normalizedPath);
    } else {
      if (!this.added.has(normalizedPath)) {
        this.modified.add(normalizedPath);
      }
    }
    this.deleted.delete(normalizedPath);
  }

  /**
   * Track a file deletion
   */
  trackDelete(filePath: string): void {
    const normalizedPath = this.normalizePath(filePath);
    this.added.delete(normalizedPath);
    this.modified.delete(normalizedPath);
    this.deleted.add(normalizedPath);
  }

  /**
   * Get all tracked changes
   */
  getChanges(): FileChanges {
    return {
      added: Array.from(this.added),
      modified: Array.from(this.modified),
      deleted: Array.from(this.deleted),
    };
  }

  /**
   * Check if there are any changes
   */
  hasChanges(): boolean {
    return this.added.size > 0 || this.modified.size > 0 || this.deleted.size > 0;
  }

  /**
   * Clear all tracked changes
   */
  clear(): void {
    this.added.clear();
    this.modified.clear();
    this.deleted.clear();
  }

  /**
   * Normalize file path for consistent tracking
   */
  private normalizePath(filePath: string): string {
    // Remove project path prefix if present
    // Assumes paths are relative to project root
    return filePath
      .replace(/^\/+/, '')  // Remove leading slashes
      .replace(/\/\//g, '/'); // Remove double slashes
  }
}

/**
 * Trigger GitHub sync after a generation phase
 */
export async function triggerPhaseSync(
  projectId: string,
  phase: string,
  tracker: GitHubFileTracker
): Promise<string | null> {
  const changes = tracker.getChanges();

  // Don't queue if no changes
  if (!tracker.hasChanges()) {
    return null;
  }

  // Queue the sync job
  const jobId = await queueSync({
    projectId,
    phase,
    files: changes,
  });

  // Clear tracker for next phase
  tracker.clear();

  return jobId;
}
