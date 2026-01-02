/**
 * Maestro E2E Test Runner
 *
 * Executes Maestro flows and collects results
 */

import { exec, execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type {
  MaestroConfig,
  MaestroTestResult,
  MaestroRunOptions,
  StepResult,
} from './types';

export interface RunnerResult {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: MaestroTestResult[];
  cloudUrl?: string;
}

/**
 * Maestro E2E Test Runner
 */
export class MaestroRunner {
  private config: MaestroConfig;

  constructor(config: MaestroConfig) {
    this.config = config;
  }

  /**
   * Check if Maestro CLI is installed
   */
  async checkInstallation(): Promise<boolean> {
    try {
      execSync('maestro --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run all Maestro flows in the test directory
   */
  async runAll(options: MaestroRunOptions = {}): Promise<RunnerResult> {
    const startTime = Date.now();
    const results: MaestroTestResult[] = [];

    // Get flow files
    const flowFiles = await this.getFlowFiles(options);

    if (flowFiles.length === 0) {
      return {
        success: true,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      };
    }

    // Run flows
    if (this.config.cloud) {
      return this.runCloud(flowFiles, options);
    }

    // Run locally
    for (const flowFile of flowFiles) {
      const result = await this.runFlow(flowFile, options);
      results.push(result);
    }

    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = results.filter((r) => !r.passed).length;

    return {
      success: failedTests === 0,
      totalTests: results.length,
      passedTests,
      failedTests,
      duration: Date.now() - startTime,
      results,
    };
  }

  /**
   * Run a single Maestro flow
   */
  async runFlow(
    flowFile: string,
    options: MaestroRunOptions = {}
  ): Promise<MaestroTestResult> {
    const startTime = Date.now();
    const flowName = path.basename(flowFile, '.yaml');

    return new Promise((resolve) => {
      const args = ['test', flowFile];

      // Add device if specified
      if (options.device) {
        args.push('--device', options.device);
      }

      // Add output directory for screenshots
      if (options.screenshots && options.outputDir) {
        args.push('--output', path.join(options.outputDir, flowName));
      }

      const maestro = spawn('maestro', args, {
        cwd: this.config.testDir,
        env: {
          ...process.env,
          APP_ID: this.config.appId,
        },
      });

      let stdout = '';
      let stderr = '';

      maestro.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      maestro.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      maestro.on('close', (code) => {
        const passed = code === 0;
        const duration = Date.now() - startTime;

        // Parse output to get step results
        const steps = this.parseStepResults(stdout);

        resolve({
          flowName,
          passed,
          duration,
          failureReason: passed ? undefined : this.extractFailureReason(stderr || stdout),
          steps,
        });
      });

      maestro.on('error', (error) => {
        resolve({
          flowName,
          passed: false,
          duration: Date.now() - startTime,
          failureReason: error.message,
          steps: [],
        });
      });
    });
  }

  /**
   * Run flows on Maestro Cloud
   */
  async runCloud(
    flowFiles: string[],
    options: MaestroRunOptions = {}
  ): Promise<RunnerResult> {
    const startTime = Date.now();

    if (!this.config.apiKey) {
      throw new Error('Maestro Cloud API key is required for cloud execution');
    }

    return new Promise((resolve) => {
      const args = [
        'cloud',
        '--apiKey', this.config.apiKey!,
        ...flowFiles,
      ];

      // Add tags filter if specified
      if (options.tags && options.tags.length > 0) {
        args.push('--include-tags', options.tags.join(','));
      }

      // Add device specification
      if (options.device) {
        args.push('--device', options.device);
      }

      const maestro = spawn('maestro', args, {
        cwd: this.config.testDir,
        env: {
          ...process.env,
          APP_ID: this.config.appId,
        },
      });

      let stdout = '';
      let stderr = '';

      maestro.stdout.on('data', (data) => {
        stdout += data.toString();
        // Log progress
        console.log(data.toString());
      });

      maestro.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      maestro.on('close', (code) => {
        const duration = Date.now() - startTime;

        // Parse cloud results
        const results = this.parseCloudResults(stdout);
        const passedTests = results.filter((r) => r.passed).length;
        const failedTests = results.filter((r) => !r.passed).length;

        // Extract cloud URL from output
        const cloudUrlMatch = stdout.match(/https:\/\/console\.mobile\.dev\/[^\s]+/);
        const cloudUrl = cloudUrlMatch ? cloudUrlMatch[0] : undefined;

        resolve({
          success: code === 0,
          totalTests: results.length,
          passedTests,
          failedTests,
          duration,
          results,
          cloudUrl,
        });
      });

      maestro.on('error', (error) => {
        resolve({
          success: false,
          totalTests: flowFiles.length,
          passedTests: 0,
          failedTests: flowFiles.length,
          duration: Date.now() - startTime,
          results: flowFiles.map((f) => ({
            flowName: path.basename(f, '.yaml'),
            passed: false,
            duration: 0,
            failureReason: error.message,
            steps: [],
          })),
        });
      });
    });
  }

  /**
   * Get flow files based on options
   */
  private async getFlowFiles(options: MaestroRunOptions): Promise<string[]> {
    // If specific flows specified, use those
    if (options.flows && options.flows.length > 0) {
      return options.flows.map((f) =>
        path.isAbsolute(f) ? f : path.join(this.config.testDir, f)
      );
    }

    // Otherwise, find all .yaml files
    const files = fs.readdirSync(this.config.testDir);
    let flowFiles = files
      .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map((f) => path.join(this.config.testDir, f));

    // Filter by tags if specified
    if (options.tags && options.tags.length > 0) {
      flowFiles = flowFiles.filter((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        return options.tags!.some((tag) => content.includes(`- ${tag}`));
      });
    }

    return flowFiles;
  }

  /**
   * Parse step results from Maestro output
   */
  private parseStepResults(output: string): StepResult[] {
    const steps: StepResult[] = [];
    const stepPattern = /(\[.+?\])\s+(.+?):\s+(PASSED|FAILED)/g;

    let match;
    while ((match = stepPattern.exec(output)) !== null) {
      steps.push({
        name: match[2].trim(),
        passed: match[3] === 'PASSED',
        duration: 0, // Duration not available in basic output
      });
    }

    return steps;
  }

  /**
   * Parse cloud results from output
   */
  private parseCloudResults(output: string): MaestroTestResult[] {
    const results: MaestroTestResult[] = [];

    // Parse flow results from cloud output
    const flowPattern = /Flow:\s+(.+?)\s+-\s+(PASSED|FAILED)/g;

    let match;
    while ((match = flowPattern.exec(output)) !== null) {
      results.push({
        flowName: match[1].trim(),
        passed: match[2] === 'PASSED',
        duration: 0,
        steps: [],
      });
    }

    return results;
  }

  /**
   * Extract failure reason from output
   */
  private extractFailureReason(output: string): string {
    // Look for common error patterns
    const errorPatterns = [
      /Error:\s+(.+)/,
      /Failed:\s+(.+)/,
      /Assertion failed:\s+(.+)/,
      /Element not found:\s+(.+)/,
    ];

    for (const pattern of errorPatterns) {
      const match = output.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Return last few lines if no specific error found
    const lines = output.trim().split('\n');
    return lines.slice(-3).join('\n');
  }
}

/**
 * Create Maestro runner with config
 */
export function createMaestroRunner(config: MaestroConfig): MaestroRunner {
  return new MaestroRunner(config);
}

/**
 * Quick utility to run Maestro tests
 */
export async function runMaestroTests(
  testDir: string,
  appId: string,
  options: MaestroRunOptions = {}
): Promise<RunnerResult> {
  const runner = new MaestroRunner({
    appId,
    testDir,
    platform: 'both',
  });

  return runner.runAll(options);
}
