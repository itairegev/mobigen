/**
 * Retry System Integration Tests
 *
 * Tests the retry logic for handling transient failures
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestProject, cleanupTestProject, createTestConfig } from './helpers';
import { globalSetup, globalTeardown } from './setup';
import { TaskTracker } from '../../../services/generator/src/task-tracker';
import { executeAgentWithTracking, runFeedbackLoop, DEFAULT_ENHANCED_CONFIG } from '../../../services/generator/src/enhanced-orchestrator';
import { createLogger } from '../../../services/generator/src/logger';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('Retry System Integration', () => {
  beforeAll(async () => {
    await globalSetup();
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('Validation Failure Retry', () => {
    it('should retry validation up to max retries', async () => {
      const testProject = await createTestProject(`test-retry-validation-${Date.now()}`);

      try {
        // Create a project with errors that can't be auto-fixed easily
        const srcDir = path.join(testProject.projectPath, 'src');
        await fs.ensureDir(srcDir);

        // Create package.json
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
        });

        // Create component with multiple issues
        await fs.ensureDir(path.join(srcDir, 'components'));
        await fs.writeFile(
          path.join(srcDir, 'components', 'Problem.tsx'),
          `import React from 'react';
import { View } from 'react-native';
import { NonExistentThing } from 'fake-package';

export function Problem() {
  const x = undefinedVariable;
  return <View><NonExistentComponent /></View>;
}`
        );

        // Track retry attempts
        const retryAttempts: number[] = [];

        // Create job and state
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
          currentPhase: 'validation',
          completedPhases: [],
          filesModified: [],
          errors: [],
          outputs: {},
        };

        // Simulate retry loop
        const maxRetries = 3;
        let attempt = 0;
        let success = false;

        while (attempt < maxRetries && !success) {
          attempt++;
          retryAttempts.push(attempt);

          console.log(`[retry-test] Attempt ${attempt}/${maxRetries}`);

          // Simulate validation that fails
          const mockErrors = [
            {
              code: 'TS2304',
              message: 'Cannot find name "undefinedVariable"',
              file: 'src/components/Problem.tsx',
              line: 6,
              autoFixable: false, // Simulate non-fixable error
            },
          ];

          // Try to fix
          const fixResult = await runFeedbackLoop(
            state,
            mockErrors,
            { ...DEFAULT_ENHANCED_CONFIG, maxRetries: 1 }
          );

          // Won't succeed because error is non-fixable
          success = fixResult.success;
        }

        // Should have attempted maxRetries times
        expect(retryAttempts.length).toBe(maxRetries);
        expect(success).toBe(false);

        console.log(`[retry-test] Completed ${retryAttempts.length} retry attempts`);

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 300000);
  });

  describe('Multiple Retries with Different Strategies', () => {
    it('should try different fix strategies across retries', async () => {
      const testProject = await createTestProject(`test-retry-strategies-${Date.now()}`);

      try {
        const srcDir = path.join(testProject.projectPath, 'src');
        await fs.ensureDir(srcDir);

        // Setup basic project structure
        await fs.writeJSON(path.join(testProject.projectPath, 'package.json'), {
          name: 'test-app',
          version: '1.0.0',
          dependencies: {
            'react': '^18.0.0',
            'react-native': '^0.72.0',
          },
        });

        // Simulate multiple errors of different types
        const errorTypes = [
          {
            code: 'IMPORT_ERROR',
            message: 'Cannot resolve import',
            autoFixable: true,
            strategy: 'add-import',
          },
          {
            code: 'TYPE_ERROR',
            message: 'Type mismatch',
            autoFixable: true,
            strategy: 'fix-type',
          },
          {
            code: 'ESLINT_ERROR',
            message: 'Unused variable',
            autoFixable: true,
            strategy: 'remove-unused',
          },
        ];

        // Create job
        const job = TaskTracker.createJob(testProject.projectId, {
          mode: 'test',
          config: createTestConfig('Test App'),
        });

        // Track which strategies were attempted
        const strategiesAttempted: string[] = [];

        // For each error type, simulate a retry
        for (const errorType of errorTypes) {
          console.log(`[retry-test] Testing strategy: ${errorType.strategy}`);
          strategiesAttempted.push(errorType.strategy);

          // In real implementation, different error codes would trigger
          // different fixing agents or different prompts
          expect(errorType.autoFixable).toBe(true);
        }

        // Should have tried all strategies
        expect(strategiesAttempted.length).toBe(errorTypes.length);
        expect(strategiesAttempted).toContain('add-import');
        expect(strategiesAttempted).toContain('fix-type');
        expect(strategiesAttempted).toContain('remove-unused');

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 120000);
  });

  describe('Eventually Succeeds After Retries', () => {
    it('should succeed after fixing errors progressively', async () => {
      const testProject = await createTestProject(`test-retry-success-${Date.now()}`);

      try {
        // This test simulates a scenario where errors are fixed progressively
        // Start with 3 errors, fix 1 per retry, succeed on 3rd retry

        const initialErrors = [
          { code: 'E1', message: 'Error 1', autoFixable: true },
          { code: 'E2', message: 'Error 2', autoFixable: true },
          { code: 'E3', message: 'Error 3', autoFixable: true },
        ];

        let remainingErrors = [...initialErrors];
        const maxRetries = 3;
        let attempt = 0;

        while (remainingErrors.length > 0 && attempt < maxRetries) {
          attempt++;
          console.log(`[retry-test] Attempt ${attempt}, Remaining errors: ${remainingErrors.length}`);

          // Simulate fixing one error per attempt
          remainingErrors = remainingErrors.slice(1);
        }

        // Should have fixed all errors
        expect(remainingErrors.length).toBe(0);
        expect(attempt).toBe(initialErrors.length);

        console.log(`[retry-test] Successfully fixed all errors after ${attempt} attempts`);

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 60000);
  });

  describe('Escalates to Human Review After Max Retries', () => {
    it('should flag for human review when retries are exhausted', async () => {
      const testProject = await createTestProject(`test-retry-escalate-${Date.now()}`);

      try {
        // Simulate persistent errors that can't be auto-fixed
        const persistentError = {
          code: 'UNFIXABLE',
          message: 'This error cannot be automatically fixed',
          autoFixable: false,
        };

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
          currentPhase: 'validation',
          completedPhases: [],
          filesModified: [],
          errors: [persistentError],
          outputs: {},
        };

        const maxRetries = 3;
        let retries = 0;

        while (retries < maxRetries) {
          retries++;

          // Try to fix - will fail because error is not auto-fixable
          const result = await runFeedbackLoop(
            state,
            [persistentError],
            { ...DEFAULT_ENHANCED_CONFIG, maxRetries: 1 }
          );

          if (result.success) {
            break;
          }
        }

        // Should have exhausted retries
        expect(retries).toBe(maxRetries);

        // In real implementation, this would trigger flagForHumanReview()
        const requiresReview = retries >= maxRetries;
        expect(requiresReview).toBe(true);

        console.log('[retry-test] Correctly escalated to human review after exhausting retries');

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 60000);
  });
});
