/**
 * Pattern 3: Incorrect import path fix
 *
 * Detects: Import path resolution errors
 * Fixes: Calculates and replaces with correct relative path
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface ImportPathError {
  file: string;
  line: number;
  importPath: string;
  message: string;
}

export interface ImportPathFix {
  type: 'fix-import-path';
  file: string;
  line: number;
  oldPath: string;
  newPath: string;
  confidence: number;
}

/**
 * Parse import path error
 */
export function parseImportPathError(
  message: string,
  file: string,
  line?: number
): ImportPathError | null {
  // Pattern: "Cannot resolve import: './components/Button'"
  let match = message.match(/Cannot resolve import:\s*['"](.+?)['"]/);
  if (match) {
    return { file, line: line || 0, importPath: match[1], message };
  }

  // TypeScript: "Cannot find module './components/Button'"
  match = message.match(/Cannot find module ['"](.+?)['"]/);
  if (match) {
    return { file, line: line || 0, importPath: match[1], message };
  }

  // ESLint: "Unable to resolve path to module './components/Button'"
  match = message.match(/Unable to resolve path to module ['"](.+?)['"]/);
  if (match) {
    return { file, line: line || 0, importPath: match[1], message };
  }

  return null;
}

/**
 * Find the correct path for an import
 */
export async function findCorrectPath(
  originalPath: string,
  fromFile: string,
  projectRoot: string
): Promise<string | null> {
  const filename = path.basename(originalPath);
  const fromDir = path.dirname(path.join(projectRoot, fromFile));

  // Extract the target name (might be missing extension)
  const targetName = filename.replace(/\.(ts|tsx|js|jsx)$/, '');

  // Search for the file in common locations
  const searchDirs = [
    path.join(projectRoot, 'src'),
    path.join(projectRoot, 'src/components'),
    path.join(projectRoot, 'src/screens'),
    path.join(projectRoot, 'src/hooks'),
    path.join(projectRoot, 'src/services'),
    path.join(projectRoot, 'src/utils'),
    path.join(projectRoot, 'src/types'),
    path.join(projectRoot, 'app'),
  ];

  for (const searchDir of searchDirs) {
    const found = await findFileByName(searchDir, targetName);
    if (found) {
      // Calculate relative path from fromFile
      let relativePath = path.relative(fromDir, found);

      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }

      // Remove extension
      relativePath = relativePath.replace(/\.(ts|tsx|js|jsx)$/, '');

      return relativePath;
    }
  }

  // Check if it's an index import
  const potentialIndexDirs = [
    path.join(projectRoot, 'src', targetName),
    path.join(projectRoot, 'src/components', targetName),
  ];

  for (const dir of potentialIndexDirs) {
    const indexPath = path.join(dir, 'index.ts');
    const indexTsxPath = path.join(dir, 'index.tsx');

    try {
      await fs.access(indexPath);
      let relativePath = path.relative(fromDir, dir);
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }
      return relativePath;
    } catch {}

    try {
      await fs.access(indexTsxPath);
      let relativePath = path.relative(fromDir, dir);
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }
      return relativePath;
    } catch {}
  }

  return null;
}

/**
 * Find a file by name in a directory (recursive)
 */
async function findFileByName(dir: string, targetName: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const found = await findFileByName(fullPath, targetName);
        if (found) return found;
      } else {
        const nameWithoutExt = entry.name.replace(/\.(ts|tsx|js|jsx)$/, '');
        if (nameWithoutExt === targetName) {
          return fullPath;
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return null;
}

/**
 * Generate import path fix
 */
export async function generateImportPathFix(
  error: ImportPathError,
  projectRoot: string
): Promise<ImportPathFix | null> {
  const correctPath = await findCorrectPath(error.importPath, error.file, projectRoot);

  if (!correctPath) {
    return null;
  }

  // Calculate confidence based on path similarity
  const confidence = calculatePathSimilarity(error.importPath, correctPath);

  return {
    type: 'fix-import-path',
    file: error.file,
    line: error.line,
    oldPath: error.importPath,
    newPath: correctPath,
    confidence,
  };
}

/**
 * Calculate similarity between two paths for confidence scoring
 */
function calculatePathSimilarity(oldPath: string, newPath: string): number {
  const oldParts = oldPath.split('/');
  const newParts = newPath.split('/');

  // Higher confidence if filenames match
  const oldFilename = oldParts[oldParts.length - 1];
  const newFilename = newParts[newParts.length - 1];

  if (oldFilename === newFilename) {
    return 0.95;
  }

  // Lower confidence if only part of path matches
  const matchingParts = oldParts.filter(p => newParts.includes(p)).length;
  return Math.max(0.7, matchingParts / Math.max(oldParts.length, newParts.length));
}

/**
 * Apply import path fix
 */
export async function applyImportPathFix(
  fix: ImportPathFix,
  projectRoot: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(projectRoot, fix.file);
    let content = await fs.readFile(filePath, 'utf-8');

    // Replace old path with new path
    const patterns = [
      new RegExp(`from ['"]${escapeRegex(fix.oldPath)}['"]`, 'g'),
      new RegExp(`import\\(['"]${escapeRegex(fix.oldPath)}['"]\\)`, 'g'),
    ];

    for (const pattern of patterns) {
      content = content.replace(pattern, (match) => {
        const quote = match.includes("'") ? "'" : '"';
        if (match.startsWith('from')) {
          return `from ${quote}${fix.newPath}${quote}`;
        } else {
          return `import(${quote}${fix.newPath}${quote})`;
        }
      });
    }

    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
