/**
 * GitHub Integration Types for Generator Service
 */

/**
 * GitHub repository information
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
 * Options for pushing code to GitHub
 */
export interface GitHubPushOptions {
  projectId: string;
  userId: string;
  repoOwner: string;
  repoName: string;
  branch?: string;
  commitMessage?: string;
  createPullRequest?: boolean;
  prTitle?: string;
  prBody?: string;
}

/**
 * OAuth tokens from GitHub
 */
export interface OAuthTokens {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * GitHub OAuth state for CSRF protection
 */
export interface OAuthState {
  userId: string;
  projectId?: string;
  redirectPath?: string;
  timestamp: number;
}

/**
 * Result of a push operation
 */
export interface PushResult {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  prNumber?: number;
  prUrl?: string;
  error?: string;
}

/**
 * GitHub connection from database
 */
export interface GitHubConnectionData {
  id: string;
  userId: string;
  githubId: number;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project GitHub configuration
 */
export interface ProjectGitHubConfigData {
  id: string;
  projectId: string;
  connectionId: string;
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  syncEnabled: boolean;
  autoCommit: boolean;
  commitPrefix: string;
  syncStatus: string;
  lastSyncAt: Date | null;
  lastSyncError: string | null;
  createdAt: Date;
  updatedAt: Date;
}
