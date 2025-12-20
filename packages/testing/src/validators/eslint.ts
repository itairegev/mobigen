import { execa } from 'execa';
import type { Validator, ValidatorConfig, StageResult, ValidationError } from '../types';

export const eslintValidator: Validator = {
  name: 'eslint',
  tier: 'tier1',

  async run(config: ValidatorConfig): Promise<StageResult> {
    const start = Date.now();
    const errors: ValidationError[] = [];

    try {
      const result = await execa(
        'npx',
        ['eslint', 'src/', '--ext', '.ts,.tsx', '--format', 'json'],
        {
          cwd: config.projectPath,
          timeout: config.timeout || 60000,
          reject: false,
        }
      );

      const lintResults = JSON.parse(result.stdout || '[]');

      for (const fileResult of lintResults) {
        for (const message of fileResult.messages) {
          errors.push({
            file: fileResult.filePath,
            line: message.line,
            column: message.column,
            message: message.message,
            severity: message.severity === 2 ? 'error' : 'warning',
            rule: message.ruleId,
          });
        }
      }

      const hasErrors = errors.some((e) => e.severity === 'error');

      return {
        name: 'eslint',
        passed: !hasErrors,
        duration: Date.now() - start,
        errors,
      };
    } catch (error) {
      return {
        name: 'eslint',
        passed: false,
        duration: Date.now() - start,
        errors: [
          {
            file: 'eslint',
            message: `ESLint failed: ${(error as Error).message}`,
            severity: 'error',
          },
        ],
      };
    }
  },
};
