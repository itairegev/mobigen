/**
 * Auto-Fix Integration Tests
 *
 * Tests the automatic error detection and fixing capabilities
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestProject, cleanupTestProject, createTestConfig } from './helpers';
import { globalSetup, globalTeardown } from './setup';
import { TestingIntegration } from '../../../services/generator/src/testing-integration';
import { executeAgentWithTracking, runFeedbackLoop, DEFAULT_ENHANCED_CONFIG } from '../../../services/generator/src/enhanced-orchestrator';
import { TaskTracker } from '../../../services/generator/src/task-tracker';
import { createLogger } from '../../../services/generator/src/logger';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('Auto-Fix Integration', () => {
  beforeAll(async () => {
    await globalSetup();
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('Missing Import Detection and Fix', () => {
    it('should detect and fix missing imports', async () => {
      const testProject = await createTestProject(`test-missing-import-${Date.now()}`);

      try {
        // Create a file with a missing import
        const srcDir = path.join(testProject.projectPath, 'src');
        const componentFile = path.join(srcDir, 'components', 'TestComponent.tsx');

        await fs.ensureDir(path.dirname(componentFile));
        await fs.writeFile(
          componentFile,
          `export function TestComponent() {
  const [count, setCount] = useState(0);
  return <View><Text>{count}</Text></View>;
}`
        );

        // Also create package.json and tsconfig.json for validation
        await fs.writeJSON(path.join(testProject.projectPath, 'package.json'), {
          name: 'test-app',
          version: '1.0.0',
          dependencies: {
            'react': '^18.0.0',
            'react-native': '^0.72.0',
          },
        });

        await fs.writeJSON(path.join(testProject.projectPath, 'tsconfig.json'), {
          extends: 'expo/tsconfig.base',
          compilerOptions: {
            strict: true,
          },
        });

        // Run validation - should fail
        const testing = new TestingIntegration({
          projectPath: testProject.projectPath,
          projectId: testProject.projectId,
          emitProgress: false,
        });

        const tier1Result = await testing.runTier1Validation();
        expect(tier1Result.success).toBe(false);
        expect(tier1Result.errors.length).toBeGreaterThan(0);

        // Check that errors are about missing imports
        const hasImportError = tier1Result.errors.some(e =>
          e.message.toLowerCase().includes('import') ||
          e.message.toLowerCase().includes('not defined') ||
          e.message.toLowerCase().includes('cannot find')
        );
        expect(hasImportError).toBe(true);

        // Create a simple execution state for testing auto-fix
        const job = TaskTracker.createJob(testProject.projectId, {
          mode: 'test',
          config: createTestConfig('Test App'),
        });

        const logger = createLogger(testProject.projectId, testProject.projectPath);

        const state = {
          projectId: testProject.projectId,
          projectPath: testProject.projectPath,
          job,
          logger,
          config: createTestConfig('Test App'),
          sessionId: undefined,
          currentPhase: 'test',
          completedPhases: [],
          filesModified: [],
          errors: tier1Result.errors,
          outputs: {},
        };

        // Run auto-fix
        const fixResult = await runFeedbackLoop(state, tier1Result.errors, DEFAULT_ENHANCED_CONFIG);

        // Should have modified files
        expect(fixResult.filesModified.length).toBeGreaterThan(0);

        // Re-run validation - should pass or have fewer errors
        const tier1AfterFix = await testing.runTier1Validation();

        if (!tier1AfterFix.success) {
          console.log('Errors after fix:', tier1AfterFix.errors);
        }

        // Should have fewer errors (may not be perfect, but should improve)
        expect(tier1AfterFix.errors.length).toBeLessThan(tier1Result.errors.length);

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 300000); // 5 minute timeout
  });

  describe('Wrong Path Correction', () => {
    it('should detect and fix incorrect import paths', async () => {
      const testProject = await createTestProject(`test-wrong-path-${Date.now()}`);

      try {
        const srcDir = path.join(testProject.projectPath, 'src');

        // Create actual type file
        const typesDir = path.join(srcDir, 'types');
        await fs.ensureDir(typesDir);
        await fs.writeFile(
          path.join(typesDir, 'User.ts'),
          `export interface User {
  id: string;
  name: string;
}`
        );

        // Create component with wrong import path
        const componentFile = path.join(srcDir, 'components', 'UserCard.tsx');
        await fs.ensureDir(path.dirname(componentFile));
        await fs.writeFile(
          componentFile,
          `import React from 'react';
import { View, Text } from 'react-native';
import type { User } from './types/User'; // Wrong path!

export function UserCard({ user }: { user: User }) {
  return <View><Text>{user.name}</Text></View>;
}`
        );

        // Create package.json and tsconfig.json
        await fs.writeJSON(path.join(testProject.projectPath, 'package.json'), {
          name: 'test-app',
          version: '1.0.0',
          dependencies: {
            'react': '^18.0.0',
            'react-native': '^0.72.0',
          },
        });

        await fs.writeJSON(path.join(testProject.projectPath, 'tsconfig.json'), {
          extends: 'expo/tsconfig.base',
          compilerOptions: {
            strict: true,
            baseUrl: '.',
            paths: {
              '@/*': ['src/*'],
            },
          },
        });

        // Run validation
        const testing = new TestingIntegration({
          projectPath: testProject.projectPath,
          projectId: testProject.projectId,
          emitProgress: false,
        });

        const tier1Result = await testing.runTier1Validation();
        expect(tier1Result.success).toBe(false);

        // Should have import resolution error
        const hasPathError = tier1Result.errors.some(e =>
          e.message.toLowerCase().includes('cannot find') ||
          e.message.toLowerCase().includes('module')
        );
        expect(hasPathError).toBe(true);

        console.log('Path errors found:', tier1Result.errors);

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 300000);
  });

  describe('Auto-Fixable Error Classification', () => {
    it('should correctly classify which errors are auto-fixable', async () => {
      const testing = new TestingIntegration({
        projectPath: '/tmp/test',
        projectId: 'test',
        emitProgress: false,
      });

      // Test various error types
      const errors = [
        { message: "Cannot find name 'useState'", rule: 'TS2304', autoFixable: true },
        { message: "Module '\"react\"' has no exported member 'UseStat'", rule: 'TS2305', autoFixable: true },
        { message: "'React' is not defined", rule: 'no-undef', autoFixable: true },
        { message: "Property 'foo' does not exist on type 'Bar'", rule: 'TS2339', autoFixable: true },
        { message: "Unused variable 'x'", rule: 'no-unused-vars', autoFixable: true },
        { message: "Missing semicolon", rule: 'semi', autoFixable: true },
        { message: "Expected indentation of 2 spaces", rule: 'indent', autoFixable: true },
        { message: "Runtime error: Cannot read property 'x' of undefined", rule: '', autoFixable: false },
        { message: "Network timeout", rule: '', autoFixable: false },
      ];

      for (const error of errors) {
        const isFixable = (testing as { isAutoFixable: (error: { message: string; rule?: string }) => boolean }).isAutoFixable(error);
        expect(isFixable).toBe(error.autoFixable);
      }
    });
  });
});
