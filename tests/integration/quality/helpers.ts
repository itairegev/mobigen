/**
 * Test Helpers for Integration Tests
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import type { WhiteLabelConfig, GenerationResult } from '@mobigen/ai';
import type { ValidationResult } from '@mobigen/testing';

export interface TestProjectConfig {
  projectId: string;
  projectPath: string;
  cleanupOnSuccess?: boolean;
  cleanupOnFailure?: boolean;
}

export interface TestGenerationOptions {
  mock?: boolean;
  timeout?: number;
  skipValidation?: boolean;
}

/**
 * Create a test project directory
 */
export async function createTestProject(
  projectId: string,
  baseDir: string = '/tmp/mobigen-tests'
): Promise<TestProjectConfig> {
  const projectPath = path.join(baseDir, projectId);

  // Clean up if exists
  await fs.remove(projectPath);

  // Create fresh directory
  await fs.ensureDir(projectPath);

  console.log(`[test-helper] Created test project: ${projectPath}`);

  return {
    projectId,
    projectPath,
    cleanupOnSuccess: true,
    cleanupOnFailure: false,
  };
}

/**
 * Run generation with mocks or real orchestrator
 */
export async function runGeneration(
  prompt: string,
  projectId: string,
  config: WhiteLabelConfig,
  options: TestGenerationOptions = {}
): Promise<GenerationResult> {
  if (options.mock) {
    // Return mock result for fast tests
    return {
      files: [
        'package.json',
        'app.json',
        'src/app/_layout.tsx',
        'src/components/Button.tsx',
      ],
      logs: [],
      success: true,
      requiresReview: false,
    };
  }

  // Import the real orchestrator
  const { generateApp } = await import('../../../services/generator/src/orchestrator');

  // Run real generation
  const result = await generateApp(prompt, projectId, config);

  return result;
}

/**
 * Assert validation result meets expectations
 */
export function assertValidation(
  result: ValidationResult,
  expected: {
    shouldPass: boolean;
    maxErrors?: number;
    maxWarnings?: number;
    requiredStages?: string[];
  }
): void {
  const { shouldPass, maxErrors = 0, maxWarnings = Infinity, requiredStages = [] } = expected;

  // Check passed status
  if (result.passed !== shouldPass) {
    throw new Error(
      `Validation ${shouldPass ? 'should have passed' : 'should have failed'} but ${result.passed ? 'passed' : 'failed'}\n` +
      `Errors: ${result.errors.length}\n` +
      `Warnings: ${result.warnings.length}`
    );
  }

  // Check error count
  if (result.errors.length > maxErrors) {
    throw new Error(
      `Too many errors: ${result.errors.length} (max: ${maxErrors})\n` +
      `Errors: ${result.errors.map(e => `${e.file}:${e.line} - ${e.message}`).join('\n')}`
    );
  }

  // Check warning count
  if (result.warnings.length > maxWarnings) {
    throw new Error(
      `Too many warnings: ${result.warnings.length} (max: ${maxWarnings})`
    );
  }

  // Check required stages ran
  for (const stage of requiredStages) {
    if (!result.stages[stage]) {
      throw new Error(`Required stage '${stage}' did not run`);
    }
  }
}

/**
 * Assert file structure matches expectations
 */
export async function assertFileStructure(
  projectPath: string,
  expected: {
    requiredFiles: string[];
    optionalFiles?: string[];
    forbiddenFiles?: string[];
    minFileCount?: number;
    maxFileCount?: number;
  }
): Promise<void> {
  // Check required files exist
  for (const file of expected.requiredFiles) {
    const filePath = path.join(projectPath, file);
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }

  // Check forbidden files don't exist
  if (expected.forbiddenFiles) {
    for (const file of expected.forbiddenFiles) {
      const filePath = path.join(projectPath, file);
      if (await fs.pathExists(filePath)) {
        throw new Error(`Forbidden file found: ${file}`);
      }
    }
  }

  // Count total files
  if (expected.minFileCount !== undefined || expected.maxFileCount !== undefined) {
    const fileCount = await countFiles(projectPath);

    if (expected.minFileCount !== undefined && fileCount < expected.minFileCount) {
      throw new Error(`Too few files: ${fileCount} (min: ${expected.minFileCount})`);
    }

    if (expected.maxFileCount !== undefined && fileCount > expected.maxFileCount) {
      throw new Error(`Too many files: ${fileCount} (max: ${expected.maxFileCount})`);
    }
  }
}

/**
 * Count files in directory recursively
 */
async function countFiles(dir: string): Promise<number> {
  let count = 0;

  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    // Skip node_modules and hidden dirs
    if (item.name === 'node_modules' || item.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      count += await countFiles(fullPath);
    } else if (item.isFile()) {
      count++;
    }
  }

  return count;
}

/**
 * Cleanup test project
 */
export async function cleanupTestProject(config: TestProjectConfig, success: boolean): Promise<void> {
  const shouldCleanup = success ? config.cleanupOnSuccess : config.cleanupOnFailure;

  if (shouldCleanup) {
    await fs.remove(config.projectPath);
    console.log(`[test-helper] Cleaned up test project: ${config.projectId}`);
  } else {
    console.log(`[test-helper] Preserved test project for inspection: ${config.projectPath}`);
  }
}

/**
 * Check if navigation is properly configured
 */
export async function checkNavigation(projectPath: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Check for _layout.tsx
  const layoutPath = path.join(projectPath, 'src/app/_layout.tsx');
  if (!await fs.pathExists(layoutPath)) {
    errors.push('Missing src/app/_layout.tsx');
    return { valid: false, errors };
  }

  // Check layout file has Stack or Tabs
  const layoutContent = await fs.readFile(layoutPath, 'utf-8');
  if (!layoutContent.includes('Stack') && !layoutContent.includes('Tabs')) {
    errors.push('_layout.tsx does not define Stack or Tabs navigation');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if imports are valid
 */
export async function checkImports(projectPath: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const srcPath = path.join(projectPath, 'src');

  if (!await fs.pathExists(srcPath)) {
    errors.push('src directory does not exist');
    return { valid: false, errors };
  }

  // Find all TypeScript files
  const files = await findFiles(srcPath, /\.(ts|tsx)$/);

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');

    // Check for common import issues
    const importPattern = /import\s+.*\s+from\s+['"](.+)['"]/g;
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];

      // Check relative imports exist
      if (importPath.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(file), importPath);
        const possiblePaths = [
          resolvedPath,
          `${resolvedPath}.ts`,
          `${resolvedPath}.tsx`,
          `${resolvedPath}/index.ts`,
          `${resolvedPath}/index.tsx`,
        ];

        const exists = await Promise.all(possiblePaths.map(p => fs.pathExists(p)));
        if (!exists.some(Boolean)) {
          errors.push(`Cannot resolve import '${importPath}' in ${path.relative(projectPath, file)}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check TypeScript types are properly defined
 */
export async function checkTypes(projectPath: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const srcPath = path.join(projectPath, 'src');

  if (!await fs.pathExists(srcPath)) {
    errors.push('src directory does not exist');
    return { valid: false, errors };
  }

  // Check for types directory or type definitions
  const typesPath = path.join(srcPath, 'types');
  const hasTypesDir = await fs.pathExists(typesPath);

  if (!hasTypesDir) {
    // Check if types are defined inline in files
    const files = await findFiles(srcPath, /\.(ts|tsx)$/);
    let hasTypeDefinitions = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (content.includes('interface ') || content.includes('type ') || content.includes('enum ')) {
        hasTypeDefinitions = true;
        break;
      }
    }

    if (!hasTypeDefinitions) {
      errors.push('No type definitions found (no types/ directory and no inline types)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check branding is applied
 */
export async function checkBranding(
  projectPath: string,
  expectedColors: { primary: string; secondary: string }
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Check app.json for branding
  const appJsonPath = path.join(projectPath, 'app.json');
  if (!await fs.pathExists(appJsonPath)) {
    errors.push('app.json does not exist');
    return { valid: false, errors };
  }

  const appJson = await fs.readJSON(appJsonPath);

  // Check colors are set
  const primaryColor = appJson.expo?.primaryColor;
  if (!primaryColor) {
    errors.push('No primary color set in app.json');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Find files matching pattern
 */
async function findFiles(dir: string, pattern: RegExp): Promise<string[]> {
  const files: string[] = [];

  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.name === 'node_modules' || item.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...await findFiles(fullPath, pattern));
    } else if (item.isFile() && pattern.test(item.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Create default white-label config for testing
 */
export function createTestConfig(appName: string): WhiteLabelConfig {
  return {
    appName,
    bundleId: {
      ios: `com.test.${appName.toLowerCase().replace(/\s+/g, '')}`,
      android: `com.test.${appName.toLowerCase().replace(/\s+/g, '')}`,
    },
    branding: {
      displayName: appName,
      primaryColor: '#007AFF',
      secondaryColor: '#5856D6',
      logo: {
        light: 'https://example.com/logo-light.png',
        dark: 'https://example.com/logo-dark.png',
      },
      splash: {
        backgroundColor: '#FFFFFF',
        image: 'https://example.com/splash.png',
      },
    },
    identifiers: {
      projectId: `test-${Date.now()}`,
      easProjectId: `test-eas-${Date.now()}`,
      awsResourcePrefix: `test-aws-${Date.now()}`,
      analyticsKey: `test-analytics-${Date.now()}`,
    },
    storeMetadata: {
      shortDescription: `A test app for ${appName}`,
      fullDescription: `This is a test application for ${appName}`,
      keywords: ['test', 'mobile', 'app'],
      category: 'Business',
      screenshots: [],
    },
  };
}
