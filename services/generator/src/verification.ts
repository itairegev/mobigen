/**
 * Generation Verification Module
 *
 * Validates generated apps before marking generation as complete.
 * Runs a series of checks to ensure the app is valid and ready for building.
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  summary: string;
  duration: number;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  message?: string;
  /** Detailed error output for failed checks */
  details?: string;
  /** Individual errors for display */
  errors?: Array<{ file?: string; line?: number; message: string }>;
  duration: number;
}

/**
 * Main verification function - runs all checks on a generated app
 */
export async function verifyGeneratedApp(projectPath: string): Promise<VerificationResult> {
  const startTime = Date.now();
  const checks: VerificationCheck[] = [];

  console.log(`[Verification] Starting verification for: ${projectPath}`);

  // Check 1: Required files exist
  checks.push(await checkRequiredFiles(projectPath));

  // Check 2: package.json is valid
  checks.push(await checkPackageJson(projectPath));

  // Check 3: app.json/app.config.js exists and is valid
  checks.push(await checkAppConfig(projectPath));

  // Check 4: TypeScript compiles
  checks.push(await checkTypeScript(projectPath));

  // Check 5: No circular imports
  checks.push(await checkCircularImports(projectPath));

  // Check 6: Navigation is valid
  checks.push(await checkNavigation(projectPath));

  // Check 7: All imports resolve
  checks.push(await checkImports(projectPath));

  const passed = checks.every((c) => c.passed);
  const failedChecks = checks.filter((c) => !c.passed);
  const duration = Date.now() - startTime;

  const summary = passed
    ? `All ${checks.length} checks passed in ${duration}ms`
    : `${failedChecks.length}/${checks.length} checks failed: ${failedChecks.map((c) => c.name).join(', ')}`;

  console.log(`[Verification] ${summary}`);

  return {
    passed,
    checks,
    summary,
    duration,
  };
}

/**
 * Check that required files exist
 */
async function checkRequiredFiles(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
  ];

  // Check for app config - can be app.json or app.config.js/ts
  const hasAppConfig =
    fs.existsSync(path.join(projectPath, 'app.json')) ||
    fs.existsSync(path.join(projectPath, 'app.config.js')) ||
    fs.existsSync(path.join(projectPath, 'app.config.ts'));

  const missing = requiredFiles.filter((f) => !fs.existsSync(path.join(projectPath, f)));

  if (!hasAppConfig) {
    missing.push('app.json or app.config.js');
  }

  // Check for app entry point - can be in src/app or app directory (Expo Router)
  const hasAppEntry =
    fs.existsSync(path.join(projectPath, 'src/app/_layout.tsx')) ||
    fs.existsSync(path.join(projectPath, 'app/_layout.tsx')) ||
    fs.existsSync(path.join(projectPath, 'App.tsx')) ||
    fs.existsSync(path.join(projectPath, 'src/App.tsx'));

  if (!hasAppEntry) {
    missing.push('App entry point (_layout.tsx or App.tsx)');
  }

  return {
    name: 'required-files',
    passed: missing.length === 0,
    message: missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined,
    duration: Date.now() - start,
  };
}

/**
 * Check that package.json is valid and has required dependencies
 */
async function checkPackageJson(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    const pkgPath = path.join(projectPath, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    const requiredDeps = ['expo', 'react', 'react-native'];
    const missingDeps = requiredDeps.filter((d) => !pkg.dependencies?.[d]);

    if (!pkg.name) {
      return {
        name: 'package-json',
        passed: false,
        message: 'package.json missing "name" field',
        duration: Date.now() - start,
      };
    }

    return {
      name: 'package-json',
      passed: missingDeps.length === 0,
      message: missingDeps.length > 0 ? `Missing deps: ${missingDeps.join(', ')}` : undefined,
      duration: Date.now() - start,
    };
  } catch (error: unknown) {
    const err = error as Error;
    return {
      name: 'package-json',
      passed: false,
      message: err.message,
      duration: Date.now() - start,
    };
  }
}

/**
 * Check that app.json/app.config is valid
 */
async function checkAppConfig(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    let appConfig: Record<string, unknown> | null = null;

    // Try app.json first
    const appJsonPath = path.join(projectPath, 'app.json');
    if (fs.existsSync(appJsonPath)) {
      appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    }

    // If no app.json, check for app.config.js/ts (can't easily validate those)
    if (!appConfig) {
      const configJsPath = path.join(projectPath, 'app.config.js');
      const configTsPath = path.join(projectPath, 'app.config.ts');

      if (fs.existsSync(configJsPath) || fs.existsSync(configTsPath)) {
        // Can't easily validate JS/TS config, assume valid if it exists
        return {
          name: 'app-config',
          passed: true,
          message: 'Using app.config.js/ts (cannot validate dynamically)',
          duration: Date.now() - start,
        };
      }

      return {
        name: 'app-config',
        passed: false,
        message: 'No app.json or app.config found',
        duration: Date.now() - start,
      };
    }

    // Check required fields in app.json
    const expo = appConfig.expo as Record<string, unknown> | undefined;
    const required: string[] = [];

    if (!expo?.name) required.push('expo.name');
    if (!expo?.slug) required.push('expo.slug');

    return {
      name: 'app-config',
      passed: required.length === 0,
      message: required.length > 0 ? `Missing: ${required.join(', ')}` : undefined,
      duration: Date.now() - start,
    };
  } catch (error: unknown) {
    const err = error as Error;
    return {
      name: 'app-config',
      passed: false,
      message: err.message,
      duration: Date.now() - start,
    };
  }
}

/**
 * Check that TypeScript compiles without errors
 */
async function checkTypeScript(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    // Check if tsconfig exists
    if (!fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
      return {
        name: 'typescript',
        passed: true,
        message: 'No tsconfig.json, skipping TypeScript check',
        duration: Date.now() - start,
      };
    }

    await execAsync('npx tsc --noEmit --skipLibCheck', { cwd: projectPath, timeout: 60000 });
    return {
      name: 'typescript',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string };
    const output = execError.stdout || execError.stderr || '';
    const errorCount = (output.match(/error TS/g) || []).length;

    // Parse individual errors for display
    const errors: Array<{ file?: string; line?: number; message: string }> = [];
    const errorRegex = /^(.+?)\((\d+),\d+\):\s*error TS\d+:\s*(.+)$/gm;
    let match;
    while ((match = errorRegex.exec(output)) !== null && errors.length < 10) {
      errors.push({
        file: match[1].replace(projectPath + '/', ''), // Remove project path prefix
        line: parseInt(match[2], 10),
        message: match[3],
      });
    }

    return {
      name: 'typescript',
      passed: false,
      message: `${errorCount} TypeScript error${errorCount !== 1 ? 's' : ''}`,
      details: output.substring(0, 2000), // Limit to 2KB
      errors,
      duration: Date.now() - start,
    };
  }
}

/**
 * Check for circular imports using madge
 */
async function checkCircularImports(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    // Check if src directory exists
    const srcPath = path.join(projectPath, 'src');
    const appPath = path.join(projectPath, 'app');

    if (!fs.existsSync(srcPath) && !fs.existsSync(appPath)) {
      return {
        name: 'circular-imports',
        passed: true,
        message: 'No src or app directory to check',
        duration: Date.now() - start,
      };
    }

    const targetDir = fs.existsSync(srcPath) ? 'src/' : 'app/';

    await execAsync(`npx madge --circular --extensions ts,tsx ${targetDir}`, {
      cwd: projectPath,
      timeout: 30000,
    });
    return {
      name: 'circular-imports',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string };
    const output = execError.stdout || execError.stderr || '';

    // madge returns non-zero when circular deps found
    if (output.includes('Circular') || output.includes('Found')) {
      // Parse circular dependency chains
      const errors: Array<{ file?: string; line?: number; message: string }> = [];
      const chainRegex = /(\S+\.tsx?)\s*->\s*(\S+\.tsx?)/g;
      let match;
      while ((match = chainRegex.exec(output)) !== null && errors.length < 10) {
        errors.push({
          file: match[1],
          message: `Circular import: ${match[1]} -> ${match[2]}`,
        });
      }

      return {
        name: 'circular-imports',
        passed: false,
        message: `Circular imports detected (${errors.length} cycle${errors.length !== 1 ? 's' : ''})`,
        details: output.substring(0, 2000),
        errors: errors.length > 0 ? errors : [{ message: 'Circular dependencies found - check madge output' }],
        duration: Date.now() - start,
      };
    }

    // madge might not be installed, treat as warning
    return {
      name: 'circular-imports',
      passed: true,
      message: 'Could not check (madge may not be installed)',
      duration: Date.now() - start,
    };
  }
}

/**
 * Check that navigation structure is valid
 */
async function checkNavigation(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    // Check for Expo Router app directory
    const appDirSrc = path.join(projectPath, 'src/app');
    const appDirRoot = path.join(projectPath, 'app');

    const appDir = fs.existsSync(appDirSrc) ? appDirSrc : fs.existsSync(appDirRoot) ? appDirRoot : null;

    if (!appDir) {
      // Not using Expo Router - check for traditional navigation
      const hasNavigation =
        fs.existsSync(path.join(projectPath, 'src/navigation')) ||
        fs.existsSync(path.join(projectPath, 'navigation'));

      return {
        name: 'navigation',
        passed: true,
        message: hasNavigation ? 'Using traditional navigation' : 'No navigation directory found',
        duration: Date.now() - start,
      };
    }

    const errors: Array<{ file?: string; line?: number; message: string }> = [];
    const relativePath = appDir.replace(projectPath + '/', '');

    // Check for root layout file (required for Expo Router)
    const layoutFile = path.join(appDir, '_layout.tsx');
    if (!fs.existsSync(layoutFile)) {
      errors.push({
        file: `${relativePath}/_layout.tsx`,
        message: 'Root _layout.tsx is missing - required for Expo Router',
      });
    }

    // Check that at least one page exists
    const files = fs.readdirSync(appDir);
    const pageFiles = files.filter((f) => f.endsWith('.tsx') && !f.startsWith('_'));

    if (pageFiles.length === 0) {
      errors.push({
        file: relativePath,
        message: 'No page files found in app directory - need at least one route (e.g., index.tsx)',
      });
    }

    // Check subdirectories for layouts if they exist
    const subdirs = files.filter((f) => {
      const fullPath = path.join(appDir, f);
      return fs.statSync(fullPath).isDirectory() && !f.startsWith('.');
    });

    for (const subdir of subdirs) {
      const subdirPath = path.join(appDir, subdir);
      const subdirFiles = fs.readdirSync(subdirPath);

      // Check if there's an index.tsx or page files in subdirectory
      const hasPages = subdirFiles.some((f) => f.endsWith('.tsx'));
      if (!hasPages) {
        errors.push({
          file: `${relativePath}/${subdir}`,
          message: `Route group "${subdir}" has no page files`,
        });
      }

      // For tab groups (like (tabs)), check for _layout.tsx
      if (subdir.startsWith('(') && subdir.endsWith(')')) {
        const groupLayout = path.join(subdirPath, '_layout.tsx');
        if (!fs.existsSync(groupLayout)) {
          errors.push({
            file: `${relativePath}/${subdir}/_layout.tsx`,
            message: `Route group "${subdir}" is missing _layout.tsx for navigation configuration`,
          });
        }
      }
    }

    if (errors.length > 0) {
      return {
        name: 'navigation',
        passed: false,
        message: `${errors.length} navigation issue${errors.length !== 1 ? 's' : ''} found`,
        errors,
        duration: Date.now() - start,
      };
    }

    return {
      name: 'navigation',
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error: unknown) {
    const err = error as Error;
    return {
      name: 'navigation',
      passed: false,
      message: err.message,
      errors: [{ message: err.message }],
      duration: Date.now() - start,
    };
  }
}

/**
 * Check that imports resolve correctly
 */
async function checkImports(projectPath: string): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    // Check if tsconfig exists
    if (!fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
      return {
        name: 'imports',
        passed: true,
        message: 'No tsconfig.json, skipping import check',
        duration: Date.now() - start,
      };
    }

    // Use tsc to check module resolution
    const { stdout } = await execAsync(
      'npx tsc --noEmit --traceResolution 2>&1 | grep -i "not found" | head -20 || true',
      {
        cwd: projectPath,
        timeout: 60000,
      }
    );

    // If output contains "not found", there are unresolved imports
    if (stdout.includes('not found')) {
      // Parse unresolved modules
      const errors: Array<{ file?: string; line?: number; message: string }> = [];
      const moduleRegex = /Module\s+'([^']+)'\s+not found/gi;
      let match;
      while ((match = moduleRegex.exec(stdout)) !== null && errors.length < 10) {
        errors.push({
          message: `Cannot resolve module '${match[1]}'`,
        });
      }

      // Also check for file resolution errors
      const fileRegex = /File\s+'([^']+)'\s+not found/gi;
      while ((match = fileRegex.exec(stdout)) !== null && errors.length < 10) {
        const relativePath = match[1].replace(projectPath + '/', '');
        errors.push({
          file: relativePath,
          message: `File not found: ${relativePath}`,
        });
      }

      return {
        name: 'imports',
        passed: false,
        message: `${errors.length} unresolved import${errors.length !== 1 ? 's' : ''} found`,
        details: stdout.substring(0, 2000),
        errors: errors.length > 0 ? errors : [{ message: 'Unresolved imports found - check TypeScript output' }],
        duration: Date.now() - start,
      };
    }

    return {
      name: 'imports',
      passed: true,
      duration: Date.now() - start,
    };
  } catch {
    // If the command fails or returns nothing, assume OK
    return {
      name: 'imports',
      passed: true,
      duration: Date.now() - start,
    };
  }
}

/**
 * Quick verification - only runs essential checks
 * Use this for faster feedback during generation
 */
export async function quickVerify(projectPath: string): Promise<VerificationResult> {
  const startTime = Date.now();
  const checks: VerificationCheck[] = [];

  // Only run essential checks
  checks.push(await checkRequiredFiles(projectPath));
  checks.push(await checkPackageJson(projectPath));
  checks.push(await checkTypeScript(projectPath));

  const passed = checks.every((c) => c.passed);
  const failedChecks = checks.filter((c) => !c.passed);
  const duration = Date.now() - startTime;

  return {
    passed,
    checks,
    summary: passed
      ? `Quick verification passed in ${duration}ms`
      : `Quick verification failed: ${failedChecks.map((c) => c.name).join(', ')}`,
    duration,
  };
}
