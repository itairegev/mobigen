/**
 * GitHub Sync Hook for Orchestrator
 *
 * Integrates GitHub sync with the generation pipeline.
 * This file is self-contained to avoid dependency issues during build.
 * The actual sync implementation uses @mobigen/github at runtime.
 */

// Types for GitHub integration (duplicated here for build-time independence)
export interface FileChanges {
  added: string[];
  modified: string[];
  deleted: string[];
}

export interface SyncJobData {
  projectId: string;
  phase: string;
  message?: string;
  files?: FileChanges;
}

/**
 * Database interface for checking GitHub config
 * Implemented by the caller to avoid circular dependencies
 */
export interface GitHubConfigChecker {
  getProjectGitHubConfig(projectId: string): Promise<{
    syncEnabled: boolean;
    autoCommit: boolean;
  } | null>;
  updateSyncStatus(projectId: string, status: 'syncing' | 'synced' | 'failed'): Promise<void>;
}

/**
 * File change tracker for orchestrator integration
 * Tracks files modified during generation phases
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
 * Check if GitHub sync is enabled for a project
 */
export async function isGitHubSyncEnabled(
  projectId: string,
  configChecker?: GitHubConfigChecker
): Promise<boolean> {
  if (!configChecker) {
    // If no config checker provided, check environment variable
    return process.env.GITHUB_SYNC_ENABLED === 'true';
  }

  const config = await configChecker.getProjectGitHubConfig(projectId);
  return config?.syncEnabled && config?.autoCommit || false;
}

/**
 * Queue a sync job (dynamic import to avoid build-time dependency)
 */
async function queueSync(data: SyncJobData): Promise<string> {
  try {
    // Dynamically import @mobigen/github at runtime
    // Using Function to avoid TypeScript's static analysis of the import
    const importModule = new Function('moduleName', 'return import(moduleName)');
    const github = await importModule('@mobigen/github') as {
      queueSync: (data: SyncJobData) => Promise<string>;
    };
    return await github.queueSync(data);
  } catch (error) {
    console.warn('[github-sync] @mobigen/github not available, sync skipped:', error);
    return '';
  }
}

/**
 * Trigger GitHub sync after a generation phase
 *
 * @param projectId - Project ID
 * @param phase - Generation phase name (e.g., 'design', 'generation', 'validation')
 * @param tracker - File change tracker
 * @param configChecker - Optional config checker (for database access)
 * @returns Job ID if queued, null if skipped
 */
export async function triggerGitHubPhaseSync(
  projectId: string,
  phase: string,
  tracker: GitHubFileTracker,
  configChecker?: GitHubConfigChecker
): Promise<string | null> {
  // Check if sync is enabled
  const enabled = await isGitHubSyncEnabled(projectId, configChecker);
  if (!enabled) {
    console.log(`[github-sync] Sync disabled for project ${projectId}, skipping`);
    return null;
  }

  // Get changes from tracker
  const changes = tracker.getChanges();

  // Don't queue if no changes
  if (!tracker.hasChanges()) {
    console.log(`[github-sync] No changes to sync for ${phase} phase`);
    return null;
  }

  console.log(`[github-sync] Queuing sync for ${phase} phase:`, {
    added: changes.added.length,
    modified: changes.modified.length,
    deleted: changes.deleted.length,
  });

  try {
    // Update status to syncing
    if (configChecker) {
      await configChecker.updateSyncStatus(projectId, 'syncing');
    }

    // Queue the sync job
    const jobId = await queueSync({
      projectId,
      phase,
      files: changes,
    });

    // Clear tracker for next phase
    tracker.clear();

    if (jobId) {
      console.log(`[github-sync] Queued sync job ${jobId} for ${phase} phase`);
    }
    return jobId || null;
  } catch (error) {
    console.error(`[github-sync] Failed to queue sync:`, error);

    // Update status to failed
    if (configChecker) {
      await configChecker.updateSyncStatus(projectId, 'failed');
    }

    return null;
  }
}

/**
 * Phase names that trigger GitHub sync
 */
export const SYNC_PHASES = [
  'setup',
  'product-definition',
  'architecture',
  'ui-design',
  'implementation',
  'validation',
  'quality-assurance',
] as const;

export type SyncPhase = typeof SYNC_PHASES[number];

/**
 * Check if a phase should trigger sync
 */
export function shouldSyncPhase(phase: string): boolean {
  return SYNC_PHASES.includes(phase as SyncPhase);
}
