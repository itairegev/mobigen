/**
 * GitHub Integration Types
 */

/**
 * GitHub OAuth configuration
 */
export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

/**
 * OAuth tokens returned from GitHub
 */
export interface GitHubTokens {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * GitHub user info
 */
export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
  name: string | null;
}

/**
 * GitHub repository info
 */
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

/**
 * Repository creation options
 */
export interface CreateRepoOptions {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
}

/**
 * File to commit
 */
export interface CommitFile {
  path: string;
  content: string;
  mode?: '100644' | '100755' | '040000' | '160000' | '120000';
}

/**
 * Commit options
 */
export interface CreateCommitOptions {
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: CommitFile[];
  deletedFiles?: string[];
}

/**
 * Branch creation options
 */
export interface CreateBranchOptions {
  owner: string;
  repo: string;
  branchName: string;
  baseBranch?: string;
}

/**
 * Pull request options
 */
export interface CreatePROptions {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
}

/**
 * Pull request info
 */
export interface GitHubPR {
  number: number;
  html_url: string;
  title: string;
  state: 'open' | 'closed' | 'merged';
}

/**
 * Commit result
 */
export interface GitHubCommit {
  sha: string;
  message: string;
  html_url: string;
}

/**
 * GitHub connection stored in database
 */
export interface GitHubConnection {
  id: string;
  userId: string;
  githubUserId: number;
  githubUsername: string;
  githubEmail: string | null;
  githubAvatarUrl: string | null;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
  scopes: string[];
  status: 'active' | 'revoked' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project GitHub sync configuration
 */
export interface ProjectGitHubConfig {
  id: string;
  projectId: string;
  connectionId: string | null;
  repoOwner: string;
  repoName: string;
  repoFullName: string;
  repoUrl: string;
  defaultBranch: string;
  syncEnabled: boolean;
  autoCommit: boolean;
  autoPush: boolean;
  branchStrategy: 'single' | 'feature';
  createPrs: boolean;
  currentBranch: string;
  lastCommitSha: string | null;
  lastSyncAt: Date | null;
  syncStatus: 'pending' | 'synced' | 'syncing' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync job data
 */
export interface SyncJobData {
  projectId: string;
  phase: string;
  message?: string;
  files?: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  commitSha?: string;
  prUrl?: string;
  error?: string;
}

/**
 * OAuth state for CSRF protection
 */
export interface OAuthState {
  userId: string;
  projectId?: string;
  redirectPath?: string;
  timestamp: number;
}

/**
 * File changes tracked during generation
 */
export interface FileChanges {
  added: string[];
  modified: string[];
  deleted: string[];
}
