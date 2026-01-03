/**
 * Happy Path Integration Tests
 *
 * Tests successful end-to-end generation workflows
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestProject, runGeneration, assertFileStructure, assertValidation, cleanupTestProject, createTestConfig, checkNavigation, checkImports, checkBranding } from './helpers';
import { getSampleRequest, getSimpleRequests } from './fixtures/sample-requests';
import { getExpectedOutput } from './fixtures/expected-outputs';
import { globalSetup, globalTeardown } from './setup';
import { TestingIntegration } from '../../../services/generator/src/testing-integration';

describe('Happy Path - Successful Generations', () => {
  beforeAll(async () => {
    await globalSetup();
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('Simple Restaurant App', () => {
    it('should generate a working restaurant menu app', async () => {
      const request = getSampleRequest('restaurant-simple');
      expect(request).toBeDefined();
      if (!request) return;

      const expected = getExpectedOutput(request.id);
      expect(expected).toBeDefined();
      if (!expected) return;

      // Create test project
      const testProject = await createTestProject(`test-${request.id}-${Date.now()}`);

      try {
        // Generate app
        const config = createTestConfig("Mario's Pizza");
        config.branding.primaryColor = '#FF0000';
        config.branding.secondaryColor = '#FFFF00';

        const result = await runGeneration(
          request.prompt,
          testProject.projectId,
          config,
          { mock: false, timeout: 300000 } // 5 minute timeout
        );

        // Assert generation succeeded
        expect(result.success).toBe(true);
        expect(result.requiresReview).toBe(false);
        expect(result.files.length).toBeGreaterThan(0);

        // Assert file structure
        await assertFileStructure(testProject.projectPath, expected.fileStructure);

        // Run validation
        const testing = new TestingIntegration({
          projectPath: testProject.projectPath,
          projectId: testProject.projectId,
          emitProgress: false,
        });

        const tier1Result = await testing.runTier1Validation();
        assertValidation(tier1Result.result, {
          shouldPass: expected.validation.tier1ShouldPass,
          maxErrors: expected.validation.maxErrors,
          maxWarnings: expected.validation.allowedWarnings,
          requiredStages: ['typescript', 'eslint'],
        });

        // Check custom validations if specified
        if (expected.customChecks?.checkNavigation) {
          const navCheck = await checkNavigation(testProject.projectPath);
          expect(navCheck.valid).toBe(true);
          if (!navCheck.valid) {
            console.error('Navigation errors:', navCheck.errors);
          }
        }

        if (expected.customChecks?.checkImports) {
          const importCheck = await checkImports(testProject.projectPath);
          expect(importCheck.valid).toBe(true);
          if (!importCheck.valid) {
            console.error('Import errors:', importCheck.errors);
          }
        }

        if (expected.customChecks?.checkBranding) {
          const brandCheck = await checkBranding(testProject.projectPath, {
            primary: config.branding.primaryColor,
            secondary: config.branding.secondaryColor,
          });
          expect(brandCheck.valid).toBe(true);
          if (!brandCheck.valid) {
            console.error('Branding errors:', brandCheck.errors);
          }
        }

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 600000); // 10 minute timeout for full test
  });

  describe('Service Booking App', () => {
    it('should generate a working salon booking app', async () => {
      const request = getSampleRequest('booking-service');
      expect(request).toBeDefined();
      if (!request) return;

      const expected = getExpectedOutput(request.id);
      expect(expected).toBeDefined();
      if (!expected) return;

      const testProject = await createTestProject(`test-${request.id}-${Date.now()}`);

      try {
        const config = createTestConfig('Beauty Studio');
        config.branding.primaryColor = '#FF69B4';

        const result = await runGeneration(
          request.prompt,
          testProject.projectId,
          config,
          { mock: false, timeout: 300000 }
        );

        expect(result.success).toBe(true);
        expect(result.files.length).toBeGreaterThan(0);

        await assertFileStructure(testProject.projectPath, expected.fileStructure);

        const testing = new TestingIntegration({
          projectPath: testProject.projectPath,
          projectId: testProject.projectId,
          emitProgress: false,
        });

        const tier1Result = await testing.runTier1Validation();
        assertValidation(tier1Result.result, {
          shouldPass: expected.validation.tier1ShouldPass,
          maxErrors: expected.validation.maxErrors,
          maxWarnings: expected.validation.allowedWarnings,
        });

        await cleanupTestProject(testProject, true);
      } catch (error) {
        await cleanupTestProject(testProject, false);
        throw error;
      }
    }, 600000);
  });

  describe('Batch Testing - All Simple Apps', () => {
    it('should successfully generate all simple apps', async () => {
      const simpleRequests = getSimpleRequests();
      expect(simpleRequests.length).toBeGreaterThan(0);

      const results = [];

      for (const request of simpleRequests) {
        console.log(`\n[batch-test] Testing: ${request.name}`);

        const testProject = await createTestProject(`batch-${request.id}-${Date.now()}`);

        try {
          const config = createTestConfig(request.name);
          const result = await runGeneration(
            request.prompt,
            testProject.projectId,
            config,
            { mock: false, timeout: 300000 }
          );

          results.push({
            request: request.name,
            success: result.success,
            filesGenerated: result.files.length,
          });

          await cleanupTestProject(testProject, result.success);
        } catch (error) {
          results.push({
            request: request.name,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });

          await cleanupTestProject(testProject, false);
        }
      }

      console.log('\n[batch-test] Results:', results);

      // All should succeed
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(simpleRequests.length);
    }, 1800000); // 30 minute timeout for batch
  });
});
