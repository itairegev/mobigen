/**
 * Pattern 5: Unused import cleanup
 *
 * Detects: Unused imports
 * Fixes: Removes unused import statements safely
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface UnusedImportError {
  file: string;
  line: number;
  importName: string;
  message: string;
}

export interface UnusedImportFix {
  type: 'remove-unused-import';
  file: string;
  line: number;
  importName: string;
  action: 'remove-line' | 'remove-specifier';
  confidence: number;
}

/**
 * Parse unused import error
 */
export function parseUnusedImportError(
  message: string,
  file: string,
  line?: number
): UnusedImportError | null {
  // TypeScript: "'X' is declared but never used"
  let match = message.match(/['"](.+?)['"] is declared but (?:its value is )?never (?:used|read)/);
  if (match) {
    return { file, line: line || 0, importName: match[1], message };
  }

  // ESLint: "'X' is defined but never used"
  match = message.match(/['"](.+?)['"] is defined but never used/);
  if (match) {
    return { file, line: line || 0, importName: match[1], message };
  }

  // ESLint: "X is assigned a value but never used"
  match = message.match(/['"]?(.+?)['"]? is assigned a value but never used/);
  if (match) {
    return { file, line: line || 0, importName: match[1], message };
  }

  return null;
}

/**
 * Check if import line has multiple specifiers
 */
function countImportSpecifiers(importLine: string): number {
  // Extract content between { }
  const match = importLine.match(/\{([^}]+)\}/);
  if (match) {
    return match[1].split(',').length;
  }

  // Check for default import
  if (importLine.match(/import\s+\w+\s+from/)) {
    return 1;
  }

  return 0;
}

/**
 * Generate unused import fix
 */
export async function generateUnusedImportFix(
  error: UnusedImportError,
  projectRoot: string
): Promise<UnusedImportFix | null> {
  try {
    const filePath = path.join(projectRoot, error.file);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Verify the import is at the specified line
    const targetLine = lines[error.line - 1] || '';

    // Check if this is an import line
    if (!targetLine.includes('import ')) {
      // Might be on a different line, search for it
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('import ') && lines[i].includes(error.importName)) {
          error.line = i + 1;
          break;
        }
      }
    }

    const importLine = lines[error.line - 1] || '';

    if (!importLine.includes('import ')) {
      return null; // Not an import line
    }

    // Determine action: remove whole line or just the specifier
    const specifierCount = countImportSpecifiers(importLine);

    let action: 'remove-line' | 'remove-specifier';

    if (specifierCount <= 1) {
      // Only import or default import - remove whole line
      action = 'remove-line';
    } else {
      // Multiple specifiers - just remove this one
      action = 'remove-specifier';
    }

    return {
      type: 'remove-unused-import',
      file: error.file,
      line: error.line,
      importName: error.importName,
      action,
      confidence: 0.95, // High confidence for unused imports
    };
  } catch {
    return null;
  }
}

/**
 * Apply unused import fix
 */
export async function applyUnusedImportFix(
  fix: UnusedImportFix,
  projectRoot: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(projectRoot, fix.file);
    let content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    if (fix.line <= 0 || fix.line > lines.length) {
      return { success: false, error: 'Invalid line number' };
    }

    const importLine = lines[fix.line - 1];

    if (fix.action === 'remove-line') {
      // Remove the entire line
      lines.splice(fix.line - 1, 1);
    } else {
      // Remove just the specifier
      let newLine = importLine;

      // Pattern: import { X, Y, Z } from '...'
      // Remove X from: import { X, Y } -> import { Y }
      // Remove Y from: import { X, Y } -> import { X }

      // Handle: { X, ... } -> { ... }
      newLine = newLine.replace(
        new RegExp(`\\{\\s*${fix.importName}\\s*,\\s*`),
        '{ '
      );

      // Handle: { ..., X } -> { ... }
      if (newLine === importLine) {
        newLine = newLine.replace(
          new RegExp(`,\\s*${fix.importName}\\s*\\}`),
          ' }'
        );
      }

      // Handle: { ..., X, ... } -> { ..., ... }
      if (newLine === importLine) {
        newLine = newLine.replace(
          new RegExp(`,\\s*${fix.importName}\\s*,`),
          ','
        );
      }

      // Clean up whitespace
      newLine = newLine.replace(/\{\s+\}/, '{ }');
      newLine = newLine.replace(/,\s*,/, ',');

      // If no specifiers left, remove the whole line
      if (newLine.match(/import\s*\{\s*\}\s*from/)) {
        lines.splice(fix.line - 1, 1);
      } else {
        lines[fix.line - 1] = newLine;
      }
    }

    content = lines.join('\n');

    // Clean up potential double blank lines
    content = content.replace(/\n\n\n+/g, '\n\n');

    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Find all unused imports in a file
 */
export async function findUnusedImports(
  file: string,
  projectRoot: string
): Promise<UnusedImportError[]> {
  const filePath = path.join(projectRoot, file);
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const unused: UnusedImportError[] = [];

  // Extract all imports
  const imports: Array<{ name: string; line: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('import ')) continue;

    // Extract named imports
    const namedMatch = line.match(/import\s*\{([^}]+)\}\s*from/);
    if (namedMatch) {
      const names = namedMatch[1].split(',').map(n => n.trim().split(' as ')[0].trim());
      for (const name of names) {
        if (name) imports.push({ name, line: i + 1 });
      }
    }

    // Extract default import
    const defaultMatch = line.match(/import\s+(\w+)\s+from/);
    if (defaultMatch) {
      imports.push({ name: defaultMatch[1], line: i + 1 });
    }
  }

  // Check if each import is used in the rest of the file
  for (const imp of imports) {
    const afterImports = lines.slice(imp.line).join('\n');

    // Check if the name appears in the code (not in imports)
    const regex = new RegExp(`\\b${imp.name}\\b`);
    if (!regex.test(afterImports)) {
      unused.push({
        file,
        line: imp.line,
        importName: imp.name,
        message: `'${imp.name}' is imported but never used`,
      });
    }
  }

  return unused;
}
