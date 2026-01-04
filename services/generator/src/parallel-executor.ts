/**
 * Parallel Task Executor
 *
 * Spawns multiple developer agents to work on independent tasks simultaneously.
 * Uses task dependencies and parallelizableTasks from lead-developer output
 * to determine which tasks can run concurrently.
 */

import {
  query,
  type SDKMessage,
} from '@anthropic-ai/claude-agent-sdk';
import {
  getDefaultRegistry,
  type DynamicAgentDefinition,
  AGENT_TIMEOUTS,
  AGENT_MAX_TURNS,
  type AgentRole,
  type DevelopmentTask,
  type TaskBreakdown,
} from '@mobigen/ai';
import { TaskTracker, type TaskError } from './task-tracker';
import { emitProgress } from './api';
import { createLogger, type GenerationLogger } from './logger';
import {
  IncrementalValidator,
  type IncrementalValidationConfig,
  type IncrementalValidationResult,
  DEFAULT_INCREMENTAL_CONFIG,
} from './incremental-validator';

// ============================================================================
// TYPES
// ============================================================================

export interface ParallelExecutionConfig {
  maxConcurrentAgents: number;  // Max agents running at once
  taskTimeout: number;          // Per-task timeout in ms
  maxRetries: number;           // Retries per task
  continueOnTaskFailure: boolean; // Continue other tasks if one fails
  /** Incremental validation after each task */
  incrementalValidation: Partial<IncrementalValidationConfig>;
}

export interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  filesModified: string[];
  output: Record<string, unknown>;
  error?: string;
  duration: number;
  /** Validation result after task completion */
  validation?: IncrementalValidationResult;
}

export interface BatchResult {
  batchIndex: number;
  tasks: TaskExecutionResult[];
  success: boolean;
  duration: number;
}

export interface ParallelExecutionResult {
  success: boolean;
  batches: BatchResult[];
  totalFilesModified: string[];
  failedTasks: string[];
  duration: number;
}

// Default configuration
export const DEFAULT_PARALLEL_CONFIG: ParallelExecutionConfig = {
  maxConcurrentAgents: 3,       // Run up to 3 developer agents in parallel
  taskTimeout: 300000,          // 5 minutes per task
  maxRetries: 2,
  continueOnTaskFailure: true,  // Keep going if a task fails
  incrementalValidation: {
    enabled: true,              // Validate after each task
    maxFixAttempts: 3,          // Try to fix errors 3 times
    typescriptTimeout: 30000,   // 30 seconds for TypeScript check
    runEslint: false,           // Skip ESLint for speed (run at end)
    failOnValidationError: false, // Continue but track errors
  },
};

// ============================================================================
// TASK DEPENDENCY ANALYZER
// ============================================================================

/**
 * Analyzes task dependencies and creates execution batches
 * Tasks in the same batch can run in parallel
 */
export function analyzeDependencies(
  breakdown: TaskBreakdown
): DevelopmentTask[][] {
  const tasks = breakdown.tasks;
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const batches: DevelopmentTask[][] = [];
  const completed = new Set<string>();
  const remaining = new Set(tasks.map(t => t.id));

  // If lead-developer already provided parallelizable groups, use them
  if (breakdown.parallelizableTasks && breakdown.parallelizableTasks.length > 0) {
    for (const group of breakdown.parallelizableTasks) {
      const batch = group
        .map(id => taskMap.get(id))
        .filter((t): t is DevelopmentTask => t !== undefined);
      if (batch.length > 0) {
        batches.push(batch);
        batch.forEach(t => {
          completed.add(t.id);
          remaining.delete(t.id);
        });
      }
    }
  }

  // Process remaining tasks based on dependencies
  while (remaining.size > 0) {
    const batch: DevelopmentTask[] = [];

    for (const taskId of remaining) {
      const task = taskMap.get(taskId)!;

      // Check if all dependencies are completed
      const depsCompleted = task.dependencies.every(dep => completed.has(dep));

      if (depsCompleted) {
        batch.push(task);
      }
    }

    if (batch.length === 0) {
      // Circular dependency or missing dependency - add remaining as final batch
      console.warn('Possible circular dependency detected, adding remaining tasks');
      for (const taskId of remaining) {
        batch.push(taskMap.get(taskId)!);
      }
    }

    // Sort batch by priority (lower = higher priority)
    batch.sort((a, b) => a.priority - b.priority);

    batches.push(batch);
    batch.forEach(t => {
      completed.add(t.id);
      remaining.delete(t.id);
    });
  }

  return batches;
}

// ============================================================================
// PARALLEL EXECUTOR CLASS
// ============================================================================

export class ParallelTaskExecutor {
  private config: ParallelExecutionConfig;
  private logger: GenerationLogger;
  private projectId: string;
  private projectPath: string;
  private mobigenRoot: string;
  private jobId: string;
  private agentRegistry: ReturnType<typeof getDefaultRegistry>;
  private context: Record<string, unknown>;
  private incrementalValidator: IncrementalValidator | null = null;

  constructor(
    projectId: string,
    projectPath: string,
    mobigenRoot: string,
    jobId: string,
    agentRegistry: ReturnType<typeof getDefaultRegistry>,
    context: Record<string, unknown>,
    config: ParallelExecutionConfig = DEFAULT_PARALLEL_CONFIG
  ) {
    this.projectId = projectId;
    this.projectPath = projectPath;
    this.mobigenRoot = mobigenRoot;
    this.jobId = jobId;
    this.agentRegistry = agentRegistry;
    this.context = context;
    this.config = config;
    this.logger = createLogger(projectId, projectPath);

    // Initialize incremental validator if enabled
    if (this.config.incrementalValidation?.enabled) {
      this.incrementalValidator = new IncrementalValidator(
        projectId,
        projectPath,
        mobigenRoot,
        { ...DEFAULT_INCREMENTAL_CONFIG, ...this.config.incrementalValidation }
      );
    }
  }

  /**
   * Initialize validator (must be called before execute)
   */
  async initialize(): Promise<void> {
    if (this.incrementalValidator) {
      await this.incrementalValidator.initialize();
      this.logger.info('Incremental validation enabled');
    }
  }

  /**
   * Execute all tasks with parallelization
   */
  async execute(breakdown: TaskBreakdown): Promise<ParallelExecutionResult> {
    const startTime = Date.now();
    const batches = analyzeDependencies(breakdown);
    const results: BatchResult[] = [];
    const allFilesModified: string[] = [];
    const failedTasks: string[] = [];

    // Initialize incremental validator
    await this.initialize();

    this.logger.info('Starting parallel execution', {
      totalTasks: breakdown.tasks.length,
      batchCount: batches.length,
      maxConcurrent: this.config.maxConcurrentAgents,
      incrementalValidation: this.config.incrementalValidation?.enabled ?? false,
    });

    await emitProgress(this.projectId, 'parallel:start', {
      totalTasks: breakdown.tasks.length,
      batches: batches.map((b, i) => ({
        index: i,
        taskCount: b.length,
        taskIds: b.map(t => t.id),
      })),
    });

    // Execute batches sequentially (tasks within batch run in parallel)
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      this.logger.info(`Executing batch ${batchIndex + 1}/${batches.length}`, {
        taskCount: batch.length,
        taskIds: batch.map(t => t.id),
      });

      await emitProgress(this.projectId, 'batch:start', {
        batchIndex,
        taskCount: batch.length,
        taskIds: batch.map(t => t.id),
      });

      const batchResult = await this.executeBatch(batch, batchIndex);
      results.push(batchResult);

      // Collect results
      for (const taskResult of batchResult.tasks) {
        allFilesModified.push(...taskResult.filesModified);
        if (!taskResult.success) {
          failedTasks.push(taskResult.taskId);
        }
      }

      await emitProgress(this.projectId, 'batch:complete', {
        batchIndex,
        success: batchResult.success,
        completedTasks: batchResult.tasks.filter(t => t.success).length,
        failedTasks: batchResult.tasks.filter(t => !t.success).length,
      });

      // Check if we should stop on failure
      if (!batchResult.success && !this.config.continueOnTaskFailure) {
        this.logger.error(`Batch ${batchIndex} failed, stopping execution`);
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    const success = failedTasks.length === 0;

    this.logger.info('Parallel execution completed', {
      success,
      totalDuration,
      filesModified: allFilesModified.length,
      failedTasks: failedTasks.length,
    });

    await emitProgress(this.projectId, 'parallel:complete', {
      success,
      duration: totalDuration,
      filesModified: allFilesModified.length,
      failedTasks,
    });

    return {
      success,
      batches: results,
      totalFilesModified: [...new Set(allFilesModified)], // Dedupe
      failedTasks,
      duration: totalDuration,
    };
  }

  /**
   * Execute a batch of tasks in parallel
   */
  private async executeBatch(
    tasks: DevelopmentTask[],
    batchIndex: number
  ): Promise<BatchResult> {
    const startTime = Date.now();
    const taskResults: TaskExecutionResult[] = [];

    // Split tasks into chunks based on maxConcurrentAgents
    const chunks = this.chunkArray(tasks, this.config.maxConcurrentAgents);

    for (const chunk of chunks) {
      // Execute chunk tasks in parallel
      const promises = chunk.map(task => this.executeTask(task, batchIndex));
      const results = await Promise.all(promises);
      taskResults.push(...results);
    }

    const success = taskResults.every(r => r.success);

    return {
      batchIndex,
      tasks: taskResults,
      success,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Execute a single task with a dedicated developer agent
   */
  private async executeTask(
    task: DevelopmentTask,
    batchIndex: number
  ): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    const filesModified: string[] = [];
    let output: Record<string, unknown> = {};
    let error: string | undefined;

    // Create AbortController for proper timeout cancellation
    const abortController = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Create task in tracker
    const trackerTask = TaskTracker.createTask(
      this.jobId,
      this.projectId,
      'implementation',
      'developer',
      'agent_execution',  // Use valid TaskType
      {
        priority: task.priority,
        input: { task, context: this.context },
      }
    );

    const foundTask = TaskTracker.getTasksByPhase(this.jobId, 'implementation')
      .find(t => {
        const inputTask = t.input?.task as { id?: string } | undefined;
        return inputTask?.id === task.id;
      });

    if (foundTask) {
      TaskTracker.startTask(foundTask.id);
    }

    this.logger.info(`Starting task: ${task.id}`, {
      title: task.title,
      type: task.type,
      files: task.files,
    });

    await emitProgress(this.projectId, 'task:start', {
      taskId: task.id,
      title: task.title,
      batchIndex,
    });

    try {
      // Get developer agent definition
      const developerAgent = this.agentRegistry.get('developer');
      if (!developerAgent) {
        throw new Error('Developer agent not found in registry');
      }

      // Build task-specific prompt
      const prompt = this.buildTaskPrompt(task);

      // Execute with timeout using AbortController
      const timeout = this.config.taskTimeout;
      const maxTurns = AGENT_MAX_TURNS['developer'] || 150;

      // Set up timeout that will trigger abort
      timeoutId = setTimeout(() => {
        abortController.abort();
        this.logger.warn(`Task ${task.id} timeout triggered after ${timeout}ms`);
      }, timeout);

      const result = await this.runTaskAgent(
        developerAgent,
        prompt,
        task,
        filesModified,
        maxTurns,
        abortController.signal
      );

      // Clear timeout on successful completion
      clearTimeout(timeoutId);
      timeoutId = undefined;

      output = result.output;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // INCREMENTAL VALIDATION: Run TypeScript check and fix errors
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      let validationResult: IncrementalValidationResult | undefined;

      if (this.incrementalValidator && filesModified.length > 0) {
        this.logger.info(`Running incremental validation for task: ${task.id}`);

        validationResult = await this.incrementalValidator.validateAfterTask({
          taskId: task.id,
          filesModified,
          projectPath: this.projectPath,
          mobigenRoot: this.mobigenRoot,
        });

        if (!validationResult.passed) {
          this.logger.warn(`Task ${task.id} has validation issues: ${validationResult.errors.length} errors after ${validationResult.fixAttempts} fix attempts`);

          // If configured to fail on validation error, treat as task failure
          if (this.config.incrementalValidation?.failOnValidationError) {
            const errorSummary = validationResult.errors
              .slice(0, 3)
              .map(e => `${e.file}:${e.line}: ${e.message}`)
              .join('; ');

            throw new Error(`Validation failed after ${validationResult.fixAttempts} fix attempts: ${errorSummary}`);
          }
        } else {
          this.logger.info(`Task ${task.id} validated successfully (${validationResult.fixAttempts} fix attempts)`);
        }
      }

      // Mark task complete
      if (foundTask) {
        TaskTracker.completeTask(foundTask.id, true, output, filesModified);
      }

      this.logger.info(`Task completed: ${task.id}`, {
        filesModified: filesModified.length,
        duration: Date.now() - startTime,
        validation: validationResult ? {
          passed: validationResult.passed,
          errors: validationResult.errors.length,
          fixAttempts: validationResult.fixAttempts,
        } : undefined,
      });

      await emitProgress(this.projectId, 'task:complete', {
        taskId: task.id,
        success: true,
        filesModified: filesModified.length,
        validation: validationResult ? {
          passed: validationResult.passed,
          errorCount: validationResult.errors.length,
          fixAttempts: validationResult.fixAttempts,
        } : undefined,
      });

      return {
        taskId: task.id,
        success: true,
        filesModified,
        output,
        duration: Date.now() - startTime,
        validation: validationResult,
      };

    } catch (err) {
      // Clear timeout if still pending
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Check if this was an abort (timeout)
      const isAborted = abortController.signal.aborted;
      if (isAborted) {
        error = `Task ${task.id} timed out after ${this.config.taskTimeout}ms`;
        this.logger.warn(`Task aborted due to timeout: ${task.id}`);
      } else {
        error = err instanceof Error ? err.message : String(err);
        this.logger.error(`Task failed: ${task.id}`, { error });
      }

      if (foundTask) {
        TaskTracker.completeTask(foundTask.id, false, undefined, filesModified, error);
      }

      await emitProgress(this.projectId, 'task:failed', {
        taskId: task.id,
        error,
        timedOut: isAborted,
      });

      return {
        taskId: task.id,
        success: false,
        filesModified,
        output: {},
        error,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run the developer agent for a specific task
   */
  private async runTaskAgent(
    agent: DynamicAgentDefinition,
    prompt: string,
    task: DevelopmentTask,
    filesModified: string[],
    maxTurns: number,
    signal?: AbortSignal
  ): Promise<{ output: Record<string, unknown> }> {
    const output: Record<string, unknown> = {};
    let resultText = '';

    // Create a unique agent instance ID for this task
    const agentInstanceId = `developer-${task.id}`;

    for await (const message of query({
      prompt,
      options: {
        agents: {
          [agentInstanceId]: {
            description: `Developer agent implementing task: ${task.title}`,
            prompt: agent.prompt,
            tools: agent.tools,
            model: agent.model,
          },
        },
        allowedTools: agent.tools,
        model: agent.model || 'sonnet',
        maxTurns,
        systemPrompt: `You are a developer agent implementing a specific task.
Working directory: ${this.mobigenRoot}
Project directory: ${this.projectPath}

IMPORTANT: Focus ONLY on this specific task. Do not implement other features.

${agent.prompt}`,
        cwd: this.mobigenRoot,
        permissionMode: 'acceptEdits',
      },
    })) {
      // Check if aborted before processing each message
      if (signal?.aborted) {
        this.logger.info(`Task ${task.id} aborted, stopping iteration`);
        throw new Error(`Task ${task.id} was aborted`);
      }

      // Track file changes
      if (message.type === 'tool' && (message.tool_name === 'Write' || message.tool_name === 'Edit')) {
        const filePath = message.tool_input?.file_path as string;
        if (filePath && !filesModified.includes(filePath)) {
          filesModified.push(filePath);
        }
      }

      // Capture output
      if (message.type === 'assistant' && message.message) {
        const textBlock = message.message.content.find((b: { type: string }) => b.type === 'text');
        if (textBlock && 'text' in textBlock) {
          resultText += textBlock.text;
        }
      }
    }

    // Try to parse structured output
    try {
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        Object.assign(output, parsed);
      }
    } catch {
      // Not JSON, that's fine
    }

    output.resultText = resultText;

    return { output };
  }

  /**
   * Build prompt for a specific task
   */
  private buildTaskPrompt(task: DevelopmentTask): string {
    return `
IMPLEMENT THE FOLLOWING TASK:

TASK ID: ${task.id}
TITLE: ${task.title}
TYPE: ${task.type}
PRIORITY: ${task.priority}

DESCRIPTION:
${task.description}

FILES TO CREATE/MODIFY:
${task.files.map(f => `- ${f}`).join('\n')}

ACCEPTANCE CRITERIA:
${task.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

DEPENDENCIES (already implemented):
${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}

PROJECT CONTEXT:
${JSON.stringify(this.context, null, 2)}

INSTRUCTIONS:
1. Implement ONLY this specific task
2. Create/modify the files listed above
3. Follow the project's existing patterns and conventions
4. Use TypeScript with proper types
5. Include testID props on interactive elements
6. Ensure all imports are correct
7. When complete, output a summary of what was implemented

Begin implementation now.
`;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// ============================================================================
// HELPER: Run parallel execution
// ============================================================================

export async function runParallelImplementation(
  projectId: string,
  projectPath: string,
  mobigenRoot: string,
  jobId: string,
  breakdown: TaskBreakdown,
  context: Record<string, unknown>,
  config?: Partial<ParallelExecutionConfig>
): Promise<ParallelExecutionResult> {
  const agentRegistry = getDefaultRegistry(mobigenRoot);
  await agentRegistry.initialize();

  const executor = new ParallelTaskExecutor(
    projectId,
    projectPath,
    mobigenRoot,
    jobId,
    agentRegistry,
    context,
    { ...DEFAULT_PARALLEL_CONFIG, ...config }
  );

  return executor.execute(breakdown);
}

export default ParallelTaskExecutor;
