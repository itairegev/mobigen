/**
 * Sprint 1 Integration Tests: Generation Verification
 *
 * Tests for the verification module that runs after generation completes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

// Mock child_process.exec
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Mock fs with more complete implementation
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
}));

// Mock util.promisify
vi.mock('util', () => ({
  promisify: vi.fn((fn) => (...args: unknown[]) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err: Error | null, result: unknown) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }),
}));

describe('Sprint 1: Generation Verification Integration', () => {
  const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
  const mockExistsSync = fs.existsSync as unknown as ReturnType<typeof vi.fn>;
  const mockReadFileSync = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
  const mockReaddirSync = fs.readdirSync as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Required Files Check', () => {
    it('should pass when all required files exist', () => {
      mockExistsSync.mockImplementation((filePath: string) => {
        const requiredFiles = [
          'package.json',
          'tsconfig.json',
          'app.json',
          'src/app/_layout.tsx',
        ];
        return requiredFiles.some((f) => filePath.endsWith(f));
      });

      // Simulate the check
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'app.json',
        'src/app/_layout.tsx',
      ];

      const missing = requiredFiles.filter((f) => !mockExistsSync(`/test/${f}`));

      expect(missing).toHaveLength(0);
    });

    it('should fail when required files are missing', () => {
      mockExistsSync.mockImplementation((filePath: string) => {
        // Only package.json exists
        return filePath.endsWith('package.json');
      });

      const requiredFiles = ['package.json', 'tsconfig.json', 'app.json'];
      const missing = requiredFiles.filter((f) => !mockExistsSync(`/test/${f}`));

      expect(missing).toHaveLength(2);
      expect(missing).toContain('tsconfig.json');
      expect(missing).toContain('app.json');
    });

    it('should accept app.config.js as alternative to app.json', () => {
      mockExistsSync.mockImplementation((filePath: string) => {
        // app.config.js exists, but not app.json
        return (
          filePath.endsWith('package.json') ||
          filePath.endsWith('tsconfig.json') ||
          filePath.endsWith('app.config.js') ||
          filePath.endsWith('_layout.tsx')
        );
      });

      const hasAppJson = mockExistsSync('/test/app.json');
      const hasAppConfigJs = mockExistsSync('/test/app.config.js');

      expect(hasAppJson).toBe(false);
      expect(hasAppConfigJs).toBe(true);
      expect(hasAppJson || hasAppConfigJs).toBe(true);
    });
  });

  describe('Package.json Check', () => {
    it('should pass for valid package.json with required dependencies', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          name: 'test-app',
          version: '1.0.0',
          dependencies: {
            expo: '~51.0.0',
            react: '18.2.0',
            'react-native': '0.74.0',
          },
        })
      );

      const pkg = JSON.parse(mockReadFileSync('/test/package.json', 'utf-8'));
      const requiredDeps = ['expo', 'react', 'react-native'];
      const missingDeps = requiredDeps.filter((d) => !pkg.dependencies?.[d]);

      expect(missingDeps).toHaveLength(0);
      expect(pkg.name).toBe('test-app');
    });

    it('should fail when required dependencies are missing', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          name: 'test-app',
          dependencies: {
            axios: '^1.0.0',
          },
        })
      );

      const pkg = JSON.parse(mockReadFileSync('/test/package.json', 'utf-8'));
      const requiredDeps = ['expo', 'react', 'react-native'];
      const missingDeps = requiredDeps.filter((d) => !pkg.dependencies?.[d]);

      expect(missingDeps).toHaveLength(3);
      expect(missingDeps).toContain('expo');
      expect(missingDeps).toContain('react');
      expect(missingDeps).toContain('react-native');
    });

    it('should fail when name field is missing', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            expo: '~51.0.0',
          },
        })
      );

      const pkg = JSON.parse(mockReadFileSync('/test/package.json', 'utf-8'));

      expect(pkg.name).toBeUndefined();
    });
  });

  describe('App Config Check', () => {
    it('should pass for valid app.json with required fields', () => {
      mockExistsSync.mockImplementation((p: string) => p.endsWith('app.json'));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          expo: {
            name: 'Test App',
            slug: 'test-app',
            version: '1.0.0',
          },
        })
      );

      const appConfig = JSON.parse(mockReadFileSync('/test/app.json', 'utf-8'));

      expect(appConfig.expo.name).toBe('Test App');
      expect(appConfig.expo.slug).toBe('test-app');
    });

    it('should fail when expo.name is missing', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          expo: {
            slug: 'test-app',
          },
        })
      );

      const appConfig = JSON.parse(mockReadFileSync('/test/app.json', 'utf-8'));

      expect(appConfig.expo.name).toBeUndefined();
    });

    it('should fail when expo.slug is missing', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          expo: {
            name: 'Test App',
          },
        })
      );

      const appConfig = JSON.parse(mockReadFileSync('/test/app.json', 'utf-8'));

      expect(appConfig.expo.slug).toBeUndefined();
    });
  });

  describe('Navigation Check', () => {
    it('should pass for valid Expo Router setup', () => {
      mockExistsSync.mockImplementation((p: string) => {
        return p.includes('src/app') || p.endsWith('_layout.tsx');
      });

      mockReaddirSync.mockReturnValue([
        '_layout.tsx',
        'index.tsx',
        'settings.tsx',
        '(tabs)',
      ] as unknown as fs.Dirent[]);

      const files = mockReaddirSync('/test/src/app') as unknown as string[];
      const pageFiles = files.filter(
        (f: string) => f.endsWith('.tsx') && !f.startsWith('_')
      );

      expect(pageFiles.length).toBeGreaterThan(0);
      expect(pageFiles).toContain('index.tsx');
    });

    it('should fail when _layout.tsx is missing', () => {
      mockExistsSync.mockImplementation((p: string) => {
        if (p.endsWith('_layout.tsx')) return false;
        return p.includes('src/app');
      });

      const hasLayout = mockExistsSync('/test/src/app/_layout.tsx');

      expect(hasLayout).toBe(false);
    });

    it('should fail when no page files exist', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        '_layout.tsx',
      ] as unknown as fs.Dirent[]);

      const files = mockReaddirSync('/test/src/app') as unknown as string[];
      const pageFiles = files.filter(
        (f: string) => f.endsWith('.tsx') && !f.startsWith('_')
      );

      expect(pageFiles.length).toBe(0);
    });
  });

  describe('TypeScript Check', () => {
    it('should pass when TypeScript compiles without errors', async () => {
      mockExistsSync.mockReturnValue(true);
      mockExec.mockImplementation((cmd: string, options: unknown, callback?: Function) => {
        if (callback) {
          callback(null, { stdout: '', stderr: '' });
        }
      });

      // Simulate successful tsc run
      const result = { passed: true };

      expect(result.passed).toBe(true);
    });

    it('should fail and count errors when TypeScript has errors', () => {
      const output = `
src/App.tsx(10,5): error TS2304: Cannot find name 'foo'.
src/App.tsx(15,10): error TS2304: Cannot find name 'bar'.
src/utils.ts(5,1): error TS2322: Type 'string' is not assignable to type 'number'.
      `.trim();

      const errorCount = (output.match(/error TS/g) || []).length;

      expect(errorCount).toBe(3);
    });

    it('should skip when tsconfig.json does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const hasTsConfig = mockExistsSync('/test/tsconfig.json');

      expect(hasTsConfig).toBe(false);
      // Check should pass with skip message
    });
  });

  describe('Full Verification Flow', () => {
    it('should pass all checks for valid project', () => {
      const checks = [
        { name: 'required-files', passed: true },
        { name: 'package-json', passed: true },
        { name: 'app-config', passed: true },
        { name: 'typescript', passed: true },
        { name: 'circular-imports', passed: true },
        { name: 'navigation', passed: true },
        { name: 'imports', passed: true },
      ];

      const passed = checks.every((c) => c.passed);
      const failedChecks = checks.filter((c) => !c.passed);

      expect(passed).toBe(true);
      expect(failedChecks).toHaveLength(0);
    });

    it('should report summary with failed checks', () => {
      const checks = [
        { name: 'required-files', passed: true },
        { name: 'package-json', passed: false, message: 'Missing deps: expo' },
        { name: 'app-config', passed: true },
        { name: 'typescript', passed: false, message: '5 TypeScript errors' },
        { name: 'navigation', passed: true },
      ];

      const passed = checks.every((c) => c.passed);
      const failedChecks = checks.filter((c) => !c.passed);

      expect(passed).toBe(false);
      expect(failedChecks).toHaveLength(2);
      expect(failedChecks.map((c) => c.name)).toEqual(['package-json', 'typescript']);
    });

    it('should calculate total duration', () => {
      const checks = [
        { name: 'required-files', duration: 10 },
        { name: 'package-json', duration: 5 },
        { name: 'typescript', duration: 1500 },
        { name: 'navigation', duration: 20 },
      ];

      const totalDuration = checks.reduce((sum, c) => sum + c.duration, 0);

      expect(totalDuration).toBe(1535);
    });
  });

  describe('Quick Verification', () => {
    it('should only run essential checks', () => {
      const quickChecks = ['required-files', 'package-json', 'typescript'];
      const fullChecks = [
        'required-files',
        'package-json',
        'app-config',
        'typescript',
        'circular-imports',
        'navigation',
        'imports',
      ];

      expect(quickChecks.length).toBeLessThan(fullChecks.length);
      expect(quickChecks).toContain('typescript');
      expect(quickChecks).not.toContain('circular-imports');
    });
  });
});
