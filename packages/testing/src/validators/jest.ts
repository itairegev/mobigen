import { execa } from 'execa';
import type { Validator, ValidatorConfig, StageResult, ValidationError } from '../types';

export const jestValidator: Validator = {
  name: 'jest',
  tier: 'tier2',

  async run(config: ValidatorConfig): Promise<StageResult> {
    const start = Date.now();
    const errors: ValidationError[] = [];

    try {
      const result = await execa(
        'npx',
        ['jest', '--passWithNoTests', '--json', '--outputFile=/dev/stdout'],
        {
          cwd: config.projectPath,
          timeout: config.timeout || 120000,
          reject: false,
        }
      );

      const testResults = JSON.parse(result.stdout || '{}');

      if (testResults.numFailedTests > 0) {
        for (const testFile of testResults.testResults || []) {
          for (const assertion of testFile.assertionResults || []) {
            if (assertion.status === 'failed') {
              errors.push({
                file: testFile.name,
                message: assertion.failureMessages?.join('\n') || 'Test failed',
                severity: 'error',
                rule: assertion.title,
              });
            }
          }
        }
      }

      return {
        name: 'jest',
        passed: testResults.success !== false,
        duration: Date.now() - start,
        errors,
      };
    } catch (error) {
      return {
        name: 'jest',
        passed: false,
        duration: Date.now() - start,
        errors: [
          {
            file: 'jest',
            message: `Jest failed: ${(error as Error).message}`,
            severity: 'error',
          },
        ],
      };
    }
  },
};
