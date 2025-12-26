/**
 * Enhanced AI Orchestrator
 *
 * This module provides enhanced orchestration modes that combine the best of both approaches:
 *
 * 1. Enhanced AI Mode (`ai-enhanced`):
 *    - AI-driven workflow decisions
 *    - Task tracking for monitoring and resume
 *    - Feedback loop for automatic error detection and fixing
 *    - Mandatory checkpoints (validation after implementation)
 *
 * 2. Hybrid Mode (`hybrid`):
 *    - AI decides workflow within guardrails
 *    - Explicit phase boundaries with mandatory progression
 *    - Full task tracking and resume capabilities
 *    - Automatic feedback loop with configurable retry limits
 *    - Best of both: AI flexibility + Pipeline reliability
 */

import {
  query,
  type SDKMessage,
} from '@anthropic-ai/claude-agent-sdk';
import {
  getDefaultRegistry,
  getDefaultMemoryManager,
  type DynamicAgentDefinition,
} from '@mobigen/ai';
import { AGENT_TIMEOUTS, type AgentRole } from '@mobigen/ai';
import type { WhiteLabelConfig, GenerationResult } from '@mobigen/ai';
import { TemplateManager, type TemplateContext } from '@mobigen/storage';
import { emitProgress } from './api';
import { flagForHumanReview } from './session-manager';
import { createLogger, type GenerationLogger } from './logger';
import {
  TaskTracker,
  type GenerationJob,
  type GenerationTask,
  type TaskError,
  type FeedbackResult,
} from './task-tracker';
import * as path from 'path';
import * as fs from 'fs';

// ============================================================================
// CONFIGURATION
// ============================================================================

function resolveMobigenRoot(): string {
  if (process.env.MOBIGEN_ROOT) {
    return process.env.MOBIGEN_ROOT;
  }
  const cwd = process.cwd();
  if (cwd.includes('services/generator')) {
    return path.resolve(cwd, '../..');
  }
  return cwd;
}

const MOBIGEN_ROOT = resolveMobigenRoot();
const TEMPLATES_BARE_DIR = path.join(MOBIGEN_ROOT, 'templates-bare');
const TEMPLATES_WORKING_DIR = path.join(MOBIGEN_ROOT, 'templates');
const PROJECTS_DIR = path.join(MOBIGEN_ROOT, 'projects');

console.log('[enhanced-orchestrator] Resolved paths:', {
  MOBIGEN_ROOT,
  TEMPLATES_BARE_DIR,
  TEMPLATES_WORKING_DIR,
  PROJECTS_DIR,
  agentsPath: path.join(MOBIGEN_ROOT, 'agents/builtin'),
  agentsExists: fs.existsSync(path.join(MOBIGEN_ROOT, 'agents/builtin')),
});

// Initialize managers
const templateManager = new TemplateManager({
  bareRepoDir: TEMPLATES_BARE_DIR,
  workingCopyDir: TEMPLATES_WORKING_DIR,
  projectsDir: PROJECTS_DIR,
});

const agentRegistry = getDefaultRegistry(MOBIGEN_ROOT);
const memoryManager = getDefaultMemoryManager(MOBIGEN_ROOT);

// ============================================================================
// TYPES
// ============================================================================

interface EnhancedConfig {
  maxRetries: number;
  enableFeedbackLoop: boolean;
  mandatoryValidation: boolean;
  trackAllAgents: boolean;
  checkpointAfterPhases: string[];
}

interface ExecutionState {
  projectId: string;
  projectPath: string;
  job: GenerationJob;
  logger: GenerationLogger;
  config: WhiteLabelConfig;
  sessionId?: string;
  currentPhase: string;
  completedPhases: string[];
  filesModified: string[];
  errors: TaskError[];
  outputs: Record<string, unknown>;
}

// Default configuration
const DEFAULT_ENHANCED_CONFIG: EnhancedConfig = {
  maxRetries: 3,
  enableFeedbackLoop: true,
  mandatoryValidation: true,
  trackAllAgents: true,
  checkpointAfterPhases: ['implementation', 'validation'],
};

// ============================================================================
// AGENT EXECUTOR WITH TRACKING
// ============================================================================

async function executeAgentWithTracking(
  state: ExecutionState,
  agentId: AgentRole,
  phase: string,
  prompt: string
): Promise<{
  success: boolean;
  result: string;
  filesModified: string[];
  error?: string;
  taskId: string;
}> {
  const { job, logger, projectPath } = state;

  // Create task in tracker
  const task = TaskTracker.createTask(
    job.id,
    state.projectId,
    phase,
    agentId,
    'agent_execution',
    { input: { prompt: prompt.substring(0, 500) } }
  );

  TaskTracker.startTask(task.id);
  TaskTracker.updateJob(job.id, { currentPhase: phase, currentAgent: agentId });

  await emitProgress(state.projectId, 'agent:start', {
    agent: agentId,
    phase,
    taskId: task.id,
  });

  // Debug: Check registry state
  console.log(`[executeAgentWithTracking] Getting agent: ${agentId}`);
  console.log(`[executeAgentWithTracking] Registry initialized: ${agentRegistry.isInitialized()}`);
  console.log(`[executeAgentWithTracking] Available agents: ${agentRegistry.getAgentIds().join(', ')}`);

  const agent = agentRegistry.get(agentId);
  console.log(`[executeAgentWithTracking] Agent ${agentId} found: ${!!agent}`);

  if (!agent) {
    const errorMsg = `Agent ${agentId} not found. Available: ${agentRegistry.getAgentIds().join(', ')}`;
    console.error(`[executeAgentWithTracking] ${errorMsg}`);
    TaskTracker.completeTask(task.id, false, undefined, undefined, errorMsg);
    return { success: false, result: '', filesModified: [], error: errorMsg, taskId: task.id };
  }

  const timeout = AGENT_TIMEOUTS[agentId] || 180000;
  const filesModified: string[] = [];
  let result = '';
  const startTime = Date.now();

  logger.info(`Executing agent: ${agentId}`, { phase, timeout: timeout / 1000 });

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Agent ${agentId} timed out after ${timeout}ms`)), timeout);
    });

    // Execute agent with timeout
    const executionPromise = (async () => {
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
          systemPrompt: `You are ${agent.description}
Working directory: ${MOBIGEN_ROOT}
Project directory: ${projectPath}
${agent.prompt}`,
          cwd: MOBIGEN_ROOT,
          permissionMode: 'acceptEdits',
          // Context for logging and retry budget tracking
          context: {
            agentId,
            phase,
            projectId: state.projectId,
            taskId: task?.id,
          },
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
            result += textBlock.text;
          }
        }

        // Emit progress for each message
        await emitProgress(state.projectId, 'agent:message', {
          agent: agentId,
          messageType: message.type,
        });
      }
      return result;
    })();

    await Promise.race([executionPromise, timeoutPromise]);

    const duration = Date.now() - startTime;

    // Parse output for structured data
    let output: Record<string, unknown> = { raw: result };
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        output = { ...output, ...JSON.parse(jsonMatch[0]) };
      }
    } catch {
      // Not JSON, that's fine
    }

    // Complete task successfully
    TaskTracker.completeTask(task.id, true, output, filesModified);

    await emitProgress(state.projectId, 'agent:complete', {
      agent: agentId,
      success: true,
      filesModified: filesModified.length,
      duration,
    });

    logger.info(`Agent ${agentId} completed`, { files: filesModified.length, duration });

    return { success: true, result, filesModified, taskId: task.id };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const duration = Date.now() - startTime;

    // Log full error details
    console.error(`[executeAgentWithTracking] Error executing agent ${agentId}:`, {
      message: errorMessage,
      stack: errorStack,
      duration,
    });

    // Parse error for structured details
    const errorDetails = parseErrorDetails(errorMessage);

    TaskTracker.completeTask(task.id, false, undefined, filesModified, errorMessage, errorDetails);

    await emitProgress(state.projectId, 'agent:complete', {
      agent: agentId,
      success: false,
      error: errorMessage,
      duration,
    });

    logger.error(`Agent ${agentId} failed`, { error: errorMessage, duration });

    return { success: false, result: '', filesModified, error: errorMessage, taskId: task.id };
  }
}

// ============================================================================
// FEEDBACK LOOP
// ============================================================================

async function runFeedbackLoop(
  state: ExecutionState,
  errors: TaskError[],
  config: EnhancedConfig
): Promise<{ success: boolean; filesModified: string[] }> {
  const { job, logger, projectId } = state;
  const fixableErrors = errors.filter(e => e.autoFixable);

  if (fixableErrors.length === 0) {
    logger.info('No auto-fixable errors found');
    return { success: false, filesModified: [] };
  }

  let retryCount = 0;
  let allFilesModified: string[] = [];

  while (retryCount < config.maxRetries && fixableErrors.length > 0) {
    retryCount++;
    logger.info(`Feedback loop attempt ${retryCount}/${config.maxRetries}`, {
      errors: fixableErrors.length,
    });

    await emitProgress(projectId, 'feedback:attempt', {
      attempt: retryCount,
      maxRetries: config.maxRetries,
      errorCount: fixableErrors.length,
    });

    // Run error-fixer agent
    const fixPrompt = `Fix the following errors in the project:

PROJECT PATH: ${state.projectPath}

ERRORS TO FIX:
${fixableErrors.map((e, i) => `${i + 1}. [${e.code}] ${e.message}${e.file ? ` in ${e.file}` : ''}${e.line ? `:${e.line}` : ''}`).join('\n')}

For each error:
1. Read the file to understand the context
2. Apply the minimal fix needed
3. Verify the fix doesn't break other code

Output a summary of fixes applied.`;

    const fixResult = await executeAgentWithTracking(
      state,
      'error-fixer',
      'fix',
      fixPrompt
    );

    if (fixResult.filesModified.length > 0) {
      allFilesModified.push(...fixResult.filesModified);
    }

    // Re-run validation to check if fixes worked
    logger.info('Re-running validation after fix');

    const validationResult = await executeAgentWithTracking(
      state,
      'validator',
      'validation',
      `Validate the code in ${state.projectPath}. Run TypeScript check, ESLint, and verify the app can be bundled.`
    );

    if (validationResult.success) {
      // Check if validation passed
      const passed = validationResult.result.toLowerCase().includes('pass') ||
                     validationResult.result.toLowerCase().includes('success') ||
                     !validationResult.result.toLowerCase().includes('error');

      if (passed) {
        logger.info('Feedback loop succeeded - validation passed');
        await emitProgress(projectId, 'feedback:success', { attempt: retryCount });
        return { success: true, filesModified: allFilesModified };
      }
    }

    // Update errors for next iteration
    const newAnalysis = TaskTracker.analyzeErrors(job.id);
    fixableErrors.length = 0;
    fixableErrors.push(...newAnalysis.errors.filter(e => e.autoFixable));
  }

  logger.warn('Feedback loop exhausted retries', { attempts: retryCount });
  await emitProgress(projectId, 'feedback:exhausted', { attempts: retryCount });

  return { success: false, filesModified: allFilesModified };
}

// ============================================================================
// ENHANCED AI MODE
// ============================================================================

/**
 * Enhanced AI Mode
 *
 * AI-driven workflow with:
 * - Full task tracking
 * - Automatic feedback loop for errors
 * - Resume capabilities
 * - Mandatory checkpoints
 */
export async function generateAppEnhancedAI(
  userPrompt: string,
  projectId: string,
  config: WhiteLabelConfig,
  enhancedConfig: EnhancedConfig = DEFAULT_ENHANCED_CONFIG
): Promise<GenerationResult> {
  const projectPath = path.join(PROJECTS_DIR, projectId);
  const logger = createLogger(projectId, projectPath);

  // Ensure project directory exists
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }

  // Create job for tracking
  const job = TaskTracker.createJob(projectId, {
    mode: 'ai-enhanced',
    config,
    prompt: userPrompt.substring(0, 500),
  });

  // Initialize state
  const state: ExecutionState = {
    projectId,
    projectPath,
    job,
    logger,
    config,
    currentPhase: 'init',
    completedPhases: [],
    filesModified: [],
    errors: [],
    outputs: {},
  };

  logger.info('Starting Enhanced AI orchestration', { projectId, mode: 'ai-enhanced' });
  TaskTracker.startJob(job.id);

  await emitProgress(projectId, 'starting', { mode: 'ai-enhanced' });

  try {
    // Initialize registries
    await Promise.all([
      agentRegistry.initialize(),
      memoryManager.initialize(projectId),
    ]);

    // Phase 1: Intent Analysis
    state.currentPhase = 'analysis';
    const intentResult = await executeAgentWithTracking(
      state,
      'intent-analyzer',
      'analysis',
      `Analyze this app request and select the best template:

USER REQUEST: ${userPrompt}

Available templates: base, ecommerce, loyalty, news, ai-assistant

Output JSON: { "template": "...", "category": "...", "features": [...], "complexity": "low|medium|high" }`
    );

    let selectedTemplate = 'base';
    if (intentResult.success) {
      try {
        const match = intentResult.result.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          selectedTemplate = parsed.template || 'base';
          state.outputs.intent = parsed;
        }
      } catch {
        logger.warn('Could not parse intent, using base template');
      }
    }
    state.completedPhases.push('analysis');

    // Clone template
    await emitProgress(projectId, 'cloning', { template: selectedTemplate });
    await templateManager.cloneToProject(selectedTemplate, projectId, {
      appName: config.appName,
      bundleId: config.bundleId.ios,
    });
    logger.info(`Cloned template: ${selectedTemplate}`);

    // Phase 2: Planning (Product Manager + Architect)
    state.currentPhase = 'planning';

    const prdResult = await executeAgentWithTracking(
      state,
      'product-manager',
      'planning',
      `Create a Product Requirements Document for:

APP NAME: ${config.appName}
USER REQUEST: ${userPrompt}
TEMPLATE: ${selectedTemplate}

Include: features, user stories, acceptance criteria, success metrics.`
    );
    if (prdResult.success) {
      state.outputs.prd = prdResult.result;
    }
    state.filesModified.push(...prdResult.filesModified);

    const archResult = await executeAgentWithTracking(
      state,
      'technical-architect',
      'planning',
      `Design the technical architecture based on:

PRD: ${prdResult.result.substring(0, 2000)}
TEMPLATE: ${selectedTemplate}

Include: data models, API design, file structure, dependencies.`
    );
    if (archResult.success) {
      state.outputs.architecture = archResult.result;
    }
    state.filesModified.push(...archResult.filesModified);
    state.completedPhases.push('planning');

    // Phase 3: UI/UX Design
    state.currentPhase = 'design';

    const designResult = await executeAgentWithTracking(
      state,
      'ui-ux-expert',
      'design',
      `Create UI/UX design system for ${config.appName}:

BRANDING:
- Primary Color: ${config.branding.primaryColor}
- Secondary Color: ${config.branding.secondaryColor}

PRD SUMMARY: ${(state.outputs.prd as string || '').substring(0, 1000)}

Create: color palette, typography, components, screen layouts.`
    );
    if (designResult.success) {
      state.outputs.uiDesign = designResult.result;
    }
    state.filesModified.push(...designResult.filesModified);
    state.completedPhases.push('design');

    // Phase 4: Task Breakdown
    state.currentPhase = 'task-breakdown';

    const tasksResult = await executeAgentWithTracking(
      state,
      'lead-developer',
      'task-breakdown',
      `Break down the implementation into tasks:

ARCHITECTURE: ${(state.outputs.architecture as string || '').substring(0, 1500)}
UI DESIGN: ${(state.outputs.uiDesign as string || '').substring(0, 1000)}

Output JSON array of tasks with: id, title, type, files, priority, dependencies.`
    );
    if (tasksResult.success) {
      state.outputs.tasks = tasksResult.result;
    }
    state.filesModified.push(...tasksResult.filesModified);
    state.completedPhases.push('task-breakdown');

    // Phase 5: Implementation
    state.currentPhase = 'implementation';

    const implResult = await executeAgentWithTracking(
      state,
      'developer',
      'implementation',
      `Implement the app based on:

PROJECT PATH: ${projectPath}
TEMPLATE: ${selectedTemplate}
TASKS: ${(state.outputs.tasks as string || '').substring(0, 3000)}

Implement all necessary components, screens, and services.
Use TypeScript, NativeWind styling, proper navigation.`
    );
    state.filesModified.push(...implResult.filesModified);
    state.completedPhases.push('implementation');

    // Checkpoint: Mandatory Validation after Implementation
    if (enhancedConfig.mandatoryValidation) {
      await emitProgress(projectId, 'checkpoint', { after: 'implementation' });
    }

    // Phase 6: Validation
    state.currentPhase = 'validation';

    const validationResult = await executeAgentWithTracking(
      state,
      'validator',
      'validation',
      `Validate the generated code in ${projectPath}:

1. Run TypeScript check: tsc --noEmit
2. Run ESLint: eslint src/
3. Check imports resolve
4. Verify navigation routes

Report all errors with file:line format.`
    );
    state.filesModified.push(...validationResult.filesModified);

    // Check if validation failed and run feedback loop
    const hasValidationErrors = !validationResult.success ||
      validationResult.result.toLowerCase().includes('error') ||
      validationResult.result.toLowerCase().includes('failed');

    if (hasValidationErrors && enhancedConfig.enableFeedbackLoop) {
      logger.info('Validation failed, entering feedback loop');

      // Analyze errors
      const errorAnalysis = TaskTracker.analyzeErrors(job.id);
      state.errors.push(...errorAnalysis.errors);

      const feedbackResult = await runFeedbackLoop(state, errorAnalysis.errors, enhancedConfig);
      state.filesModified.push(...feedbackResult.filesModified);

      if (!feedbackResult.success) {
        logger.warn('Feedback loop could not fix all errors');
      }
    }
    state.completedPhases.push('validation');

    // Phase 7: Build Validation
    state.currentPhase = 'build-validation';

    const buildResult = await executeAgentWithTracking(
      state,
      'build-validator',
      'build-validation',
      `Validate that the app builds successfully:

PROJECT PATH: ${projectPath}

Run:
1. Pre-build checks (package.json, app.json valid)
2. npm install if needed
3. npx expo prebuild --clean --no-install
4. Check Metro can bundle

Report build status.`
    );
    state.filesModified.push(...buildResult.filesModified);
    state.completedPhases.push('build-validation');

    // Phase 8: QA
    state.currentPhase = 'qa';

    const qaResult = await executeAgentWithTracking(
      state,
      'qa',
      'qa',
      `Perform final quality assessment of ${projectPath}:

Evaluate:
1. Code quality and patterns
2. UI/UX consistency
3. Accessibility
4. Performance considerations
5. Security basics

Output score (0-100) and recommendations.`
    );
    state.filesModified.push(...qaResult.filesModified);
    state.completedPhases.push('qa');

    // Determine success
    const failedTasks = TaskTracker.getFailedTasks(job.id);
    const criticalFailures = failedTasks.filter(t =>
      t.phase === 'implementation' || t.phase === 'validation' || t.phase === 'build-validation'
    );
    const success = criticalFailures.length === 0;

    // Complete job
    TaskTracker.completeJob(job.id, success);

    // Build result
    const result: GenerationResult = {
      files: [...new Set(state.filesModified)],
      logs: [],
      success,
      requiresReview: !success,
    };

    // Emit completion
    const taskSummary = TaskTracker.getProgressSummary(job.id);
    await emitProgress(projectId, 'complete', {
      success,
      filesGenerated: result.files.length,
      status: success ? 'DONE' : 'NEEDS_REVIEW',
      mode: 'ai-enhanced',
      taskSummary,
      message: success
        ? `✓ Enhanced AI generation completed with ${result.files.length} files.`
        : `⚠ Generation completed with issues. Review recommended.`,
    });

    // Log completion
    console.log(`\n${'═'.repeat(60)}`);
    console.log(success
      ? `✓ ENHANCED AI COMPLETE: ${projectId}`
      : `⚠ ENHANCED AI NEEDS REVIEW: ${projectId}`);
    console.log(`  Files: ${result.files.length}`);
    console.log(`  Phases: ${state.completedPhases.join(' → ')}`);
    console.log(`  Failed Tasks: ${failedTasks.length}`);
    console.log(`${'═'.repeat(60)}\n`);

    if (!success) {
      await flagForHumanReview(projectId, []);
    }

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Enhanced AI orchestration failed', { error: errorMessage });

    TaskTracker.completeJob(job.id, false, errorMessage);
    await emitProgress(projectId, 'error', { error: errorMessage, mode: 'ai-enhanced' });

    return {
      files: state.filesModified,
      logs: [],
      success: false,
      requiresReview: true,
    };
  }
}

// ============================================================================
// HYBRID MODE
// ============================================================================

/**
 * Hybrid Mode
 *
 * Combines the best of AI and Pipeline approaches:
 * - AI decides within guardrails (can skip optional steps, parallelize)
 * - Explicit phase boundaries ensure progression
 * - Full task tracking and resume
 * - Mandatory checkpoints with validation
 * - Automatic feedback loop
 */
export async function generateAppHybrid(
  userPrompt: string,
  projectId: string,
  config: WhiteLabelConfig,
  enhancedConfig: EnhancedConfig = DEFAULT_ENHANCED_CONFIG
): Promise<GenerationResult> {
  const projectPath = path.join(PROJECTS_DIR, projectId);
  const logger = createLogger(projectId, projectPath);

  // Ensure project directory exists
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }

  // Check for existing job to resume
  const existingJob = TaskTracker.getJobByProject(projectId);
  let job: GenerationJob;
  let resuming = false;

  if (existingJob && (existingJob.status === 'paused' || existingJob.status === 'failed')) {
    const resumeResult = TaskTracker.resumeJob(existingJob.id);
    if (resumeResult) {
      job = resumeResult.job;
      resuming = true;
      logger.info(`Resuming job ${job.id}`, { previousStatus: existingJob.status });
    } else {
      job = TaskTracker.createJob(projectId, { mode: 'hybrid', config });
    }
  } else {
    job = TaskTracker.createJob(projectId, { mode: 'hybrid', config });
  }

  // Initialize state
  const state: ExecutionState = {
    projectId,
    projectPath,
    job,
    logger,
    config,
    currentPhase: resuming ? (job.currentPhase || 'init') : 'init',
    completedPhases: [],
    filesModified: [],
    errors: [],
    outputs: {},
  };

  // If resuming, get completed phases from tasks
  if (resuming) {
    const completedTasks = TaskTracker.getTasksByJob(job.id).filter(t => t.status === 'completed');
    state.completedPhases = [...new Set(completedTasks.map(t => t.phase))];
    logger.info(`Resumed with completed phases: ${state.completedPhases.join(', ')}`);
  }

  logger.info('Starting Hybrid orchestration', { projectId, mode: 'hybrid', resuming });
  TaskTracker.startJob(job.id);

  await emitProgress(projectId, 'starting', { mode: 'hybrid', resuming });

  try {
    console.log('[generateAppHybrid] Initializing registry and memory manager...');
    await Promise.all([
      agentRegistry.initialize(),
      memoryManager.initialize(projectId),
    ]);
    console.log(`[generateAppHybrid] Registry initialized. Agent count: ${agentRegistry.count()}`);
    console.log(`[generateAppHybrid] Available agents: ${agentRegistry.getAgentIds().join(', ')}`);

    // Define phase execution with AI flexibility within each phase
    const phases = [
      {
        name: 'analysis',
        required: true,
        execute: async () => {
          const result = await executeAgentWithTracking(state, 'intent-analyzer', 'analysis',
            `Analyze: ${userPrompt}\nOutput JSON: { "template": "...", "features": [...] }`);
          if (result.success) {
            try {
              const match = result.result.match(/\{[\s\S]*\}/);
              if (match) state.outputs.intent = JSON.parse(match[0]);
            } catch { /* ignore */ }
          }
          return result;
        },
      },
      {
        name: 'template-setup',
        required: true,
        execute: async () => {
          const template = (state.outputs.intent as Record<string, string>)?.template || 'base';
          await templateManager.cloneToProject(template, projectId, {
            appName: config.appName,
            bundleId: config.bundleId.ios,
          });
          return { success: true, result: `Cloned ${template}`, filesModified: [], taskId: '' };
        },
      },
      {
        name: 'planning',
        required: true,
        // AI decides: run PM and Architect in parallel or sequential
        execute: async () => {
          const prdPromise = executeAgentWithTracking(state, 'product-manager', 'planning',
            `Create PRD for: ${config.appName}\nRequest: ${userPrompt}`);
          const archPromise = executeAgentWithTracking(state, 'technical-architect', 'planning',
            `Design architecture for: ${config.appName}\nRequest: ${userPrompt}`);

          const [prdResult, archResult] = await Promise.all([prdPromise, archPromise]);

          state.outputs.prd = prdResult.result;
          state.outputs.architecture = archResult.result;
          state.filesModified.push(...prdResult.filesModified, ...archResult.filesModified);

          return {
            success: prdResult.success && archResult.success,
            result: 'Planning complete',
            filesModified: [...prdResult.filesModified, ...archResult.filesModified],
            taskId: prdResult.taskId,
          };
        },
      },
      {
        name: 'design',
        required: false, // AI can skip if template already has good design
        execute: async () => {
          return await executeAgentWithTracking(state, 'ui-ux-expert', 'design',
            `Create design system for ${config.appName} with colors: ${config.branding.primaryColor}, ${config.branding.secondaryColor}`);
        },
      },
      {
        name: 'implementation',
        required: true,
        execute: async () => {
          // First get task breakdown
          const tasksResult = await executeAgentWithTracking(state, 'lead-developer', 'implementation',
            `Break down implementation for: ${(state.outputs.architecture as string || '').substring(0, 2000)}`);

          // Then implement
          const implResult = await executeAgentWithTracking(state, 'developer', 'implementation',
            `Implement the app in ${projectPath} based on the task breakdown.`);

          state.filesModified.push(...tasksResult.filesModified, ...implResult.filesModified);
          return implResult;
        },
      },
      {
        name: 'validation',
        required: true,
        checkpoint: true, // Mandatory checkpoint
        execute: async () => {
          const result = await executeAgentWithTracking(state, 'validator', 'validation',
            `Validate code in ${projectPath}: TypeScript, ESLint, imports.`);

          // Run feedback loop if needed
          if (!result.success || result.result.toLowerCase().includes('error')) {
            const analysis = TaskTracker.analyzeErrors(job.id);
            if (analysis.canAutoFix && enhancedConfig.enableFeedbackLoop) {
              const feedbackResult = await runFeedbackLoop(state, analysis.errors, enhancedConfig);
              state.filesModified.push(...feedbackResult.filesModified);
              return { ...result, success: feedbackResult.success };
            }
          }
          return result;
        },
      },
      {
        name: 'build-validation',
        required: true,
        execute: async () => {
          return await executeAgentWithTracking(state, 'build-validator', 'build-validation',
            `Validate build for ${projectPath}: prebuild, metro bundle.`);
        },
      },
      {
        name: 'qa',
        required: false,
        execute: async () => {
          return await executeAgentWithTracking(state, 'qa', 'qa',
            `QA assessment for ${projectPath}: code quality, UX, accessibility, security.`);
        },
      },
    ];

    // Execute phases
    for (const phase of phases) {
      // Skip if already completed (resuming)
      if (state.completedPhases.includes(phase.name)) {
        logger.info(`Skipping completed phase: ${phase.name}`);
        continue;
      }

      state.currentPhase = phase.name;
      await emitProgress(projectId, 'phase:start', { phase: phase.name, required: phase.required });

      try {
        const result = await phase.execute();
        state.filesModified.push(...result.filesModified);

        if (!result.success && phase.required) {
          logger.error(`Required phase ${phase.name} failed`);
          state.errors.push({ code: 'PHASE_FAILED', message: `Phase ${phase.name} failed`, autoFixable: false });

          // Don't stop - try to continue with remaining phases
          // The feedback loop in validation phase will try to fix issues
        }

        state.completedPhases.push(phase.name);
        await emitProgress(projectId, 'phase:complete', { phase: phase.name, success: result.success });

        // Checkpoint: save state for resume
        if ((phase as { checkpoint?: boolean }).checkpoint) {
          logger.info(`Checkpoint after ${phase.name}`);
          await emitProgress(projectId, 'checkpoint', { phase: phase.name });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Phase ${phase.name} threw error`, { error: errorMessage });

        if (phase.required) {
          state.errors.push({ code: 'PHASE_ERROR', message: errorMessage, autoFixable: false });
        }

        // Continue to next phase even on error
        state.completedPhases.push(phase.name);
      }
    }

    // Determine success
    const failedTasks = TaskTracker.getFailedTasks(job.id);
    const criticalFailures = failedTasks.filter(t =>
      ['implementation', 'validation', 'build-validation'].includes(t.phase)
    );
    const success = criticalFailures.length === 0;

    TaskTracker.completeJob(job.id, success);

    const result: GenerationResult = {
      files: [...new Set(state.filesModified)],
      logs: [],
      success,
      requiresReview: !success,
    };

    const taskSummary = TaskTracker.getProgressSummary(job.id);
    await emitProgress(projectId, 'complete', {
      success,
      filesGenerated: result.files.length,
      status: success ? 'DONE' : 'NEEDS_REVIEW',
      mode: 'hybrid',
      taskSummary,
      message: success
        ? `✓ Hybrid generation completed with ${result.files.length} files.`
        : `⚠ Generation needs review. ${criticalFailures.length} critical failures.`,
    });

    console.log(`\n${'═'.repeat(60)}`);
    console.log(success ? `✓ HYBRID COMPLETE: ${projectId}` : `⚠ HYBRID NEEDS REVIEW: ${projectId}`);
    console.log(`  Files: ${result.files.length}`);
    console.log(`  Phases: ${state.completedPhases.join(' → ')}`);
    console.log(`  Can Resume: ${!success}`);
    console.log(`${'═'.repeat(60)}\n`);

    if (!success) {
      await flagForHumanReview(projectId, []);
    }

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Hybrid orchestration failed', { error: errorMessage });

    // Pause job for resume
    TaskTracker.pauseJob(job.id);
    await emitProgress(projectId, 'error', { error: errorMessage, mode: 'hybrid', canResume: true });

    return {
      files: state.filesModified,
      logs: [],
      success: false,
      requiresReview: true,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseErrorDetails(errorMessage: string): Record<string, unknown> {
  const details: Record<string, unknown> = { raw: errorMessage };

  // TypeScript errors
  const tsErrors = errorMessage.match(/(\S+\.tsx?)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)/g);
  if (tsErrors) {
    details.typescript = { errors: tsErrors };
  }

  // ESLint errors
  const eslintPattern = /(\S+)\s+(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+(\S+)$/gm;
  const eslintErrors: string[] = [];
  let match;
  while ((match = eslintPattern.exec(errorMessage)) !== null) {
    eslintErrors.push(match[0]);
  }
  if (eslintErrors.length > 0) {
    details.eslint = { errors: eslintErrors };
  }

  return details;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ExecutionState,
  EnhancedConfig,
  DEFAULT_ENHANCED_CONFIG,
  executeAgentWithTracking,
  runFeedbackLoop,
};
