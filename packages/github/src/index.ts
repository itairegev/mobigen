/**
 * @mobigen/github - GitHub Integration Package
 *
 * Provides OAuth, sync, and repository management for Mobigen
 */

// Import for internal use
import {
  getOAuthUrl as _getOAuthUrl,
  exchangeCodeForTokens as _exchangeCodeForTokens,
  getUserInfo as _getUserInfo,
} from './oauth';
import { GitHubClient as _GitHubClient } from './client';
import { queueSync as _queueSync } from './sync';
import type { SyncJobData } from './types';

// Re-export types
export type {
  GitHubOAuthConfig,
  GitHubTokens,
  GitHubUser,
  GitHubRepo,
  CreateRepoOptions,
  CommitFile,
  CreateCommitOptions,
  CreateBranchOptions,
  CreatePROptions,
  GitHubPR,
  GitHubCommit,
  GitHubConnection,
  ProjectGitHubConfig,
  SyncJobData,
  SyncResult,
  OAuthState,
  FileChanges,
} from './types';

// Re-export errors
export {
  GitHubError,
  GitHubAuthError,
  GitHubRateLimitError,
  GitHubNotFoundError,
  GitHubConflictError,
  GitHubPermissionError,
  GitHubOAuthError,
  GitHubSyncConfigError,
  toGitHubError,
} from './errors';

// Re-export OAuth functions
export {
  getOAuthConfig,
  encodeState,
  decodeState,
  getOAuthUrl,
  exchangeCodeForTokens,
  getUserInfo,
  refreshAccessToken,
} from './oauth';

// Re-export client
export { GitHubClient } from './client';
export type { GitHubClientConfig } from './client';

// Re-export sync service
export {
  getSyncQueue,
  queueSync,
  createSyncWorker,
  GitHubFileTracker,
  triggerPhaseSync,
} from './sync';
export type { SyncDependencies } from './sync';

/**
 * Convenience namespace for all GitHub operations
 */
export const GitHubService = {
  // OAuth
  getOAuthUrl: (state: string) => {
    return _getOAuthUrl(state);
  },

  exchangeCodeForTokens: (code: string) => {
    return _exchangeCodeForTokens(code);
  },

  getUserInfo: (accessToken: string) => {
    return _getUserInfo(accessToken);
  },

  // Client
  createClient: (config: { accessToken: string }) => {
    return new _GitHubClient(config);
  },

  // Sync
  queueSync: (data: SyncJobData) => {
    return _queueSync(data);
  },
};
