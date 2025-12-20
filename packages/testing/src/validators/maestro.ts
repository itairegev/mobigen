import { execa } from 'execa';
import type { Validator, ValidatorConfig, StageResult, ValidationError } from '../types';

export const maestroValidator: Validator = {
  name: 'maestro',
  tier: 'tier3',

  async run(config: ValidatorConfig): Promise<StageResult> {
    const start = Date.now();
    const errors: ValidationError[] = [];

    try {
      await execa('maestro', ['test', '.maestro/', '--format', 'junit'], {
        cwd: config.projectPath,
        timeout: config.timeout || 300000, // 5 minutes for E2E tests
      });

      return {
        name: 'maestro',
        passed: true,
        duration: Date.now() - start,
        errors: [],
      };
    } catch (error) {
      const execaError = error as { stdout?: string; stderr?: string };
      const output = execaError.stderr || execaError.stdout || '';

      errors.push({
        file: '.maestro',
        message: `Maestro E2E tests failed: ${output.slice(0, 500)}`,
        severity: 'error',
      });

      return {
        name: 'maestro',
        passed: false,
        duration: Date.now() - start,
        errors,
        output,
      };
    }
  },
};
