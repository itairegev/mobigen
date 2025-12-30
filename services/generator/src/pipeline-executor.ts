/**
 * Pipeline Executor
 *
 * Explicit pipeline execution with:
 * - Per-agent timeouts
 * - Task tracking in database
 * - Feedback loop for automatic error detection and fixing
 * - Proper flow continuation (no getting stuck)
 * - Resume capabilities
 */

import {
  query,
  type SDKMessage,
} from '@anthropic-ai/claude-agent-sdk';
import {
  getDefaultRegistry,
  type DynamicAgentDefinition,
} from '@mobigen/ai';
import { AGENT_TIMEOUTS, AGENT_MAX_TURNS, type AgentRole } from '@mobigen/ai';
import {
  TaskTracker,
  type GenerationJob,
  type GenerationTask,
  type TaskError,
} from './task-tracker';
import { emitProgress } from './api';
import { createLogger, type GenerationLogger } from './logger';
import {
  ParallelTaskExecutor,
  DEFAULT_PARALLEL_CONFIG,
  type ParallelExecutionConfig,
} from './parallel-executor';
import type { TaskBreakdown } from '@mobigen/ai';
import * as path from 'path';
import * as fs from 'fs';

// ============================================================================
// TYPES
// ============================================================================

export interface PipelinePhase {
  name: string;
  agents: AgentRole[];
  description: string;
  required: boolean;
  parallel?: boolean; // Can agents in this phase run in parallel?
  continueOnError?: boolean; // Continue to next phase even if this fails?
}

export interface PipelineConfig {
  phases: PipelinePhase[];
  maxRetries: number;
  enableFeedbackLoop: boolean;
  validateAfterImplementation: boolean;
  parallelImplementation: boolean;  // Use parallel task execution for implementation
  parallelConfig?: Partial<ParallelExecutionConfig>;
}

export interface ExecutionContext {
  projectId: string;
  projectPath: string;
  job: GenerationJob;
  logger: GenerationLogger;
  agentRegistry: ReturnType<typeof getDefaultRegistry>;
  mobigenRoot: string;
  config: Record<string, unknown>;
  outputs: Record<string, unknown>; // Accumulated outputs from previous phases
}

export interface PhaseResult {
  phase: string;
  success: boolean;
  outputs: Record<string, unknown>;
  filesModified: string[];
  errors: TaskError[];
  duration: number;
}

// ============================================================================
// DEFAULT PIPELINE CONFIGURATION
// ============================================================================

export const DEFAULT_PIPELINE: PipelineConfig = {
  phases: [
    {
      name: 'analysis',
      agents: ['intent-analyzer'],
      description: 'Analyze user requirements and select template',
      required: true,
    },
    {
      name: 'planning',
      agents: ['product-manager', 'technical-architect'],
      description: 'Create PRD and architecture design',
      required: true,
      parallel: false, // Sequential: PRD first, then architecture
    },
    {
      name: 'design',
      agents: ['ui-ux-expert'],
      description: 'Create UI/UX design system',
      required: true,
    },
    {
      name: 'task-breakdown',
      agents: ['lead-developer'],
      description: 'Break down work into development tasks',
      required: true,
    },
    {
      name: 'implementation',
      agents: ['developer'],
      description: 'Implement all development tasks',
      required: true,
    },
    {
      name: 'validation',
      agents: ['validator'],
      description: 'Validate generated code',
      required: true,
    },
    {
      name: 'build-validation',
      agents: ['build-validator'],
      description: 'Validate that the app builds successfully',
      required: true,
    },
    {
      name: 'qa',
      agents: ['qa'],
      description: 'Final quality assessment',
      required: true,
      continueOnError: true, // Complete even if QA finds issues
    },
    {
      name: 'web-preview',
      agents: ['web-deployer'],
      description: 'Deploy web preview using Expo Web',
      required: false, // Optional - only if web is supported
      continueOnError: true,
    },
    {
      name: 'android-build',
      agents: ['apk-builder'],
      description: 'Build Android APK',
      required: false, // Optional - can be triggered separately
      continueOnError: true,
    },
  ],
  maxRetries: 3,
  enableFeedbackLoop: true,
  validateAfterImplementation: true,
  parallelImplementation: true,  // Enable parallel task execution
  parallelConfig: {
    maxConcurrentAgents: 3,      // Run up to 3 developer agents in parallel
    taskTimeout: 300000,         // 5 minutes per task
    maxRetries: 2,
    continueOnTaskFailure: true,
  },
};

// ============================================================================
// PIPELINE EXECUTOR CLASS
// ============================================================================

export class PipelineExecutor {
  private config: PipelineConfig;
  private context: ExecutionContext;

  constructor(context: ExecutionContext, config: PipelineConfig = DEFAULT_PIPELINE) {
    this.context = context;
    this.config = config;
  }

  /**
   * Execute the entire pipeline
   */
  async execute(): Promise<{
    success: boolean;
    filesModified: string[];
    errors: TaskError[];
    outputs: Record<string, unknown>;
  }> {
    const { job, logger, projectId, projectPath } = this.context;
    const allFiles: string[] = [];
    const allErrors: TaskError[] = [];
    const phaseStatuses: Record<string, 'pending' | 'running' | 'completed' | 'failed'> = {};
    const startTime = Date.now();

    // Initialize all phases as pending
    for (const phase of this.config.phases) {
      phaseStatuses[phase.name] = 'pending';
    }

    logger.info('Starting pipeline execution', {
      phases: this.config.phases.map(p => p.name),
      maxRetries: this.config.maxRetries,
    });

    TaskTracker.startJob(job.id);
    await emitProgress(projectId, 'pipeline:start', {
      phases: this.config.phases.map(p => ({ name: p.name, agents: p.agents })),
      totalPhases: this.config.phases.length,
    });

    // Emit initial status
    await this.emitPipelineStatus(phaseStatuses, 0, this.config.phases.length);

    try {
      // Execute each phase sequentially
      for (let phaseIndex = 0; phaseIndex < this.config.phases.length; phaseIndex++) {
        const phase = this.config.phases[phaseIndex];
        phaseStatuses[phase.name] = 'running';

        const elapsedTime = Math.round((Date.now() - startTime) / 1000);
        logger.info(`Starting phase: ${phase.name}`, { agents: phase.agents });

        await emitProgress(projectId, 'phase:start', {
          phase: phase.name,
          phaseIndex: phaseIndex + 1,
          totalPhases: this.config.phases.length,
          elapsedTime,
          agents: phase.agents,
        });

        // Emit detailed status
        await this.emitPipelineStatus(phaseStatuses, phaseIndex, this.config.phases.length);

        TaskTracker.updateJob(job.id, { currentPhase: phase.name });

        const phaseResult = await this.executePhase(phase);

        // Accumulate results
        allFiles.push(...phaseResult.filesModified);
        this.context.outputs = { ...this.context.outputs, ...phaseResult.outputs };

        if (!phaseResult.success) {
          allErrors.push(...phaseResult.errors);

          // Check if we should run feedback loop
          if (this.config.enableFeedbackLoop && phaseResult.errors.length > 0) {
            logger.info('Entering feedback loop for error recovery');

            await emitProgress(projectId, 'feedback:start', {
              phase: phase.name,
              errors: phaseResult.errors.length,
            });

            const fixResult = await this.runFeedbackLoop(phase, phaseResult.errors);

            if (fixResult.success) {
              logger.info('Feedback loop recovered from errors');
              allFiles.push(...fixResult.filesModified);
              phaseStatuses[phase.name] = 'completed';

              await emitProgress(projectId, 'feedback:success', {
                phase: phase.name,
                filesFixed: fixResult.filesModified.length,
              });
            } else if (phase.required && !phase.continueOnError) {
              // Phase failed and is required - stop pipeline
              phaseStatuses[phase.name] = 'failed';
              logger.error(`Required phase ${phase.name} failed`, { errors: phaseResult.errors });

              await emitProgress(projectId, 'phase:failed', {
                phase: phase.name,
                errors: phaseResult.errors,
                canResume: true,
                resumeFromPhase: phase.name,
              });

              // Save recovery info
              await this.saveRecoveryInfo(phase.name, phaseResult.errors);
              break;
            } else {
              phaseStatuses[phase.name] = 'failed';
            }
          } else if (phase.required && !phase.continueOnError) {
            phaseStatuses[phase.name] = 'failed';
            logger.error(`Required phase ${phase.name} failed without recovery`);

            await emitProgress(projectId, 'phase:failed', {
              phase: phase.name,
              canResume: true,
              resumeFromPhase: phase.name,
            });

            // Save recovery info
            await this.saveRecoveryInfo(phase.name, phaseResult.errors);
            break;
          } else {
            // Phase failed but can continue
            phaseStatuses[phase.name] = 'failed';
          }
        } else {
          phaseStatuses[phase.name] = 'completed';
        }

        const phaseDuration = Math.round(phaseResult.duration / 1000);
        await emitProgress(projectId, 'phase:complete', {
          phase: phase.name,
          success: phaseResult.success,
          filesModified: phaseResult.filesModified.length,
          duration: phaseDuration,
          phaseIndex: phaseIndex + 1,
          totalPhases: this.config.phases.length,
        });

        logger.info(`Phase ${phase.name} completed`, {
          success: phaseResult.success,
          files: phaseResult.filesModified.length,
          duration: phaseResult.duration,
        });

        // Emit updated status
        await this.emitPipelineStatus(phaseStatuses, phaseIndex + 1, this.config.phases.length);
      }

      // Determine overall success
      const failedRequired = this.config.phases
        .filter(p => p.required && !p.continueOnError)
        .some(p => {
          const tasks = TaskTracker.getTasksByPhase(job.id, p.name);
          return tasks.some(t => t.status === 'failed');
        });

      const success = !failedRequired;

      // Complete job
      TaskTracker.completeJob(job.id, success, success ? undefined : 'Pipeline completed with errors');

      await emitProgress(projectId, 'pipeline:complete', {
        success,
        filesModified: allFiles.length,
        errors: allErrors.length,
      });

      logger.info('Pipeline execution completed', {
        success,
        totalFiles: allFiles.length,
        totalErrors: allErrors.length,
      });

      return {
        success,
        filesModified: allFiles,
        errors: allErrors,
        outputs: this.context.outputs,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Pipeline execution failed', { error: errorMessage });

      TaskTracker.completeJob(job.id, false, errorMessage);

      await emitProgress(projectId, 'pipeline:error', { error: errorMessage });

      return {
        success: false,
        filesModified: allFiles,
        errors: [{ code: 'PIPELINE_ERROR', message: errorMessage, autoFixable: false }],
        outputs: this.context.outputs,
      };
    }
  }

  /**
   * Execute a single phase
   */
  private async executePhase(phase: PipelinePhase): Promise<PhaseResult> {
    const { job, logger, projectId } = this.context;
    const startTime = Date.now();
    const outputs: Record<string, unknown> = {};
    const filesModified: string[] = [];
    const errors: TaskError[] = [];

    // Create tasks for all agents in this phase
    for (const agentId of phase.agents) {
      TaskTracker.createTask(
        job.id,
        projectId,
        phase.name,
        agentId,
        'agent_execution',
        {
          priority: phase.agents.indexOf(agentId),
          input: { phaseContext: this.context.outputs },
        }
      );
    }

    // SPECIAL CASE: Parallel implementation phase
    // Use ParallelTaskExecutor to run multiple developer agents on separate tasks
    if (phase.name === 'implementation' && this.config.parallelImplementation) {
      const taskBreakdown = this.context.outputs.tasks as TaskBreakdown | undefined;

      if (taskBreakdown && taskBreakdown.tasks && taskBreakdown.tasks.length > 0) {
        logger.info('Using parallel task execution for implementation', {
          taskCount: taskBreakdown.tasks.length,
          maxConcurrent: this.config.parallelConfig?.maxConcurrentAgents || 3,
        });

        const parallelExecutor = new ParallelTaskExecutor(
          projectId,
          this.context.projectPath,
          this.context.mobigenRoot,
          job.id,
          this.context.agentRegistry,
          this.context.outputs,
          { ...DEFAULT_PARALLEL_CONFIG, ...this.config.parallelConfig }
        );

        const parallelResult = await parallelExecutor.execute(taskBreakdown);

        // Convert parallel result to phase result format
        if (parallelResult.success) {
          outputs.implementation = {
            filesModified: parallelResult.totalFilesModified,
            batches: parallelResult.batches.length,
            totalTasks: taskBreakdown.tasks.length,
          };
          filesModified.push(...parallelResult.totalFilesModified);
        } else {
          for (const failedTaskId of parallelResult.failedTasks) {
            errors.push({
              code: 'TASK_FAILED',
              message: `Task ${failedTaskId} failed during parallel execution`,
              autoFixable: true,
            });
          }
        }

        return {
          phase: phase.name,
          success: errors.length === 0,
          outputs,
          filesModified,
          errors,
          duration: Date.now() - startTime,
        };
      } else {
        logger.warn('No task breakdown found, falling back to sequential implementation');
      }
    }

    // Execute agents (sequentially or in parallel)
    if (phase.parallel) {
      // Parallel execution
      const promises = phase.agents.map(agentId =>
        this.executeAgent(agentId, phase.name)
      );
      const results = await Promise.all(promises);

      for (const result of results) {
        if (result.success) {
          Object.assign(outputs, result.output);
          filesModified.push(...(result.filesModified || []));
        } else {
          errors.push(...this.extractErrors(result));
        }
      }
    } else {
      // Sequential execution
      for (const agentId of phase.agents) {
        logger.info(`Executing agent: ${agentId}`);
        await emitProgress(projectId, 'agent:start', { agent: agentId, phase: phase.name });

        const result = await this.executeAgent(agentId, phase.name);

        await emitProgress(projectId, 'agent:complete', {
          agent: agentId,
          phase: phase.name,
          success: result.success,
          filesModified: result.filesModified?.length || 0,
        });

        if (result.success) {
          Object.assign(outputs, result.output);
          filesModified.push(...(result.filesModified || []));
        } else {
          errors.push(...this.extractErrors(result));

          // If feedback loop is enabled and this agent failed, try to fix immediately
          if (this.config.enableFeedbackLoop && errors.length > 0) {
            const fixResult = await this.attemptFix(agentId, errors);
            if (fixResult.success) {
              // Clear errors since we fixed them
              errors.length = 0;
              filesModified.push(...(fixResult.filesModified || []));
            } else if (phase.required && !phase.continueOnError) {
              // Stop this phase if required and can't be fixed
              break;
            }
          }
        }
      }
    }

    return {
      phase: phase.name,
      success: errors.length === 0,
      outputs,
      filesModified,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Execute a single agent with retry logic
   */
  private async executeAgent(
    agentId: AgentRole,
    phase: string
  ): Promise<{
    success: boolean;
    output: Record<string, unknown>;
    filesModified?: string[];
    error?: string;
    errorDetails?: Record<string, unknown>;
  }> {
    const { job, projectPath, logger, agentRegistry } = this.context;
    const { projectId } = this.context;

    // Get task for this agent
    const tasks = TaskTracker.getTasksByPhase(job.id, phase);
    const task = tasks.find(t => t.agentId === agentId);
    if (!task) {
      return { success: false, output: {}, error: 'Task not found' };
    }

    // Get agent definition
    const agent = agentRegistry.get(agentId);
    if (!agent) {
      TaskTracker.completeTask(task.id, false, undefined, undefined, `Agent ${agentId} not found`);
      return { success: false, output: {}, error: `Agent ${agentId} not found` };
    }

    TaskTracker.startTask(task.id);
    TaskTracker.updateJob(job.id, { currentAgent: agentId });

    const baseTimeout = AGENT_TIMEOUTS[agentId] || 180000; // Default 3 min
    const maxRetries = 3;
    const maxTurns = AGENT_MAX_TURNS[agentId] || 50;

    logger.info(`Executing agent ${agentId}`, { timeout: baseTimeout, maxTurns, phase, maxRetries });

    let lastError: string = '';
    let lastErrorDetails: Record<string, unknown> = {};
    const allFilesModified: string[] = [];

    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const filesModified: string[] = [];
      let output: Record<string, unknown> = {};
      let resultText = '';

      // Emit retry progress
      await emitProgress(projectId, 'agent:attempt', {
        agent: agentId,
        phase,
        attempt,
        maxRetries,
        status: attempt === 1 ? 'starting' : 'retrying',
      });

      try {
        // Build prompt with context from previous phases
        let prompt = this.buildAgentPrompt(agent, phase);

        // If retrying, add context about previous failure
        if (attempt > 1) {
          prompt += `\n\n⚠️ RETRY ATTEMPT ${attempt}/${maxRetries}\nPrevious attempt failed: ${lastError}\nPlease try a different approach or be more careful with the implementation.\n`;
          logger.warn(`Retrying agent ${agentId}`, { attempt, previousError: lastError });
        }

        // Calculate timeout (increase slightly on retries)
        const timeout = baseTimeout + (attempt - 1) * 60000; // Add 1 min per retry

        // Execute with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Agent ${agentId} timed out after ${timeout}ms`)), timeout)
        );

        const executionPromise = this.runAgentQuery(agent, prompt, filesModified, agentId);

        const result = await Promise.race([executionPromise, timeoutPromise]);
        resultText = result.text;
        output = result.output;

        // Try to parse structured output
        try {
          const jsonMatch = resultText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            output = { ...output, ...parsed };
          }
        } catch {
          // Not JSON, that's fine
        }

        // Success! Mark task complete
        allFilesModified.push(...filesModified);
        TaskTracker.completeTask(task.id, true, output, allFilesModified);

        // Save checkpoint on success
        await this.saveCheckpoint(phase, agentId, output, allFilesModified);

        logger.info(`Agent ${agentId} completed successfully`, {
          filesModified: filesModified.length,
          attempt,
        });

        await emitProgress(projectId, 'agent:success', {
          agent: agentId,
          phase,
          attempt,
          filesModified: filesModified.length,
        });

        return { success: true, output, filesModified: allFilesModified };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        lastError = errorMessage;
        lastErrorDetails = this.parseErrorDetails(errorMessage);
        allFilesModified.push(...filesModified);

        const isTimeout = errorMessage.includes('timed out');
        const isRateLimit = errorMessage.toLowerCase().includes('rate limit') ||
                          errorMessage.toLowerCase().includes('too many');

        logger.error(`Agent ${agentId} failed (attempt ${attempt}/${maxRetries})`, {
          error: errorMessage,
          isTimeout,
          isRateLimit,
        });

        await emitProgress(projectId, 'agent:error', {
          agent: agentId,
          phase,
          attempt,
          maxRetries,
          error: errorMessage,
          isTimeout,
          isRateLimit,
          willRetry: attempt < maxRetries,
        });

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          // Longer wait for rate limits, shorter for other errors
          const waitTime = isRateLimit ? 30000 : (isTimeout ? 10000 : 5000);
          logger.info(`Waiting ${waitTime}ms before retry...`);

          await emitProgress(projectId, 'agent:waiting', {
            agent: agentId,
            phase,
            waitTime,
            reason: isRateLimit ? 'rate_limit' : (isTimeout ? 'timeout' : 'error'),
          });

          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries exhausted
    logger.error(`Agent ${agentId} failed after ${maxRetries} attempts`, { error: lastError });

    TaskTracker.completeTask(
      task.id,
      false,
      undefined,
      allFilesModified,
      `Failed after ${maxRetries} attempts: ${lastError}`,
      lastErrorDetails
    );

    await emitProgress(projectId, 'agent:failed', {
      agent: agentId,
      phase,
      totalAttempts: maxRetries,
      error: lastError,
      filesModified: allFilesModified.length,
    });

    return {
      success: false,
      output: {},
      filesModified: allFilesModified,
      error: `Failed after ${maxRetries} attempts: ${lastError}`,
      errorDetails: lastErrorDetails,
    };
  }

  /**
   * Save checkpoint for recovery
   */
  private async saveCheckpoint(
    phase: string,
    agentId: string,
    output: Record<string, unknown>,
    filesModified: string[]
  ): Promise<void> {
    const { projectPath, logger } = this.context;
    const checkpointDir = path.join(projectPath, '.mobigen', 'checkpoints');

    try {
      if (!fs.existsSync(checkpointDir)) {
        fs.mkdirSync(checkpointDir, { recursive: true });
      }

      const checkpoint = {
        phase,
        agentId,
        output,
        filesModified,
        timestamp: new Date().toISOString(),
        outputs: this.context.outputs, // Save all accumulated outputs
      };

      const checkpointPath = path.join(checkpointDir, `${phase}-${agentId}.json`);
      fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

      // Also save a "latest" checkpoint
      const latestPath = path.join(checkpointDir, 'latest.json');
      fs.writeFileSync(latestPath, JSON.stringify({
        ...checkpoint,
        completedPhases: this.getCompletedPhases(),
      }, null, 2));

      logger.debug(`Checkpoint saved: ${phase}/${agentId}`);
    } catch (error) {
      logger.warn(`Failed to save checkpoint: ${error}`);
    }
  }

  /**
   * Get list of completed phases
   */
  private getCompletedPhases(): string[] {
    const { job } = this.context;
    const tasks = TaskTracker.getTasksByJob(job.id);
    const completedAgents = tasks.filter(t => t.status === 'completed').map(t => t.phase);
    return [...new Set(completedAgents)];
  }

  /**
   * Emit detailed pipeline status
   */
  private async emitPipelineStatus(
    phaseStatuses: Record<string, 'pending' | 'running' | 'completed' | 'failed'>,
    currentPhaseIndex: number,
    totalPhases: number
  ): Promise<void> {
    const { projectId, job } = this.context;
    const tasks = TaskTracker.getTasksByJob(job.id);

    // Build detailed status
    const status = {
      phases: Object.entries(phaseStatuses).map(([name, state]) => ({
        name,
        status: state,
        icon: state === 'completed' ? '✅' : state === 'failed' ? '❌' : state === 'running' ? '🔄' : '⏳',
      })),
      progress: Math.round((currentPhaseIndex / totalPhases) * 100),
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length,
        running: tasks.filter(t => t.status === 'running').length,
        pending: tasks.filter(t => t.status === 'pending').length,
      },
      currentPhase: Object.entries(phaseStatuses).find(([_, s]) => s === 'running')?.[0] || null,
      completedPhases: Object.entries(phaseStatuses).filter(([_, s]) => s === 'completed').map(([n]) => n),
      failedPhases: Object.entries(phaseStatuses).filter(([_, s]) => s === 'failed').map(([n]) => n),
    };

    await emitProgress(projectId, 'pipeline:status', status);
  }

  /**
   * Save recovery info for resuming later
   */
  private async saveRecoveryInfo(failedPhase: string, errors: TaskError[]): Promise<void> {
    const { projectPath, logger, job } = this.context;
    const recoveryDir = path.join(projectPath, '.mobigen');

    try {
      if (!fs.existsSync(recoveryDir)) {
        fs.mkdirSync(recoveryDir, { recursive: true });
      }

      const recoveryInfo = {
        failedPhase,
        errors,
        outputs: this.context.outputs,
        timestamp: new Date().toISOString(),
        jobId: job.id,
        completedPhases: this.getCompletedPhases(),
        resumeCommand: `POST /api/projects/${this.context.projectId}/resume-from-phase { "phase": "${failedPhase}" }`,
      };

      const recoveryPath = path.join(recoveryDir, 'recovery.json');
      fs.writeFileSync(recoveryPath, JSON.stringify(recoveryInfo, null, 2));

      logger.info(`Recovery info saved for phase: ${failedPhase}`, {
        completedPhases: recoveryInfo.completedPhases,
        resumeCommand: recoveryInfo.resumeCommand,
      });
    } catch (error) {
      logger.warn(`Failed to save recovery info: ${error}`);
    }
  }

  /**
   * Run the actual agent query
   */
  private async runAgentQuery(
    agent: DynamicAgentDefinition,
    prompt: string,
    filesModified: string[],
    agentId?: AgentRole
  ): Promise<{ text: string; output: Record<string, unknown> }> {
    const { projectPath, mobigenRoot } = this.context;
    let resultText = '';
    const output: Record<string, unknown> = {};

    // Get max turns for this agent (default to 50)
    const maxTurns = agentId ? (AGENT_MAX_TURNS[agentId] || 50) : 50;

    for await (const message of query({
      prompt,
      options: {
        agents: {
          [agent.id]: {
            description: agent.description,
            prompt: agent.prompt,
            tools: agent.tools,
            model: agent.model,
          },
        },
        allowedTools: agent.tools,
        model: agent.model || 'sonnet',
        maxTurns,
        systemPrompt: `You are ${agent.description}
Working directory: ${mobigenRoot}
Project directory: ${projectPath}
${agent.prompt}`,
        cwd: mobigenRoot,
        permissionMode: 'acceptEdits',
      },
    })) {
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

    return { text: resultText, output };
  }

  /**
   * Build agent prompt with accumulated context
   */
  private buildAgentPrompt(agent: DynamicAgentDefinition, phase: string): string {
    const { config, outputs, projectPath } = this.context;

    let prompt = `Execute your task for the ${phase} phase.

PROJECT CONFIGURATION:
${JSON.stringify(config, null, 2)}

PROJECT PATH: ${projectPath}

`;

    // Add relevant outputs from previous phases
    if (outputs.intent && phase !== 'analysis') {
      prompt += `\nINTENT ANALYSIS:\n${JSON.stringify(outputs.intent, null, 2)}\n`;
    }

    if (outputs.prd && (phase === 'design' || phase === 'task-breakdown' || phase === 'implementation')) {
      prompt += `\nPRODUCT REQUIREMENTS:\n${JSON.stringify(outputs.prd, null, 2)}\n`;
    }

    if (outputs.architecture && (phase === 'design' || phase === 'task-breakdown' || phase === 'implementation')) {
      prompt += `\nARCHITECTURE:\n${JSON.stringify(outputs.architecture, null, 2)}\n`;
    }

    if (outputs.uiDesign && (phase === 'task-breakdown' || phase === 'implementation')) {
      prompt += `\nUI DESIGN:\n${JSON.stringify(outputs.uiDesign, null, 2)}\n`;
    }

    if (outputs.tasks && phase === 'implementation') {
      prompt += `\nDEVELOPMENT TASKS:\n${JSON.stringify(outputs.tasks, null, 2)}\n`;
    }

    prompt += `\nExecute your ${agent.id} responsibilities now.`;

    return prompt;
  }

  /**
   * Run feedback loop to fix errors
   */
  private async runFeedbackLoop(
    phase: PipelinePhase,
    errors: TaskError[]
  ): Promise<{ success: boolean; filesModified: string[] }> {
    const { job, logger, projectId } = this.context;
    const fixableErrors = errors.filter(e => e.autoFixable);

    if (fixableErrors.length === 0) {
      logger.info('No auto-fixable errors found');
      return { success: false, filesModified: [] };
    }

    logger.info(`Attempting to fix ${fixableErrors.length} errors`);
    await emitProgress(projectId, 'feedback:start', { errorCount: fixableErrors.length });

    // Create fix task
    const fixTask = TaskTracker.createFixTask(
      job.id,
      projectId,
      TaskTracker.getFailedTasks(job.id)[0]?.id || '',
      fixableErrors
    );

    // Execute error-fixer agent
    const result = await this.executeAgent('error-fixer', 'fix');

    await emitProgress(projectId, 'feedback:complete', {
      success: result.success,
      filesFixed: result.filesModified?.length || 0,
    });

    if (result.success) {
      // Re-run validation to confirm fix worked
      logger.info('Re-running validation after fix');

      const validationResult = await this.executeAgent('validator', 'validation');

      return {
        success: validationResult.success,
        filesModified: result.filesModified || [],
      };
    }

    return { success: false, filesModified: [] };
  }

  /**
   * Attempt to fix errors from a specific agent
   */
  private async attemptFix(
    failedAgentId: AgentRole,
    errors: TaskError[]
  ): Promise<{ success: boolean; filesModified?: string[] }> {
    const { job, logger, projectId } = this.context;
    const retriesLeft = this.config.maxRetries - (job.retryCount || 0);

    if (retriesLeft <= 0) {
      logger.warn('No retries left for auto-fix');
      return { success: false };
    }

    // Check if errors are auto-fixable
    const autoFixableErrors = errors.filter(e => e.autoFixable);
    const timeoutErrors = errors.filter(e =>
      e.message.toLowerCase().includes('timeout') ||
      e.message.toLowerCase().includes('timed out')
    );
    const rateLimitErrors = errors.filter(e =>
      e.message.toLowerCase().includes('rate limit') ||
      e.message.toLowerCase().includes('too many')
    );

    logger.info(`Attempting auto-fix for ${failedAgentId}`, {
      retriesLeft,
      totalErrors: errors.length,
      autoFixable: autoFixableErrors.length,
      timeouts: timeoutErrors.length,
      rateLimits: rateLimitErrors.length,
    });

    await emitProgress(projectId, 'fix:start', {
      failedAgent: failedAgentId,
      errorCount: errors.length,
      autoFixable: autoFixableErrors.length,
    });

    // For timeout errors, we can retry the original agent rather than using error-fixer
    if (timeoutErrors.length > 0 && autoFixableErrors.length === 0) {
      logger.info('Timeout error detected - will retry original agent');

      // Wait before retrying for rate limits
      if (rateLimitErrors.length > 0) {
        logger.info('Rate limit detected - waiting 30s before retry');
        await emitProgress(projectId, 'fix:waiting', { reason: 'rate_limit', waitTime: 30000 });
        await new Promise(resolve => setTimeout(resolve, 30000));
      } else {
        logger.info('Waiting 10s before retry');
        await emitProgress(projectId, 'fix:waiting', { reason: 'timeout', waitTime: 10000 });
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      // The retry will happen at the agent level
      await emitProgress(projectId, 'fix:retry', { agent: failedAgentId });
      return { success: false }; // Let the caller retry
    }

    // For other errors, use error-fixer
    if (autoFixableErrors.length > 0) {
      const result = await this.executeAgent('error-fixer', 'fix');

      if (result.success) {
        TaskTracker.updateJob(job.id, { retryCount: (job.retryCount || 0) + 1 });

        await emitProgress(projectId, 'fix:success', {
          filesModified: result.filesModified?.length || 0,
        });
      } else {
        await emitProgress(projectId, 'fix:failed', {
          error: result.error,
        });
      }

      return {
        success: result.success,
        filesModified: result.filesModified,
      };
    }

    // No auto-fixable errors
    logger.info('No auto-fixable errors found');
    await emitProgress(projectId, 'fix:skipped', { reason: 'no_fixable_errors' });
    return { success: false };
  }

  /**
   * Extract errors from agent result
   */
  private extractErrors(result: {
    error?: string;
    errorDetails?: Record<string, unknown>;
  }): TaskError[] {
    const errors: TaskError[] = [];

    if (result.errorDetails && Array.isArray((result.errorDetails as Record<string, unknown>).errors)) {
      const detailErrors = (result.errorDetails as Record<string, unknown>).errors as Array<Record<string, unknown>>;
      for (const err of detailErrors) {
        errors.push({
          code: String(err.code || 'ERROR'),
          message: String(err.message),
          file: err.file as string | undefined,
          line: err.line as number | undefined,
          autoFixable: this.isAutoFixable(err),
        });
      }
    }

    if (result.error && errors.length === 0) {
      errors.push({
        code: 'AGENT_ERROR',
        message: result.error,
        autoFixable: this.isAutoFixable({ message: result.error }),
      });
    }

    return errors;
  }

  /**
   * Parse error message into structured details
   */
  private parseErrorDetails(errorMessage: string): Record<string, unknown> {
    const details: Record<string, unknown> = { raw: errorMessage };

    // Try to extract TypeScript errors
    const tsErrors = errorMessage.match(/(\S+\.tsx?)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)/g);
    if (tsErrors) {
      details.typescript = {
        errors: tsErrors.map(err => {
          const match = err.match(/(\S+\.tsx?)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)/);
          if (match) {
            return {
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              code: match[4],
              message: match[5],
            };
          }
          return { message: err };
        }),
      };
    }

    // Try to extract ESLint errors
    const eslintPattern = /(\S+)\s+(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+(\S+)$/gm;
    let eslintMatch;
    const eslintErrors: Array<Record<string, unknown>> = [];
    while ((eslintMatch = eslintPattern.exec(errorMessage)) !== null) {
      eslintErrors.push({
        file: eslintMatch[1],
        line: parseInt(eslintMatch[2]),
        column: parseInt(eslintMatch[3]),
        severity: eslintMatch[4],
        message: eslintMatch[5],
        rule: eslintMatch[6],
      });
    }
    if (eslintErrors.length > 0) {
      details.eslint = { errors: eslintErrors };
    }

    return details;
  }

  /**
   * Check if an error is auto-fixable
   */
  private isAutoFixable(error: Record<string, unknown>): boolean {
    const message = String(error.message || '').toLowerCase();

    const fixablePatterns = [
      'missing import',
      'cannot find module',
      'is not defined',
      'property does not exist',
      'type is not assignable',
      'expected',
      'unused',
      'no-unused-vars',
      'prefer-const',
      'unexpected token',
    ];

    return fixablePatterns.some(pattern => message.includes(pattern));
  }
}

// ============================================================================
// HELPER: Create and run pipeline
// ============================================================================

export interface RunPipelineOptions {
  /** Start from a specific phase (skip earlier phases) */
  startFromPhase?: string;
  /** Pre-populated outputs from previous phases (used when resuming) */
  previousOutputs?: Record<string, unknown>;
  /** Existing job ID to resume */
  resumeJobId?: string;
}

export async function runPipeline(
  projectId: string,
  projectPath: string,
  config: Record<string, unknown>,
  mobigenRoot: string,
  pipelineConfig: PipelineConfig = DEFAULT_PIPELINE,
  options: RunPipelineOptions = {}
): Promise<{
  success: boolean;
  filesModified: string[];
  errors: TaskError[];
  outputs: Record<string, unknown>;
  job: GenerationJob;
}> {
  // Initialize registries
  const agentRegistry = getDefaultRegistry(mobigenRoot);
  await agentRegistry.initialize();

  // Create logger
  const logger = createLogger(projectId, projectPath);

  // Create or resume job
  let job: GenerationJob;
  if (options.resumeJobId) {
    const existingJob = TaskTracker.getJob(options.resumeJobId);
    if (existingJob) {
      job = existingJob;
      TaskTracker.updateJob(job.id, { status: 'running' });
      logger.info(`Resuming job ${job.id}`);
    } else {
      job = TaskTracker.createJob(projectId, { config });
    }
  } else {
    job = TaskTracker.createJob(projectId, { config });
  }

  // Filter phases if starting from a specific one
  let phasesToRun = pipelineConfig.phases;
  if (options.startFromPhase) {
    const startIndex = pipelineConfig.phases.findIndex(p => p.name === options.startFromPhase);
    if (startIndex >= 0) {
      phasesToRun = pipelineConfig.phases.slice(startIndex);
      logger.info(`Starting from phase: ${options.startFromPhase}`, {
        skippedPhases: pipelineConfig.phases.slice(0, startIndex).map(p => p.name),
      });
    }
  }

  // Create modified pipeline config
  const effectivePipelineConfig: PipelineConfig = {
    ...pipelineConfig,
    phases: phasesToRun,
  };

  // Create context
  const context: ExecutionContext = {
    projectId,
    projectPath,
    job,
    logger,
    agentRegistry,
    mobigenRoot,
    config,
    outputs: options.previousOutputs || {},
  };

  // Create and run executor
  const executor = new PipelineExecutor(context, effectivePipelineConfig);
  const result = await executor.execute();

  return {
    ...result,
    job,
  };
}

/**
 * Resume a failed pipeline from where it left off
 */
export async function resumePipeline(
  projectId: string,
  projectPath: string,
  config: Record<string, unknown>,
  mobigenRoot: string,
  startFromPhase: string,
  previousOutputs: Record<string, unknown> = {},
  pipelineConfig: PipelineConfig = DEFAULT_PIPELINE
): Promise<{
  success: boolean;
  filesModified: string[];
  errors: TaskError[];
  outputs: Record<string, unknown>;
  job: GenerationJob;
}> {
  console.log(`[pipeline] Resuming pipeline for ${projectId} from phase: ${startFromPhase}`);

  return runPipeline(
    projectId,
    projectPath,
    config,
    mobigenRoot,
    pipelineConfig,
    {
      startFromPhase,
      previousOutputs,
    }
  );
}

export default PipelineExecutor;
