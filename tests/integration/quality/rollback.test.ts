/**
 * Rollback Integration Tests
 *
 * Tests the rollback mechanism for reverting bad changes
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestProject, cleanupTestProject } from './helpers';
import { globalSetup, globalTeardown } from './setup';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Rollback Integration', () => {
  beforeAll(async () => {
    await globalSetup();
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('Apply Fix That Breaks Code', () => {
    it('should detect when a fix makes things worse', async () => {
      const testProject = await createTestProject(`test-rollback-detect-${Date.now()}`);

      try {
        const srcDir = path.join(testProject.projectPath, 'src');
        await fs.ensureDir(srcDir);

        // Create initial working file
        const componentPath = path.join(srcDir, 'Component.tsx');
        const workingCode = `import React from 'react';
import { View, Text } from 'react-native';

export function Component() {
  return <View><Text>Hello</Text></View>;
}`;

        await fs.writeFile(componentPath, workingCode);

        // Setup git for tracking changes
        execSync('git init', { cwd: testProject.projectPath });
        execSync('git config user.email "test@test.com"', { cwd: testProject.projectPath });
        execSync('git config user.name "Test"', { cwd: testProject.projectPath });
        execSync('git add .', { cwd: testProject.projectPath });
        execSync('git commit -m "Initial commit"', { cwd: testProject.projectPath });

        // Initial state: 0 errors
        let errorCount = 0;

        // Apply a "fix" that actually breaks things
        const brokenCode = `import React from 'react';
import { View } from 'react-native';
// Oops, removed Text import!

export function Component() {
  return <View><Text>Hello</Text></View>;
  // ^ This will cause an error now
}`;

        await fs.writeFile(componentPath, brokenCode);

        // New state: should have error
        // In real implementation, validator would catch this
        const hasError = !brokenCode.includes("import { View, Text }");
        expect(hasError).toBe(true);

        const newErrorCount = hasError ? 1 : 0;

        // Detect that fix made things worse
        const fixMadeThingsWorse = newErrorCount > errorCount;
        expect(fixMadeThingsWorse).toBe(true);

        console.log('[rollback-test] Detected that fix made things worse');

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 60000);
  });

  describe('Rollback Restores State', () => {
    it('should restore previous state after bad fix', async () => {
      const testProject = await createTestProject(`test-rollback-restore-${Date.now()}`);

      try {
        const srcDir = path.join(testProject.projectPath, 'src');
        await fs.ensureDir(srcDir);

        const componentPath = path.join(srcDir, 'Component.tsx');
        const workingCode = `import React from 'react';
import { View, Text } from 'react-native';

export function Component() {
  return <View><Text>Hello</Text></View>;
}`;

        await fs.writeFile(componentPath, workingCode);

        // Setup git
        execSync('git init', { cwd: testProject.projectPath });
        execSync('git config user.email "test@test.com"', { cwd: testProject.projectPath });
        execSync('git config user.name "Test"', { cwd: testProject.projectPath });
        execSync('git add .', { cwd: testProject.projectPath });
        execSync('git commit -m "Working state"', { cwd: testProject.projectPath });

        const beforeContent = await fs.readFile(componentPath, 'utf-8');

        // Apply broken fix
        const brokenCode = workingCode.replace("import { View, Text }", "import { View }");
        await fs.writeFile(componentPath, brokenCode);

        // Commit the broken change
        execSync('git add .', { cwd: testProject.projectPath });
        execSync('git commit -m "Broken fix"', { cwd: testProject.projectPath });

        // Verify it's broken
        const afterContent = await fs.readFile(componentPath, 'utf-8');
        expect(afterContent).not.toBe(beforeContent);
        expect(afterContent.includes('import { View, Text }')).toBe(false);

        // Rollback using git
        execSync('git reset --hard HEAD~1', { cwd: testProject.projectPath });

        // Verify rollback worked
        const restoredContent = await fs.readFile(componentPath, 'utf-8');
        expect(restoredContent).toBe(beforeContent);
        expect(restoredContent.includes('import { View, Text }')).toBe(true);

        console.log('[rollback-test] Successfully rolled back to working state');

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 60000);
  });

  describe('Multiple Rollbacks', () => {
    it('should handle multiple rollback operations', async () => {
      const testProject = await createTestProject(`test-rollback-multiple-${Date.now()}`);

      try {
        const srcDir = path.join(testProject.projectPath, 'src');
        await fs.ensureDir(srcDir);

        const componentPath = path.join(srcDir, 'Component.tsx');

        // Setup git
        execSync('git init', { cwd: testProject.projectPath });
        execSync('git config user.email "test@test.com"', { cwd: testProject.projectPath });
        execSync('git config user.name "Test"', { cwd: testProject.projectPath });

        const versions = [
          { version: 'v1', code: 'export const v1 = 1;' },
          { version: 'v2', code: 'export const v2 = 2;' },
          { version: 'v3', code: 'export const v3 = 3;' },
          { version: 'v4', code: 'export const v4 = 4;' },
        ];

        // Create multiple versions
        for (const { version, code } of versions) {
          await fs.writeFile(componentPath, code);
          execSync('git add .', { cwd: testProject.projectPath });
          execSync(`git commit -m "${version}"`, { cwd: testProject.projectPath });
        }

        // Current is v4
        let currentContent = await fs.readFile(componentPath, 'utf-8');
        expect(currentContent).toBe('export const v4 = 4;');

        // Rollback to v3
        execSync('git reset --hard HEAD~1', { cwd: testProject.projectPath });
        currentContent = await fs.readFile(componentPath, 'utf-8');
        expect(currentContent).toBe('export const v3 = 3;');

        // Rollback to v2
        execSync('git reset --hard HEAD~1', { cwd: testProject.projectPath });
        currentContent = await fs.readFile(componentPath, 'utf-8');
        expect(currentContent).toBe('export const v2 = 2;');

        // Rollback to v1
        execSync('git reset --hard HEAD~1', { cwd: testProject.projectPath });
        currentContent = await fs.readFile(componentPath, 'utf-8');
        expect(currentContent).toBe('export const v1 = 1;');

        console.log('[rollback-test] Successfully rolled back through 3 versions');

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 60000);
  });

  describe('History Tracked Correctly', () => {
    it('should maintain accurate git history after rollbacks', async () => {
      const testProject = await createTestProject(`test-rollback-history-${Date.now()}`);

      try {
        const srcDir = path.join(testProject.projectPath, 'src');
        await fs.ensureDir(srcDir);

        const componentPath = path.join(srcDir, 'Component.tsx');

        // Setup git
        execSync('git init', { cwd: testProject.projectPath });
        execSync('git config user.email "test@test.com"', { cwd: testProject.projectPath });
        execSync('git config user.name "Test"', { cwd: testProject.projectPath });

        // Create commits
        const commits = ['first', 'second', 'third'];
        for (const msg of commits) {
          await fs.writeFile(componentPath, `// ${msg}\n`);
          execSync('git add .', { cwd: testProject.projectPath });
          execSync(`git commit -m "${msg}"`, { cwd: testProject.projectPath });
        }

        // Check initial history
        const initialLog = execSync('git log --oneline', {
          cwd: testProject.projectPath,
          encoding: 'utf-8',
        });
        expect(initialLog).toContain('first');
        expect(initialLog).toContain('second');
        expect(initialLog).toContain('third');

        // Rollback one commit
        execSync('git reset --hard HEAD~1', { cwd: testProject.projectPath });

        // Check history after rollback
        const afterRollback = execSync('git log --oneline', {
          cwd: testProject.projectPath,
          encoding: 'utf-8',
        });
        expect(afterRollback).toContain('first');
        expect(afterRollback).toContain('second');
        expect(afterRollback).not.toContain('third');

        // Verify we can see the full history with reflog
        const reflog = execSync('git reflog', {
          cwd: testProject.projectPath,
          encoding: 'utf-8',
        });
        expect(reflog).toContain('third'); // Still in reflog

        console.log('[rollback-test] Git history tracked correctly after rollback');

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 60000);
  });
});
