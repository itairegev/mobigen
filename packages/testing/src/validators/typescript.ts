import { execa } from 'execa';
import type { Validator, ValidatorConfig, StageResult, ValidationError } from '../types';

export const typescriptValidator: Validator = {
  name: 'typescript',
  tier: 'tier1',

  async run(config: ValidatorConfig): Promise<StageResult> {
    const start = Date.now();
    const errors: ValidationError[] = [];

    try {
      await execa('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
        cwd: config.projectPath,
        timeout: config.timeout || 30000,
      });

      return {
        name: 'typescript',
        passed: true,
        duration: Date.now() - start,
        errors: [],
      };
    } catch (error) {
      const execaError = error as { stdout?: string; stderr?: string };
      const output = execaError.stdout || execaError.stderr || '';

      // Parse TypeScript errors
      const errorPattern = /^(.+)\((\d+),(\d+)\): error TS\d+: (.+)$/gm;
      let match;
      while ((match = errorPattern.exec(output)) !== null) {
        errors.push({
          file: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
          message: match[4],
          severity: 'error',
          rule: 'typescript',
        });
      }

      return {
        name: 'typescript',
        passed: false,
        duration: Date.now() - start,
        errors,
        output,
      };
    }
  },
};
