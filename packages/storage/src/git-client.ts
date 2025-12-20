import simpleGit, { SimpleGit } from 'simple-git';
import type { GitCommit } from './types.js';

export class GitStorage {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  async init(): Promise<void> {
    await this.git.init();
    await this.git.addConfig('user.email', 'mobigen@auto.local');
    await this.git.addConfig('user.name', 'Mobigen');
  }

  async isRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  async add(files: string | string[] = '.'): Promise<void> {
    await this.git.add(files);
  }

  async commit(message: string): Promise<string> {
    const result = await this.git.commit(message);
    return result.commit;
  }

  async getLatestCommit(): Promise<GitCommit | null> {
    try {
      const log = await this.git.log({ maxCount: 1 });
      const latest = log.latest;
      if (!latest) return null;

      const diff = await this.git.diff(['--name-only', `${latest.hash}^`, latest.hash]);
      const files = diff.split('\n').filter(Boolean);

      return {
        hash: latest.hash,
        message: latest.message,
        author: latest.author_name,
        date: new Date(latest.date),
        files,
      };
    } catch {
      return null;
    }
  }

  async getCommits(count: number = 10): Promise<GitCommit[]> {
    const log = await this.git.log({ maxCount: count });
    return log.all.map((entry) => ({
      hash: entry.hash,
      message: entry.message,
      author: entry.author_name,
      date: new Date(entry.date),
      files: [],
    }));
  }

  async checkout(ref: string): Promise<void> {
    await this.git.checkout(ref);
  }

  async createBranch(name: string): Promise<void> {
    await this.git.checkoutLocalBranch(name);
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || 'main';
  }

  async getStatus(): Promise<{ staged: string[]; modified: string[]; untracked: string[] }> {
    const status = await this.git.status();
    return {
      staged: status.staged,
      modified: status.modified,
      untracked: status.not_added,
    };
  }

  async revert(commitHash: string): Promise<void> {
    await this.git.revert(commitHash);
  }

  async tag(name: string, message?: string): Promise<void> {
    if (message) {
      await this.git.addAnnotatedTag(name, message);
    } else {
      await this.git.addTag(name);
    }
  }
}
