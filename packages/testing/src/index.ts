import type { ValidationTier, ValidatorConfig, ValidationResult } from './types.js';
import { runTier1 } from './tiers/tier1.js';
import { runTier2 } from './tiers/tier2.js';
import { runTier3 } from './tiers/tier3.js';

export * from './types.js';
export * from './tiers/index.js';
export * from './validators/index.js';

/**
 * Run validation at the specified tier level
 */
export async function validate(
  projectPath: string,
  tier: ValidationTier = 'tier1',
  options: { timeout?: number; cwd?: string } = {}
): Promise<ValidationResult> {
  const config: ValidatorConfig = {
    projectPath,
    tier,
    timeout: options.timeout,
    cwd: options.cwd || projectPath,
  };

  switch (tier) {
    case 'tier1':
      return runTier1(config);
    case 'tier2':
      return runTier2(config);
    case 'tier3':
      return runTier3(config);
    default:
      throw new Error(`Unknown validation tier: ${tier}`);
  }
}

/**
 * Run progressive validation, stopping at first failure
 */
export async function validateProgressive(
  projectPath: string,
  maxTier: ValidationTier = 'tier3',
  options: { timeout?: number; cwd?: string } = {}
): Promise<ValidationResult> {
  const config: ValidatorConfig = {
    projectPath,
    tier: maxTier,
    timeout: options.timeout,
    cwd: options.cwd || projectPath,
  };

  // Always start with Tier 1
  const tier1Result = await runTier1(config);
  if (!tier1Result.passed || maxTier === 'tier1') {
    return tier1Result;
  }

  // If passed Tier 1 and max is >= tier2, run Tier 2
  const tier2Result = await runTier2(config);
  if (!tier2Result.passed || maxTier === 'tier2') {
    return tier2Result;
  }

  // If passed Tier 2 and max is tier3, run Tier 3
  return runTier3(config);
}
