import type { ValidatorConfig, ValidationResult, StageResult } from '../types';
import { runTier1 } from './tier1';
import { expoPrebuildValidator } from '../validators/expo-prebuild';
import { jestValidator } from '../validators/jest';

/**
 * Tier 2: Fast validation (<2 minutes)
 * - All Tier 1 checks
 * - Expo prebuild (native project generation)
 * - Jest unit tests
 */
export async function runTier2(config: ValidatorConfig): Promise<ValidationResult> {
  const start = Date.now();

  // Run Tier 1 first
  const tier1Result = await runTier1(config);

  // If Tier 1 failed, return early
  if (!tier1Result.passed) {
    return {
      ...tier1Result,
      tier: 'tier2',
      duration: Date.now() - start,
    };
  }

  const stages = { ...tier1Result.stages };
  const allErrors = [...tier1Result.errors];
  const allWarnings = [...tier1Result.warnings];

  // Run Expo prebuild
  const prebuildResult = await expoPrebuildValidator.run(config);
  stages['expo-prebuild'] = prebuildResult;
  allErrors.push(...prebuildResult.errors.filter((e) => e.severity === 'error'));
  allWarnings.push(...prebuildResult.errors.filter((e) => e.severity === 'warning'));

  // Run Jest tests
  const jestResult = await jestValidator.run(config);
  stages.jest = jestResult;
  allErrors.push(...jestResult.errors.filter((e) => e.severity === 'error'));
  allWarnings.push(...jestResult.errors.filter((e) => e.severity === 'warning'));

  const passed = Object.values(stages).every((s) => s.passed);

  return {
    tier: 'tier2',
    passed,
    errors: allErrors,
    warnings: allWarnings,
    duration: Date.now() - start,
    stages,
  };
}
