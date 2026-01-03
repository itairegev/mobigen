import { execa } from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import type { Validator, ValidatorConfig, StageResult, ValidationError } from '../types';

export const maestroValidator: Validator = {
  name: 'maestro',
  tier: 'tier3',

  async run(config: ValidatorConfig): Promise<StageResult> {
    const start = Date.now();
    const errors: ValidationError[] = [];
    const maestroDir = path.join(config.projectPath, '.maestro');

    // Check if .maestro directory exists
    if (!fs.existsSync(maestroDir)) {
      errors.push({
        file: '.maestro',
        message: 'No Maestro E2E tests found. Create .maestro/ directory with test flows for Gold certification.',
        severity: 'warning',
      });

      return {
        name: 'maestro',
        passed: false,
        duration: Date.now() - start,
        errors,
        output: 'No .maestro directory found',
      };
    }

    // Check if there are any YAML test files
    const yamlFiles = fs.readdirSync(maestroDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    const testFiles = yamlFiles.filter(f => f !== 'config.yaml' && f !== 'config.yml');

    if (testFiles.length === 0) {
      errors.push({
        file: '.maestro',
        message: 'No Maestro test flows found. Add .yaml test files to .maestro/ directory.',
        severity: 'warning',
      });

      return {
        name: 'maestro',
        passed: false,
        duration: Date.now() - start,
        errors,
        output: 'No test flows in .maestro directory',
      };
    }

    // Check if Maestro CLI is available (for local runs)
    try {
      await execa('which', ['maestro'], { timeout: 5000 });
    } catch {
      // Maestro not installed - return warning but pass if tests exist
      errors.push({
        file: '.maestro',
        message: `Maestro CLI not installed. ${testFiles.length} test flows found and validated structurally.`,
        severity: 'warning',
      });

      // Validate YAML structure instead
      const structureValid = await validateMaestroYamlStructure(maestroDir, testFiles, errors);

      return {
        name: 'maestro',
        passed: structureValid,
        duration: Date.now() - start,
        errors,
        output: `Structural validation: ${testFiles.length} test files`,
      };
    }

    // Run Maestro tests
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
        output: `${testFiles.length} E2E test flows passed`,
      };
    } catch (error) {
      const execaError = error as { stdout?: string; stderr?: string; message?: string };
      const output = execaError.stderr || execaError.stdout || execaError.message || '';

      // Parse Maestro output for specific failures
      const failedFlows = parseMaestroFailures(output);

      if (failedFlows.length > 0) {
        for (const flow of failedFlows) {
          errors.push({
            file: `.maestro/${flow.file}`,
            line: flow.step,
            message: flow.reason,
            severity: 'error',
          });
        }
      } else {
        errors.push({
          file: '.maestro',
          message: `Maestro E2E tests failed: ${output.slice(0, 500)}`,
          severity: 'error',
        });
      }

      return {
        name: 'maestro',
        passed: false,
        duration: Date.now() - start,
        errors,
        output: output.slice(0, 2000),
      };
    }
  },
};

/**
 * Validate Maestro YAML structure when CLI is not available
 */
async function validateMaestroYamlStructure(
  maestroDir: string,
  testFiles: string[],
  errors: ValidationError[]
): Promise<boolean> {
  let allValid = true;

  for (const file of testFiles) {
    const filePath = path.join(maestroDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for required elements
      if (!content.includes('launchApp') && !content.includes('appId')) {
        errors.push({
          file: `.maestro/${file}`,
          message: 'Missing launchApp or appId - test may not run correctly',
          severity: 'warning',
        });
      }

      // Check for at least one action
      const hasActions = /- (tapOn|assertVisible|inputText|scroll|swipe|waitFor)/.test(content);
      if (!hasActions) {
        errors.push({
          file: `.maestro/${file}`,
          message: 'No Maestro actions found (tapOn, assertVisible, etc.)',
          severity: 'error',
        });
        allValid = false;
      }
    } catch (err) {
      errors.push({
        file: `.maestro/${file}`,
        message: `Failed to read test file: ${err instanceof Error ? err.message : String(err)}`,
        severity: 'error',
      });
      allValid = false;
    }
  }

  return allValid;
}

/**
 * Parse Maestro failure output for specific errors
 */
function parseMaestroFailures(output: string): Array<{ file: string; step?: number; reason: string }> {
  const failures: Array<{ file: string; step?: number; reason: string }> = [];

  // Pattern: "Flow 'filename' failed at step N: reason"
  const flowPattern = /(?:Flow|Test)\s+['"]?([^'"]+\.ya?ml)['"]?\s+failed(?:\s+at\s+step\s+(\d+))?[:\s]+(.+?)(?=\n|$)/gi;
  let match;

  while ((match = flowPattern.exec(output)) !== null) {
    failures.push({
      file: match[1],
      step: match[2] ? parseInt(match[2], 10) : undefined,
      reason: match[3].trim(),
    });
  }

  return failures;
}
