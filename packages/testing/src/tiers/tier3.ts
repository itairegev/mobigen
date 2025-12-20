import type { ValidatorConfig, ValidationResult } from '../types';
import { runTier2 } from './tier2';
import { maestroValidator } from '../validators/maestro';

/**
 * Tier 3: Thorough validation (<10 minutes)
 * - All Tier 2 checks
 * - Maestro E2E tests
 */
export async function runTier3(config: ValidatorConfig): Promise<ValidationResult> {
  const start = Date.now();

  // Run Tier 2 first
  const tier2Result = await runTier2(config);

  // If Tier 2 failed, return early
  if (!tier2Result.passed) {
    return {
      ...tier2Result,
      tier: 'tier3',
      duration: Date.now() - start,
    };
  }

  const stages = { ...tier2Result.stages };
  const allErrors = [...tier2Result.errors];
  const allWarnings = [...tier2Result.warnings];

  // Run Maestro E2E tests
  const maestroResult = await maestroValidator.run(config);
  stages.maestro = maestroResult;
  allErrors.push(...maestroResult.errors.filter((e) => e.severity === 'error'));
  allWarnings.push(...maestroResult.errors.filter((e) => e.severity === 'warning'));

  const passed = Object.values(stages).every((s) => s.passed);

  return {
    tier: 'tier3',
    passed,
    errors: allErrors,
    warnings: allWarnings,
    duration: Date.now() - start,
    stages,
  };
}
