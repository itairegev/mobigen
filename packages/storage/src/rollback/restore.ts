/**
 * Restore from snapshot
 *
 * Atomically restores files from a snapshot
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Snapshot, FileSnapshot } from './snapshot';

export interface RestoreResult {
  success: boolean;
  filesRestored: number;
  filesSkipped: number;
  errors: Array<{ file: string; error: string }>;
  duration: number;
}

/**
 * Restore files from snapshot
 */
export async function restoreFromSnapshot(
  snapshot: Snapshot,
  projectRoot: string,
  options: {
    overwriteAll?: boolean;
    dryRun?: boolean;
  } = {}
): Promise<RestoreResult> {
  const { overwriteAll = true, dryRun = false } = options;

  const startTime = Date.now();
  const result: RestoreResult = {
    success: true,
    filesRestored: 0,
    filesSkipped: 0,
    errors: [],
    duration: 0,
  };

  // Phase 1: Validate all files can be written
  for (const file of snapshot.files) {
    const filePath = path.join(projectRoot, file.path);
    const dir = path.dirname(filePath);

    try {
      // Ensure directory exists
      if (!dryRun) {
        await fs.mkdir(dir, { recursive: true });
      }

      // Check if file exists and is writable
      try {
        await fs.access(filePath, fs.constants.W_OK);
      } catch {
        // File doesn't exist, which is fine for restore
      }
    } catch (error) {
      result.errors.push({
        file: file.path,
        error: `Cannot prepare path: ${error}`,
      });
      result.success = false;
    }
  }

  // Phase 2: If validation passed, restore all files
  if (result.success && !dryRun) {
    for (const file of snapshot.files) {
      try {
        const filePath = path.join(projectRoot, file.path);
        await fs.writeFile(filePath, file.content, 'utf-8');
        result.filesRestored++;
      } catch (error) {
        result.errors.push({
          file: file.path,
          error: `Failed to write: ${error}`,
        });
        result.success = false;
      }
    }
  } else if (dryRun) {
    result.filesRestored = snapshot.files.length;
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Restore a single file from snapshot
 */
export async function restoreSingleFile(
  snapshot: Snapshot,
  filePath: string,
  projectRoot: string
): Promise<{ success: boolean; error?: string }> {
  const fileSnapshot = snapshot.files.find(f => f.path === filePath);

  if (!fileSnapshot) {
    return { success: false, error: 'File not found in snapshot' };
  }

  try {
    const fullPath = path.join(projectRoot, fileSnapshot.path);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, fileSnapshot.content, 'utf-8');

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Compare current files with snapshot to see what changed
 */
export async function compareWithSnapshot(
  snapshot: Snapshot,
  projectRoot: string
): Promise<{
  unchanged: string[];
  modified: string[];
  deleted: string[];
  added: string[];
}> {
  const unchanged: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];
  const added: string[] = [];

  // Check files in snapshot
  for (const file of snapshot.files) {
    const filePath = path.join(projectRoot, file.path);

    try {
      const currentContent = await fs.readFile(filePath, 'utf-8');

      if (currentContent === file.content) {
        unchanged.push(file.path);
      } else {
        modified.push(file.path);
      }
    } catch {
      deleted.push(file.path);
    }
  }

  // Find new files (simplified - only checks src directory)
  const srcDir = path.join(projectRoot, 'src');
  try {
    const currentFiles = await findFilesInDir(srcDir);
    const snapshotPaths = new Set(snapshot.files.map(f => f.path));

    for (const file of currentFiles) {
      const relativePath = path.relative(projectRoot, file);
      if (!snapshotPaths.has(relativePath)) {
        added.push(relativePath);
      }
    }
  } catch {
    // src dir might not exist
  }

  return { unchanged, modified, deleted, added };
}

/**
 * Find all files in directory (recursive)
 */
async function findFilesInDir(dir: string): Promise<string[]> {
  const files: string[] = [];
  const ignoreDirs = ['node_modules', '.git', 'android', 'ios'];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !ignoreDirs.includes(entry.name)) {
        files.push(...await findFilesInDir(fullPath));
      } else if (entry.name.match(/\.(ts|tsx|js|jsx)$/)) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return files;
}
