/**
 * GitHub Service for Mobigen Generator
 *
 * Handles OAuth connection, repository management, and code export to GitHub
 */

import { GitHubClient, getOAuthUrl, exchangeCodeForTokens, getUserInfo } from '@mobigen/github';
import { prisma } from '@mobigen/db';
import { ProjectStorage } from '@mobigen/storage';
import * as crypto from 'crypto';
import * as path from 'path';
import type {
  GitHubRepo,
  GitHubPushOptions,
  OAuthTokens,
  OAuthState,
  PushResult,
  GitHubConnectionData,
  ProjectGitHubConfigData,
} from './github-types';

/**
 * Encryption key for storing sensitive tokens
 * In production, this should come from environment/secrets manager
 */
const ENCRYPTION_KEY = process.env.GITHUB_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

/**
 * GitHub Service Class
 */
export class GitHubService {
  /**
   * Generate OAuth URL for connecting GitHub account
   */
  static async startOAuth(userId: string, projectId?: string, redirectPath?: string): Promise<string> {
    const state: OAuthState = {
      userId,
      projectId,
      redirectPath,
      timestamp: Date.now(),
    };

    // Encode state as base64 JSON
    const stateEncoded = Buffer.from(JSON.stringify(state)).toString('base64');

    return getOAuthUrl(stateEncoded);
  }

  /**
   * Handle OAuth callback and store connection
   */
  static async handleOAuthCallback(code: string, state: string): Promise<{
    userId: string;
    projectId?: string;
    redirectPath?: string;
  }> {
    // Decode state
    const stateData: OAuthState = JSON.parse(Buffer.from(state, 'base64').toString());

    // Verify state is recent (prevent replay attacks)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 10 * 60 * 1000) {
      // 10 minutes
      throw new Error('OAuth state expired');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user info
    const githubUser = await getUserInfo(tokens.access_token);

    // Encrypt tokens
    const accessTokenEncrypted = this.encrypt(tokens.access_token);
    const refreshTokenEncrypted = tokens.refresh_token
      ? this.encrypt(tokens.refresh_token)
      : null;

    // Store or update connection
    await prisma.gitHubConnection.upsert({
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
        accessToken: accessTokenEncrypted,
        refreshToken: refreshTokenEncrypted,
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scopes: tokens.scope.split(' '),
        updatedAt: new Date(),
      },
      create: {
        userId: stateData.userId,
        githubId: githubUser.id,
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        accessToken: accessTokenEncrypted,
        refreshToken: refreshTokenEncrypted,
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scopes: tokens.scope.split(' '),
      },
    });

    return {
      userId: stateData.userId,
      projectId: stateData.projectId,
      redirectPath: stateData.redirectPath,
    };
  }

  /**
   * Get GitHub connection for a user
   */
  static async getConnection(userId: string): Promise<GitHubConnectionData | null> {
    const connection = await prisma.gitHubConnection.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!connection) {
      return null;
    }

    return {
      ...connection,
      accessToken: this.decrypt(connection.accessToken),
      refreshToken: connection.refreshToken ? this.decrypt(connection.refreshToken) : null,
    };
  }

  /**
   * List user's GitHub repositories
   */
  static async listRepos(userId: string, options?: {
    page?: number;
    perPage?: number;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  }): Promise<GitHubRepo[]> {
    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new Error('No GitHub connection found. Please connect your GitHub account.');
    }

    const client = new GitHubClient({ accessToken: connection.accessToken });
    return client.listUserRepos(options);
  }

  /**
   * Create a new GitHub repository
   */
  static async createRepo(userId: string, repoName: string, options?: {
    description?: string;
    private?: boolean;
  }): Promise<GitHubRepo> {
    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new Error('No GitHub connection found. Please connect your GitHub account.');
    }

    const client = new GitHubClient({ accessToken: connection.accessToken });
    return client.createRepo({
      name: repoName,
      description: options?.description,
      private: options?.private ?? true,
      autoInit: true,
    });
  }

  /**
   * Push project code to GitHub repository
   */
  static async pushToRepo(options: GitHubPushOptions): Promise<PushResult> {
    const {
      projectId,
      userId,
      repoOwner,
      repoName,
      branch = 'main',
      commitMessage = '[mobigen] Export generated code',
      createPullRequest = false,
      prTitle = 'Update from Mobigen',
      prBody = 'Generated code from Mobigen',
    } = options;

    try {
      // Get GitHub connection
      const connection = await this.getConnection(userId);
      if (!connection) {
        throw new Error('No GitHub connection found. Please connect your GitHub account.');
      }

      // Get project from database
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Initialize ProjectStorage
      const projectPath = path.join(process.cwd(), 'projects', projectId);
      const projectStorage = new ProjectStorage(
        {
          projectId,
          bucket: project.s3Bucket,
          prefix: project.s3Prefix,
        },
        projectPath
      );

      // Get project files
      const projectFiles = await projectStorage.listFiles();
      if (!projectFiles || projectFiles.length === 0) {
        throw new Error('No project files found');
      }

      // Create GitHub client
      const client = new GitHubClient({ accessToken: connection.accessToken });

      // Read file contents and prepare for commit
      const fs = await import('fs/promises');
      const files = await Promise.all(
        projectFiles.map(async (file) => {
          const fullPath = path.join(projectPath, file.path);
          const content = await fs.readFile(fullPath, 'utf-8');
          return {
            path: file.path,
            content,
          };
        })
      );

      // Determine target branch
      let targetBranch = branch;
      if (createPullRequest) {
        // Create a feature branch
        const timestamp = Date.now();
        targetBranch = `mobigen-export-${timestamp}`;

        await client.createBranch({
          owner: repoOwner,
          repo: repoName,
          branchName: targetBranch,
          baseBranch: branch,
        });
      }

      // Create commit
      const commit = await client.createCommit({
        owner: repoOwner,
        repo: repoName,
        branch: targetBranch,
        message: commitMessage,
        files,
      });

      let prUrl: string | undefined;
      let prNumber: number | undefined;

      // Create PR if requested
      if (createPullRequest) {
        const pr = await client.createPullRequest({
          owner: repoOwner,
          repo: repoName,
          title: prTitle,
          body: prBody,
          head: targetBranch,
          base: branch,
        });

        prUrl = pr.html_url;
        prNumber = pr.number;
      }

      // Store or update project GitHub config
      await this.updateProjectConfig(projectId, userId, repoOwner, repoName, branch);

      return {
        success: true,
        commitSha: commit.sha,
        commitUrl: commit.html_url,
        prNumber,
        prUrl,
      };
    } catch (error) {
      console.error('GitHub push error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a pull request with project changes
   */
  static async createPullRequest(
    userId: string,
    repoUrl: string,
    branch: string,
    options?: {
      title?: string;
      body?: string;
      base?: string;
    }
  ): Promise<{ number: number; url: string }> {
    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new Error('No GitHub connection found. Please connect your GitHub account.');
    }

    // Parse repo URL to get owner and repo name
    const urlMatch = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!urlMatch) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = urlMatch;

    const client = new GitHubClient({ accessToken: connection.accessToken });

    const pr = await client.createPullRequest({
      owner,
      repo,
      title: options?.title || 'Update from Mobigen',
      body: options?.body || 'Generated code from Mobigen',
      head: branch,
      base: options?.base || 'main',
    });

    return {
      number: pr.number,
      url: pr.html_url,
    };
  }

  /**
   * Update or create project GitHub configuration
   */
  private static async updateProjectConfig(
    projectId: string,
    userId: string,
    repoOwner: string,
    repoName: string,
    defaultBranch: string
  ): Promise<void> {
    const connection = await prisma.gitHubConnection.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!connection) {
      throw new Error('GitHub connection not found');
    }

    await prisma.projectGitHubConfig.upsert({
      where: { projectId },
      update: {
        repoOwner,
        repoName,
        defaultBranch,
        syncStatus: 'synced',
        lastSyncAt: new Date(),
        lastSyncError: null,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        connectionId: connection.id,
        repoOwner,
        repoName,
        defaultBranch,
        syncEnabled: false,
        autoCommit: false,
        commitPrefix: '[mobigen]',
        syncStatus: 'synced',
        lastSyncAt: new Date(),
      },
    });
  }

  /**
   * Get project GitHub configuration
   */
  static async getProjectConfig(projectId: string): Promise<ProjectGitHubConfigData | null> {
    return prisma.projectGitHubConfig.findUnique({
      where: { projectId },
    });
  }

  /**
   * Encrypt sensitive data
   */
  private static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  private static decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Disconnect GitHub account
   */
  static async disconnect(userId: string): Promise<void> {
    await prisma.gitHubConnection.deleteMany({
      where: { userId },
    });
  }

  /**
   * Check if user has GitHub connected
   */
  static async isConnected(userId: string): Promise<boolean> {
    const connection = await prisma.gitHubConnection.findFirst({
      where: { userId },
    });

    return !!connection;
  }
}
