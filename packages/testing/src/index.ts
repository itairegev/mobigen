import type { ValidationTier, ValidatorConfig, ValidationResult } from './types';
import { runTier1 } from './tiers/tier1';
import { runTier2 } from './tiers/tier2';
import { runTier3 } from './tiers/tier3';

export * from './types';
export * from './tiers/index';
export * from './validators/index';
export * from './visual';

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
 * Progressive validation options
 */
export interface ProgressiveValidationOptions {
  projectPath: string;
  stopOnFailure?: boolean;
  maxTier?: ValidationTier;
  timeout?: number;
  cwd?: string;
  onTierComplete?: (tier: ValidationTier, result: ValidationResult) => void;
}

/**
 * Run progressive validation, stopping at first failure
 * Returns array of all tier results
 */
export async function validateProgressive(
  options: ProgressiveValidationOptions | string,
  maxTierArg?: ValidationTier,
  legacyOptions?: { timeout?: number; cwd?: string }
): Promise<ValidationResult[]> {
  // Handle legacy signature: validateProgressive(projectPath, maxTier, options)
  let projectPath: string;
  let stopOnFailure = true;
  let maxTier: ValidationTier = 'tier3';
  let timeout: number | undefined;
  let cwd: string | undefined;
  let onTierComplete: ((tier: ValidationTier, result: ValidationResult) => void) | undefined;

  if (typeof options === 'string') {
    // Legacy call
    projectPath = options;
    maxTier = maxTierArg || 'tier3';
    timeout = legacyOptions?.timeout;
    cwd = legacyOptions?.cwd;
  } else {
    // New options object
    projectPath = options.projectPath;
    stopOnFailure = options.stopOnFailure ?? true;
    maxTier = options.maxTier || 'tier3';
    timeout = options.timeout;
    cwd = options.cwd;
    onTierComplete = options.onTierComplete;
  }

  const results: ValidationResult[] = [];

  const config: ValidatorConfig = {
    projectPath,
    tier: maxTier,
    timeout,
    cwd: cwd || projectPath,
  };

  // Always start with Tier 1
  const tier1Result = await runTier1(config);
  results.push(tier1Result);
  onTierComplete?.('tier1', tier1Result);

  if ((!tier1Result.passed && stopOnFailure) || maxTier === 'tier1') {
    return results;
  }

  // If passed Tier 1 and max is >= tier2, run Tier 2
  const tier2Result = await runTier2(config);
  results.push(tier2Result);
  onTierComplete?.('tier2', tier2Result);

  if ((!tier2Result.passed && stopOnFailure) || maxTier === 'tier2') {
    return results;
  }

  // If passed Tier 2 and max is tier3, run Tier 3
  const tier3Result = await runTier3(config);
  results.push(tier3Result);
  onTierComplete?.('tier3', tier3Result);

  return results;
}
