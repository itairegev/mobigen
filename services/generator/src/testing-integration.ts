/**
 * Testing Integration
 *
 * Integrates @mobigen/testing validation pipeline with the generator.
 * Provides hooks for running tiered validation during generation.
 */

import { emitProgress } from './api';
import type { TaskError } from './task-tracker';

// Types from @mobigen/testing (imported dynamically to avoid circular deps)
interface ValidationResult {
  tier: 'tier1' | 'tier2' | 'tier3';
  passed: boolean;
  errors: Array<{
    file: string;
    line?: number;
    column?: number;
    message: string;
    severity: 'error' | 'warning';
    rule?: string;
  }>;
  warnings: Array<{
    file: string;
    line?: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
  duration: number;
  stages: Record<string, {
    name: string;
    passed: boolean;
    duration: number;
    errors: unknown[];
    output?: string;
  }>;
}

export interface TestingIntegrationConfig {
  projectPath: string;
  projectId: string;
  runTier1AfterEdit?: boolean;
  runTier2BeforePreview?: boolean;
  runTier3BeforeBuild?: boolean;
  stopOnFailure?: boolean;
  emitProgress?: boolean;
}

export interface ValidationRunResult {
  success: boolean;
  tier: 'tier1' | 'tier2' | 'tier3';
  result: ValidationResult;
  errors: TaskError[];
}

/**
 * Testing Integration Service
 *
 * Provides methods for running validation at different stages
 * of the generation pipeline.
 */
export class TestingIntegration {
  private config: Required<TestingIntegrationConfig>;
  private lastTier1Result: ValidationResult | null = null;
  private lastTier2Result: ValidationResult | null = null;
  private lastTier3Result: ValidationResult | null = null;

  constructor(config: TestingIntegrationConfig) {
    this.config = {
      projectPath: config.projectPath,
      projectId: config.projectId,
      runTier1AfterEdit: config.runTier1AfterEdit ?? true,
      runTier2BeforePreview: config.runTier2BeforePreview ?? true,
      runTier3BeforeBuild: config.runTier3BeforeBuild ?? true,
      stopOnFailure: config.stopOnFailure ?? false,
      emitProgress: config.emitProgress ?? true,
    };
  }

  /**
   * Run Tier 1 validation (instant, <30s)
   * Best used after file edits to catch obvious errors quickly
   */
  async runTier1Validation(): Promise<ValidationRunResult> {
    return this.runValidation('tier1');
  }

  /**
   * Run Tier 2 validation (fast, <2min)
   * Best used before generating preview to ensure app can be bundled
   */
  async runTier2Validation(): Promise<ValidationRunResult> {
    return this.runValidation('tier2');
  }

  /**
   * Run Tier 3 validation (thorough, <10min)
   * Best used before triggering a cloud build
   */
  async runTier3Validation(): Promise<ValidationRunResult> {
    return this.runValidation('tier3');
  }

  /**
   * Run progressive validation (Tier 1 -> Tier 2 -> Tier 3)
   * Stops at first failure if stopOnFailure is true
   */
  async runProgressiveValidation(): Promise<{
    success: boolean;
    results: ValidationRunResult[];
    stoppedAtTier?: 'tier1' | 'tier2' | 'tier3';
  }> {
    const results: ValidationRunResult[] = [];

    // Tier 1
    if (this.config.emitProgress) {
      await emitProgress(this.config.projectId, 'testing:progressive:start', {
        tiers: ['tier1', 'tier2', 'tier3'],
      });
    }

    const tier1Result = await this.runTier1Validation();
    results.push(tier1Result);

    if (!tier1Result.success && this.config.stopOnFailure) {
      return { success: false, results, stoppedAtTier: 'tier1' };
    }

    // Tier 2
    const tier2Result = await this.runTier2Validation();
    results.push(tier2Result);

    if (!tier2Result.success && this.config.stopOnFailure) {
      return { success: false, results, stoppedAtTier: 'tier2' };
    }

    // Tier 3
    const tier3Result = await this.runTier3Validation();
    results.push(tier3Result);

    const allPassed = results.every(r => r.success);

    if (this.config.emitProgress) {
      await emitProgress(this.config.projectId, 'testing:progressive:complete', {
        success: allPassed,
        results: results.map(r => ({
          tier: r.tier,
          passed: r.success,
          errorCount: r.errors.length,
          duration: r.result.duration,
        })),
      });
    }

    return {
      success: allPassed,
      results,
      stoppedAtTier: allPassed ? undefined : tier3Result.success ? (tier2Result.success ? undefined : 'tier2') : 'tier3',
    };
  }

  /**
   * Run validation at specific tier
   */
  private async runValidation(tier: 'tier1' | 'tier2' | 'tier3'): Promise<ValidationRunResult> {
    const { projectPath, projectId, emitProgress: shouldEmit } = this.config;

    if (shouldEmit) {
      await emitProgress(projectId, `testing:${tier}:start`, {
        projectPath,
        tier,
      });
    }

    try {
      // Dynamically import @mobigen/testing to avoid build issues
      const testing = await import('@mobigen/testing');

      const runFn = tier === 'tier1' ? testing.runTier1 :
                    tier === 'tier2' ? testing.runTier2 :
                    testing.runTier3;

      const result = await runFn({
        projectPath,
        tier,
        timeout: tier === 'tier1' ? 30000 : tier === 'tier2' ? 120000 : 600000,
      });

      // Store result
      if (tier === 'tier1') this.lastTier1Result = result;
      else if (tier === 'tier2') this.lastTier2Result = result;
      else this.lastTier3Result = result;

      // Convert to TaskErrors
      const errors: TaskError[] = result.errors.map(err => ({
        code: err.rule || `${tier.toUpperCase()}_ERROR`,
        message: err.message,
        file: err.file,
        line: err.line,
        autoFixable: this.isAutoFixable(err),
      }));

      if (shouldEmit) {
        await emitProgress(projectId, `testing:${tier}:complete`, {
          passed: result.passed,
          duration: result.duration,
          stages: Object.entries(result.stages).map(([name, stage]) => ({
            name,
            passed: stage.passed,
            duration: stage.duration,
            errorCount: stage.errors.length,
          })),
          errorCount: errors.length,
          warningCount: result.warnings.length,
        });
      }

      return {
        success: result.passed,
        tier,
        result,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (shouldEmit) {
        await emitProgress(projectId, `testing:${tier}:error`, {
          error: errorMessage,
        });
      }

      return {
        success: false,
        tier,
        result: {
          tier,
          passed: false,
          errors: [{
            file: projectPath,
            message: errorMessage,
            severity: 'error',
          }],
          warnings: [],
          duration: 0,
          stages: {},
        },
        errors: [{
          code: 'TESTING_ERROR',
          message: `${tier} validation failed: ${errorMessage}`,
          autoFixable: false,
        }],
      };
    }
  }

  /**
   * Get validation summary
   */
  getValidationSummary(): {
    tier1: { passed: boolean; errorCount: number; duration: number } | null;
    tier2: { passed: boolean; errorCount: number; duration: number } | null;
    tier3: { passed: boolean; errorCount: number; duration: number } | null;
    lastRun: Date | null;
  } {
    return {
      tier1: this.lastTier1Result ? {
        passed: this.lastTier1Result.passed,
        errorCount: this.lastTier1Result.errors.length,
        duration: this.lastTier1Result.duration,
      } : null,
      tier2: this.lastTier2Result ? {
        passed: this.lastTier2Result.passed,
        errorCount: this.lastTier2Result.errors.length,
        duration: this.lastTier2Result.duration,
      } : null,
      tier3: this.lastTier3Result ? {
        passed: this.lastTier3Result.passed,
        errorCount: this.lastTier3Result.errors.length,
        duration: this.lastTier3Result.duration,
      } : null,
      lastRun: this.lastTier3Result || this.lastTier2Result || this.lastTier1Result
        ? new Date()
        : null,
    };
  }

  /**
   * Get detailed errors from all tiers
   */
  getAllErrors(): TaskError[] {
    const errors: TaskError[] = [];

    for (const result of [this.lastTier1Result, this.lastTier2Result, this.lastTier3Result]) {
      if (result) {
        errors.push(...result.errors.map(err => ({
          code: err.rule || 'VALIDATION_ERROR',
          message: err.message,
          file: err.file,
          line: err.line,
          autoFixable: this.isAutoFixable(err),
        })));
      }
    }

    return errors;
  }

  /**
   * Check if an error is auto-fixable
   */
  private isAutoFixable(error: { message: string; rule?: string }): boolean {
    const message = error.message.toLowerCase();
    const rule = (error.rule || '').toLowerCase();

    const fixablePatterns = [
      'missing import',
      'cannot find module',
      'is not defined',
      'property does not exist',
      'type is not assignable',
      'unused',
      'no-unused-vars',
      'prefer-const',
    ];

    const fixableRules = [
      'no-unused-vars',
      'prefer-const',
      '@typescript-eslint/no-unused-vars',
      'import/order',
    ];

    return fixablePatterns.some(p => message.includes(p)) ||
           fixableRules.some(r => rule.includes(r));
  }

  /**
   * Clear cached results
   */
  clearResults(): void {
    this.lastTier1Result = null;
    this.lastTier2Result = null;
    this.lastTier3Result = null;
  }
}

/**
 * Create a testing integration instance
 */
export function createTestingIntegration(
  config: TestingIntegrationConfig
): TestingIntegration {
  return new TestingIntegration(config);
}

/**
 * Run quick validation check (Tier 1 only)
 * Useful for post-edit hooks
 */
export async function quickValidation(
  projectPath: string,
  projectId: string
): Promise<{ passed: boolean; errors: TaskError[] }> {
  const integration = new TestingIntegration({
    projectPath,
    projectId,
    emitProgress: false,
  });

  const result = await integration.runTier1Validation();

  return {
    passed: result.success,
    errors: result.errors,
  };
}

/**
 * Run full validation suite (all tiers)
 */
export async function fullValidation(
  projectPath: string,
  projectId: string,
  options: { stopOnFailure?: boolean } = {}
): Promise<{
  passed: boolean;
  errors: TaskError[];
  summary: {
    tier1: boolean;
    tier2: boolean;
    tier3: boolean;
  };
}> {
  const integration = new TestingIntegration({
    projectPath,
    projectId,
    stopOnFailure: options.stopOnFailure ?? true,
    emitProgress: true,
  });

  const result = await integration.runProgressiveValidation();

  const summary = {
    tier1: result.results[0]?.success ?? false,
    tier2: result.results[1]?.success ?? false,
    tier3: result.results[2]?.success ?? false,
  };

  const errors = result.results.flatMap(r => r.errors);

  return {
    passed: result.success,
    errors,
    summary,
  };
}
