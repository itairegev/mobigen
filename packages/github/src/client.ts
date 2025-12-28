/**
 * GitHub API Client Wrapper
 *
 * Wraps Octokit with Mobigen-specific operations and error handling
 */

import { Octokit } from '@octokit/rest';
import type {
  GitHubConnection,
  GitHubRepo,
  CreateRepoOptions,
  CreateCommitOptions,
  CreateBranchOptions,
  CreatePROptions,
  GitHubCommit,
  GitHubPR,
} from './types';
import {
  toGitHubError,
  GitHubConflictError,
} from './errors';

export interface GitHubClientConfig {
  accessToken: string;
  userAgent?: string;
}

/**
 * GitHub API client for repository operations
 */
export class GitHubClient {
  private octokit: Octokit;

  constructor(config: GitHubClientConfig) {
    this.octokit = new Octokit({
      auth: config.accessToken,
      userAgent: config.userAgent || 'Mobigen/1.0',
    });
  }

  /**
   * Create client from a stored connection
   * Note: Requires decrypt function to be passed in to avoid circular dependency
   */
  static async fromConnection(
    connection: GitHubConnection,
    decrypt: (encrypted: string) => Promise<string>
  ): Promise<GitHubClient> {
    const accessToken = await decrypt(connection.accessTokenEncrypted);
    return new GitHubClient({ accessToken });
  }

  /**
   * List repositories for the authenticated user
   */
  async listUserRepos(options: {
    page?: number;
    perPage?: number;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  } = {}): Promise<GitHubRepo[]> {
    try {
      const response = await this.octokit.repos.listForAuthenticatedUser({
        page: options.page || 1,
        per_page: options.perPage || 30,
        sort: options.sort || 'updated',
        affiliation: 'owner,collaborator',
      });

      return response.data as GitHubRepo[];
    } catch (error) {
      throw toGitHubError(error);
    }
  }

  /**
   * Create a new repository
   */
  async createRepo(options: CreateRepoOptions): Promise<GitHubRepo> {
    try {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name: options.name,
        description: options.description,
        private: options.private ?? true,
        auto_init: options.autoInit ?? true,
        gitignore_template: 'Node',
      });

      return response.data as GitHubRepo;
    } catch (error) {
      throw toGitHubError(error);
    }
  }

  /**
   * Get repository by full name (owner/repo)
   */
  async getRepo(fullName: string): Promise<GitHubRepo> {
    try {
      const [owner, repo] = fullName.split('/');
      const response = await this.octokit.repos.get({ owner, repo });
      return response.data as GitHubRepo;
    } catch (error) {
      throw toGitHubError(error);
    }
  }

  /**
   * Create a commit with multiple file changes
   */
  async createCommit(options: CreateCommitOptions): Promise<GitHubCommit> {
    const { owner, repo, branch, message, files, deletedFiles = [] } = options;

    try {
      // 1. Get the current commit SHA for the branch
      const { data: ref } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      const currentCommitSha = ref.object.sha;

      // 2. Get the tree SHA from the current commit
      const { data: currentCommit } = await this.octokit.git.getCommit({
        owner,
        repo,
        commit_sha: currentCommitSha,
      });
      const currentTreeSha = currentCommit.tree.sha;

      // 3. Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await this.octokit.git.createBlob({
            owner,
            repo,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          return {
            path: file.path,
            mode: file.mode || '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        })
      );

      // 4. Add deletions (sha: null means delete)
      const deletions = deletedFiles.map((path) => ({
        path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: null as unknown as string, // Type workaround for deletion
      }));

      // 5. Create a new tree
      const { data: newTree } = await this.octokit.git.createTree({
        owner,
        repo,
        base_tree: currentTreeSha,
        tree: [...blobs, ...deletions],
      });

      // 6. Create the commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner,
        repo,
        message,
        tree: newTree.sha,
        parents: [currentCommitSha],
      });

      // 7. Update the reference
      await this.octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });

      return {
        sha: newCommit.sha,
        message: newCommit.message,
        html_url: newCommit.html_url,
      };
    } catch (error) {
      throw toGitHubError(error);
    }
  }

  /**
   * Create a new branch from an existing branch
   */
  async createBranch(options: CreateBranchOptions): Promise<string> {
    const { owner, repo, branchName, baseBranch = 'main' } = options;

    try {
      // Get the SHA of the base branch
      const { data: ref } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
      });

      // Create new branch
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha,
      });

      return branchName;
    } catch (error) {
      // If branch already exists, return it (not an error for our use case)
      const ghError = toGitHubError(error);
      if (ghError instanceof GitHubConflictError) {
        return branchName;
      }
      throw ghError;
    }
  }

  /**
   * Check if a branch exists
   */
  async branchExists(owner: string, repo: string, branch: string): Promise<boolean> {
    try {
      await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(options: CreatePROptions): Promise<GitHubPR> {
    try {
      const response = await this.octokit.pulls.create({
        owner: options.owner,
        repo: options.repo,
        title: options.title,
        body: options.body,
        head: options.head,
        base: options.base,
      });

      return {
        number: response.data.number,
        html_url: response.data.html_url,
        title: response.data.title,
        state: response.data.state as 'open' | 'closed',
      };
    } catch (error) {
      // If PR already exists for this head/base, that's ok
      const ghError = toGitHubError(error);
      if (ghError instanceof GitHubConflictError) {
        // Try to find existing PR
        const existingPR = await this.findExistingPR(
          options.owner,
          options.repo,
          options.head,
          options.base
        );
        if (existingPR) {
          return existingPR;
        }
      }
      throw ghError;
    }
  }

  /**
   * Find an existing PR for a head/base combination
   */
  private async findExistingPR(
    owner: string,
    repo: string,
    head: string,
    base: string
  ): Promise<GitHubPR | null> {
    try {
      const response = await this.octokit.pulls.list({
        owner,
        repo,
        head: head.includes(':') ? head : `${owner}:${head}`,
        base,
        state: 'open',
      });

      if (response.data.length > 0) {
        const pr = response.data[0];
        return {
          number: pr.number,
          html_url: pr.html_url,
          title: pr.title,
          state: pr.state as 'open' | 'closed',
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimit(): Promise<{
    remaining: number;
    limit: number;
    resetAt: Date;
  }> {
    try {
      const response = await this.octokit.rateLimit.get();
      return {
        remaining: response.data.resources.core.remaining,
        limit: response.data.resources.core.limit,
        resetAt: new Date(response.data.resources.core.reset * 1000),
      };
    } catch (error) {
      throw toGitHubError(error);
    }
  }
}
