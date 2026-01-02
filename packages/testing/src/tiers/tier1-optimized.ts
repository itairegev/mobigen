/**
 * Optimized Tier 1 Validation (<30 seconds)
 *
 * Optimizations:
 * 1. Parallel validation execution
 * 2. File content caching
 * 3. Incremental validation (only changed files)
 * 4. Early termination on critical errors
 * 5. Targeted rule sets (critical rules only)
 */

import type { ValidatorConfig, ValidationResult, StageResult, ValidationError } from '../types';
import { typescriptValidator } from '../validators/typescript';
import { eslintValidator } from '../validators/eslint';
import { navigationValidator } from '../validators/navigation';
import { importsValidator } from '../validators/imports';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// File content cache for incremental validation
const fileCache = new Map<string, { hash: string; content: string; mtime: number }>();

// Validation result cache for unchanged files
const validationCache = new Map<string, {
  hash: string;
  result: StageResult;
  timestamp: number;
}>();

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Optimized Tier 1 validation with parallel execution
 */
export async function runTier1Optimized(
  config: ValidatorConfig,
  options: {
    incremental?: boolean;
    changedFiles?: string[];
    earlyTermination?: boolean;
    parallelValidation?: boolean;
  } = {}
): Promise<ValidationResult> {
  const start = Date.now();
  const {
    incremental = true,
    changedFiles,
    earlyTermination = true,
    parallelValidation = true,
  } = options;

  // Get files to validate
  const filesToValidate = incremental && changedFiles
    ? changedFiles
    : await getAllSourceFiles(config.projectPath);

  // Update file cache
  const fileHashes = await updateFileCache(filesToValidate);
  const projectHash = computeProjectHash(fileHashes);

  // Check if we can use cached validation result
  const cachedResult = getCachedValidation(projectHash);
  if (cachedResult) {
    return {
      ...cachedResult,
      duration: Date.now() - start,
      cached: true,
    } as ValidationResult;
  }

  // Create optimized config for targeted validation
  const optimizedConfig: ValidatorConfig = {
    ...config,
    // Use skipLibCheck for faster TypeScript validation
    tsOptions: {
      skipLibCheck: true,
      incremental: true,
    },
    // Use critical rules only for ESLint
    eslintOptions: {
      rules: getCriticalEslintRules(),
      maxWarnings: 0,
    },
  };

  let stages: Record<string, StageResult>;
  let allErrors: ValidationError[] = [];
  let allWarnings: ValidationError[] = [];

  if (parallelValidation) {
    // Run validators in parallel
    const results = await Promise.all([
      runWithTimeout(typescriptValidator.run(optimizedConfig), 10000, 'typescript'),
      runWithTimeout(eslintValidator.run(optimizedConfig), 10000, 'eslint'),
      runWithTimeout(navigationValidator.run(optimizedConfig), 5000, 'navigation'),
      runWithTimeout(importsValidator.run(optimizedConfig), 5000, 'imports'),
    ]);

    stages = {
      typescript: results[0],
      eslint: results[1],
      navigation: results[2],
      imports: results[3],
    };
  } else {
    // Sequential execution with early termination
    stages = {};

    const tsResult = await runWithTimeout(
      typescriptValidator.run(optimizedConfig),
      10000,
      'typescript'
    );
    stages.typescript = tsResult;

    if (earlyTermination && !tsResult.passed && hasCriticalErrors(tsResult)) {
      return buildResult(stages, Date.now() - start, projectHash);
    }

    const eslintResult = await runWithTimeout(
      eslintValidator.run(optimizedConfig),
      10000,
      'eslint'
    );
    stages.eslint = eslintResult;

    if (earlyTermination && !eslintResult.passed && hasCriticalErrors(eslintResult)) {
      return buildResult(stages, Date.now() - start, projectHash);
    }

    const [navResult, importsResult] = await Promise.all([
      runWithTimeout(navigationValidator.run(optimizedConfig), 5000, 'navigation'),
      runWithTimeout(importsValidator.run(optimizedConfig), 5000, 'imports'),
    ]);

    stages.navigation = navResult;
    stages.imports = importsResult;
  }

  // Collect errors and warnings
  for (const stage of Object.values(stages)) {
    allErrors.push(...stage.errors.filter((e) => e.severity === 'error'));
    allWarnings.push(...stage.errors.filter((e) => e.severity === 'warning'));
  }

  const result = buildResult(stages, Date.now() - start, projectHash);

  // Cache the result
  cacheValidation(projectHash, result);

  return result;
}

/**
 * Run validator with timeout
 */
async function runWithTimeout(
  promise: Promise<StageResult>,
  timeout: number,
  name: string
): Promise<StageResult> {
  return Promise.race([
    promise,
    new Promise<StageResult>((_, reject) =>
      setTimeout(() => reject(new Error(`${name} validation timed out after ${timeout}ms`)), timeout)
    ),
  ]).catch((error) => ({
    name,
    passed: false,
    duration: timeout,
    errors: [{
      file: 'unknown',
      message: error.message,
      severity: 'error' as const,
      code: 'VALIDATION_TIMEOUT',
    }],
  }));
}

/**
 * Get all source files in project
 */
async function getAllSourceFiles(projectPath: string): Promise<string[]> {
  const files: string[] = [];

  async function scanDir(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules, .git, etc.
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', '.expo', 'ios', 'android', 'dist', 'build'].includes(entry.name)) {
          await scanDir(fullPath);
        }
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  await scanDir(projectPath);
  return files;
}

/**
 * Update file cache with new file hashes
 */
async function updateFileCache(files: string[]): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();

  await Promise.all(files.map(async (file) => {
    try {
      const stat = await fs.promises.stat(file);
      const cached = fileCache.get(file);

      // Check if file has changed
      if (cached && cached.mtime === stat.mtimeMs) {
        hashes.set(file, cached.hash);
        return;
      }

      // Read and hash file
      const content = await fs.promises.readFile(file, 'utf-8');
      const hash = crypto.createHash('md5').update(content).digest('hex');

      fileCache.set(file, {
        hash,
        content,
        mtime: stat.mtimeMs,
      });

      hashes.set(file, hash);
    } catch {
      // File might not exist or be readable
    }
  }));

  return hashes;
}

/**
 * Compute overall project hash from file hashes
 */
function computeProjectHash(fileHashes: Map<string, string>): string {
  const sortedHashes = Array.from(fileHashes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, hash]) => hash)
    .join('');

  return crypto.createHash('md5').update(sortedHashes).digest('hex');
}

/**
 * Get cached validation result if valid
 */
function getCachedValidation(projectHash: string): ValidationResult | null {
  const cached = validationCache.get(projectHash);

  if (!cached) return null;

  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    validationCache.delete(projectHash);
    return null;
  }

  return {
    tier: 'tier1',
    passed: cached.result.passed,
    errors: cached.result.errors.filter(e => e.severity === 'error'),
    warnings: cached.result.errors.filter(e => e.severity === 'warning'),
    duration: 0,
    stages: { cached: cached.result },
  };
}

/**
 * Cache validation result
 */
function cacheValidation(projectHash: string, result: ValidationResult): void {
  validationCache.set(projectHash, {
    hash: projectHash,
    result: {
      name: 'combined',
      passed: result.passed,
      duration: result.duration,
      errors: [...result.errors, ...result.warnings],
    },
    timestamp: Date.now(),
  });
}

/**
 * Check if stage has critical errors that warrant early termination
 */
function hasCriticalErrors(stage: StageResult): boolean {
  return stage.errors.some((e) =>
    e.severity === 'error' &&
    (e.code?.startsWith('TS') || // TypeScript errors
      e.code === 'no-undef' ||   // Undefined variables
      e.code === 'import/no-unresolved') // Unresolved imports
  );
}

/**
 * Get critical ESLint rules for fast validation
 */
function getCriticalEslintRules(): Record<string, string | number[]> {
  return {
    'no-undef': 'error',
    'no-unused-vars': 'off', // Disable for speed
    'react/jsx-no-undef': 'error',
    'import/no-unresolved': 'error',
    '@typescript-eslint/no-explicit-any': 'off', // Disable for speed
  };
}

/**
 * Build validation result from stages
 */
function buildResult(
  stages: Record<string, StageResult>,
  duration: number,
  projectHash?: string
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  for (const stage of Object.values(stages)) {
    allErrors.push(...stage.errors.filter((e) => e.severity === 'error'));
    allWarnings.push(...stage.errors.filter((e) => e.severity === 'warning'));
  }

  const passed = Object.values(stages).every((s) => s.passed);

  return {
    tier: 'tier1',
    passed,
    errors: allErrors,
    warnings: allWarnings,
    duration,
    stages,
  };
}

/**
 * Clear all caches (useful for testing)
 */
export function clearValidationCache(): void {
  fileCache.clear();
  validationCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  filesCached: number;
  validationsCached: number;
} {
  return {
    filesCached: fileCache.size,
    validationsCached: validationCache.size,
  };
}
