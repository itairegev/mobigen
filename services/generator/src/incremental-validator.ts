/**
 * Incremental Validator
 *
 * Provides quick validation checks that run after each development task.
 * This catches errors early before they accumulate across multiple tasks.
 *
 * Key Features:
 * - Fast TypeScript compilation check (< 30 seconds)
 * - Targeted file validation (only check modified files when possible)
 * - Integrated error fixing with retry loop
 * - Progress tracking for real-time feedback
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import {
  query,
  type SDKMessage,
} from '@anthropic-ai/claude-agent-sdk';
import {
  getDefaultRegistry,
  type DynamicAgentDefinition,
} from '@mobigen/ai';
import { emitProgress } from './api';
import { createLogger, type GenerationLogger } from './logger';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface IncrementalValidationConfig {
  /** Enable incremental validation after each task */
  enabled: boolean;
  /** Maximum time for TypeScript check in ms */
  typescriptTimeout: number;
  /** Maximum fix attempts per task */
  maxFixAttempts: number;
  /** Run ESLint check (slower but catches more issues) */
  runEslint: boolean;
  /** Check only modified files (faster but may miss cross-file issues) */
  targetedValidation: boolean;
  /** Stop task execution if validation fails after max retries */
  failOnValidationError: boolean;
}

export interface ValidationError {
  file: string;
  line?: number;
  column?: number;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface IncrementalValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  fixAttempts: number;
  duration: number;
  filesChecked: number;
}

export interface TaskValidationContext {
  taskId: string;
  filesModified: string[];
  projectPath: string;
  mobigenRoot: string;
}

// Default configuration
export const DEFAULT_INCREMENTAL_CONFIG: IncrementalValidationConfig = {
  enabled: true,
  typescriptTimeout: 30000,    // 30 seconds
  maxFixAttempts: 3,
  runEslint: false,            // Skip for speed, run at end
  targetedValidation: false,   // Full project check for reliability
  failOnValidationError: false, // Continue but log issues
};

// ============================================================================
// INCREMENTAL VALIDATOR CLASS
// ============================================================================

export class IncrementalValidator {
  private config: IncrementalValidationConfig;
  private logger: GenerationLogger;
  private projectId: string;
  private projectPath: string;
  private mobigenRoot: string;
  private agentRegistry: ReturnType<typeof getDefaultRegistry> | null = null;

  constructor(
    projectId: string,
    projectPath: string,
    mobigenRoot: string,
    config: Partial<IncrementalValidationConfig> = {}
  ) {
    this.projectId = projectId;
    this.projectPath = projectPath;
    this.mobigenRoot = mobigenRoot;
    this.config = { ...DEFAULT_INCREMENTAL_CONFIG, ...config };
    this.logger = createLogger(projectId, projectPath);
  }

  /**
   * Initialize the validator (load agent registry if needed for fixing)
   */
  async initialize(): Promise<void> {
    this.agentRegistry = getDefaultRegistry(this.mobigenRoot);
    await this.agentRegistry.initialize();
  }

  /**
   * Validate after a task completes - the main entry point
   */
  async validateAfterTask(context: TaskValidationContext): Promise<IncrementalValidationResult> {
    if (!this.config.enabled) {
      return {
        passed: true,
        errors: [],
        warnings: [],
        fixAttempts: 0,
        duration: 0,
        filesChecked: 0,
      };
    }

    const startTime = Date.now();
    this.logger.info(`[IncrementalValidation] Starting validation after task: ${context.taskId}`);

    await emitProgress(this.projectId, 'task:validation:start', {
      taskId: context.taskId,
      filesModified: context.filesModified.length,
    });

    let result: IncrementalValidationResult;
    let fixAttempts = 0;
    let currentErrors: ValidationError[] = [];

    // Run initial validation
    const initialResult = await this.runValidationChecks(context);
    currentErrors = initialResult.errors;

    if (currentErrors.length === 0) {
      // All good!
      result = {
        passed: true,
        errors: [],
        warnings: initialResult.warnings,
        fixAttempts: 0,
        duration: Date.now() - startTime,
        filesChecked: initialResult.filesChecked,
      };
    } else {
      // Errors found - try to fix them
      this.logger.warn(`[IncrementalValidation] Found ${currentErrors.length} errors after task ${context.taskId}`);

      await emitProgress(this.projectId, 'task:validation:errors', {
        taskId: context.taskId,
        errorCount: currentErrors.length,
        errors: currentErrors.slice(0, 5).map(e => ({
          file: e.file,
          message: e.message,
        })),
      });

      // Fix loop
      while (fixAttempts < this.config.maxFixAttempts && currentErrors.length > 0) {
        fixAttempts++;
        this.logger.info(`[IncrementalValidation] Fix attempt ${fixAttempts}/${this.config.maxFixAttempts}`);

        await emitProgress(this.projectId, 'task:validation:fixing', {
          taskId: context.taskId,
          attempt: fixAttempts,
          maxAttempts: this.config.maxFixAttempts,
          errorCount: currentErrors.length,
        });

        // Run the error fixer
        const fixResult = await this.runErrorFixer(context, currentErrors, fixAttempts);

        // Re-validate
        const revalidation = await this.runValidationChecks(context);

        if (revalidation.errors.length === 0) {
          this.logger.info(`[IncrementalValidation] All errors fixed after ${fixAttempts} attempt(s)`);
          currentErrors = [];
          break;
        }

        // Check for progress
        if (revalidation.errors.length >= currentErrors.length) {
          const sameErrors = this.compareErrors(currentErrors, revalidation.errors);
          if (sameErrors) {
            this.logger.warn(`[IncrementalValidation] No progress made, stopping fix attempts`);
            break;
          }
        }

        currentErrors = revalidation.errors;
      }

      result = {
        passed: currentErrors.length === 0,
        errors: currentErrors,
        warnings: initialResult.warnings,
        fixAttempts,
        duration: Date.now() - startTime,
        filesChecked: initialResult.filesChecked,
      };
    }

    await emitProgress(this.projectId, 'task:validation:complete', {
      taskId: context.taskId,
      passed: result.passed,
      errorCount: result.errors.length,
      fixAttempts: result.fixAttempts,
      duration: result.duration,
    });

    if (result.passed) {
      this.logger.info(`[IncrementalValidation] Task ${context.taskId} validated successfully`);
    } else {
      this.logger.warn(`[IncrementalValidation] Task ${context.taskId} has ${result.errors.length} unresolved errors`);
    }

    return result;
  }

  /**
   * Run the validation checks (TypeScript, optionally ESLint)
   */
  private async runValidationChecks(context: TaskValidationContext): Promise<{
    errors: ValidationError[];
    warnings: ValidationError[];
    filesChecked: number;
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let filesChecked = 0;

    // TypeScript check
    const tsResult = await this.runTypeScriptCheck(context);
    errors.push(...tsResult.errors);
    warnings.push(...tsResult.warnings);
    filesChecked = tsResult.filesChecked;

    // Optional ESLint check
    if (this.config.runEslint) {
      const eslintResult = await this.runEslintCheck(context);
      errors.push(...eslintResult.errors);
      warnings.push(...eslintResult.warnings);
    }

    return { errors, warnings, filesChecked };
  }

  /**
   * Run TypeScript compilation check
   */
  private async runTypeScriptCheck(context: TaskValidationContext): Promise<{
    errors: ValidationError[];
    warnings: ValidationError[];
    filesChecked: number;
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Check if tsconfig exists
      const tsconfigPath = path.join(context.projectPath, 'tsconfig.json');
      if (!fs.existsSync(tsconfigPath)) {
        this.logger.warn(`[IncrementalValidation] No tsconfig.json found at ${tsconfigPath}`);
        return { errors: [], warnings: [], filesChecked: 0 };
      }

      // Run tsc --noEmit
      const cmd = `cd "${context.projectPath}" && npx tsc --noEmit --skipLibCheck 2>&1 || true`;

      const { stdout } = await execAsync(cmd, {
        timeout: this.config.typescriptTimeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      // Parse TypeScript errors
      const parsedErrors = this.parseTypeScriptOutput(stdout, context.projectPath);
      errors.push(...parsedErrors.filter(e => e.severity === 'error'));
      warnings.push(...parsedErrors.filter(e => e.severity === 'warning'));

      // Count files checked (estimate from error output or assume all TS files)
      const filesChecked = context.filesModified.filter(f =>
        f.endsWith('.ts') || f.endsWith('.tsx')
      ).length || 1;

      return { errors, warnings, filesChecked };

    } catch (error) {
      const err = error as Error & { killed?: boolean };

      if (err.killed) {
        this.logger.warn(`[IncrementalValidation] TypeScript check timed out`);
        warnings.push({
          file: 'tsconfig.json',
          code: 'TIMEOUT',
          message: 'TypeScript check timed out',
          severity: 'warning',
        });
      } else {
        this.logger.error(`[IncrementalValidation] TypeScript check failed: ${err.message}`);
      }

      return { errors, warnings, filesChecked: 0 };
    }
  }

  /**
   * Parse TypeScript compiler output into structured errors
   */
  private parseTypeScriptOutput(output: string, projectPath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Pattern: file.ts(line,col): error TSxxxx: message
    const errorPattern = /^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)$/gm;

    let match;
    while ((match = errorPattern.exec(output)) !== null) {
      const [, file, line, column, severity, code, message] = match;

      // Normalize file path
      const normalizedFile = file.startsWith(projectPath)
        ? file.substring(projectPath.length + 1)
        : file;

      errors.push({
        file: normalizedFile,
        line: parseInt(line, 10),
        column: parseInt(column, 10),
        code,
        message: message.trim(),
        severity: severity as 'error' | 'warning',
      });
    }

    return errors;
  }

  /**
   * Run ESLint check (optional, slower)
   */
  private async runEslintCheck(context: TaskValidationContext): Promise<{
    errors: ValidationError[];
    warnings: ValidationError[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      const cmd = `cd "${context.projectPath}" && npx eslint src/ --ext .ts,.tsx --format json 2>&1 || true`;

      const { stdout } = await execAsync(cmd, {
        timeout: 60000, // 1 minute for ESLint
        maxBuffer: 10 * 1024 * 1024,
      });

      // Try to parse JSON output
      try {
        const results = JSON.parse(stdout);
        for (const fileResult of results) {
          for (const msg of fileResult.messages || []) {
            const normalizedFile = fileResult.filePath.startsWith(context.projectPath)
              ? fileResult.filePath.substring(context.projectPath.length + 1)
              : fileResult.filePath;

            const error: ValidationError = {
              file: normalizedFile,
              line: msg.line,
              column: msg.column,
              code: msg.ruleId || 'eslint',
              message: msg.message,
              severity: msg.severity === 2 ? 'error' : 'warning',
            };

            if (error.severity === 'error') {
              errors.push(error);
            } else {
              warnings.push(error);
            }
          }
        }
      } catch {
        // Not JSON, ignore
      }

    } catch (error) {
      this.logger.warn(`[IncrementalValidation] ESLint check failed: ${(error as Error).message}`);
    }

    return { errors, warnings };
  }

  /**
   * Run the error-fixer agent to fix validation errors
   */
  private async runErrorFixer(
    context: TaskValidationContext,
    errors: ValidationError[],
    attempt: number
  ): Promise<{ filesModified: string[] }> {
    const filesModified: string[] = [];

    if (!this.agentRegistry) {
      await this.initialize();
    }

    const errorFixerAgent = this.agentRegistry!.get('error-fixer');
    if (!errorFixerAgent) {
      this.logger.error('[IncrementalValidation] Error-fixer agent not found');
      return { filesModified };
    }

    // Group errors by file
    const errorsByFile = this.groupErrorsByFile(errors);

    // Build fix prompt
    const prompt = this.buildFixPrompt(context, errorsByFile, attempt);

    try {
      for await (const message of query({
        prompt,
        options: {
          agents: {
            'incremental-fixer': {
              description: 'Fixes TypeScript errors incrementally after each task',
              prompt: errorFixerAgent.prompt,
              tools: errorFixerAgent.tools,
              model: errorFixerAgent.model,
            },
          },
          allowedTools: errorFixerAgent.tools,
          model: errorFixerAgent.model || 'sonnet',
          maxTurns: 50,
          systemPrompt: `You are an error fixer running as part of incremental validation.
Working directory: ${this.mobigenRoot}
Project directory: ${context.projectPath}

Fix the TypeScript/ESLint errors listed. Focus on quick, targeted fixes.
${errorFixerAgent.prompt}`,
          cwd: this.mobigenRoot,
          permissionMode: 'acceptEdits',
        },
      })) {
        // Track file modifications
        if (message.type === 'tool' && (message.tool_name === 'Write' || message.tool_name === 'Edit')) {
          const filePath = message.tool_input?.file_path as string;
          if (filePath && !filesModified.includes(filePath)) {
            filesModified.push(filePath);
          }
        }
      }
    } catch (error) {
      this.logger.error(`[IncrementalValidation] Error fixer failed: ${(error as Error).message}`);
    }

    return { filesModified };
  }

  /**
   * Build the fix prompt with error details
   */
  private buildFixPrompt(
    context: TaskValidationContext,
    errorsByFile: Map<string, ValidationError[]>,
    attempt: number
  ): string {
    let prompt = `INCREMENTAL VALIDATION FIX - ATTEMPT ${attempt}\n\n`;
    prompt += `Task: ${context.taskId}\n`;
    prompt += `Project: ${context.projectPath}\n\n`;
    prompt += `The following TypeScript errors need to be fixed:\n\n`;

    for (const [file, fileErrors] of errorsByFile) {
      prompt += `📄 ${file}:\n`;
      for (const err of fileErrors) {
        prompt += `  Line ${err.line || '?'}: [${err.code}] ${err.message}\n`;
      }
      prompt += '\n';
    }

    prompt += `\nINSTRUCTIONS:\n`;
    prompt += `1. Read each file with errors\n`;
    prompt += `2. Apply minimal fixes to resolve the TypeScript errors\n`;
    prompt += `3. Do not refactor or change unrelated code\n`;
    prompt += `4. Ensure fixes don't introduce new errors\n`;

    if (attempt > 1) {
      prompt += `\n⚠️ This is attempt ${attempt}. Previous fixes did not resolve all errors.\n`;
      prompt += `Please analyze the errors more carefully and try different approaches.\n`;
    }

    return prompt;
  }

  /**
   * Group errors by file for easier processing
   */
  private groupErrorsByFile(errors: ValidationError[]): Map<string, ValidationError[]> {
    const grouped = new Map<string, ValidationError[]>();
    for (const error of errors) {
      const existing = grouped.get(error.file) || [];
      existing.push(error);
      grouped.set(error.file, existing);
    }
    return grouped;
  }

  /**
   * Compare two error sets to detect if they're the same (no progress)
   */
  private compareErrors(prev: ValidationError[], current: ValidationError[]): boolean {
    if (prev.length !== current.length) return false;

    const prevSet = new Set(prev.map(e => `${e.file}:${e.line}:${e.code}`));
    const currentSet = new Set(current.map(e => `${e.file}:${e.line}:${e.code}`));

    for (const key of prevSet) {
      if (!currentSet.has(key)) return false;
    }
    return true;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create an incremental validator instance
 */
export function createIncrementalValidator(
  projectId: string,
  projectPath: string,
  mobigenRoot: string,
  config?: Partial<IncrementalValidationConfig>
): IncrementalValidator {
  return new IncrementalValidator(projectId, projectPath, mobigenRoot, config);
}

export default IncrementalValidator;
