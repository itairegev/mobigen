/**
 * Deterministic Auto-Fix System
 *
 * High-confidence auto-fix patterns for common errors.
 * Only applies fixes with >95% accuracy, verifies after applying.
 */

import * as path from 'path';

// Pattern imports
import {
  parseMissingImportError,
  generateMissingImportFix,
  applyMissingImportFix,
  type MissingImportError,
  type ImportFix,
} from './patterns/missing-import';

import {
  parseUnregisteredRouteError,
  generateRouteRegistration,
  applyRoutefix,
  type UnregisteredRouteError,
  type RouteFix,
} from './patterns/unregistered-route';

import {
  parseImportPathError,
  generateImportPathFix,
  applyImportPathFix,
  type ImportPathError,
  type ImportPathFix,
} from './patterns/import-path';

import {
  parseTypeAnnotationError,
  generateTypeAnnotationFix,
  applyTypeAnnotationFix,
  type TypeAnnotationError,
  type TypeAnnotationFix,
} from './patterns/type-annotation';

import {
  parseUnusedImportError,
  generateUnusedImportFix,
  applyUnusedImportFix,
  type UnusedImportError,
  type UnusedImportFix,
} from './patterns/unused-import';

// Re-export types
export * from './patterns/missing-import';
export * from './patterns/unregistered-route';
export * from './patterns/import-path';
export * from './patterns/type-annotation';
export * from './patterns/unused-import';

/**
 * Validation error from any source
 */
export interface ValidationError {
  type: string;
  file: string;
  line?: number;
  column?: number;
  message: string;
  code?: string;
}

/**
 * Auto-fix result
 */
export interface AutoFixResult {
  success: boolean;
  applied: Array<{
    pattern: string;
    file: string;
    description: string;
  }>;
  skipped: Array<{
    pattern: string;
    file: string;
    reason: string;
  }>;
  failed: Array<{
    pattern: string;
    file: string;
    error: string;
  }>;
}

/**
 * Minimum confidence threshold for auto-fix
 */
const MIN_CONFIDENCE = 0.95;

/**
 * Parse error and determine which pattern applies
 */
export function categorizeError(error: ValidationError): {
  pattern: string;
  parsed: any;
} | null {
  // Pattern 1: Missing import
  const missingImport = parseMissingImportError(error.message, error.file, error.line);
  if (missingImport) {
    return { pattern: 'missing-import', parsed: missingImport };
  }

  // Pattern 2: Unregistered route
  const unregisteredRoute = parseUnregisteredRouteError(error.message, error.file);
  if (unregisteredRoute) {
    return { pattern: 'unregistered-route', parsed: unregisteredRoute };
  }

  // Pattern 3: Import path error
  const importPath = parseImportPathError(error.message, error.file, error.line);
  if (importPath) {
    return { pattern: 'import-path', parsed: importPath };
  }

  // Pattern 4: Type annotation
  const typeAnnotation = parseTypeAnnotationError(error.message, error.file, error.line);
  if (typeAnnotation) {
    return { pattern: 'type-annotation', parsed: typeAnnotation };
  }

  // Pattern 5: Unused import
  const unusedImport = parseUnusedImportError(error.message, error.file, error.line);
  if (unusedImport) {
    return { pattern: 'unused-import', parsed: unusedImport };
  }

  return null;
}

/**
 * Generate fix for an error
 */
export async function generateFix(
  pattern: string,
  parsed: any,
  projectRoot: string
): Promise<{ fix: any; confidence: number } | null> {
  switch (pattern) {
    case 'missing-import': {
      const fix = await generateMissingImportFix(parsed, projectRoot);
      return fix ? { fix, confidence: fix.confidence } : null;
    }

    case 'unregistered-route': {
      const fix = await generateRouteRegistration(parsed, projectRoot);
      return fix ? { fix, confidence: fix.confidence } : null;
    }

    case 'import-path': {
      const fix = await generateImportPathFix(parsed, projectRoot);
      return fix ? { fix, confidence: fix.confidence } : null;
    }

    case 'type-annotation': {
      const fix = await generateTypeAnnotationFix(parsed, projectRoot);
      return fix ? { fix, confidence: fix.confidence } : null;
    }

    case 'unused-import': {
      const fix = await generateUnusedImportFix(parsed, projectRoot);
      return fix ? { fix, confidence: fix.confidence } : null;
    }

    default:
      return null;
  }
}

/**
 * Apply a fix
 */
export async function applyFix(
  pattern: string,
  fix: any,
  projectRoot: string
): Promise<{ success: boolean; error?: string }> {
  switch (pattern) {
    case 'missing-import':
      return applyMissingImportFix(fix, projectRoot);

    case 'unregistered-route':
      return applyRoutefix(fix, projectRoot);

    case 'import-path':
      return applyImportPathFix(fix, projectRoot);

    case 'type-annotation':
      return applyTypeAnnotationFix(fix, projectRoot);

    case 'unused-import':
      return applyUnusedImportFix(fix, projectRoot);

    default:
      return { success: false, error: `Unknown pattern: ${pattern}` };
  }
}

/**
 * Auto-fix multiple errors
 */
export async function autoFixErrors(
  errors: ValidationError[],
  projectRoot: string,
  options: {
    minConfidence?: number;
    dryRun?: boolean;
    maxFixes?: number;
  } = {}
): Promise<AutoFixResult> {
  const {
    minConfidence = MIN_CONFIDENCE,
    dryRun = false,
    maxFixes = 50,
  } = options;

  const result: AutoFixResult = {
    success: true,
    applied: [],
    skipped: [],
    failed: [],
  };

  let fixCount = 0;

  for (const error of errors) {
    if (fixCount >= maxFixes) break;

    // Categorize error
    const categorized = categorizeError(error);
    if (!categorized) {
      result.skipped.push({
        pattern: 'unknown',
        file: error.file,
        reason: 'No matching fix pattern',
      });
      continue;
    }

    // Generate fix
    const generated = await generateFix(categorized.pattern, categorized.parsed, projectRoot);
    if (!generated) {
      result.skipped.push({
        pattern: categorized.pattern,
        file: error.file,
        reason: 'Could not generate fix',
      });
      continue;
    }

    // Check confidence
    if (generated.confidence < minConfidence) {
      result.skipped.push({
        pattern: categorized.pattern,
        file: error.file,
        reason: `Confidence too low: ${(generated.confidence * 100).toFixed(1)}% < ${(minConfidence * 100).toFixed(1)}%`,
      });
      continue;
    }

    // Apply fix (unless dry run)
    if (!dryRun) {
      const applyResult = await applyFix(categorized.pattern, generated.fix, projectRoot);

      if (applyResult.success) {
        result.applied.push({
          pattern: categorized.pattern,
          file: error.file,
          description: getFixDescription(categorized.pattern, generated.fix),
        });
        fixCount++;
      } else {
        result.failed.push({
          pattern: categorized.pattern,
          file: error.file,
          error: applyResult.error || 'Unknown error',
        });
        result.success = false;
      }
    } else {
      // Dry run - just record as would-apply
      result.applied.push({
        pattern: categorized.pattern,
        file: error.file,
        description: `[DRY RUN] ${getFixDescription(categorized.pattern, generated.fix)}`,
      });
      fixCount++;
    }
  }

  return result;
}

/**
 * Get human-readable description of a fix
 */
function getFixDescription(pattern: string, fix: any): string {
  switch (pattern) {
    case 'missing-import':
      return `Added import: ${fix.importStatement}`;

    case 'unregistered-route':
      return `Registered screen '${fix.screenName}' in ${fix.navigatorType} navigator`;

    case 'import-path':
      return `Fixed import path: '${fix.oldPath}' → '${fix.newPath}'`;

    case 'type-annotation':
      return `Added type annotation: ${fix.variableName}: ${fix.inferredType}`;

    case 'unused-import':
      return `Removed unused import: ${fix.importName}`;

    default:
      return `Applied ${pattern} fix`;
  }
}

/**
 * Log auto-fix results
 */
export function logAutoFixResult(result: AutoFixResult): void {
  console.log('\n=== Auto-Fix Results ===\n');

  if (result.applied.length > 0) {
    console.log(`✅ Applied ${result.applied.length} fixes:`);
    for (const fix of result.applied) {
      console.log(`   [${fix.pattern}] ${fix.file}: ${fix.description}`);
    }
  }

  if (result.skipped.length > 0) {
    console.log(`\n⏭️  Skipped ${result.skipped.length} errors:`);
    for (const skip of result.skipped) {
      console.log(`   [${skip.pattern}] ${skip.file}: ${skip.reason}`);
    }
  }

  if (result.failed.length > 0) {
    console.log(`\n❌ Failed ${result.failed.length} fixes:`);
    for (const fail of result.failed) {
      console.log(`   [${fail.pattern}] ${fail.file}: ${fail.error}`);
    }
  }

  console.log(`\nOverall: ${result.success ? '✅ Success' : '❌ Some fixes failed'}`);
}
