import { execa } from 'execa';
import type { Validator, ValidatorConfig, StageResult, ValidationError } from '../types.js';

export const expoPrebuildValidator: Validator = {
  name: 'expo-prebuild',
  tier: 'tier2',

  async run(config: ValidatorConfig): Promise<StageResult> {
    const start = Date.now();
    const errors: ValidationError[] = [];

    try {
      await execa('npx', ['expo', 'prebuild', '--clean', '--no-install'], {
        cwd: config.projectPath,
        timeout: config.timeout || 120000,
      });

      return {
        name: 'expo-prebuild',
        passed: true,
        duration: Date.now() - start,
        errors: [],
      };
    } catch (error) {
      const execaError = error as { stdout?: string; stderr?: string };
      const output = execaError.stderr || execaError.stdout || '';

      errors.push({
        file: 'expo-prebuild',
        message: `Expo prebuild failed: ${output.slice(0, 500)}`,
        severity: 'error',
      });

      return {
        name: 'expo-prebuild',
        passed: false,
        duration: Date.now() - start,
        errors,
        output,
      };
    }
  },
};
