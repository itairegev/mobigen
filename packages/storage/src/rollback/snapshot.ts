/**
 * Snapshot capture for rollback system
 *
 * Captures file state before risky operations
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileSnapshot {
  path: string;
  content: string;
  timestamp: number;
  size: number;
}

export interface Snapshot {
  id: string;
  projectId: string;
  files: FileSnapshot[];
  createdAt: number;
  reason: string;
}

/**
 * Generate unique snapshot ID
 */
export function generateSnapshotId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Capture snapshot of files
 */
export async function captureSnapshot(
  projectRoot: string,
  files: string[],
  reason: string
): Promise<Snapshot> {
  const id = generateSnapshotId();
  const projectId = path.basename(projectRoot);
  const fileSnapshots: FileSnapshot[] = [];

  for (const file of files) {
    try {
      const filePath = path.isAbsolute(file) ? file : path.join(projectRoot, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);

      fileSnapshots.push({
        path: path.relative(projectRoot, filePath),
        content,
        timestamp: stats.mtimeMs,
        size: stats.size,
      });
    } catch (error) {
      // File might not exist yet - that's OK for new files
      console.log(`Snapshot: File not found (new file?): ${file}`);
    }
  }

  return {
    id,
    projectId,
    files: fileSnapshots,
    createdAt: Date.now(),
    reason,
  };
}

/**
 * Capture snapshot of all TypeScript files in project
 */
export async function captureFullSnapshot(
  projectRoot: string,
  reason: string
): Promise<Snapshot> {
  const files = await findAllSourceFiles(projectRoot);
  return captureSnapshot(projectRoot, files, reason);
}

/**
 * Find all source files in project
 */
async function findAllSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  const ignoreDirs = ['node_modules', '.git', 'android', 'ios', '.expo', 'dist', 'build'];

  async function walk(currentDir: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!ignoreDirs.includes(entry.name)) {
            await walk(fullPath);
          }
        } else if (entry.name.match(/\.(ts|tsx|js|jsx|json)$/)) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory access error - skip
    }
  }

  await walk(dir);
  return files;
}

/**
 * Get snapshot size in bytes
 */
export function getSnapshotSize(snapshot: Snapshot): number {
  return snapshot.files.reduce((total, file) => total + file.size, 0);
}

/**
 * Serialize snapshot for storage
 */
export function serializeSnapshot(snapshot: Snapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Deserialize snapshot from storage
 */
export function deserializeSnapshot(data: string): Snapshot {
  return JSON.parse(data);
}
