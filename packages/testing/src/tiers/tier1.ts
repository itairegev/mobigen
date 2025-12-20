import type { ValidatorConfig, ValidationResult, StageResult } from '../types.js';
import { typescriptValidator } from '../validators/typescript.js';
import { eslintValidator } from '../validators/eslint.js';

/**
 * Tier 1: Instant validation (<30 seconds)
 * - TypeScript compilation check
 * - ESLint linting
 */
export async function runTier1(config: ValidatorConfig): Promise<ValidationResult> {
  const start = Date.now();
  const stages: Record<string, StageResult> = {};
  const allErrors: ValidationResult['errors'] = [];
  const allWarnings: ValidationResult['warnings'] = [];

  // Run TypeScript validation
  const tsResult = await typescriptValidator.run(config);
  stages.typescript = tsResult;
  allErrors.push(...tsResult.errors.filter((e) => e.severity === 'error'));
  allWarnings.push(...tsResult.errors.filter((e) => e.severity === 'warning'));

  // Run ESLint validation
  const eslintResult = await eslintValidator.run(config);
  stages.eslint = eslintResult;
  allErrors.push(...eslintResult.errors.filter((e) => e.severity === 'error'));
  allWarnings.push(...eslintResult.errors.filter((e) => e.severity === 'warning'));

  const passed = Object.values(stages).every((s) => s.passed);

  return {
    tier: 'tier1',
    passed,
    errors: allErrors,
    warnings: allWarnings,
    duration: Date.now() - start,
    stages,
  };
}
