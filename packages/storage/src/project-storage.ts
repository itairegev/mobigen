import * as fs from 'fs/promises';
import * as path from 'path';
import * as tar from 'tar';
import { S3Storage } from './s3-client.js';
import { GitStorage } from './git-client.js';
import type { ProjectStorageConfig, ProjectSnapshot, FileInfo } from './types.js';

export class ProjectStorage {
  private s3: S3Storage;
  private git: GitStorage;
  private projectId: string;
  private localPath: string;

  constructor(config: ProjectStorageConfig, localPath: string) {
    this.projectId = config.projectId;
    this.localPath = localPath;
    this.s3 = new S3Storage({
      s3Bucket: config.bucket,
      s3Region: process.env.AWS_REGION || 'us-east-1',
      s3Prefix: config.prefix,
    });
    this.git = new GitStorage(localPath);
  }

  async initialize(): Promise<void> {
    // Create local directory if needed
    await fs.mkdir(this.localPath, { recursive: true });

    // Initialize git if not already a repo
    if (!(await this.git.isRepo())) {
      await this.git.init();
    }
  }

  async saveSnapshot(version: number, message: string): Promise<ProjectSnapshot> {
    // Stage and commit all changes
    await this.git.add('.');
    const commitHash = await this.git.commit(`v${version}: ${message}`);

    // Create tarball
    const tarballPath = path.join(this.localPath, '..', `${this.projectId}-v${version}.tar.gz`);
    await tar.create(
      {
        gzip: true,
        file: tarballPath,
        cwd: this.localPath,
      },
      ['.']
    );

    // Upload to S3
    const tarball = await fs.readFile(tarballPath);
    const s3Key = `projects/${this.projectId}/snapshots/v${version}.tar.gz`;
    await this.s3.upload(s3Key, tarball, 'application/gzip');

    // Clean up local tarball
    await fs.unlink(tarballPath);

    // Get file list
    const files = await this.listFiles();

    return {
      version,
      timestamp: new Date(),
      s3Key,
      gitCommit: commitHash,
      files,
    };
  }

  async restoreSnapshot(version: number): Promise<void> {
    const s3Key = `projects/${this.projectId}/snapshots/v${version}.tar.gz`;

    // Download tarball
    const { data } = await this.s3.download(s3Key);
    const tarballPath = path.join(this.localPath, '..', `restore-v${version}.tar.gz`);
    await fs.writeFile(tarballPath, data);

    // Clear local directory (except .git)
    const entries = await fs.readdir(this.localPath);
    for (const entry of entries) {
      if (entry !== '.git') {
        await fs.rm(path.join(this.localPath, entry), { recursive: true });
      }
    }

    // Extract tarball
    await tar.extract({
      file: tarballPath,
      cwd: this.localPath,
    });

    // Clean up
    await fs.unlink(tarballPath);

    // Commit the restore
    await this.git.add('.');
    await this.git.commit(`Restored to v${version}`);
  }

  async uploadFile(filePath: string, content: Buffer): Promise<void> {
    const fullPath = path.join(this.localPath, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.localPath, filePath);
    return fs.readFile(fullPath);
  }

  async listFiles(): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    const walk = async (dir: string, prefix: string = '') => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;

        const relativePath = path.join(prefix, entry.name);
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath, relativePath);
        } else {
          const stat = await fs.stat(fullPath);
          files.push({
            path: relativePath,
            size: stat.size,
            lastModified: stat.mtime,
          });
        }
      }
    };

    await walk(this.localPath);
    return files;
  }

  async getGitHistory(count: number = 10) {
    return this.git.getCommits(count);
  }

  async revertToCommit(commitHash: string): Promise<void> {
    await this.git.checkout(commitHash);
  }
}
