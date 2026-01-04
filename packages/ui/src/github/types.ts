/**
 * GitHub Sync UI Types
 */

/**
 * GitHub connection status from database
 */
export type GitHubConnectionStatus = 'active' | 'revoked' | 'expired' | 'disconnected';

/**
 * GitHub sync status
 */
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'failed' | 'disconnected';

/**
 * GitHub connection data for UI
 */
export interface GitHubConnectionData {
  id: string;
  githubUsername: string;
  githubEmail: string | null;
  githubAvatarUrl: string | null;
  status: GitHubConnectionStatus;
  scopes: string[];
  connectedAt: Date;
}

/**
 * Project GitHub configuration for UI
 */
export interface ProjectGitHubData {
  id: string;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  defaultBranch: string;
  currentBranch: string;
  syncEnabled: boolean;
  autoCommit: boolean;
  autoPush: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: Date | null;
  lastCommitSha: string | null;
}

/**
 * Sync history entry for UI
 */
export interface SyncHistoryEntry {
  id: string;
  phase: string;
  commitSha: string | null;
  commitMessage: string | null;
  branch: string | null;
  filesAdded: string[];
  filesModified: string[];
  filesDeleted: string[];
  status: 'success' | 'failed';
  errorMessage: string | null;
  durationMs: number;
  createdAt: Date;
}

/**
 * Sync action types
 */
export type SyncAction = 'push' | 'pull' | 'disconnect' | 'configure';

/**
 * OAuth flow state
 */
export interface OAuthFlowState {
  isLoading: boolean;
  error: string | null;
}
